import json
import time
import logging
from typing import List, Optional, Tuple
import redis
from packages.domain.redis_client import get_redis_client

logger = logging.getLogger("hisab.queue")

DEFAULT_QUEUE = "hisab:queue:default"
RECON_QUEUE = "hisab:queue:reconciliation"
WEBHOOK_QUEUE = "hisab:queue:webhooks"
DELAYED_SET = "hisab:queue:delayed"
ACTIVE_SET = "hisab:queue:active"

ALL_QUEUES = [RECON_QUEUE, WEBHOOK_QUEUE, DEFAULT_QUEUE]


class JobQueue:
    def __init__(self, client: Optional[redis.Redis] = None):
        self._client = client

    def _get_client(self) -> redis.Redis:
        if self._client is not None:
            return self._client
        return get_redis_client()

    def enqueue(self, job_id: str, queue_name: str = DEFAULT_QUEUE, client: Optional[redis.Redis] = None) -> bool:
        r = client or self._get_client()
        try:
            r.lpush(queue_name, job_id)
            return True
        except Exception as e:
            logger.error(f"Failed to enqueue job {job_id} to {queue_name}: {e}")
            return False

    def dequeue(
        self,
        timeout: int = 2,
        queues: Optional[List[str]] = None,
        client: Optional[redis.Redis] = None,
    ) -> Optional[Tuple[str, str]]:
        r = client or self._get_client()
        target_queues = queues or ALL_QUEUES
        try:
            # First process any mature delayed jobs
            self.process_delayed_jobs(client=r)

            res = r.brpop(target_queues, timeout=timeout)
            if res:
                q_name, job_id = res[0], res[1]
                # Track in active set with current timestamp
                r.hset(ACTIVE_SET, job_id, f"{q_name}:{time.time()}")
                return q_name, job_id
            return None
        except Exception as e:
            logger.error(f"Error during dequeue from {target_queues}: {e}")
            return None

    def schedule_retry(
        self,
        job_id: str,
        delay_seconds: float,
        queue_name: str = DEFAULT_QUEUE,
        client: Optional[redis.Redis] = None,
    ) -> bool:
        r = client or self._get_client()
        try:
            run_at = time.time() + max(0.0, delay_seconds)
            payload = json.dumps({"job_id": job_id, "queue": queue_name})
            r.zadd(DELAYED_SET, {payload: run_at})
            # Remove from active set
            r.hdel(ACTIVE_SET, job_id)
            return True
        except Exception as e:
            logger.error(f"Failed to schedule retry for job {job_id}: {e}")
            return False

    def process_delayed_jobs(self, client: Optional[redis.Redis] = None) -> int:
        r = client or self._get_client()
        now = time.time()
        count = 0
        try:
            # Find all items where score <= now
            due_items = r.zrangebyscore(DELAYED_SET, min=0, max=now)
            for item in due_items:
                # Atomically remove from zset and push to target queue
                if r.zrem(DELAYED_SET, item):
                    try:
                        data = json.loads(item)
                        job_id = data.get("job_id")
                        q_name = data.get("queue", DEFAULT_QUEUE)
                        if job_id:
                            r.lpush(q_name, job_id)
                            count += 1
                    except Exception as json_err:
                        logger.error(f"Invalid delayed item payload '{item}': {json_err}")
            return count
        except Exception as e:
            logger.error(f"Failed to process delayed jobs: {e}")
            return 0

    def acknowledge(self, job_id: str, client: Optional[redis.Redis] = None) -> bool:
        r = client or self._get_client()
        try:
            r.hdel(ACTIVE_SET, job_id)
            return True
        except Exception as e:
            logger.error(f"Failed to acknowledge job {job_id}: {e}")
            return False

    def get_queue_length(self, queue_name: str, client: Optional[redis.Redis] = None) -> int:
        r = client or self._get_client()
        try:
            return r.llen(queue_name)
        except Exception:
            return 0

    def clear_all_queues(self, client: Optional[redis.Redis] = None) -> None:
        r = client or self._get_client()
        try:
            for q in ALL_QUEUES:
                r.delete(q)
            r.delete(DELAYED_SET)
            r.delete(ACTIVE_SET)
        except Exception:
            pass
