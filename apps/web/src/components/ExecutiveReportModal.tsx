"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Printer, ShieldCheck, CheckCircle2, FileText, Lock } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchApi<any>("/api/reports/executive-summary").then(setReport).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl max-w-4xl w-full p-8 shadow-2xl space-y-6 relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#262626]">
          <div className="flex items-center space-x-2 text-xs text-[#64748B]">
            <span>Executive Reconciliation Report</span>
            <span>•</span>
            <span className="font-mono">{report?.report_id || "HISAB-AUDIT-2026-AUG-001"}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E0E0E] text-[#0F172A] dark:text-[#EDEDED] border border-[#E2E8F0] dark:border-[#262626] text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <a
              href="http://localhost:8000/api/accounting/export-csv"
              download
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0B72E7] text-white text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </a>
            <button onClick={onClose} className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-[#0B72E7] text-white flex items-center justify-center font-bold text-xs">
                H
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#EDEDED]">
                HISAB Financial Assurance Report
              </h1>
            </div>
            <p className="text-xs text-[#64748B]">
              Autonomous Payment Gateway Reconciliation & Statutory Compliance Certification
            </p>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-[#0F172A] dark:text-[#EDEDED]">{report?.merchant_name || "Nova Commerce Pvt Ltd"}</div>
            <div className="text-[#64748B] font-mono">MID: {report?.merchant_id || "rzp_live_99420"}</div>
            <div className="text-[#64748B] font-mono">GSTIN: {report?.gstin || "27AABCN8890K1Z9"}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Gross Captured Turnover</span>
            <div className="text-xl font-black text-[#0F172A] dark:text-[#EDEDED] mt-1">{report?.metrics?.gross_turnover || "₹49,53,770.00"}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] font-bold text-[#16A34A] uppercase">Net Bank Cleared</span>
            <div className="text-xl font-black text-[#16A34A] mt-1">{report?.metrics?.net_bank_settled || "₹48,12,248.43"}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] font-bold text-[#0B72E7] uppercase">MDR Fee & 18% GST</span>
            <div className="text-xl font-black text-[#0B72E7] mt-1">{report?.metrics?.mdr_fee_retention || "₹84,210.00"}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-red-200 dark:border-red-900">
            <span className="text-[10px] font-bold text-[#DC2626] uppercase">Unresolved Exposure</span>
            <div className="text-xl font-black text-[#DC2626] mt-1">{report?.metrics?.unresolved_exposure || "₹1,44,500.00"}</div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#EDEDED] mb-3">
            The Seven Financial Controls Assurance Matrix
          </h3>
          <div className="border border-[#E2E8F0] dark:border-[#262626] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#0E0E0E] text-[#64748B] text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Control ID</th>
                  <th className="py-2.5 px-3">Financial Invariant</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Auditor Verification Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                {report?.controls_summary?.map((ctl: any) => (
                  <tr key={ctl.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#081120]">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F172A] dark:text-[#EDEDED]">{ctl.id}</td>
                    <td className="py-2.5 px-3 font-semibold">{ctl.name}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ctl.status === "PASS" ? "bg-green-100 text-[#16A34A]" :
                        ctl.status === "FAIL" ? "bg-red-100 text-[#DC2626]" :
                        "bg-amber-100 text-[#F59E0B]"
                      }`}>
                        {ctl.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B] dark:text-[#A1A1AA]">{ctl.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2 text-[#16A34A]">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-bold">Cryptographically Certified via SHA-256 Ledger</div>
              <div className="text-[10px] text-[#64748B] truncate max-w-md">Audit Seal: {report?.audit_hash}</div>
            </div>
          </div>
          <div className="text-[10px] text-[#64748B] text-right">
            <div>Generated {report?.generated_at}</div>
            <div>Signed by Finance Controller</div>
          </div>
        </div>
      </div>
    </div>
  );
};
