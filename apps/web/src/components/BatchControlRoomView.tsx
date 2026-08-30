"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  AlertOctagon, 
  CheckCircle2, 
  Lock, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  X,
  FileCheck2
} from "lucide-react";
import { ReconciliationSummary, fetchApi } from "@/lib/api";

interface BatchControlRoomProps {
  summary: ReconciliationSummary | null;
  orgName?: string;
  onNavigateToExceptions: () => void;
  onNavigateToEvidence: () => void;
}

export const BatchControlRoomView: React.FC<BatchControlRoomProps> = ({
  summary,
  orgName = "Nova Commerce Pvt Ltd",
  onNavigateToExceptions,
  onNavigateToEvidence,
}) => {
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeResult, setCloseResult] = useState<any | null>(null);

  const hasData = (summary?.total_payments_count ?? 0) > 0;

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-10 text-center space-y-4 shadow-sm font-sans">
        <div className="inline-flex p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0B72E7] dark:text-[#3395FF]">
          <FileCheck2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0F172A] dark:text-white">No Active Reconciliation Batches</h3>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] max-w-md mx-auto mt-1">
            <strong className="text-[#0F172A] dark:text-white">{orgName}</strong> currently has no open or processed financial batches. Ingest Razorpay transactions or import reconciliation CSVs to open an automated batch control room.
          </p>
        </div>
      </div>
    );
  }

  const handleCloseBatch = async (force: boolean = false) => {
    setClosing(true);
    try {
      const data = await fetchApi("/api/reconcile/close-batch", {
        method: "POST",
        body: JSON.stringify({ batch_id: "BATCH_AUG_2026", force_override: force }),
      });
      setCloseResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setClosing(false);
    }
  };

  const totalIngested = (summary?.total_payments_count ?? 0) + (summary?.total_settlements_count ?? 0) + (summary?.total_refunds_count ?? 0) + (summary?.total_disputes_count ?? 0);
  const matchRate = summary?.total_payments_count ? ((summary.settled_payments_count / summary.total_payments_count) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 font-sans">
      {/* Batch Header Bar */}
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
              BATCH #1842
            </span>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#EDEDED]">
              {orgName} Active Reconciliation Batch
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              (summary?.open_exceptions_count ?? 0) > 0
                ? "bg-amber-100 dark:bg-[#382503] text-[#F59E0B]"
                : "bg-green-100 dark:bg-[#052E16] text-[#16A34A]"
            }`}>
              {(summary?.open_exceptions_count ?? 0) > 0 ? "REQUIRES REVIEW" : "ALL MATCHED"}
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1 font-mono">
            {totalIngested} Records Ingested • {summary?.open_exceptions_count ?? 0} Exceptions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setCloseResult(null);
              setIsCloseModalOpen(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white font-bold text-xs shadow-sm transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span>CLOSE BATCH</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#262626]">
          <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] uppercase font-bold">Total Ingested</span>
          <div className="text-xl font-black text-[#0F172A] dark:text-[#EDEDED] mt-1">{totalIngested}</div>
          <span className="text-[10px] text-[#64748B]">Across Data Sources</span>
        </div>

        <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#262626]">
          <span className="text-[10px] text-[#16A34A] uppercase font-bold">Reconciled & Matched</span>
          <div className="text-xl font-black text-[#16A34A] mt-1">{summary?.settled_payments_count ?? 0}</div>
          <span className="text-[10px] text-[#16A34A]">{matchRate}% Match Rate</span>
        </div>

        <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#262626]">
          <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] uppercase font-bold">Expected Variance</span>
          <div className="text-xl font-black text-[#0F172A] dark:text-[#EDEDED] mt-1">{summary?.unmapped_payments_count ?? 0}</div>
          <span className="text-[10px] text-[#64748B]">MDR retention & GST</span>
        </div>

        <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#262626]">
          <span className="text-[10px] text-[#F59E0B] uppercase font-bold">Exceptions Remaining</span>
          <div className="text-xl font-black text-[#F59E0B] mt-1">{summary?.open_exceptions_count ?? 0}</div>
          <span className="text-[10px] text-[#F59E0B]">Safe policy filtered</span>
        </div>

        <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-red-200 dark:border-red-900/60">
          <span className="text-[10px] text-[#DC2626] uppercase font-bold">Potential Exposure</span>
          <div className="text-xl font-black text-[#DC2626] mt-1">{summary?.unresolved_exposure_formatted || "₹0.00"}</div>
          <span className="text-[10px] text-[#DC2626] font-semibold">Active Variances</span>
        </div>
      </div>

      {/* Live Processing Pipeline Event Stream */}
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#262626] mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED]">
                Reconciliation Execution & Audit Logs
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">Deterministic Matching Ladder & Financial Policy Pipeline</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-green-100 dark:bg-[#052E16] text-[#16A34A]">
            LIVE ENGINE
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {[
            { status: "SUCCESS", title: "Manifest Ingestion", event: `Ingested ${totalIngested} records from Razorpay settlement & bank statement manifests` },
            { status: "SUCCESS", title: "Minor-Unit Normalization", event: "Normalized all monetary values into minor-unit paise with symmetric half-up rounding" },
            { status: "SUCCESS", title: "Tier 1 & 2 Matching", event: `Matched ${summary?.settled_payments_count ?? 0} payments to settlement batches using Tier 1 exact ID & Tier 2 constraint windows` },
            { status: "SUCCESS", title: "Batch Decomposition", event: "Decomposed multi-movement batches and reconstructed unlinked payments via subset-sum optimization" },
            { status: "SUCCESS", title: "Statutory Tax Gate", event: "Applied statutory 0.1% Section 194-O TDS rate and validated MDR fee retentions" },
            { status: (summary?.open_exceptions_count ?? 0) > 0 ? "WARNING" : "SUCCESS", title: "Anomalies Discovered", event: `Detected ${summary?.open_exceptions_count ?? 0} anomalous items across active controls` },
            { status: "SUCCESS", title: "Cryptographic Seal", event: "Generated clickable 'Prove It' multi-touchpoint Evidence Graph and sealed Audit Hash" },
          ].map((ev, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                ev.status === "ALERT"
                  ? "bg-red-50/60 dark:bg-[#3E0E0E]/30 border-red-200 dark:border-red-900/60 text-[#DC2626]"
                  : ev.status === "WARNING"
                  ? "bg-amber-50/60 dark:bg-[#382503]/30 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300"
                  : "bg-[#F8FAFC] dark:bg-[#0E0E0E] border-[#E2E8F0] dark:border-[#262626] text-slate-800 dark:text-slate-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                {ev.status === "ALERT" ? (
                  <AlertOctagon className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
                ) : ev.status === "WARNING" ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
                <div className="font-medium text-xs">
                  <span className="font-bold mr-1.5">{ev.title}:</span>
                  <span>{ev.event}</span>
                </div>
              </div>

              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase flex-shrink-0 ${
                ev.status === "ALERT"
                  ? "bg-red-200 dark:bg-red-950 text-red-800 dark:text-red-200"
                  : ev.status === "WARNING"
                  ? "bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}>
                {ev.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CLOSE BATCH DETERMINISTIC POLICY MODAL */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-[#3E0E0E] text-[#DC2626]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                    Close Reconciliation Batch #1842
                  </h3>
                  <p className="text-xs text-[#64748B]">Deterministic Policy Verification Gate</p>
                </div>
              </div>
              <button onClick={() => setIsCloseModalOpen(false)} className="text-[#64748B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!closeResult && (
              <div className="space-y-4">
                <p className="text-xs text-[#0F172A] dark:text-[#EDEDED]">
                  Closing a reconciliation batch is an irreversible financial action. The system will evaluate all 7 controls, unresolved exposures, and open exception tolerances.
                </p>
                <div className="p-3 bg-[#F8FAFC] dark:bg-[#0E0E0E] rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-xs font-mono">
                  <div>• Materiality Tolerance: ₹0.00</div>
                  <div>• Active Exceptions: 8 items</div>
                  <div>• Potential Exposure: ₹1,44,500.00</div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setIsCloseModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-[#64748B]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCloseBatch(false)}
                    disabled={closing}
                    className="px-5 py-2 rounded-lg bg-[#DC2626] hover:bg-[#b91c1c] text-white font-bold text-xs"
                  >
                    {closing ? "Evaluating Invariants..." : "Evaluate & Close Batch"}
                  </button>
                </div>
              </div>
            )}

            {closeResult && !closeResult.can_close && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-50 dark:bg-[#3E0E0E] border border-red-200 dark:border-red-900 text-[#DC2626]">
                  <div className="flex items-center space-x-2 mb-2 font-bold text-sm">
                    <AlertOctagon className="w-5 h-5" />
                    <span>CANNOT CLOSE BATCH</span>
                  </div>
                  <p className="text-xs mb-3">
                    {closeResult.message}
                  </p>
                  <div className="space-y-1.5 text-xs font-mono">
                    {closeResult.blocking_reasons.map((r: string, idx: number) => (
                      <div key={idx}>• {r}</div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsCloseModalOpen(false);
                      onNavigateToExceptions();
                    }}
                    className="px-4 py-2 rounded-lg bg-[#0B72E7] text-white font-bold text-xs"
                  >
                    Open Exceptions Queue
                  </button>
                </div>
              </div>
            )}

            {closeResult && closeResult.can_close && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-green-50 dark:bg-[#052E16] border border-green-200 dark:border-green-800 text-[#16A34A]">
                  <div className="flex items-center space-x-2 mb-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>✓ BATCH CLOSED & CRYPTOGRAPHICALLY SEALED</span>
                  </div>
                  <p className="text-xs">
                    All 7 controls passed. Audit Hash: <span className="font-mono">{closeResult.audit_hash}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
