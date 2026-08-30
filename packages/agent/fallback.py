"""
HISAB — Deterministic Fallback Engine (Section 15 & 16).

Ensures system resiliency when LLM providers time out, return malformed JSON,
or hallucinate invalid entity IDs. Operates strictly on deterministic invariants.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from packages.agent.tools import ToolCandidateMatch
from packages.domain.money import format_inr


class FallbackResolutionResult(BaseModel):
    selected_candidate: Optional[str]
    confidence: float
    reason_codes: List[str]
    explanation: str
    needs_human_review: bool
    recommended_action: str
    execution_tier: str = "TIER_2_FALLBACK"


def resolve_with_deterministic_fallback(
    record_id: str,
    candidates: List[ToolCandidateMatch],
    is_double_loss: bool = False,
    max_auto_exposure_paise: int = 500000,
) -> FallbackResolutionResult:
    """
    Executes constraint-based fallback resolution without LLM dependency.
    """
    if is_double_loss:
        return FallbackResolutionResult(
            selected_candidate=None,
            confidence=0.99,
            reason_codes=["MANDATORY_ESCALATION_DOUBLE_LOSS"],
            explanation="Deterministic safety rule: Confirmed double-loss risk must be escalated to human finance controller.",
            needs_human_review=True,
            recommended_action="ESCALATE",
        )

    if not candidates:
        return FallbackResolutionResult(
            selected_candidate=None,
            confidence=0.0,
            reason_codes=["NO_CANDIDATES_AVAILABLE"],
            explanation=f"No compatible candidates identified for record {record_id}.",
            needs_human_review=True,
            recommended_action="HUMAN_REVIEW",
        )

    # Pick top candidate
    top = candidates[0]

    # Deterministic criteria:
    # 1. High candidate score (>= 0.90)
    # 2. Exposure within limit
    if top.confidence_score >= 0.90 and top.amount_paise <= max_auto_exposure_paise:
        return FallbackResolutionResult(
            selected_candidate=top.candidate_id,
            confidence=top.confidence_score,
            reason_codes=["FALLBACK_CONSTRAINT_MATCH", "ALLOWLISTED_EXPOSURE"],
            explanation=(
                f"Deterministic fallback matched record {record_id} to candidate {top.candidate_id} "
                f"({top.amount_formatted}) based on date proximity and fee schedule alignment."
            ),
            needs_human_review=False,
            recommended_action="AUTO_RESOLVE",
        )

    return FallbackResolutionResult(
        selected_candidate=top.candidate_id,
        confidence=top.confidence_score,
        reason_codes=["FALLBACK_EXCEEDS_EXPOSURE_THRESHOLD"],
        explanation=(
            f"Candidate {top.candidate_id} identified by fallback engine, but financial exposure "
            f"({top.amount_formatted}) requires human review."
        ),
        needs_human_review=True,
        recommended_action="HUMAN_REVIEW",
    )
