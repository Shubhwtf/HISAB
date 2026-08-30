"use client";

import React, { useState, useEffect } from "react";
import { FileText, TrendingUp, AlertOctagon, CheckCircle2, Download } from "lucide-react";
import { fetchApi } from "@/lib/api";

export const DailyFinanceBrief: React.FC = () => {
  const [brief, setBrief] = useState<any | null>(null);

  const loadBrief = async () => {
    try {
      const data = await fetchApi<any>("/api/accounting/daily-brief");
      setBrief(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBrief();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                  DAILY FINANCE & RECONCILIATION BRIEF
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 dark:bg-[#052E16] text-[#16A34A]">
                  {brief?.brief_date || "29 Aug 2026"}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Executive financial health briefing for {brief?.merchant_name || "Nova Commerce Pvt Ltd"}
              </p>
            </div>
          </div>

          <a
            href="http://localhost:8000/api/accounting/export-csv"
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0B72E7] dark:bg-[#3395FF] text-white text-xs font-bold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Financial Report (CSV)</span>
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Gross Captured Revenue</span>
            <div className="text-xl font-black text-[#0F172A] dark:text-[#EDEDED] mt-1">{brief?.key_metrics?.gross_revenue || "₹49,53,770.00"}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] uppercase font-bold text-[#16A34A]">Net Bank Settled</span>
            <div className="text-xl font-black text-[#16A34A] mt-1">{brief?.key_metrics?.net_bank_settled || "₹48,12,248.43"}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] uppercase font-bold text-[#0B72E7]">Cash in Transit</span>
            <div className="text-xl font-black text-[#0B72E7] dark:text-[#3395FF] mt-1">{brief?.key_metrics?.cash_in_transit || "₹1,41,521.57"}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-red-200 dark:border-red-900">
            <span className="text-[10px] uppercase font-bold text-[#DC2626]">Unresolved Exposure</span>
            <div className="text-xl font-black text-[#DC2626] mt-1">{brief?.key_metrics?.unresolved_exposure || "₹1,44,500.00"}</div>
          </div>
        </div>

        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#EDEDED] mb-3">
          Top Financial Risk Items & Actions
        </h4>
        <div className="space-y-3">
          {brief?.top_financial_risks?.map((risk: any, i: number) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-[#3E0E0E]/30 flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#DC2626] text-white uppercase">
                    {risk.severity}
                  </span>
                  <span className="font-bold text-xs text-[#0F172A] dark:text-[#EDEDED]">{risk.risk_title}</span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1">{risk.action}</p>
              </div>
              <div className="text-sm font-bold font-mono text-[#DC2626]">{risk.exposure}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
