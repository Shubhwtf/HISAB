import os
import sys
import time
import signal
import logging
from datetime import datetime, timezone, timedelta
from typing import Callable, Optional
import redis
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from packages.domain.database import get_sync_db, SyncSessionLocal
from packages.domain.db_models import JobDB, OrganizationDB
from packages.domain.redis_client import get_redis_client, ping_redis
from packages.worker.queue import JobQueue, ALL_QUEUES, DEFAULT_QUEUE
from packages.worker.retry import calculate_backoff
from packages.worker.exceptions import (
    JobError,
    RetryableJobError,
    NonRetryableJobError,
    InvalidOrganizationContextError,
)
from packages.worker.handlers import JOB_HANDLERS

logger = logging.getLogger("hisab.worker")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class HISABWorker:
    def __init__(
        self,
        queue: Optional[JobQueue] = None,
        redis_client: Optional[redis.Redis] = None,
        session_factory: Optional[Callable[[], Session]] = None,
        queues: Optional[list] = None,
    ):
        self._redis = redis_client or get_redis_client()
        self._queue = queue or JobQueue(client=self._redis)
        self._session_factory = session_factory or SyncSessionLocal
        self._queues = queues or ALL_QUEUES
        self._should_stop = False

    def stop(self, *args, **kwargs):
        logger.info("Worker received stop signal, shutting down gracefully...")
        self._should_stop = True

    def publish_worker_heartbeat(self):
        try:
            now_ts = time.time()
            self._redis.set("hisab:worker:heartbeat", str(now_ts), ex=30)
        except Exception:
            pass

    def run_once(self, timeout: int = 1) -> Optional[str]:
        self.publish_worker_heartbeat()
        item = self._queue.dequeue(timeout=timeout, queues=self._queues, client=self._redis)
        if not item:
            return None

        queue_name, job_id = item
        self.process_job(job_id, queue_name)
        return job_id

    def process_job(self, job_id: str, queue_name: str = DEFAULT_QUEUE) -> bool:
        start_time = time.perf_counter()
        db: Session = self._session_factory()
        try:
            job = db.get(JobDB, job_id)
            if not job:
                logger.warning(f"Job {job_id} not found in database, discarding from queue.")
                self._queue.acknowledge(job_id, client=self._redis)
                return False

            if job.status == "CANCELLED":
                logger.info(f"Job {job_id} was cancelled, skipping execution.")
                self._queue.acknowledge(job_id, client=self._redis)
                return False

            # Validate organization context
            org = db.get(OrganizationDB, job.org_id)
            if not org:
                err_msg = f"Invalid organization context: {job.org_id} does not exist"
                logger.error(err_msg)
                job.status = "FAILED"
                job.error = err_msg
                job.completed_at = datetime.now(timezone.utc)
                job.updated_at = datetime.now(timezone.utc)
                db.commit()
                self._queue.acknowledge(job_id, client=self._redis)
                return False

            # Mark RUNNING
            now = datetime.now(timezone.utc)
            job.status = "RUNNING"
            job.started_at = job.started_at or now
            job.last_heartbeat_at = now
            job.attempts += 1
            job.error = None
            job.updated_at = now
            db.commit()

            logger.info(f"Starting job {job.id} (type={job.type}, org={job.org_id}, attempt={job.attempts}/{job.max_attempts})")

            def progress_callback(pct: int, stage_msg: str):
                try:
                    job.progress_pct = max(0, min(100, pct))
                    job.stage = stage_msg
                    job.last_heartbeat_at = datetime.now(timezone.utc)
                    job.updated_at = datetime.now(timezone.utc)
                    db.commit()
                    self.publish_worker_heartbeat()
                except Exception as cb_err:
                    logger.debug(f"Progress update failed: {cb_err}")

            handler = JOB_HANDLERS.get(job.type)
            if not handler:
                raise NonRetryableJobError(f"Unsupported job type '{job.type}'")

            # Execute task
            result = handler(job, db, progress_callback)

            # Mark COMPLETED
            now = datetime.now(timezone.utc)
            job.status = "COMPLETED"
            job.progress_pct = 100
            job.result = result
            job.completed_at = now
            job.updated_at = now
            db.commit()

            duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
            logger.info(f"Job {job.id} COMPLETED in {duration_ms}ms (org={job.org_id})")
            self._queue.acknowledge(job_id, client=self._redis)
            return True

        except Exception as e:
            now = datetime.now(timezone.utc)
            is_retryable = isinstance(e, RetryableJobError) or (
                not isinstance(e, NonRetryableJobError)
                and isinstance(e, (redis.RedisError, TimeoutError, ConnectionError, OSError))
            )

            job = db.get(JobDB, job_id)
            if job:
                job.error = str(e)
                job.updated_at = now

                if is_retryable and job.attempts < job.max_attempts:
                    job.status = "RETRYING"
                    db.commit()
                    delay = calculate_backoff(job.attempts)
                    logger.warning(
                        f"Job {job_id} encountered retryable error on attempt {job.attempts}/{job.max_attempts}. "
                        f"Retrying in {delay}s: {e}"
                    )
                    self._queue.schedule_retry(job_id, delay, queue_name=queue_name, client=self._redis)
                else:
                    job.status = "FAILED"
                    job.completed_at = now
                    db.commit()
                    logger.error(f"Job {job_id} FAILED permanently (attempts={job.attempts}/{job.max_attempts}): {e}")
                    self._queue.acknowledge(job_id, client=self._redis)
            else:
                self._queue.acknowledge(job_id, client=self._redis)
            return False
        finally:
            db.close()

    def recover_stale_jobs(self, max_age_seconds: int = 120) -> int:
        db: Session = self._session_factory()
        count = 0
        try:
            threshold = datetime.now(timezone.utc) - timedelta(seconds=max_age_seconds)
            stale_jobs = db.scalars(
                select(JobDB).where(
                    JobDB.status == "RUNNING",
                    JobDB.last_heartbeat_at < threshold,
                )
            ).all()

            for j in stale_jobs:
                logger.warning(f"Recovering stale job {j.id} (last heartbeat: {j.last_heartbeat_at})")
                j.status = "FAILED"
                j.error = f"Worker heartbeat timeout exceeded ({max_age_seconds}s). Safe stale job recovery applied."
                j.completed_at = datetime.now(timezone.utc)
                j.updated_at = datetime.now(timezone.utc)
                self._queue.acknowledge(j.id, client=self._redis)
                count += 1

            if count > 0:
                db.commit()
            return count
        except Exception as e:
            logger.error(f"Error during stale job recovery: {e}")
            db.rollback()
            return 0
        finally:
            db.close()

    def run_forever(self, idle_sleep: float = 0.5):
        signal.signal(signal.SIGINT, self.stop)
        signal.signal(signal.SIGTERM, self.stop)
        logger.info("HISAB Background Worker started. Listening for jobs...")

        last_stale_check = time.time()
        while not self._should_stop:
            try:
                # Periodic stale job recovery every 60 seconds
                if time.time() - last_stale_check > 60:
                    self.recover_stale_jobs()
                    last_stale_check = time.time()

                job_id = self.run_once(timeout=1)
                if not job_id and not self._should_stop:
                    time.sleep(idle_sleep)
            except Exception as e:
                logger.error(f"Unexpected error in worker loop: {e}")
                time.sleep(idle_sleep)

        logger.info("HISAB Background Worker stopped.")


def main():
    worker = HISABWorker()
    worker.run_forever()


if __name__ == "__main__":
    main()
