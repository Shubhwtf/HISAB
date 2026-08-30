"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, ShieldCheck, UserCheck, MessageSquare, AlertTriangle } from "lucide-react";
import { fetchApi } from "@/lib/api";

export const MakerCheckerInbox: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<any>("/api/approvals/queue");
      setQueue(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (approvalId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      await fetchApi(`/api/approvals/${approvalId}/decide`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          manager_name: "Rajesh Gupta (Finance Manager)",
          comments: decision === "APPROVED" ? "Verified supporting invoice and bank statement reference." : "Insufficient documentation provided."
        }),
      });
      setActionSuccess(`Approval ${approvalId} ${decision.toLowerCase()} and recorded into audit ledger.`);
      await loadQueue();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                MAKER-CHECKER APPROVAL INBOX
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800 font-bold uppercase">
                DUAL AUTHORIZATION
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Analyst prepares resolution proposal → Finance Manager reviews and signs off
            </p>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-green-50 dark:bg-[#052E16] text-[#16A34A] text-xs mb-4 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        <div className="space-y-4">
          {queue.map((item) => {
            const isPending = item.status === "PENDING_MANAGER_APPROVAL";
            return (
              <div
                key={item.approval_id}
                className="p-5 rounded-xl border border-[#E2E8F0] dark:border-[#262626] bg-[#F8FAFC] dark:bg-[#0E0E0E] space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0] dark:border-[#262626]">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-[#0B72E7] dark:text-[#3395FF]">
                      {item.approval_id}
                    </span>
                    <span className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED]">
                      Case {item.exception_id} ({item.category})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-[#382503] text-[#F59E0B]">
                      SLA: {item.sla_remaining}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-bold text-[#0F172A] dark:text-[#EDEDED]">
                    Impact: {item.financial_impact_formatted}
                  </div>
                </div>

                <div className="text-xs text-[#0F172A] dark:text-[#EDEDED]">
                  <span className="font-bold text-[#64748B]">Justification:</span> {item.justification}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
                  <div className="flex items-center space-x-2 text-[#64748B]">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Prepared by: <strong className="text-[#0F172A] dark:text-[#EDEDED]">{item.prepared_by}</strong></span>
                  </div>

                  {isPending ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDecision(item.approval_id, "REJECTED")}
                        className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-[#3E0E0E] text-[#DC2626] font-bold text-xs hover:bg-red-200"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDecision(item.approval_id, "APPROVED")}
                        className="px-4 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs"
                      >
                        Approve & Seal Ledger
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-[#16A34A]">
                      ✓ {item.status} by {item.decided_by}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
