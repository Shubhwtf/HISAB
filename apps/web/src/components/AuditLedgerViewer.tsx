"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { AuditEntryItem, fetchApi } from "@/lib/api";

export const AuditLedgerViewer: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ is_valid: boolean; status: string; total_entries_verified: number; error_detail?: string } | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<{ items: AuditEntryItem[] }>("/api/audit/entries?limit=50");
      setEntries(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLedger = async () => {
    setVerifying(true);
    try {
      const result = await fetchApi<{ is_valid: boolean; status: string; total_entries_verified: number; error_detail?: string }>("/api/audit/verify", {
        method: "POST",
      });
      setVerifyResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  return (
    <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
              IMMUTABLE CRYPTOGRAPHIC AUDIT LEDGER (H₁ → H₂ → H₃)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-green-50 dark:bg-[#052E16] text-[#16A34A] border border-green-200 dark:border-green-800 font-bold uppercase">
              SHA-256 HASH CHAIN
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
            Every material financial decision and policy gate transition is cryptographically sealed.
          </p>
        </div>

        <button
          onClick={handleVerifyLedger}
          disabled={verifying}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs transition-colors"
        >
          {verifying ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying Hashes...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Audit Integrity</span>
            </>
          )}
        </button>
      </div>

      {verifyResult && (
        <div className={`p-4 rounded-xl border mb-6 flex items-center justify-between ${
          verifyResult.is_valid ? 'bg-green-50 dark:bg-[#052E16] border-green-200 dark:border-green-800 text-[#16A34A]' : 'bg-red-50 dark:bg-[#3E0E0E] border-red-200 dark:border-red-800 text-[#DC2626]'
        }`}>
          <div className="flex items-center space-x-3">
            {verifyResult.is_valid ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">
                {verifyResult.status}: {verifyResult.total_entries_verified} AUDIT RECORDS VERIFIED
              </span>
              <p className="text-xs opacity-90 mt-0.5">
                {verifyResult.is_valid ? "Cryptographic hash chain is 100% unbroken. Zero data tampering detected." : verifyResult.error_detail}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-xs text-[#64748B] dark:text-[#A1A1AA]">Loading audit records...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#64748B] dark:text-[#A1A1AA]">
            No audit records yet. Click 'Run Reconcile Engine' above to trigger automated pipeline.
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.sequence} className="bg-[#F8FAFC] dark:bg-[#0E0E0E] rounded-xl p-4 border border-[#E2E8F0] dark:border-[#262626] text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#E2E8F0] dark:border-[#262626]">
                <div className="flex items-center space-x-2">
                  <span className="font-mono px-2 py-0.5 rounded bg-white dark:bg-[#111111] text-[#0B72E7] dark:text-[#3395FF] font-bold border border-[#E2E8F0] dark:border-[#262626]">
                    #{entry.sequence}
                  </span>
                  <span className="font-bold text-[#0F172A] dark:text-[#EDEDED]">{entry.action}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] font-mono font-bold">
                    {entry.actor_type}
                  </span>
                </div>
                <span className="text-[#64748B] dark:text-[#A1A1AA] font-mono">{entry.created_at}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono mb-2">
                <div className="truncate text-[#64748B] dark:text-[#A1A1AA]">
                  <span className="font-bold mr-1">Prev:</span>
                  {entry.previous_hash}
                </div>
                <div className="truncate text-[#0B72E7] dark:text-[#3395FF] font-bold">
                  <span className="text-[#64748B] dark:text-[#A1A1AA] font-bold mr-1">Hash:</span>
                  {entry.current_hash}
                </div>
              </div>

              <div className="bg-white dark:bg-[#111111] p-2 rounded-lg text-[11px] text-[#0F172A] dark:text-[#EDEDED] font-mono border border-[#E2E8F0] dark:border-[#262626]">
                {JSON.stringify(entry.payload)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
