"""
HISAB — Safe Auto-Resolution Policy Engine (Section 15).

Enforces strict, deterministic policy gates before allowing any automated resolution.
AI agents and background workers CANNOT bypass these policy constraints.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple
from pydantic import BaseModel, Field

from packages.domain.models import ExceptionRecord
from packages.domain.money import format_inr


class PolicyAction(str, Enum):
    AUTO_RESOLVE = "AUTO_RESOLVE"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    ESCALATE = "ESCALATE"


class PolicyGateConfig(BaseModel):
    """
    Deterministic parameters governing automated financial actions.
    """
    min_confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    max_auto_resolve_exposure_paise: int = Field(default=500000, ge=0, description="Max ₹5,000 exposure for auto-resolve")
    min_evidence_signals: int = Field(default=2, ge=1)
    allowlisted_categories: Set[str] = Field(
        default_factory=lambda: {
            "MISSING_SETTLEMENT",
            "BANK_CREDIT_UNMATCHED",
            "REFUND_MISMATCH",
            "DUPLICATE_PAYMENT",
        }
    )
    strictly_forbidden_categories: Set[str] = Field(
        default_factory=lambda: {
            "DOUBLE_LOSS",
            "DISPUTE_EXPOSURE",
            "TAX_RECONCILIATION",
        }
    )


class PolicyDecision(BaseModel):
    exception_id: str
    action: PolicyAction
    is_safe: bool
    rule_code: str
    justification: str
    evidence_signals_count: int


def evaluate_policy_for_exception(
    exception: ExceptionRecord,
    config: Optional[PolicyGateConfig] = None,
) -> PolicyDecision:
    """
    Evaluates an exception against deterministic safety invariants.
    """
    cfg = config or PolicyGateConfig()

    if exception.category in cfg.strictly_forbidden_categories:
        return PolicyDecision(
            exception_id=exception.id,
            action=PolicyAction.ESCALATE if exception.category == "DOUBLE_LOSS" else PolicyAction.HUMAN_REVIEW,
            is_safe=False,
            rule_code="POLICY_FORBIDDEN_CATEGORY",
            justification=f"Anomaly category '{exception.category}' carries compounding or statutory legal risk and requires mandatory human sign-off.",
            evidence_signals_count=len(exception.evidence),
        )

    if exception.financial_impact_paise > cfg.max_auto_resolve_exposure_paise:
        return PolicyDecision(
            exception_id=exception.id,
            action=PolicyAction.ESCALATE if exception.severity == "CRITICAL" else PolicyAction.HUMAN_REVIEW,
            is_safe=False,
            rule_code="POLICY_EXPOSURE_EXCEEDS_THRESHOLD",
            justification=(
                f"Financial exposure of {exception.impact_formatted} exceeds the safety threshold "
                f"of {format_inr(cfg.max_auto_resolve_exposure_paise)} for automated clearance."
            ),
            evidence_signals_count=len(exception.evidence),
        )

    if exception.confidence < cfg.min_confidence:
        return PolicyDecision(
            exception_id=exception.id,
            action=PolicyAction.HUMAN_REVIEW,
            is_safe=False,
            rule_code="POLICY_INSUFFICIENT_CONFIDENCE",
            justification=f"Confidence score ({exception.confidence*100:.1f}%) is below required threshold ({cfg.min_confidence*100:.1f}%).",
            evidence_signals_count=len(exception.evidence),
        )

    if exception.category not in cfg.allowlisted_categories:
        return PolicyDecision(
            exception_id=exception.id,
            action=PolicyAction.HUMAN_REVIEW,
            is_safe=False,
            rule_code="POLICY_UNALLOWLISTED_CATEGORY",
            justification=f"Category '{exception.category}' is not in the configured automated resolution allowlist.",
            evidence_signals_count=len(exception.evidence),
        )

    return PolicyDecision(
        exception_id=exception.id,
        action=PolicyAction.AUTO_RESOLVE,
        is_safe=True,
        rule_code="POLICY_SAFE_AUTO_RESOLVE",
        justification=(
            f"Verified safe for auto-resolution: Category allowlisted ('{exception.category}'), "
            f"confidence {exception.confidence*100:.1f}% >= {cfg.min_confidence*100:.1f}%, "
            f"exposure {exception.impact_formatted} <= {format_inr(cfg.max_auto_resolve_exposure_paise)}."
        ),
        evidence_signals_count=len(exception.evidence),
    )


def apply_safe_resolutions(
    exceptions: List[ExceptionRecord],
    config: Optional[PolicyGateConfig] = None,
) -> Tuple[List[ExceptionRecord], List[ExceptionRecord]]:
    """
    Applies the policy gate to a list of exceptions.
    Returns: (auto_resolved_exceptions, remaining_unresolved_exceptions)
    """
    cfg = config or PolicyGateConfig()
    resolved: List[ExceptionRecord] = []
    unresolved: List[ExceptionRecord] = []
    now = datetime.now(timezone.utc)

    for exc in exceptions:
        decision = evaluate_policy_for_exception(exc, cfg)
        if decision.action == PolicyAction.AUTO_RESOLVE:
            exc.status = "RESOLVED"
            exc.resolution_method = "DETERMINISTIC_POLICY"
            exc.resolved_at = now
            resolved.append(exc)
        else:
            if decision.action == PolicyAction.ESCALATE:
                exc.status = "ESCALATED"
            unresolved.append(exc)

    return resolved, unresolved
