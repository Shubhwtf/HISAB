"""
HISAB — Dynamic Schema Detection & Field Mapping API Endpoints.
"""

from typing import Any, Dict, List, Optional, Set
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from apps.api.dependencies import get_current_user
from packages.domain.auth_rbac import UserSession
from packages.domain.mapping_engine import (
    detect_source_type,
    map_columns_dynamically,
    detect_schema_drift,
    CANONICAL_FIELDS,
    DynamicMappingResponse,
)

router = APIRouter(prefix="/api/mapping", tags=["Dynamic Schema Mapping"])


class DetectAndMapRequest(BaseModel):
    filename: str = "rzp_custom_export_aug.csv"
    columns: List[str] = ["Txn Ref", "Amt", "Fee", "GST", "Created", "UTR No"]
    sample_rows: Optional[List[Dict[str, Any]]] = None
    saved_profile_headers: Optional[List[str]] = None


class SaveMappingProfileRequest(BaseModel):
    merchant_id: str = "rzp_live_99420"
    source_type: str = "SETTLEMENT_RECONCILIATION"
    mapping: Dict[str, str]


SAVED_MERCHANT_PROFILES: Dict[str, Dict[str, Any]] = {
    "rzp_live_99420_HDFC_BANK": {
        "headers": ["Txn Date", "Narration", "Credit Amt", "UTR Ref"],
        "mapping": {
            "Txn Date": "payment_timestamp",
            "Narration": "bank_narration",
            "Credit Amt": "bank_credit_amount",
            "UTR Ref": "bank_reference_utr",
        }
    }
}


@router.post("/detect-and-map", response_model=DynamicMappingResponse)
def detect_and_map_uploaded_file(req: DetectAndMapRequest, user: UserSession = Depends(get_current_user)):
    """
    Intelligently identifies file source type, generates AI-assisted canonical field mappings,
    performs cross-source ID checks, and reports schema drift.
    """
    detection = detect_source_type(req.filename, req.columns, req.sample_rows)
    
    cross_payment_ids = {"pay_90000", "pay_90001", "pay_90002", "pay_90006"}
    
    mappings = map_columns_dynamically(
        columns=req.columns,
        source_type=detection.detected_source_type,
        sample_rows=req.sample_rows,
        cross_source_payment_ids=cross_payment_ids,
    )

    drift_report = None
    if req.saved_profile_headers:
        drift_report = detect_schema_drift(req.saved_profile_headers, req.columns)

    blocking = [m.source_column for m in mappings if m.tier == "MANUAL_REVIEW" and m.canonical_field is None]

    return DynamicMappingResponse(
        detection=detection,
        mappings=mappings,
        drift_report=drift_report,
        validation_passed=len(blocking) == 0,
        blocking_ambiguities=blocking,
    )


@router.get("/canonical-fields")
def get_canonical_fields():
    """
    Returns the controlled canonical financial schema allowlist.
    """
    return CANONICAL_FIELDS


@router.post("/save-profile")
def save_merchant_mapping_profile(req: SaveMappingProfileRequest, user: UserSession = Depends(get_current_user)):
    """
    Saves approved column mapping to merchant profile for zero-effort future reconciliation uploads.
    """
    profile_key = f"{req.merchant_id}_{req.source_type}"
    SAVED_MERCHANT_PROFILES[profile_key] = {
        "headers": list(req.mapping.keys()),
        "mapping": req.mapping,
    }
    return {
        "success": True,
        "profile_key": profile_key,
        "message": f"Mapping profile for '{req.source_type}' saved to merchant profile."
    }
