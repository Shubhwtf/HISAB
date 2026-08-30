# CLAUDE.md — HISAB
## AI Finance Controller for Razorpay

You are the principal engineer, product architect, data scientist, fintech domain researcher, QA lead, and demo engineer for this project.

The goal is not to build a generic "AI reconciliation agent." The goal is to build a competition-winning Finance Controller for Razorpay's AI Buildathon Track 04.

The product must feel like a real financial-control system that uses AI intelligently, not a chatbot wrapped around CSV matching.

Project name:

# HISAB
### AI Finance Controller

Core positioning:

> **Hisab follows every rupee from payment to settlement, explains every mismatch, and knows when it should not make a decision.**

The product must feel like a serious financial-control system, not an "AI reconciliation chatbot".

The official competition requirement (Razorpay Buildathon Track 04) is to build an agent that closes one finance-ops loop across a 50+ record synthetic-data batch and reports match rate plus unresolved exceptions. Optimize the entire system around that requirement. A polished, measurable, reliable reconciliation loop is more important than a huge feature list.

This document is the single source of truth. Where an older instruction elsewhere in this file conflicts with a later section, the later section wins.

---

# 0. NON-NEGOTIABLE PRODUCT THESIS

The system is NOT primarily "an AI agent that reconciles payments."

It is:

> **An autonomous financial control system that reconstructs the flow of money across payment, refund, settlement and bank records, explains discrepancies with evidence, safely resolves high-confidence cases, and escalates ambiguous cases to humans.**

The product hierarchy is:

```text
SOURCE DATA
    ↓
NORMALIZATION
    ↓
FINANCIAL MODEL
    ↓
RECONCILIATION
    ↓
CONTROL CHECKS
    ↓
EXCEPTION DETECTION
    ↓
AI INVESTIGATION
    ↓
POLICY GATE
    ↓
RESOLVE OR ESCALATE
    ↓
EVIDENCE + AUDIT
```

The LLM is only one component in this architecture.

Never make the LLM responsible for authoritative financial calculations.

The LLM must NOT be the source of financial truth.

The LLM is allowed to:

- interpret ambiguous records
- rank candidate matches when deterministic methods cannot decide
- classify exception narratives
- explain decisions in natural language
- summarize evidence
- decide which investigation tools to call
- propose a resolution

The LLM must NOT:

- invent amounts
- calculate fees instead of deterministic code
- invent tax rates
- override policy rules
- directly mutate financial records without validation
- silently turn an uncertain match into a match
- fabricate external integration status

The core philosophy:

> AI reasons about ambiguity. Deterministic code establishes financial truth.

---

# 1. WHY THIS PRODUCT EXISTS

A merchant using Razorpay has multiple financial surfaces that must agree:

```text
Orders
Payments
Refunds
Disputes / Chargebacks
Razorpay Settlement Reconciliation
Razorpay Settlement Records
External Bank Statement
Optional Tax Records
```

The system must determine whether the money movement is complete, accurate, correctly classified, and explainable.

The product should answer:

1. Did every expected payment appear in settlement?
2. Did the settlement amount reconcile to the external bank credit?
3. Are fee and GST deductions expected and correct?
4. Are refunds correctly linked to their parent payment?
5. Are disputes creating additional financial exposure?
6. Are there duplicate or double-loss situations?
7. Which records can be safely auto-resolved?
8. Which records require human review?
9. Can every conclusion be proven from source evidence?
10. Can the entire batch be formally closed?

This is the Finance Controller loop.

---

# 2. COMPETITION STRATEGY

Design for the judging bar:

- 50+ records minimum, preferably 250–500 in the final benchmark
- measured match rate
- precision / recall for anomaly and exception detection
- throughput
- amount-weighted coverage
- explicit unresolved exception list
- honest confidence handling
- visible evidence trail
- one concrete financial edge case that generic reconciliation systems miss
- graceful failure and deterministic fallback

The product should be able to say:

```text
BATCH CLOSED

Records processed: 500
Matched: 462
Adjusted: 17
AI-assisted: 9
Escalated: 12
Unresolved: 9

Match rate: 92.4%

₹38.42L reconciled
₹1.73L unresolved

Throughput: 1,842 records/sec
```

Numbers shown in the UI must come from the actual benchmark run. During development, clearly label seeded/demo values. Never fabricate production performance claims.

---

# 3. PRODUCT DIFFERENTIATION

Do not position this as:

> "AI-powered reconciliation."

Position it as:

> "AI financial forensics and control: follow the money, prove the match, and isolate the losses that cannot be explained."

The product has three layers:

## Layer A — Controller

Closes the settlement/reconciliation loop.

## Layer B — Forensic Engine

Explains discrepancies and traces money across payment → refund → settlement → bank movement.

## Layer C — Exception Intelligence

Detects dangerous cases, especially double-loss scenarios, and refuses to hide uncertainty.

---

# 4. SIGNATURE FEATURE: DOUBLE-LOSS DETECTOR

This is the memorable competition feature.

Detect situations where the merchant experiences two legitimate-looking money-outflows related to the same commercial transaction.

Primary target scenario:

```text
Customer payment
      ↓
Manual merchant refund
      ↓
Separately raised dispute / chargeback
      ↓
Additional financial deduction / exposure
```

Do NOT call every second outflow a duplicate.

That distinction is the point.

The engine should classify:

```text
NORMAL_REFUND
DUPLICATE_REFUND
REFUND_PLUS_CHARGEBACK_POTENTIAL_DOUBLE_LOSS
CHARGEBACK_ONLY
DISPUTE_PENDING
DISPUTE_WON
DISPUTE_LOST
AMBIGUOUS
```

Example UI:

```text
⚠ POTENTIAL DOUBLE LOSS

Order: ORD_10482
Original payment: ₹72,000
Manual refund: ₹72,000
Chargeback exposure: ₹72,000

Potential merchant exposure: ₹144,000

Why flagged:
• same commercial order
• independent refund event exists
• independent dispute event exists
• both represent legitimate money-outflow paths

Confidence: 97.4%

Recommended action:
HUMAN REVIEW

Evidence:
Payment → Refund → Dispute → Settlement impact
```

Do not silently "deduplicate" this.

This is an exception requiring explicit review.

Make this the strongest screenshot and second strongest demo moment after batch close.

---

# 5. SECOND SIGNATURE FEATURE: PROVE IT

Every reconciliation decision must have a human-readable evidence graph.

Example:

```text
ORDER ORD-10482
        │
        ▼
PAYMENT PAY_91231  ₹50,000
        │
        ├──────────► REFUND REF_3321  ₹20,000
        │
        ▼
SETTLEMENT SET_8842
        │
        ▼
BANK CREDIT UTR_77821
```

Clicking any edge should reveal evidence:

```text
WHY DID YOU MATCH THESE?

Payment → Settlement

✓ payment ID present in settlement reconciliation report
✓ settlement ID matches
✓ amount contribution reconciles
✓ capture timestamp within settlement window
✓ fee schedule produces expected net
✓ no contradictory refund/dispute state

Confidence: 99.7%
```

The product must never rely on a naked confidence number.

---

# 6. REAL RAZORPAY DOMAIN RULES

Domain research is a first-class, blocking phase. The project begins by producing `DOMAIN_RULES.md`. No financial logic is implemented before the rule it encodes exists in that file.

Every domain rule must contain:

```text
Rule ID
Domain
Rule
Source URL
Official documentation title
Date researched
Applicability
Implementation location
Tests covering this rule
```

Research and verify at minimum:

1. Settlement reconciliation
2. Settlement reports
3. Transaction-to-settlement relationships
4. Refund behavior
5. Non-reversal of captured transaction fees on refunds
6. GST treatment on fees
7. Payment-source refund behavior
8. Dispute lifecycle
9. Chargeback deductions/fees
10. Dispute evidence workflow
11. Settlement timing/state where relevant
12. Razorpay test-mode behavior relevant to the demo

Do NOT rely on generic LLM knowledge for any financial-domain rule.

Do NOT invent Razorpay behavior.

If a rule cannot be verified from an official source, mark it:

```text
UNVERIFIED
```

and do not build it as a hard financial invariant. An `UNVERIFIED` rule may still drive a WARN-level control, but never a FAIL-level invariant or an auto-resolution.

## 6.0 Development rule for every financial rule

Before implementing each financial rule:

1. research official source
2. add rule to `DOMAIN_RULES.md`
3. implement deterministic rule
4. write tests
5. add synthetic cases
6. verify benchmark impact

Never allow an LLM-generated assumption to silently become a financial invariant.

## 6.1 Settlements

Razorpay provides Settlement Reconciliation reporting that maps transactions to settlement IDs. Therefore:

DO NOT claim that Razorpay is incapable of telling which transaction belongs to which settlement.

Do NOT model the financial flow as a simplistic chain:

```text
Order → Payment → Settlement → Bank Credit
```

Settlement is a batch/aggregation layer. The correct architecture is:

```text
Orders
   ↓
Payments
   ↓
Refunds / Adjustments / Fees
   ↓
Razorpay Settlement Batch
   ↓
External Bank Credit
```

Many financial movements aggregate into one settlement batch, which produces one or more external bank credits.

Within the settlement:

```text
Gross captured payments
- fees
- fee taxes
- refunds / adjustments
± other configured adjustments
= expected settlement amount
```

The product's differentiation is NOT "we discover which payment belongs to which Razorpay settlement because Razorpay doesn't know."

Instead, Hisab must:

1. ingest transaction-level data
2. ingest settlement-level data
3. ingest external bank-statement data
4. verify settlement composition
5. calculate expected settlement value
6. reconcile settlement to actual bank movement
7. detect missing, duplicated, malformed, delayed, or inconsistent records
8. investigate exceptions

The key financial-control question is:

> **Does the settlement batch actually reconcile to the bank movement, and can every material difference be explained?**

Where source data is incomplete or intentionally corrupted, the system should be able to reconstruct candidate decompositions.

## 6.2 Refund fee behavior

For normal refunds, Razorpay states that the original transaction fee and GST levied at capture are not reversed to the merchant.

Therefore:

```text
refund != simply -original_payment
```

The normal refund accounting rule must preserve the original fee and tax leakage.

Do NOT hardcode a universal MDR percentage such as 2% for all merchants. Fee schedules vary by configuration/payment method. Build a parameterized fee schedule in the synthetic dataset and test the formula against the configured schedule.

A synthetic case may use:

```text
Payment = ₹1,000
MDR = 2% of configured scenario
MDR fee = ₹20
GST = 18% of fee = ₹3.60
Net = ₹976.40
```

but treat this as a dataset configuration, not a universal Razorpay pricing claim.

General formula, in integer paise:

```text
gross = 100000 paise
mdr_rate = configurable
fee = gross × mdr_rate
fee_tax = fee × tax_rate
net = gross - fee - fee_tax - other_adjustments
```

Use integer-safe arithmetic throughout. Never use floating-point financial arithmetic. Define and document the rounding rule for each multiplication.

For a normal full refund:

```text
customer_refund = original_payment_amount
merchant_fee_and_fee_tax = not reversed
```

Ensure the reconciler knows this expected variance rather than flagging it as a mismatch.

## 6.2.1 Financial effect engine

Implement a deterministic financial-effect engine. For every payment, refund, fee, tax and adjustment, calculate:

```text
gross amount
fee
tax on fee
refund amount
expected merchant-side effect
observed merchant-side effect
variance
variance classification
```

This engine is the only place merchant-side economics are computed. Matching, controls and the agent all read from it; none of them recompute economics independently.

## 6.2.2 Refund classifications

A refund is NOT always `refund = -payment`, because the original transaction fee/tax treatment matters. The expected variance must be computed using configured fee rules.

Every refund-related variance must land in exactly one class:

```text
EXPECTED_REFUND_VARIANCE
UNEXPECTED_REFUND_VARIANCE
REFUND_AMOUNT_MISMATCH
REFUND_SOURCE_MISMATCH
REFUND_WITHOUT_PAYMENT
DUPLICATE_REFUND
```

The system must never classify a normal fee-retention effect as an unexplained discrepancy.

Test this heavily. It directly determines the false-positive rate, which is the metric most likely to be attacked in judging.

## 6.3 Refund source evidence and instrument threading

Razorpay refunds are source refunds: they are returned to the original payment method.

Thread instrument/source information through the canonical model wherever legitimately available:

```text
Payment
  ↓
Refund
```

The purpose is not to collect unnecessary sensitive data. The purpose is to prove that a refund corresponds to the source payment.

Use masked or tokenized values such as:

```text
CARD: •••• 4242
VPA_HASH: 91af...
```

Do not store raw PAN or sensitive payment credentials. Never expose full card numbers or secrets.

The Prove It screen should show:

```text
Original payment method:
<Card / UPI / other available source metadata>

Refund:
linked to original payment

Evidence:
payment ID
refund ID
source/reference information
amount
timestamp
```

The instrument/reference must be evidence, not merely UI decoration.

## 6.4 Disputes and chargeback control

Razorpay exposes dispute states and supports accepting or contesting disputes with evidence.

Model at least:

```text
OPEN
EVIDENCE_SUBMITTED
WON
LOST
ACCEPTED
```

Build a dedicated dispute control subsystem. Track:

```text
dispute created
amount
payment
order
status
fees
deductions
evidence deadline
evidence submitted
resolution
```

Build controls for:

```text
UNSUPPORTED_DISPUTE
MISSING_EVIDENCE
APPROACHING_DEADLINE
DUPLICATE_OUTFLOW
REFUND_PLUS_DISPUTE
DISPUTE_AMOUNT_MISMATCH
```

Include response deadline / respond-by date when available in the synthetic scenario.

A dispute must affect financial exposure separately from a normal refund.

The agent may investigate disputes and gather existing evidence. The agent must never fabricate evidence.

## 6.5 TDS / Section 194-O tax reconciliation

Retain TDS as a secondary but impressive feature. Treat tax reconciliation as an advanced control pack, not a universal Razorpay rule.

Do NOT blindly state that every Razorpay merchant is subject to Section 194-O. Section 194-O has applicability conditions, and the statutory rate was amended from 1% to 0.1% effective October 1, 2024. The domain research phase must verify the currently applicable rule and effective date against a primary statutory source before this module is built.

Model tax rules as versioned configuration:

```text
tax_rule_id
section
rate
effective_from
effective_to
conditions
source
```

Create a synthetic external tax-record source representing a government tax statement such as a Form-26AS-style dataset. Then reconcile:

```text
Settlement
    ↓
Expected TDS
    ↓
External tax statement
```

Possible states:

```text
TDS_MATCHED
TDS_MISMATCH
TDS_MISSING
TDS_UNEXPECTED
NOT_APPLICABLE
```

Rules:

- explicitly label the scenario as applicable
- parameterize the rate and tax-year rule
- call the output a tax-reconciliation control, not legal/tax advice
- cite the statutory source in `DOMAIN_RULES.md`

Never bake an old 1% rule into the engine without an applicability/version layer.

This is a P2 module. Do not allow it to consume development time before the core settlement/reconciliation engine is excellent.

---

# 7. THE SEVEN FINANCIAL CONTROLS

Do not make "matched/unmatched" the whole product.

Controls must be explicit, independently testable, and individually runnable. Each control is a named unit of code with its own tests and its own synthetic cases.

| ID | Control | Objective it enforces |
|---|---|---|
| `CTL_01_SETTLEMENT_BANK` | Settlement-to-bank mismatch | Accuracy |
| `CTL_02_MISSING_TXN` | Missing settlement transaction | Completeness |
| `CTL_03_DUPLICATE` | Duplicate transaction / refund | Duplicate detection |
| `CTL_04_FEE_GST` | Fee / GST inconsistency | Classification |
| `CTL_05_REFUND` | Refund mismatch | Refund correctness |
| `CTL_06_DOUBLE_LOSS` | Potential double-loss | Compounded outflow |
| `CTL_07_DISPUTE` | Dispute / deadline exposure | Cut-off and exposure |

Two cross-cutting invariants apply to every control rather than being controls themselves:

- **Evidence** — every match or resolution must be traceable to source records.
- **Uncertainty** — low-confidence cases must remain exceptions and must never be auto-resolved.

Each control run produces:

```text
CONTROL_ID
status
severity
financial_impact
evidence
explanation
recommended_action
```

Status values:

```text
PASS
WARN
FAIL
BLOCKED
```

`BLOCKED` means the control could not be evaluated — missing source data, an unavailable dependency, or an `UNVERIFIED` domain rule. A `BLOCKED` control is never silently treated as `PASS`, and it prevents batch close for the records it covers.

These controls must be visible in the UI.

---

# 7.1 CONTROL SEVERITY MUST BE FINANCIAL

Do not prioritize anomalies merely by confidence. Severity is driven by financial impact.

Demo defaults:

```text
CRITICAL   ₹1,00,000+ exposure
HIGH       ₹25,000 – ₹99,999
MEDIUM     ₹5,000 – ₹24,999
LOW        <₹5,000
```

Thresholds must be configurable. Do not assume these exact thresholds are universal — they are demo defaults, and the UI must present them as configuration rather than as accounting standard.

Control significance can escalate severity above the amount band: a potential double-loss or an active dispute is never below `HIGH` regardless of value.

The exception engine must expose *why* a severity was assigned — the band, the amount, and any escalation rule that fired.

---

# 8. END-TO-END AGENT LOOP

The agent must close exactly one strong finance-ops loop:

```text
INGEST
  ↓
NORMALIZE
  ↓
RECONCILE
  ↓
INVESTIGATE EXCEPTIONS
  ↓
AUTO-RESOLVE SAFE CASES
  ↓
ESCALATE UNSAFE CASES
  ↓
VERIFY CONTROLS
  ↓
CLOSE BATCH
  ↓
REPORT
```

The central action should be:

# `CLOSE BATCH`

When clicked, or triggered by the agent after all required controls pass:

1. process all records
2. reconcile all possible matches
3. run financial controls
4. identify exceptions
5. auto-resolve allowed cases
6. freeze the batch result
7. generate the exception list
8. compute metrics
9. produce a reconciliation report
10. generate an immutable decision summary

The batch cannot be considered "closed" while unresolved exceptions are silently hidden.

---

# 9. TOOL-USING AGENT

Implement the agent as a tool-using controller, not a chat-only assistant.

Core tools:

```text
list_source_records()
get_record(record_id)
search_candidates(record)
calculate_expected_settlement(payment_id)
calculate_refund_effect(payment_id, refund_id)
inspect_dispute(payment_id)
match_payment_to_settlement(payment_id, settlement_id)
validate_bank_credit(bank_line_id)
run_control(control_id, case_id)
create_exception(case_id, reason)
propose_resolution(case_id)
apply_safe_resolution(case_id)
verify_evidence(case_id)
close_batch(batch_id)
```

The LLM chooses which investigation tools to call.

Critical calculations are deterministic code.

Tool outputs must be typed and validated.

---

# 10. MATCHING ENGINE

Use a tiered matching strategy.

## Tier 1 — Exact deterministic

Use:

- payment ID
- order ID
- refund ID
- settlement ID
- dispute ID
- UTR / reference
- exact source reference

## Tier 2 — Constraint-based

Use:

- amount
- timestamp windows
- customer reference
- transaction direction
- payment status
- settlement membership
- fee-adjusted amount
- refund state

## Tier 3 — Fuzzy matching

Use carefully:

- normalized reference strings
- textual descriptions
- merchant reference variants
- customer identifiers

## Tier 4 — LLM-assisted ambiguity resolution

Only after the deterministic engine produces candidate matches.

The LLM receives:

```text
record
candidate_1
candidate_2
candidate_3
hard_constraints
calculated_amounts
source_evidence
```

It returns structured JSON:

```json
{
  "selected_candidate": "SET_8842",
  "confidence": 0.963,
  "reason_codes": [
    "AMOUNT_RECONCILES",
    "TIMESTAMP_COMPATIBLE",
    "REFERENCE_SIMILARITY"
  ],
  "needs_human_review": false
}
```

Never let it invent a candidate ID.

---

# 11. BATCH DECOMPOSITION

This is foundational.

Do NOT build the system around a simplistic 1:1 payment → settlement → bank-credit chain.

The conceptual model is:

```text
Many financial movements
        ↓
Razorpay settlement / batch
        ↓
One or more external bank credits
```

Within the settlement:

```text
Gross captured payments
- fees
- fee taxes
- refunds / adjustments
± other configured adjustments
= expected settlement amount
```

Implement a batch decomposition engine capable of:

1. reading settlement membership when available
2. grouping records by settlement ID
3. calculating expected batch net
4. comparing against bank statement line(s)
5. identifying missing lines
6. identifying extra lines
7. reconstructing candidate groupings when source mappings are intentionally corrupted

For reconstruction, prefer a constrained algorithm over brute-force explosion.

Possible techniques:

- indexed candidate retrieval
- sorted two-pointer methods where applicable
- dynamic programming for bounded subset-sum
- meet-in-the-middle for small ambiguous groups
- integer/linear optimization only if needed

Do not deploy an expensive optimizer for every normal record.

Use a fast path for clean data and an investigation path for anomalies.

---

# 12. REFUND-AWARE RECONCILIATION

A refund changes economics but does not mean the original payment never existed.

Model:

```text
ORIGINAL PAYMENT
   gross
   fee
   fee tax
   net

REFUND
   customer amount returned
   merchant fee/tax retained

SETTLEMENT EFFECT
   original net
   minus any settlement-side refund adjustment if applicable
```

The exact settlement treatment must be driven by documented dataset assumptions and official documentation.

The rule engine should explain:

```text
Expected difference:
₹1,676

Cause:
₹1,420 transaction fee
₹256 fee tax

Status:
EXPECTED VARIANCE
```

Never label every refund shortfall as fraud or accounting error.

---

# 13. DOUBLE-LOSS FORENSICS

Create a dedicated detector.

Inputs:

- payment
- refund events
- dispute events
- settlement effects
- dispute outcomes
- timing
- references
- order/customer relationship

Rules should detect:

### Case A
Refund exists and no dispute exists.

→ normal refund.

### Case B
Multiple refunds exceed captured amount.

→ duplicate/over-refund exception.

### Case C
Refund exists plus independent dispute/chargeback exposure.

→ potential double-loss.

### Case D
Same payment appears in dispute but evidence proves the earlier refund was source-completed.

→ likely defensive evidence case, not automatically double-loss.

### Case E
Evidence is insufficient.

→ ambiguous, human review.

The engine should calculate:

```text
original amount
refund amount
chargeback exposure
fees/penalties when modeled
net potential loss
```

Do not overstate actual loss if the dispute is still pending.

Use terminology:

```text
Potential Exposure
```

instead of:

```text
Confirmed Loss
```

until outcome is known.

---

# 14. EXCEPTION ENGINE

Every exception needs:

```text
exception_id
severity
category
financial_impact
confidence
root_cause
recommendation
affected_records
evidence
status
created_at
resolved_at
resolution_method
```

Categories:

```text
MISSING_SETTLEMENT
AMOUNT_MISMATCH
FEE_MISMATCH
REFUND_MISMATCH
DUPLICATE_PAYMENT
DUPLICATE_REFUND
DOUBLE_LOSS
DISPUTE_EXPOSURE
BANK_CREDIT_UNMATCHED
TAX_RECONCILIATION
TIMING_ANOMALY
UNKNOWN
```

Severity should depend on financial impact and control significance, not just confidence.

---

# 15. SAFE AUTO-RESOLUTION POLICY

Build a deterministic resolution policy.

Example:

```text
AUTO-RESOLVE if:
- confidence >= configured threshold
- at least 2 independent evidence signals
- no contradictory source
- financial impact below configured limit
- anomaly type is allowlisted
- no active dispute
```

Otherwise:

```text
HUMAN REVIEW
```

Examples of safe automation:

```text
Known fee + tax variance
Known settlement-to-payment mapping
Exact UTR match
Exact duplicate source event with same event ID
```

Examples that should require review:

```text
Potential double loss
High-value unexplained discrepancy
Conflicting payment references
Tax applicability ambiguity
Active dispute with competing outflow
```

The policy engine must be code/configuration, not LLM output.

---

# 16. EVIDENCE GRAPH

Implement a graph-like relationship model even if stored relationally.

Entities:

```text
Customer
Order
Payment
Refund
Dispute
Settlement
SettlementLine
BankTransaction
TaxRecord
```

Edges:

```text
ORDER_CONTAINS_PAYMENT
PAYMENT_REFUNDED_BY_REFUND
PAYMENT_DISPUTED_BY_DISPUTE
PAYMENT_INCLUDED_IN_SETTLEMENT
SETTLEMENT_CREDITED_TO_BANK
REFUND_ORIGINATES_FROM_PAYMENT
TAX_RECORD_RELATES_TO_SETTLEMENT
```

Every edge should store:

```text
source
 target
relationship
confidence
proof / evidence IDs
created_by
```

---

# 17. USER INTERFACE

Build a premium fintech control-room UI.

Avoid generic AI-dashboard aesthetics.

No giant robot.
No fake futuristic graphics.
No chatbot homepage.
No meaningless animated gradients.

Visual language:

```text
financial
precise
dense but readable
executive-friendly
investigative
```

Main navigation:

```text
Overview
Batches
Exceptions
Evidence Graph
Controls
Data Sources
Agent Runs
Audit Log
Settings
```

---

# 18. OVERVIEW DASHBOARD

Top cards:

```text
Revenue Processed
Revenue Reconciled
Match Rate
Exception Rate
Potential Loss Exposed
Batches Closed
```

Main visual:

## Money Flow

```text
Customer Payments
       ↓
Razorpay Settlement
       ↓
Bank Credit
```

Then show:

```text
EXPECTED
ACTUAL
VARIANCE
STATUS
```

Secondary panels:

- control health
- top financial exceptions
- batch processing throughput
- unresolved value
- double-loss alerts
- recent agent decisions

---

# 19. BATCH CONTROL ROOM

Primary screen.

Header:

```text
BATCH #SETTLEMENT_2026_08_28

Status: INVESTIGATING

₹38.42L expected
₹38.31L bank-confirmed
₹11,240 unexplained
```

Buttons:

```text
RUN CONTROLLER
CLOSE BATCH
EXPORT REPORT
```

Progress:

```text
✓ Ingested
✓ Normalized
✓ Matched
✓ Controls checked
⚠ 9 exceptions
○ Human review
```

Once safe cases are resolved:

```text
BATCH CLOSED WITH EXCEPTIONS
```

That wording matters. A batch can be operationally closed while transparently carrying unresolved exceptions.

---

# 20. EXCEPTION DETAIL

Build a cinematic but professional investigation view.

Example:

```text
DOUBLE-LOSS ALERT

₹72,000 potential exposure

ORDER ORD-10482

Payment       ₹72,000
Refund        ₹72,000
Chargeback    ₹72,000

POTENTIAL EXPOSURE
₹144,000
```

Evidence timeline:

```text
10:04 Payment captured
10:13 Refund initiated
10:14 Refund processed
11:02 Dispute received
11:02 Dispute amount deducted / exposed
```

Then:

```text
WHY FLAGGED

The refund and dispute are independent financial paths
linked to the same commercial transaction.

This is not a duplicate record.
It is a possible double-loss.
```

Buttons:

```text
VERIFY
RESOLVE
ESCALATE
EXPORT EVIDENCE
```

Default should be ESCALATE for the signature double-loss feature.

---

# 21. PROVE IT VIEW

For any match:

```text
PROOF OF RECONCILIATION
```

Show:

```text
Source A
Source B

Amount relationship
Time relationship
Identifier relationship
Fee calculation
Refund relationship
Settlement relationship
```

Each evidence item must be clickable.

Example:

```text
✓ Payment P8812 appears in Settlement Recon Report
✓ Settlement ID SET1822
✓ Expected net ₹48,259.50
✓ Bank credit ₹48,259.50
✓ UTR matches

DECISION: MATCHED
CONFIDENCE: 99.7%
```

---

# 22. AI EXPLANATION PANEL

Include a right-side panel:

```text
CONTROLLER REASONING
```

But never expose hidden chain-of-thought.

Show concise decision justification based on stored evidence.

Good:

```text
I matched this payment to settlement SET1822 because:

1. Razorpay's reconciliation report links the payment to SET1822.
2. Fee-aware expected net equals the settlement contribution.
3. The bank credit matches the settlement total.
4. No contradictory refund or dispute exists.
```

Never display internal private reasoning traces.

---

# 23. BATCH AUTOPSY

Create the final report:

```text
BATCH AUTOPSY

Records processed          500
Matched                    462
Adjusted                    17
AI-assisted                  9
Escalated                   12
Unresolved                   9

Match rate                92.4%

Value reconciled         ₹38.42L
Value unresolved          ₹1.73L

False-positive rate         1.1%
Throughput              1,842 r/s
```

Then a breakdown:

```text
WHY CASES FAILED

5 × missing settlement evidence
2 × ambiguous bank reference
1 × potential double loss
1 × tax applicability ambiguity
```

The report must include the complete unresolved exception list.

---

# 24. BENCHMARKING

Build a deterministic benchmark harness.

Dataset:

- minimum 500 rows in final benchmark
- deterministic seed
- clean ground truth hidden from the agent
- 70/30 development/test split
- anomaly categories distributed intentionally

Generate:

### Clean cases

- exact matches
- known fee variance
- known refund behavior
- ordinary settlement timing

### Corrupted cases

- missing settlement mapping
- duplicate event
- altered reference
- amount mismatch
- incorrect fee assumption
- refund mismatch
- bank credit mismatch
- dispute state conflict
- double-loss case
- tax record mismatch
- timing anomaly

Metrics:

```text
record_match_precision
record_match_recall
record_match_f1
exception_precision
exception_recall
throughput_records_per_second
amount_weighted_reconciliation_rate
false_positive_cost
false_negative_financial_exposure
auto_resolution_safe_rate
human_review_rate
```

Also compute:

```text
value_reconciled / total_value
```

because a 98% record match rate is less impressive if the remaining 2% contains 60% of the money.

---

# 25. BASELINE COMPARISON

Run three strategies:

## Baseline A — Exact join only

Match on IDs.

## Baseline B — Deterministic finance engine

IDs + constraints + fee-aware calculations.

## Baseline C — HISAB

Deterministic engine + anomaly controls + AI-assisted ambiguity + exception intelligence.

Report:

```text
                       Exact    Deterministic    HISAB
Match rate              ...          ...              ...
Precision                ...          ...              ...
False positives          ...          ...              ...
Unresolved value         ...          ...              ...
Double-loss detection    ...          ...              ...
Throughput               ...          ...              ...
```

The final presentation must show that AI and agentic reasoning improved a specific class of difficult cases rather than merely adding prose.

---

# 26. FAILURE ENGINEERING

The competition rewards builders who demonstrate what broke and how the system handled it.

Build a Failure Lab.

Inject:

```text
Malformed settlement record
Duplicate webhook/event
LLM timeout
LLM malformed JSON
Bank statement missing reference
Unknown payment failure state
Conflicting amounts
Database transient error
```

Required behavior:

```text
FAILURE DETECTED
       ↓
CLASSIFY
       ↓
FALLBACK
       ↓
SAFE DECISION
       ↓
AUDIT
```

Example:

```text
AI MATCHING SERVICE UNAVAILABLE

Fallback activated:
Constraint-based matcher

Result:
487 records reconciled
8 cases escalated

No financial record was auto-resolved using unavailable AI.
```

The system must never silently fail.

---

# 27. AUDIT LEDGER

Every material decision must be immutable in the application's audit log.

Fields:

```text
sequence
batch_id
case_id
event_id
action
policy_result
reason_code
evidence_ids
actor_type
created_at
previous_hash
current_hash
```

Use hash chaining:

```text
H1 → H2 → H3 → H4 → H5
```

Provide:

```text
VERIFY AUDIT INTEGRITY
```

Include a test that intentionally mutates an entry and shows verification failure.

Do not spend competition time implementing public blockchain anchoring unless the entire core system is already excellent.

---

# 28. DATA MODEL

Prefer PostgreSQL.

Tables:

```text
customers
orders
payments
payment_instruments
refunds
disputes
settlements
settlement_lines
bank_transactions
tax_records
revenue_cases
match_candidates
matches
controls
exceptions
resolutions
audit_entries
agent_runs
agent_tool_calls
benchmark_runs
benchmark_results
failure_events
```

Use proper foreign keys and indexes.

Avoid a single giant JSON blob.

Use JSON only for raw payload/evidence when appropriate.

---

# 29. CANONICAL ENTITIES

Use typed Pydantic / TypeScript models.

Example:

```typescript
interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded' | 'partially_refunded';
  method: string;
  instrumentRef?: string;
  capturedAt: string;
}
```

Settlement:

```typescript
interface Settlement {
  id: string;
  utr?: string;
  amount: number;
  currency: string;
  status: string;
  settledAt: string;
}
```

Bank:

```typescript
interface BankTransaction {
  id: string;
  date: string;
  valueDate?: string;
  amount: number;
  direction: 'credit' | 'debit';
  reference?: string;
  description?: string;
}
```

Refund:

```typescript
interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  sourceInstrumentRef?: string;
  createdAt: string;
}
```

Dispute:

```typescript
interface Dispute {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  respondBy?: string;
  createdAt: string;
}
```

Keep money amounts integer in minor units wherever practical. Avoid floating-point monetary arithmetic.

---

# 30. TECH STACK

Use a pragmatic stack.

Frontend:

- Next.js
- TypeScript
- Tailwind CSS
- accessible component system
- chart library only where useful

Backend:

- FastAPI
- Python
- Pydantic
- SQLAlchemy

Database:

- PostgreSQL

Background processing:

- Redis + worker only if actually needed

LLM:

- provider abstraction
- support one reliable provider initially
- keep model configuration in environment variables

Deployment:

- Docker
- docker-compose for local environment

Do not build microservices just to sound enterprise.

A modular monolith is preferable for an eight-day competition build.

---

# 31. SECURITY

Implement:

- `.env`
- `.env.example`
- no secrets in Git
- webhook verification where applicable
- API authentication for dashboard
- request validation
- rate limits on external endpoints
- idempotency
- safe logging
- masked payment instrument references

Never log credentials or sensitive payment details.

---

# 32. RAZORPAY INTEGRATION STRATEGY

Use three modes.

## Mode 1 — Synthetic Benchmark

This is mandatory and the source of competition metrics.

## Mode 2 — Razorpay Test Mode Adapter

Use official test-mode APIs where practical.

Do not make the entire demo dependent on network reliability.

## Mode 3 — Recorded Fixtures

Store sanitized example payloads / fixtures for a deterministic demo.

The final demo must work even if the external API is unavailable.

Clearly label fixtures as fixtures.

Never pretend a fixture is a live API call.

---

# 33. SYNTHETIC DATA GENERATOR

Create a realistic synthetic merchant.

Example:

```text
Merchant: Nova Commerce Pvt Ltd

500+ financial records
30–80 customers
200+ payments
50+ refunds
20+ settlements
bank statement
15+ disputes
optional tax ledger
```

Generate realistic relationships, not independent random rows.

Every anomaly must have ground truth:

```text
is_anomaly
anomaly_type
ground_truth_match
ground_truth_resolution
expected_financial_impact
```

Keep ground truth out of the agent-facing dataset.

---

# 34. DATA CORRUPTION ENGINE

Create a reproducible corruption layer.

Functions:

```text
remove_settlement_mapping()
shift_bank_reference()
duplicate_payment_event()
modify_amount()
introduce_wrong_fee()
create_partial_refund()
create_double_loss_case()
create_missing_bank_credit()
create_tax_mismatch()
create_timing_anomaly()
```

Store a hidden scenario manifest so metrics can be validated automatically.

---

# 35. API DESIGN

At minimum:

```text
POST /api/batches
POST /api/batches/{id}/run
POST /api/batches/{id}/close
GET  /api/batches/{id}
GET  /api/batches/{id}/metrics
GET  /api/batches/{id}/exceptions
GET  /api/exceptions/{id}
GET  /api/cases/{id}
GET  /api/cases/{id}/evidence
POST /api/cases/{id}/resolve
POST /api/cases/{id}/escalate
POST /api/failure-lab/{scenario}
GET  /api/audit/verify
GET  /api/health
```

Implement OpenAPI documentation automatically through FastAPI.

---

# 36. REPO STRUCTURE

If the repository is empty, create:

```text
/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── domain/
│   ├── matching/
│   ├── controls/
│   ├── agent/
│   └── evaluation/
├── data/
│   ├── fixtures/
│   ├── synthetic/
│   └── generated/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DOMAIN_RULES.md
│   ├── CONTROLS.md
│   ├── EVALUATION.md
│   ├── DEMO.md
│   └── FAILURE_REPORT.md
├── scripts/
│   ├── seed_data.py
│   ├── run_benchmark.py
│   └── run_demo.py
├── tests/
├── docker-compose.yml
├── .env.example
├── README.md
└── CLAUDE.md
```

If an existing repository already has a working architecture, preserve it where sensible and improve it instead of blindly replacing it.

---

# 37. TESTING REQUIREMENTS

Unit tests:

- money calculations
- fee calculations
- refund calculations
- matching functions
- exception classification
- double-loss detection
- policy decisions
- hash-chain integrity

Integration tests:

- seed dataset
- run full batch
- generate benchmark
- fail an LLM call
- verify deterministic fallback
- verify batch closure

End-to-end tests:

- open dashboard
- run benchmark
- inspect exception
- inspect evidence graph
- close batch
- export report

The benchmark itself is a test.

---

# 38. ACCEPTANCE CRITERIA

Do not call the product complete until all of these work:

1. 50+ records are processed end to end.
2. Final benchmark uses at least 500 records.
3. Ground truth is hidden from the agent.
4. Normal fee/GST variance does not create false exceptions.
5. Bank settlement matching works across batch-level credits.
6. Refunds are tied to original payment instruments/references.
7. Disputes are modeled independently from refunds.
8. Double-loss scenarios are detected.
9. Low-confidence cases become exceptions.
10. At least one ambiguity is resolved using AI-assisted reasoning.
11. The same case works without the LLM through fallback logic.
12. Batch can be closed and produces metrics.
13. Complete unresolved exception list is visible.
14. Evidence can be inspected for every material decision.
15. Audit chain verification works.
16. Failure Lab works.
17. Baseline comparison works.
18. The five-minute demo can run without manually editing the database.
19. README and architecture documentation are accurate.
20. No fabricated production performance claims exist.

---

# 39. DEMO SCRIPT

The final five-minute demo should follow this exact narrative.

## 0:00–0:30 — Problem

Show:

```text
₹38.42L financial movement
500 records
Multiple sources
```

Say:

> “The hard part isn't recording transactions. It's proving that the money across payments, settlements, refunds, disputes and the bank actually agrees.”

## 0:30–1:15 — Controller

Click:

`RUN CONTROLLER`

Show the agent executing:

```text
ingest
normalize
match
control-check
resolve
escalate
```

## 1:15–2:00 — Batch result

Show:

```text
92.4% match rate
₹38.42L reconciled
9 unresolved exceptions
```

Show the honest exception list.

## 2:00–3:15 — Signature case

Open the double-loss case.

Show:

```text
₹72,000 refund
+
₹72,000 dispute exposure
=
₹144,000 potential exposure
```

Then show the evidence graph.

## 3:15–4:00 — Prove It

Pick an ordinary record.

Show why a refund variance is expected because transaction fee/GST is retained.

Then show the exact evidence graph.

## 4:00–4:35 — Failure

Trigger LLM timeout.

Show:

```text
LLM unavailable
↓
deterministic fallback
↓
unsafe cases escalated
↓
no silent financial action
```

## 4:35–5:00 — Close

Show:

```text
BATCH CLOSED WITH 9 EXCEPTIONS

₹38.42L reconciled
₹1.73L unresolved
```

Finish with:

> “HISAB doesn't ask an LLM whether the books look right. It builds the evidence, checks the economics, resolves what is safe, and tells a human exactly what remains unexplained.”

---

# 40. HOSTILE Q&A PREPARATION

Generate `docs/HOSTILE_QA.md` containing hard questions and concise answers.

Questions must include:

- Why not just use SQL joins?
- Why is an LLM necessary?
- Why not let the LLM do everything?
- How do you prevent hallucinations?
- How do you calculate fees?
- Why does refund amount differ from original payment?
- How do you handle many payments in one settlement?
- How do you avoid false positives?
- How do you detect the double-loss case?
- How do you know the refund belongs to the original instrument?
- What happens when the AI fails?
- What if the confidence is wrong?
- Why should a merchant trust auto-resolution?
- What happens to unresolved exceptions?
- How is your benchmark generated?
- Are your metrics cherry-picked?
- Can the system work without Razorpay being reachable?
- What is actually live versus synthetic?
- Where is AI providing measurable value?
- What would you build next for production?

Answers must be defensible by looking at the code.

---

# 41. DOCUMENTATION REQUIREMENTS

Create:

`README.md`

Must explain:

- problem
- product
- architecture
- setup
- demo
- benchmark
- metrics
- AI role
- failure handling
- limitations

`DOMAIN_RULES.md`

Document every Razorpay-specific accounting assumption and its source/version.

`ARCHITECTURE.md`

Show:

```text
sources
→ canonical model
→ matching
→ controls
→ agent
→ policy
→ resolution
→ evidence
→ audit
→ benchmark
```

`EVALUATION.md`

Explain dataset generation, ground truth, corruption, metrics and baseline comparisons.

`FAILURE_REPORT.md`

Record a real failure encountered during development.

Do not invent a dramatic failure after the fact.

---

# 42. ENGINEERING RULES

1. Never silently swallow exceptions.
2. Never use floating point for monetary truth when integer minor units are possible.
3. Never hardcode a universal MDR.
4. Never hardcode obsolete tax rates without versioning.
5. Never allow LLM output to bypass policy validation.
6. Never call an uncertain match a confirmed match.
7. Never hide unresolved exceptions.
8. Never fabricate external API connectivity.
9. Never expose sensitive payment credentials.
10. Never optimize the UI before the benchmark works.
11. Never create fake AI functionality that is just `LLM.generate()` with no measurable value.
12. Prefer deterministic code for rules and economics.
13. Prefer an explainable model over an opaque model for the core financial control.
14. Every important decision must have evidence.
15. Every auto-resolution must be reversible in the prototype.

---

# 43. IMPLEMENTATION PRIORITY

Do not attempt to build every possible feature simultaneously.

Priority 0 — Foundation

- inspect repo
- preserve working code
- install/run project
- establish architecture
- canonical models
- database
- seed generator

Priority 1 — Winning Core

- payments
- settlements
- bank statement
- batch decomposition
- fee-aware reconciliation
- refund-aware reconciliation
- controls
- exception engine
- metrics

Priority 2 — Signature Differentiation

- double-loss detector
- evidence graph
- Prove It view
- safe auto-resolution

Priority 3 — Agentic Intelligence

- tool-using controller
- AI ambiguity resolution
- explanation generation
- failure fallback

Priority 4 — Polish

- premium dashboard
- Batch Autopsy
- failure lab
- audit integrity
- baseline comparison
- exportable report

Priority 5 — Stretch

- Section 194-O applicability-controlled tax reconciliation
- additional settlement anomaly types
- richer dispute evidence analysis
- live test-mode adapter enhancements

If time is limited, stop after Priority 3 and polish the benchmark/demo instead of adding more breadth.

---

# 44. BUILD PROCESS FOR CLAUDE

When you begin:

## Step 1 — Inspect

Run the repository inspection commands.

Understand:

- existing apps
- package managers
- current stack
- existing environment
- current tests
- current database

Do not ask the user to repeat information already present in the repository.

## Step 2 — Research

Use official Razorpay documentation for domain behavior.

Capture important findings in `DOMAIN_RULES.md`.

When sources conflict, prefer primary official documentation and document the discrepancy.

## Step 3 — Plan

Create a short internal implementation plan based on the repository state.

Then start coding.

Do not stop at planning.

## Step 4 — Build incrementally

After every major module:

- run tests
- run lint/type checks
- run the benchmark on a small dataset
- fix regressions

## Step 5 — Benchmark

Run the full 500+ record benchmark.

Record actual metrics.

## Step 6 — Demo hardening

Run the five-minute scripted demo from a clean environment.

Remove fragile dependencies.

## Step 7 — Documentation

Update README, architecture, domain rules, evaluation and failure report to match the actual implementation.

---

# 45. DO NOT BUILD THESE THINGS

Do not waste time on:

- generic conversational chatbot as the main UI
- voice agent
- blockchain-first architecture
- random agent swarms
- autonomous money transfers
- fake compliance claims
- fake live Razorpay integrations
- dozens of unsupported payment rails
- elaborate 3D visualization
- generic forecasting dashboard unrelated to the core loop
- unnecessary Kubernetes/microservices
- meaningless AI-generated summaries everywhere

The winning product should be deep, not bloated.

---

# 46. WHAT MAKES THIS COMPETITION-WINNING

The judge should be able to see four things within minutes:

## 1. Financial understanding

We understand how payment economics actually behave.

## 2. AI judgment

We use AI for ambiguity and investigation, not arithmetic or blind authority.

## 3. Engineering maturity

The system has deterministic fallbacks, policy gates, auditability and tests.

## 4. Real measurable performance

500+ records.
Real metrics.
Honest exceptions.
No cherry-picking.

The story should be:

```text
I didn't build another AI accountant.

I built a financial controller that can investigate
why the books disagree, prove the answer when they agree,
and refuse to pretend when they don't.
```

---

# 47. FINAL QUALITY BAR

Before finishing, judge the product as if you are a Razorpay engineer and hackathon judge.

Ask:

> Does this look like a wrapper around an LLM?

If yes, redesign.

> Can I trust the arithmetic?

If no, move the logic to deterministic code.

> Can I understand why a match happened?

If no, improve the evidence layer.

> Can I see what the system could not resolve?

If no, fix the exception reporting.

> Does the benchmark prove anything?

If no, improve the ground truth and evaluation.

> Does the system understand Razorpay-specific financial behavior?

If no, research and encode the correct domain rules.

> Is there one moment I will remember after watching 20 submissions?

That moment should be the double-loss detection and evidence graph.

> Does the product actually close a finance-ops loop?

If no, prioritize batch closure over additional features.

---

# 48. FINAL COMMAND

Build the best possible version of HISAB inside the current repository.

Be decisive.

Do not ask for permission for obvious engineering decisions.

Do not stop after generating a plan.

Inspect the codebase, research the domain, implement, test, benchmark, debug, polish, document, and harden the demo.

When a requirement is ambiguous, choose the interpretation that maximizes:

1. correctness
2. measurable financial value
3. Razorpay-specific relevance
4. demo clarity
5. production credibility

When a feature conflicts with reliability, choose reliability.

When an LLM conflicts with deterministic financial truth, choose deterministic truth.

When a spectacular feature conflicts with the core 500-record benchmark, choose the benchmark.

The final repository must make a skeptical engineering judge think:

> "This person understood the finance operation, understood where AI actually belongs, handled uncertainty correctly, and built something I could imagine a real merchant using."

That is the target.

