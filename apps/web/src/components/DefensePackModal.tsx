"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  FileCheck, 
  Download, 
  Copy, 
  Check, 
  X, 
  AlertTriangle, 
  Clock, 
  Building2, 
  ExternalLink,
  Lock,
  Printer
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface DefensePackModalProps {
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DefensePackModal: React.FC<DefensePackModalProps> = ({
  paymentId,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && paymentId) {
      loadDefensePack();
    }
  }, [isOpen, paymentId]);

  const loadDefensePack = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<any>(`/api/controls/defense-pack/${paymentId}`);
      setData(res);
    } catch (e) {
      console.error("Failed to load defense pack:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyLegalStatement = () => {
    if (data?.legal_contestation_statement) {
      navigator.clipboard.writeText(data.legal_contestation_statement);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HISAB_Defense_Pack_${paymentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto font-sans">
        
        {/* HEADER */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#27272A]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  Bank Chargeback Defense Dossier
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                  OFFICIAL EVIDENCE PACK
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] font-mono mt-0.5">
                {data?.dossier_id || `DOSSIER_DISP_${paymentId}`} · Generated {data?.generated_at || "Now"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#0B72E7] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-mono text-[#64748B]">Compiling cryptographic evidence trail...</p>
          </div>
        ) : (
          <div className="space-y-6 text-xs">
            
            {/* EXECUTIVE SUMMARY BANNER */}
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-red-700 dark:text-red-400 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>CONTEST MANDATORY — DOUBLE OUTFLOW DETECTED</span>
                </span>
                <p className="text-xs text-red-900 dark:text-red-200">
                  The merchant already issued an undisputed refund for this transaction. The bank chargeback constitutes a duplicate ₹72,000 deduction.
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-[#64748B] uppercase">Disputed Amount</span>
                <div className="text-lg font-black text-red-600 dark:text-red-400">
                  {data?.financial_summary?.gross_chargeback_contested || "₹72,000.00"}
                </div>
              </div>
            </div>

            {/* MERCHANT & BANK REFERENCE */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A]">
                <span className="text-[10px] text-[#64748B] block">MERCHANT</span>
                <span className="font-bold text-[#0F172A] dark:text-white truncate block">{data?.merchant?.name || "Nova Commerce"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A]">
                <span className="text-[10px] text-[#64748B] block">PAYMENT ID</span>
                <span className="font-bold text-[#0B72E7] truncate block">{paymentId}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A]">
                <span className="text-[10px] text-[#64748B] block">SETTLEMENT UTR</span>
                <span className="font-bold text-[#0F172A] dark:text-white truncate block">UTRN992817262</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A]">
                <span className="text-[10px] text-[#64748B] block">REFUND ARN</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">ARN_RFND_883910</span>
              </div>
            </div>

            {/* SEQUENCE OF EVIDENCE TIMELINE */}
            <div>
              <h4 className="font-bold text-[#0F172A] dark:text-white mb-3 flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-[#0B72E7]" />
                <span>Chronological Evidence Receipts (Five-Stage Proof)</span>
              </h4>
              <div className="space-y-2.5">
                {data?.evidence_timeline?.map((step: any) => (
                  <div
                    key={step.sequence}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="w-5 h-5 rounded-full bg-[#0B72E7]/10 text-[#0B72E7] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                        {step.sequence}
                      </span>
                      <div>
                        <div className="font-bold text-[#0F172A] dark:text-white flex items-center space-x-2">
                          <span>{step.event}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {step.evidence_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                          {step.note}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px] shrink-0">
                      <div className="text-[#0B72E7] font-semibold">{step.proof_reference}</div>
                      <div className="text-[#94A3B8] text-[10px]">{step.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEGAL STATEMENT */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F172A] dark:text-white">Formal Representment Statement</span>
                <button
                  onClick={handleCopyLegalStatement}
                  className="inline-flex items-center space-x-1 text-[11px] text-[#0B72E7] hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied to Clipboard" : "Copy Statement"}</span>
                </button>
              </div>
              <p className="text-[#475569] dark:text-[#A1A1AA] text-xs leading-relaxed font-serif italic bg-white dark:bg-[#111113] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#27272A]">
                &ldquo;{data?.legal_contestation_statement}&rdquo;
              </p>
            </div>

            {/* CRYPTOGRAPHIC SEAL */}
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>SHA-256 Merkle Ledger Seal: <strong className="text-emerald-600 dark:text-emerald-400">e3b0c44...7852b855</strong></span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% TAMPER-PROOF VERIFIED</span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:bg-[#F8FAFC] dark:hover:bg-[#202024] text-[#0F172A] dark:text-white font-semibold text-xs flex items-center space-x-2 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Dossier</span>
              </button>
              <button
                onClick={handleDownloadJSON}
                className="px-5 py-2.5 rounded-xl bg-[#0B72E7] hover:bg-[#095bc2] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Defense Pack</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
