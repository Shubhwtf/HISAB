"""
HISAB — Tier 2 Constraint-Based & Tier 3 Fuzzy Matcher.

Resolves ambiguous bank credits and altered reference strings using:
- Date proximity windows (T to T+3 days)
- Amount constraints (integer paise)
- Substring & Levenshtein similarity on UTR / narration references
"""

import re
from datetime import timedelta
from typing import List, Optional, Tuple
from packages.domain.models import Settlement, BankTransaction, Payment
from packages.matching.exact_matcher import MatchResult


def levenshtein_similarity(s1: str, s2: str) -> float:
    """
    Computes normalized similarity ratio between two strings [0.0, 1.0].
    Incorporates prefix/substring awareness for appended reference suffixes.
    """
    if s1 == s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    
    s1_u, s2_u = s1.upper(), s2.upper()
    prefix_score = 0.0
    if s1_u in s2_u or s2_u in s1_u:
        shorter = min(len(s1), len(s2))
        longer = max(len(s1), len(s2))
        prefix_score = shorter / longer

    len1, len2 = len(s1), len(s2)
    dp = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    for i in range(len1 + 1):
        dp[i][0] = i
    for j in range(len2 + 1):
        dp[0][j] = j

    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            )

    distance = dp[len1][len2]
    max_len = max(len1, len2)
    edit_score = 1.0 - (distance / max_len)
    
    return max(edit_score, prefix_score)


def match_settlement_to_bank_fuzzy(
    unmatched_settlements: List[Settlement],
    unmatched_bank: List[BankTransaction],
    date_window_days: int = 3,
    similarity_threshold: float = 0.65,
) -> Tuple[List[MatchResult], List[Settlement], List[BankTransaction]]:
    """
    Matches remaining unlinked settlements to bank credits using:
    1. Regex extraction of UTR or Settlement ID from bank statement narration
    2. Fuzzy string similarity on UTR reference
    3. Exact amount in paise constraint
    4. Date proximity window
    """
    matches: List[MatchResult] = []
    matched_setl_ids = set()
    matched_bank_ids = set()

    for s in unmatched_settlements:
        if s.id in matched_setl_ids:
            continue

        best_bank: Optional[BankTransaction] = None
        best_score: float = 0.0
        best_proofs: List[str] = []

        for b in unmatched_bank:
            if b.id in matched_bank_ids or b.direction != "credit":
                continue

            if s.settled_at and b.date:
                s_dt = s.settled_at.replace(tzinfo=None)
                b_dt = b.date.replace(tzinfo=None)
                date_diff = abs((s_dt - b_dt).total_seconds()) / 86400.0
                if date_diff > date_window_days:
                    continue
            else:
                date_diff = 0.0

            amount_equal = (s.amount_paise == b.amount_paise)
            if not amount_equal:
                continue

            ref_sim = 0.0
            utr_extracted = False
            
            if b.description:
                if s.id.lower() in b.description.lower():
                    ref_sim = 0.98
                    utr_extracted = True
                elif s.utr and s.utr.lower() in b.description.lower():
                    ref_sim = 0.95
                    utr_extracted = True

            if not utr_extracted and s.utr and b.reference:
                sim = levenshtein_similarity(s.utr.strip().upper(), b.reference.strip().upper())
                ref_sim = max(ref_sim, sim)

            if ref_sim >= similarity_threshold or utr_extracted:
                score = 0.90 + (0.08 * ref_sim)
                if score > best_score:
                    best_score = score
                    best_bank = b
                    proofs = [
                        f"Amount constraint matched: {s.amount_formatted}",
                        f"Date constraint within {date_diff:.1f} days",
                    ]
                    if utr_extracted:
                        proofs.append(f"Settlement key extracted from narration: '{b.description}'")
                    else:
                        proofs.append(f"Fuzzy UTR similarity {ref_sim*100:.1f}% ({s.utr} vs {b.reference})")
                    best_proofs = proofs

        if best_bank and best_score >= 0.85:
            matched_setl_ids.add(s.id)
            matched_bank_ids.add(best_bank.id)
            matches.append(MatchResult(
                source_id=s.id,
                target_id=best_bank.id,
                tier="TIER_3_FUZZY" if "Fuzzy" in best_proofs[-1] else "TIER_2_CONSTRAINT",
                confidence=round(best_score, 3),
                match_type="SETTLEMENT_BANK",
                proof_items=best_proofs,
                metadata={"settlement_id": s.id, "bank_id": best_bank.id, "score": str(best_score)}
            ))

    remaining_settlements = [s for s in unmatched_settlements if s.id not in matched_setl_ids]
    remaining_bank = [b for b in unmatched_bank if b.id not in matched_bank_ids]

    return matches, remaining_settlements, remaining_bank
