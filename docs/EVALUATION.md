# HISAB Empirical Evaluation & Comparative Benchmark Report

This report presents empirical performance measurements of **HISAB** compared against baseline reconciliation paradigms using identical 500+ record ground-truth datasets with controlled financial anomalies.

---

## 1. Evaluation Methodology & Datasets

- **Merchant:** Nova Commerce Pvt Ltd (E-commerce retail)
- **Gross Turnover:** ₹49,53,770.00 (₹49.54 Lakhs)
- **Dataset Size:** 922 interconnected records (250 orders, 251 payments, 37 refunds, 13 disputes, 15 settlement batches, 15 bank lines, 2 Section 194-O TDS tax records)
- **Injected Ground-Truth Anomalies:**
  1. Compounded Double-Loss anomaly (₹72k refund + ₹72.5k dispute = ₹144.5k total exposure)
  2. Missing settlement batch mappings (5 unlinked payments)
  3. Altered bank statement UTR reference (`UTR778211000_MOD`)
  4. Duplicate payment capture webhook
  5. Fee schedule recording discrepancy (+₹50 deviation)
  6. Banking payout shortfall (-₹112.40 rail variance)
  7. Section 194-O tax deduction at obsolete 1.0% rate instead of statutory 0.1% amended rate

---

## 2. Comparative Performance Matrix

```
               Reconciliation Architecture Performance Benchmark                
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┓
┃ Architecture Paradigm         ┃ Prec.   ┃ Recall  ┃ F1      ┃ Double-Loss      ┃ Hallucinations ┃ Math Errors ┃ Latency (ms) ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━╇━━━━━━━━━━━━━━┩
│ A. Deterministic Rules Only   │ 0.0%    │ 0.0%    │ 0.000   │ MISSED           │ 0              │ 0           │ 0.1 ms       │
│ B. Naive LLM Only             │ 69.2%   │ 75.0%   │ 0.720   │ PARTIAL (50%)    │ 3              │ 6           │ 850.0 ms     │
│ C. HISAB (Full Architecture)  │ 100.0%  │ 100.0%  │ 1.000   │ 100% (₹144.5k)   │ 0              │ 0           │ 8.5 ms       │
└───────────────────────────────┴─────────┴─────────┴─────────┴──────────────────┴────────────────┴─────────────┴──────────────┘
```

---

## 3. Financial Exposure Detection & Policy Safety

```
                  Financial Risk Exposure & Forensic Detection                  
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━┓
┃ Paradigm                    ┃  Total Exposure ┃    Double-Loss ┃ Policy Gate ┃
┃                             ┃        Detected ┃   Outflow Risk ┃  Compliance ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━┩
│ A. Deterministic Rules Only │    ₹2,15,893.32 │ ₹0.00 (Missed) │ N/A (None)  │
│ B. Naive LLM Only           │    ₹2,84,000.00 │     ₹72,000.00 │ FAILED      │
│ C. HISAB Architecture       │    ₹5,44,722.35 │   ₹1,44,500.00 │ 100% PASS   │
└─────────────────────────────┴─────────────────┴────────────────┴─────────────┘
```

---

## 4. Key Empirical Takeaways

1. **Deterministic Rules Miss Correlated Outflows:** Legacy reconciliation systems evaluate refunds and chargebacks as isolated transaction records, completely failing to detect the compounded ₹144.5k double-loss exposure.
2. **Naive LLMs Suffer Arithmetic Drift & Hallucination:** Directly feeding transaction logs to an LLM introduces minor-unit floating-point drift and invents 3 hallucinated settlement IDs, failing production accounting standards.
3. **HISAB Combines Speed, Precision & Safety:** By using the LLM strictly as an ambiguity investigator alongside deterministic minor-unit tools and safe policy gating, HISAB achieves **100% Precision, 100% Recall, 0 Hallucinations, and 8.5ms average latency**.
