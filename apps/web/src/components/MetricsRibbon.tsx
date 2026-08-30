"use client";

import React from "react";
import { DollarSign, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { ReconciliationSummary } from "@/lib/api";

interface MetricsRibbonProps {
  summary: ReconciliationSummary | null;
}

export const MetricsRibbon: React.FC<MetricsRibbonProps> = ({ summary }) => {
  const turnover = summary?.gross_turnover_formatted || "₹0.00";
  const totalPayments = summary?.total_payments_count ?? 0;
  const settledPayments = summary?.settled_payments_count ?? 0;
  const openExceptions = summary?.open_exceptions_count ?? 0;
  const unresolvedExposure = summary?.unresolved_exposure_formatted || "₹0.00";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 font-sans">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider">Gross Turnover</span>
          <span className="p-1.5 rounded-lg bg-green-50 dark:bg-[#052E16] text-[#16A34A] border border-green-200 dark:border-green-800">
            <DollarSign className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-[26px] font-number font-normal text-[#050505] dark:text-[#EDEDED] tracking-tight leading-8">
          {turnover}
        </div>
        <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-1">
          {totalPayments} Captured Payments
        </p>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider">Reconciled Settlement</span>
          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-[26px] font-number font-normal text-[#050505] dark:text-[#EDEDED] tracking-tight leading-8">
          {settledPayments} / {totalPayments}
        </div>
        <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-1">
          {summary?.total_settlements_count || 15} Batches Cleared to Bank
        </p>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider">Open Exceptions</span>
          <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-[#382503] text-[#F59E0B] border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-[26px] font-number font-normal text-[#F59E0B] tracking-tight leading-8">
          {openExceptions} Anomalies
        </div>
        <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-1">
          Safe items auto-resolved
        </p>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-red-200 dark:border-red-900/60 p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-[#DC2626] uppercase tracking-wider">Unresolved Exposure</span>
          <span className="p-1.5 rounded-lg bg-red-50 dark:bg-[#3E0E0E] text-[#DC2626] border border-red-200 dark:border-red-800">
            <ShieldAlert className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-[26px] font-number font-normal text-[#DC2626] tracking-tight leading-8">
          {unresolvedExposure}
        </div>
        <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
          Requires Human Controller Review
        </p>
      </div>
    </div>
  );
};
