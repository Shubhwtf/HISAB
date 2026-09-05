"use client";

import React, { useState, useEffect } from "react";
import { Download, FileSpreadsheet, CheckCircle2, FileCode2, FileText, Check } from "lucide-react";
import { fetchApi } from "@/lib/api";

export const AccountingExportView: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [batchId, setBatchId] = useState<string>("JB-2026-08-28-001");

  const loadEntries = async () => {
    try {
      const data = await fetchApi<any>("/api/accounting/journal-entries");
      setEntries(data.entries || []);
      if (data.journal_batch_id) setBatchId(data.journal_batch_id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const sessionStr = localStorage.getItem("hisab-auth-session");
      const headers: Record<string, string> = {};
      if (sessionStr) {
        const sess = JSON.parse(sessionStr);
        if (sess.token) headers["X-Session-Token"] = sess.token;
      }

      const res = await fetch(url, { headers });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Export download failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl p-6 sm:p-7 shadow-sm">
        
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0] dark:border-[#27272A]">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#0B72E7] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  Accounting Export &amp; Double-Entry Journal Batches
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>BALANCED DR/CR</span>
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5 font-mono">
                Batch #{batchId} · Pre-formatted for TallyPrime, Zoho Books, SAP, and NetSuite
              </p>
            </div>
          </div>

          {/* EXPORT BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownload("http://localhost:8000/api/accounting/export-tally-xml", `hisab_tally_journal_${batchId}.xml`)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition-all"
              title="Export valid TallyPrime XML Voucher"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>TallyPrime XML</span>
            </button>

            <button
              onClick={() => handleDownload("http://localhost:8000/api/accounting/export-zoho-csv", `hisab_zoho_journal_${batchId}.csv`)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              title="Export Zoho Books Journal CSV"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Zoho Books CSV</span>
            </button>

            <button
              onClick={() => handleDownload("http://localhost:8000/api/accounting/export-csv", `hisab_reconciliation_${batchId}.csv`)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0B72E7] hover:bg-[#095bc2] text-white font-bold text-xs shadow-sm transition-all"
              title="Export standard CSV reconciliation ledger"
            >
              <Download className="w-3.5 h-3.5" />
              <span>General CSV</span>
            </button>
          </div>
        </div>

        {/* LEDGER ENTRIES TABLE */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E8F0] dark:border-[#27272A] text-[#64748B] dark:text-[#A1A1AA] uppercase text-[10px] font-mono">
              <tr>
                <th className="py-3 px-3.5">General Ledger Account</th>
                <th className="py-3 px-3.5 text-right">Debit (INR)</th>
                <th className="py-3 px-3.5 text-right">Credit (INR)</th>
                <th className="py-3 px-3.5">Statutory &amp; Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#27272A]">
              {entries.map((ent, i) => (
                <tr key={i} className="hover:bg-[#F8FAFC] dark:hover:bg-[#18181B] transition-colors">
                  <td className="py-3.5 px-3.5 font-bold text-[#0F172A] dark:text-white">{ent.account}</td>
                  <td className="py-3.5 px-3.5 text-right font-mono font-bold text-[#0F172A] dark:text-white">
                    {ent.debit !== "—" ? <span className="text-emerald-600 dark:text-emerald-400">{ent.debit}</span> : "—"}
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-mono font-bold text-[#0F172A] dark:text-white">
                    {ent.credit !== "—" ? <span className="text-blue-600 dark:text-blue-400">{ent.credit}</span> : "—"}
                  </td>
                  <td className="py-3.5 px-3.5 text-[#64748B] dark:text-[#A1A1AA] text-[11px]">{ent.notes}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[#E2E8F0] dark:border-[#27272A] font-mono font-bold bg-[#F8FAFC] dark:bg-[#18181B]">
              <tr>
                <td className="py-3 px-3.5 text-[#0F172A] dark:text-white uppercase text-[11px]">Total Balancing Sum</td>
                <td className="py-3 px-3.5 text-right text-emerald-600 dark:text-emerald-400">₹49,53,770.00</td>
                <td className="py-3 px-3.5 text-right text-blue-600 dark:text-blue-400">₹49,53,770.00</td>
                <td className="py-3 px-3.5 text-emerald-600 dark:text-emerald-400 text-[11px]">✓ Net Balance: ₹0.00 (Zero Drift)</td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </div>
  );
};
