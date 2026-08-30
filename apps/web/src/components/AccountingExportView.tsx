"use client";

import React, { useState, useEffect } from "react";
import { Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

export const AccountingExportView: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);

  const loadEntries = async () => {
    try {
      const data = await fetchApi<any>("/api/accounting/journal-entries");
      setEntries(data.entries || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                ACCOUNTING EXPORT & JOURNAL ENTRIES
              </h2>
              <p className="text-xs text-[#64748B]">
                Pre-formatted double-entry accounting batches for ERP, Tally, Zoho Books, and SAP
              </p>
            </div>
          </div>

          <a
            href="http://localhost:8000/api/accounting/export-csv"
            download
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] text-white font-bold text-xs shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Export</span>
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E8F0] dark:border-[#262626] text-[#64748B] uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">General Ledger Account</th>
                <th className="py-2.5 px-3 text-right">Debit (INR)</th>
                <th className="py-2.5 px-3 text-right">Credit (INR)</th>
                <th className="py-2.5 px-3">Accounting Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
              {entries.map((ent, i) => (
                <tr key={i} className="hover:bg-[#F8FAFC] dark:hover:bg-[#081120]">
                  <td className="py-3 px-3 font-semibold text-[#0F172A] dark:text-[#EDEDED]">{ent.account}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#0F172A] dark:text-[#EDEDED]">{ent.debit}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#0F172A] dark:text-[#EDEDED]">{ent.credit}</td>
                  <td className="py-3 px-3 text-[#64748B]">{ent.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
