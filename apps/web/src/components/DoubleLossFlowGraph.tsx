"use client";

import React from "react";
import { AlertOctagon, CheckCircle2, ShieldCheck } from "lucide-react";
import { DoubleLossAlertItem } from "@/lib/api";

interface DoubleLossFlowGraphProps {
  alerts?: DoubleLossAlertItem[];
  orgName?: string;
}

export const DoubleLossFlowGraph: React.FC<DoubleLossFlowGraphProps> = ({ 
  alerts = [], 
  orgName = "Nova Commerce Pvt Ltd" 
}) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-10 text-center space-y-4 shadow-sm mb-6 font-sans">
        <div className="inline-flex p-3.5 rounded-2xl bg-green-50 dark:bg-green-950/40 text-[#16A34A] border border-green-200 dark:border-green-800">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Zero Double-Loss Exposure Detected</h3>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] max-w-md mx-auto mt-1">
            <strong className="text-[#0F172A] dark:text-white">{orgName}</strong> has zero simultaneous refund and chargeback dual-debit vectors. All customer returns and banking disputes are reconciled cleanly.
          </p>
        </div>
      </div>
    );
  }

  const alert = alerts[0];

  return (
    <div className="bg-white dark:bg-[#111111] border border-red-200 dark:border-red-900/60 rounded-xl p-6 shadow-sm mb-6 font-sans">
      <div className="flex items-center space-x-3 pb-4 border-b border-red-100 dark:border-red-900/40 mb-6">
        <div className="p-2 rounded-lg bg-[#DC2626] text-white">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED] tracking-tight">
            FORENSIC DOUBLE-LOSS OUTFLOW VECTOR ({alert.total_exposure_formatted} EXPOSURE ON {alert.original_payment_formatted} SALE)
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
            Visualizing independent dual-debit flows when customer receives manual refund and raises chargeback simultaneously.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="bg-[#F8FAFC] dark:bg-[#0E0E0E] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] mb-2 inline-block">
            Step 1: Captured Sale
          </span>
          <div className="text-base font-bold text-[#0F172A] dark:text-[#EDEDED] mt-1">{alert.original_payment_formatted}</div>
          <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-1 font-mono">
            Payment {alert.payment_id} ({alert.order_id})
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-[#F8FAFC] dark:bg-[#0E0E0E] p-3 rounded-xl border border-red-200 dark:border-red-900/60 text-left">
            <span className="text-[10px] uppercase font-bold text-[#DC2626] block">
              Outflow Leg A: Manual Merchant Refund
            </span>
            <div className="text-sm font-bold text-[#DC2626] font-mono mt-0.5">{alert.manual_refund_formatted}</div>
            <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-mono">Credited to customer bank</span>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#0E0E0E] p-3 rounded-xl border border-red-200 dark:border-red-900/60 text-left">
            <span className="text-[10px] uppercase font-bold text-[#DC2626] block">
              Outflow Leg B: Bank Chargeback Dispute
            </span>
            <div className="text-sm font-bold text-[#DC2626] font-mono mt-0.5">{alert.chargeback_exposure_formatted}</div>
            <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-mono">Withheld independently by acquiring bank</span>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-[#3E0E0E] p-5 rounded-xl border border-red-200 dark:border-red-900/80 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#DC2626] text-white mb-2 inline-block">
            Net Compounded Exposure
          </span>
          <div className="text-xl font-black text-[#DC2626] mt-1">{alert.total_exposure_formatted}</div>
          <p className="text-xs text-[#DC2626] font-bold mt-1">
            Merchant is at -{alert.original_payment_formatted} net deficit!
          </p>
        </div>
      </div>
    </div>
  );
};
