"""
HISAB — Autonomous Finance Controller FastAPI Application.

Main entry point providing REST endpoints for reconciliation, financial controls,
forensic double-loss alerts, interactive evidence graphs, immutable audit ledger,
snapshots & What Changed diffs, Ask HISAB grounded query engine, settlement tower,
Maker-Checker approvals, Daily Finance Brief, Razorpay Sync, and Policy Simulator.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from packages.domain.database import init_db_sync
from apps.api.routes.reconciliation import router as reconciliation_router
from apps.api.routes.controls import router as controls_router
from apps.api.routes.evidence import router as evidence_router
from apps.api.routes.audit import router as audit_router
from apps.api.routes.benchmark import router as benchmark_router
from apps.api.routes.snapshots import router as snapshots_router
from apps.api.routes.ask_hisab import router as ask_hisab_router
from apps.api.routes.sources import router as sources_router
from apps.api.routes.auth import router as auth_router
from apps.api.routes.razorpay_sync import router as razorpay_sync_router
from apps.api.routes.settlements import router as settlements_router
from apps.api.routes.maker_checker import router as maker_checker_router
from apps.api.routes.accounting import router as accounting_router
from apps.api.routes.policy_simulator import router as policy_simulator_router
from apps.api.routes.mapping import router as mapping_router
from apps.api.routes.reports import router as reports_router
from apps.api.routes.search import router as search_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("hisab.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup & shutdown lifespan handler.
    Ensures database tables are created and seeded on startup.
    """
    logger.info("Initializing HISAB database tables...")
    init_db_sync()
    
    # Auto-seed database if empty
    from packages.domain.db_models import PaymentDB
    from packages.domain.database import get_sync_db
    from sqlalchemy import select, func
    from scripts.seed_data import seed_database_from_dataset
    from packages.evaluation.generator import generate_synthetic_dataset
    from packages.evaluation.corruptor import inject_corruptions
    from apps.api.routes.reconciliation import run_full_reconciliation

    with get_sync_db() as db:
        payment_count = db.scalar(select(func.count(PaymentDB.id))) or 0
        if payment_count == 0:
            logger.info("Database is empty. Generating synthetic merchant dataset...")
            clean = generate_synthetic_dataset(record_count=500, seed=42)
            corrupted = inject_corruptions(clean, seed=42)
            seed_database_from_dataset(corrupted)
            logger.info("Running initial reconciliation pipeline across seeded records...")
            run_full_reconciliation(batch_id="batch_settlement_2026_08_28", db=db)
            logger.info("Database successfully seeded and reconciled.")

    logger.info("HISAB API initialized and ready.")
    yield
    logger.info("Shutting down HISAB API.")


app = FastAPI(
    title="HISAB Finance Controller API",
    description=(
        "Autonomous Payment Gateway Reconciliation and Financial Controls Engine for Indian Merchants. "
        "Engineered for Razorpay accounting mechanics, Section 194-O TDS compliance, and double-loss forensics."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "InternalServerError", "message": str(exc)},
    )


# Register All Domain Routers
app.include_router(reconciliation_router)
app.include_router(controls_router)
app.include_router(evidence_router)
app.include_router(audit_router)
app.include_router(benchmark_router)
app.include_router(snapshots_router)
app.include_router(ask_hisab_router)
app.include_router(sources_router)
app.include_router(auth_router)
app.include_router(razorpay_sync_router)
app.include_router(settlements_router)
app.include_router(maker_checker_router)
app.include_router(accounting_router)
app.include_router(policy_simulator_router)
app.include_router(mapping_router)
app.include_router(reports_router)
app.include_router(search_router)


@app.get("/healthz", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Service health check endpoint.
    """
    return {
        "status": "healthy",
        "service": "HISAB Finance Controller",
        "version": "1.0.0",
        "merchant": "Nova Commerce Pvt Ltd",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
