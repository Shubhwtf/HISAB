"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, AlertOctagon, Search, FileCheck2, Compass, ShieldAlert } from "lucide-react";
import { ReconciliationSummary } from "@/lib/api";
import { EvidenceGraphViewer } from "@/components/EvidenceGraphViewer";

interface TraceMoneyViewProps {
  summary?: ReconciliationSummary | null;
  orgName?: string;
  onNavigateTab?: (tab: string) => void;
}

export const TraceMoneyView: React.FC<TraceMoneyViewProps> = ({ 
  summary, 
  orgName = "Nova Commerce Pvt Ltd",
  onNavigateTab 
}) => {
  const [searchId, setSearchId] = useState("pay_90006");

  const hasData = (summary?.total_payments_count ?? 0) > 0;

  if (summary && !hasData) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-10 text-center space-y-4 shadow-sm font-sans">
        <div className="inline-flex p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0B72E7] dark:text-[#3395FF]">
          <Compass className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0F172A] dark:text-white">No Transactions to Trace</h3>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] max-w-md mx-auto mt-1">
            <strong className="text-[#0F172A] dark:text-white">{orgName}</strong> currently has no captured payments or settlement batches in the ledger. Connect Razorpay or upload CSV files to generate multi-touchpoint invariant proofs.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-3 pt-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("razorpay-sync")}
              className="px-4 py-2 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] text-white font-semibold text-xs transition-colors"
            >
              Connect Razorpay
            </button>
          )}
        </div>
      </div>
    );
  }

  const sampleTraces = [
    {
      id: "pay_90000",
      order: "order_10000",
      type: "CLEAN_SETTLEMENT",
      gross: "₹500.00",
      fee: "₹11.80",
      net: "₹488.20",
      status: "Matched & Cleared",
      narrative: "Payment captured via Card → settled in setl_8800 → bank credit UTR778211000 matched."
    },
    {
      id: "pay_90006",
      order: "order_10006",
      type: "DOUBLE_LOSS_RISK",
      gross: "₹72,000.00",
      fee: "₹1,440.00",
      net: "-₹72,500.00",
      status: "Critical Double-Loss",
      narrative: "Manual refund -₹72,000 processed AND bank dispute -₹72,500 filed simultaneously."
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                Trace Money Flow
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                End-to-end lifecycle graph from Order checkout → Gateway capture → Settlement payout → Bank clearing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Search Payment ID..."
                className="bg-[#F8FAFC] dark:bg-[#0E0E0E] text-xs pl-8 pr-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] font-semibold w-56 text-[#0F172A] dark:text-[#EDEDED] focus:outline-none focus:border-[#0B72E7]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sampleTraces.map((tr) => {
            const isSelected = searchId === tr.id;
            const isAlert = tr.type === "DOUBLE_LOSS_RISK";
            return (
              <div
                key={tr.id}
                onClick={() => setSearchId(tr.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-50/70 dark:bg-[#0B254A]/40 border-[#0B72E7] dark:border-[#3395FF] shadow-sm"
                    : "bg-[#F8FAFC] dark:bg-[#0E0E0E] border-[#E2E8F0] dark:border-[#262626] hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-[#0F172A] dark:text-[#EDEDED]">
                      {tr.id}
                    </span>
                    <span className="text-[11px] text-[#64748B]">({tr.order})</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                    isAlert
                      ? "bg-red-100 dark:bg-[#3E0E0E] text-[#DC2626]"
                      : "bg-green-100 dark:bg-[#052E16] text-[#16A34A]"
                  }`}>
                    {isAlert ? <AlertOctagon className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    <span>{tr.status}</span>
                  </span>
                </div>

                <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mb-3 leading-relaxed">
                  {tr.narrative}
                </p>

                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[#E2E8F0] dark:border-[#262626]">
                  <div className="flex items-center space-x-3 text-[11px]">
                    <div>
                      <span className="text-[#64748B] text-[10px] uppercase block">Gross Sale</span>
                      <span className="font-bold text-[#0F172A] dark:text-[#EDEDED]">{tr.gross}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[10px] uppercase block">Gateway Fee</span>
                      <span className="font-medium text-[#64748B]">{tr.fee}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[10px] uppercase block">Net Credited</span>
                      <span className={`font-bold ${isAlert ? "text-[#DC2626]" : "text-[#16A34A]"}`}>
                        {tr.net}
                      </span>
                    </div>
                  </div>

                  <span className="font-semibold text-xs text-[#0B72E7] dark:text-[#3395FF] flex items-center space-x-1 hover:underline">
                    <span>Inspect Graph</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EvidenceGraphViewer initialPaymentId={searchId} />
    </div>
  );
};
