# HISAB — Razorpay Domain Rules & Financial Standards

This document is the authoritative domain reference for HISAB (AI Finance Controller for Razorpay).
Every financial invariant, formula, and exception classification implemented in the codebase is derived from verified domain rules documented herein.

---

## Index of Domain Rules

| Rule ID | Domain | Rule Name | Verification Status | Code Location |
|---|---|---|---|---|
| `RULE_SETTLEMENT_01` | Settlement | Settlement Batch Composition & Net Calculation | `VERIFIED` | `packages.domain.effects` |
| `RULE_REFUND_02` | Refunds | Non-Reversal of Gateway Fees & GST on Refunds | `VERIFIED` | `packages.domain.fees`, `packages.domain.effects` |
| `RULE_REFUND_03` | Refunds | Source Payment Method & Instrument Threading | `VERIFIED` | `packages.domain.models` |
| `RULE_DISPUTE_04` | Disputes | Dispute Lifecycle & Exposure Withholding | `VERIFIED` | `packages.controls.dispute_control` |
| `RULE_DOUBLE_LOSS_05` | Forensics | Double-Loss Compounded Outflow Detection | `VERIFIED` | `packages.controls.double_loss_detector` |
| `RULE_TAX_06` | Taxation | Section 194-O TDS Rate & Applicability | `VERIFIED` | `packages.domain.tax` |
| `RULE_SETTLEMENT_BANK_07` | Bank Recon | UTR Matching & Batch Credit Aggregation | `VERIFIED` | `packages.matching.batch_reconciliation` |

---

## 1. RULE_SETTLEMENT_01: Settlement Batch Composition & Net Calculation

* **Rule ID**: `RULE_SETTLEMENT_01`
* **Domain**: Settlements & Accounting
* **Official Documentation**: Razorpay Settlement Reconciliation & Reports API
* **Source URL**: https://razorpay.com/docs/payments/settlements/reconciliation/
* **Date Researched**: 2026-08-28
* **Verification Status**: `VERIFIED`
* **Applicability**: All Razorpay settlement cycles (T+2, Instant, or custom schedule).

### Description
Razorpay settles funds to merchants in aggregated batches. A settlement is not a 1:1 mirror of a customer payment; it is a batch credit computed from gross captured transactions minus merchant discount rate (MDR) fees, goods and services tax (GST) on fees, customer refunds, dispute deductions, and adjustments.

### Invariant Formula (Integer Minor Units - Paise)
$$\text{Expected Settlement} = \sum \text{Gross Captured} - \sum \text{MDR Fees} - \sum \text{GST on Fees} - \sum \text{Refunds} \pm \sum \text{Adjustments}$$

$$\text{Paise Invariant}: \text{net\_paise} = \text{gross\_paise} - \text{fee\_paise} - \text{tax\_paise} - \text{refund\_paise} \pm \text{adjustment\_paise}$$

* **Implementation Location**: [`packages/domain/effects.py`](file:///home/shubh/Desktop/code/buildathon/packages/domain/effects.py)
* **Tests**: [`tests/test_fee_math.py`](file:///home/shubh/Desktop/code/buildathon/tests/test_fee_math.py), [`tests/test_settlement_recon.py`](file:///home/shubh/Desktop/code/buildathon/tests/test_settlement_recon.py)

---

## 2. RULE_REFUND_02: Non-Reversal of Gateway Fees & GST on Refunds

* **Rule ID**: `RULE_REFUND_02`
* **Domain**: Refunds & Merchant Economics
* **Official Documentation**: Razorpay Refunds Documentation & FAQs
* **Source URL**: https://razorpay.com/docs/payments/refunds/
* **Date Researched**: 2026-08-28
* **Verification Status**: `VERIFIED`
* **Applicability**: Standard domestic and international merchant accounts.

### Description
When a refund is initiated, Razorpay returns 100% of the customer refund amount to the customer's payment source. However, the original transaction fee (MDR) and the 18% GST levied on the fee at the time of payment capture are **NOT reversed** to the merchant.

### Economic Effect
For a transaction of ₹1,000 with 2.0% MDR + 18% GST:
1. **Capture**:
   * Gross = ₹1,000.00 (100,000 paise)
   * MDR Fee (2.0%) = ₹20.00 (2,000 paise)
   * GST on Fee (18%) = ₹3.60 (360 paise)
   * Net credited to settlement pool = ₹976.40 (97,640 paise)
2. **Full Refund (₹1,000.00)**:
   * Debited from settlement pool = ₹1,000.00 (100,000 paise)
   * Merchant net variance on transaction = -₹23.60 (-2,360 paise, which represents fee + GST leakage).

### Classification Invariant
The system must classify this ₹23.60 deficit as `EXPECTED_REFUND_VARIANCE` and **never** flag it as an unexplained mismatch, error, or fraud.

* **Implementation Location**: [`packages/domain/fees.py`](file:///home/shubh/Desktop/code/buildathon/packages/domain/fees.py), [`packages/domain/effects.py`](file:///home/shubh/Desktop/code/buildathon/packages/domain/effects.py)
* **Tests**: [`tests/test_fee_math.py`](file:///home/shubh/Desktop/code/buildathon/tests/test_fee_math.py)

---

## 3. RULE_REFUND_03: Source Payment Method & Instrument Threading

* **Rule ID**: `RULE_REFUND_03`
* **Domain**: Refunds & Instrument Tracking
* **Official Documentation**: Razorpay Source Refunds Reference
* **Source URL**: https://razorpay.com/docs/payments/refunds/source-refunds/
* **Date Researched**: 2026-08-28
* **Verification Status**: `VERIFIED`
* **Applicability**: All payment methods (Cards, UPI, Netbanking, Wallets).

### Description
Razorpay issues refunds back to the exact payment method used for payment capture. To prove the reconciliation link without exposing sensitive PAN data:
* Card payments thread masked card numbers (e.g. `CARD •••• 4242`) and card network.
* UPI transactions thread masked VPA / VPA hash (e.g. `vpa_hash:91af...`).
* The refund entity must link explicitly to `parent_payment_id` and contain `source_instrument_ref`.

* **Implementation Location**: [`packages/domain/models.py`](file:///home/shubh/Desktop/code/buildathon/packages/domain/models.py)
* **Tests**: [`tests/test_models.py`](file:///home/shubh/Desktop/code/buildathon/tests/test_models.py)

---

## 4. RULE_DISPUTE_04: Dispute Lifecycle & Exposure Withholding

* **Rule ID**: `RULE_DISPUTE_04`
* **Domain**: Disputes & Chargebacks
* **Official Documentation**: Razorpay Disputes Management Guide
* **Source URL**: https://razorpay.com/docs/payments/disputes/
* **Date Researched**: 2026-08-28
* **Verification Status**: `VERIFIED`
* **Applicability**: All payment methods subject to chargebacks or consumer disputes.

### Description
When a customer raises a dispute via their issuing bank:
1. State starts at `OPEN` (or `UNDER_REVIEW`).
2. Razorpay sets a strict `respond_by` deadline for merchant evidence submission.
3. Razorpay holds/withholds the disputed amount from subsequent merchant settlements.
4. Possible final states: `WON` (withheld funds released), `LOST` (withheld funds permanently debited), `ACCEPTED` (merchant accepts liability).

### Financial Invariant
An open dispute creates **Potential Exposure** equal to the disputed principal plus any applicable chargeback dispute fees.

* **Implementation Location**: [`packages/controls/dispute_control.py`](file:///home/shubh/Desktop/code/buildathon/packages/controls/dispute_control.py)
* **Tests**: [`tests/test_controls.py`](file:///home/shubh/Desktop/code/buildathon/tests/test_controls.py)

---

## 5. RULE_DOUBLE_LOSS_05: Double-Loss Compounded Outflow Detection

* **Rule ID**: `RULE_DOUBLE_LOSS_05`
* **Domain**: Forensics & Risk Control
* **Official Documentation**: Razorpay AI Buildathon Track 04 Forensic Specifications
* **Date Researched**: 2026-08-28
* **Verification Status**: `VERIFIED`
* **Applicability**: All merchant operations with concurrent manual refund and banking dispute channels.

### Description
A dangerous financial risk occurs when a merchant issues a customer refund (e.g. via customer support or store portal) while the customer simultaneously or subsequently files a chargeback dispute through their card-issuing bank.

### Risk Scenario
$$\text{Original Sale} = +₹72,000$$
$$\text{Manual Refund Outflow} = -₹72,000$$
$$\text{Dispute Withholding Outflow} = -₹72,000$$
$$\text{Total Merchant Position} = -₹72,000 \quad (\text{Gross Outflow: } ₹144,000 \text{ on a } ₹72,000 \text{ sale})$$

### Classification Invariant
* Must NOT be silently deduplicated.
* Must be classified as `REFUND_PLUS_CHARGEBACK_POTENTIAL_DOUBLE_LOSS`.
* Severity: `CRITICAL` or `HIGH` (minimum `HIGH`).
* Auto-Resolution Policy: **Forbidden to auto-resolve**. Mandatory human escalation with complete evidence timeline.

* **Implementation Location**: [`packages/controls/double_loss_detector.py`](file:///home/shubh/Desktop/code/buildathon/packages/controls/double_loss_detector.py)
* **Tests**: [`tests/test_double_loss.py`](file:///home/shubh/Desktop/code/buildathon/tests/test_double_loss.py)

---

## 6. RULE_TAX_06: Section 194-O TDS Rate & Applicability

* **Rule ID**: `RULE_TAX_06`
* **Domain**: Direct Taxation & Statutory Withholding
* **Official Documentation**: Income Tax Act 1961, Section 194-O & Finance Act 2024 Amendments
* **Source URL**: https://incometaxindia.gov.in/
* **Date Researched**: 2026-08-28
* **Verification Status**: `VERIFIED`
* **Applicability**: E-commerce operators facilitating participant sales.

### Description
Under Section 194-O of the Indian Income Tax Act, e-commerce operators must deduct TDS on the gross amount of sales of goods/services facilitated through their digital platform.

### Statutory Rate History & Versioning
* **Prior Rate (upto 2024-09-30)**: 1.0% (100 basis points)
* **Amended Rate (effective 2024-10-01)**: **0.1%** (10 basis points) as per Finance Act 2024.
* **TDS Threshold**: Resident individuals/HUFs exempt if gross amount does not exceed ₹5,00,000 in a financial year and PAN/Aadhaar is furnished.

### Implementation Invariant
TDS rules must be modeled with versioned date ranges (`effective_from`, `effective_to`, `rate_bps`) and labeled as an applicability-controlled tax control pack.

* **Implementation Location**: [`packages/domain/tax.py`](file:///home/shubh/Desktop/code/buildathon/packages/domain/tax.py)
* **Tests**: [`tests/test_tax.py`](file:///home/shubh/Desktop/code/buildathon/tests/test_tax.py)

---

## 7. RULE_SETTLEMENT_BANK_07: UTR Matching & Batch Credit Aggregation

* **Rule ID**: `RULE_SETTLEMENT_BANK_07`
* **Domain**: Bank Reconciliation
* **Official Documentation**: RBI NEFT/RTGS Standards & Razorpay Settlement Webhooks
* **Date Researched**: 2026-08-28
* **Verification Status**: `VERIFIED`
* **Applicability**: All merchant bank credit statements.

### Description
When Razorpay executes a settlement payout, the payment rail assigns a Unique Transaction Reference (UTR).
* The settlement record's `utr` matches the bank statement credit line `reference` / `description`.
* The bank statement credit amount matches the net settlement amount in minor units.
* Any difference $\ge 1\text{ paisa}$ triggers `CTL_01_SETTLEMENT_BANK` exception.

* **Implementation Location**: [`packages/matching/batch_reconciliation.py`](file:///home/shubh/Desktop/code/buildathon/packages/matching/batch_reconciliation.py)
* **Tests**: [`tests/test_settlement_recon.py`](file:///home/shubh/Desktop/code/buildathon/tests/test_settlement_recon.py)
