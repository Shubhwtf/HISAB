"use client";

import React, { useState, useEffect } from "react";
import { Layers, ArrowRight, CheckCircle2, RefreshCw, GitCommit, FileText, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface SnapshotManagerViewProps {
  orgName?: string;
}

export const SnapshotManagerView: React.FC<SnapshotManagerViewProps> = ({
  orgName = "Nova Commerce Pvt Ltd"
}) => {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("SNP-003");
  const [comparison, setComparison] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [rerunStatus, setRerunStatus] = useState<string | null>(null);

  const loadSnapshots = async () => {
    try {
      const data = await fetchApi<any[]>("/api/snapshots");
      setSnapshots(data || []);
      if (data && data.length >= 2) {
        loadComparison();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadComparison = async () => {
    setLoading(true);
    try {
      const comp = await fetchApi<any>("/api/snapshots/compare", {
        method: "POST",
        body: JSON.stringify({ base_snapshot_id: "SNP-002", compare_snapshot_id: "SNP-003" }),
      });
      setComparison(comp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRerunAffected = async (onlyAffected: boolean) => {
    try {
      const res = await fetchApi<any>(`/api/snapshots/${selectedSnapshotId}/rerun-affected`, {
        method: "POST",
        body: JSON.stringify({ snapshot_id: selectedSnapshotId, affected_cases_only: onlyAffected }),
      });
      setRerunStatus(res.message);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  if (snapshots.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-10 text-center space-y-4 shadow-sm font-sans">
        <div className="inline-flex p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0B72E7] dark:text-[#3395FF]">
          <Layers className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#0F172A] dark:text-white">No Reconciliation Snapshots Created</h3>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] max-w-md mx-auto mt-1">
            <strong className="text-[#0F172A] dark:text-white">{orgName}</strong> has no sealed reconciliation snapshots yet. Snapshots are created and cryptographically sealed whenever a reconciliation batch runs or reports are ingested.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                IMMUTABLE SNAPSHOTS & VERSION HISTORY
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800 font-bold uppercase">
                REPRODUCIBILITY
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Every reconciliation operates on a sealed snapshot. No financial result depends on mutable files.
            </p>
          </div>
        </div>

        {/* Snapshot Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {snapshots.map((s) => {
            const isCurrent = s.id === "SNP-003";
            return (
              <div
                key={s.id}
                onClick={() => setSelectedSnapshotId(s.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                  selectedSnapshotId === s.id
                    ? "bg-blue-50/60 dark:bg-[#0B254A]/40 border-[#0B72E7] dark:border-[#3395FF]"
                    : "bg-[#F8FAFC] dark:bg-[#0E0E0E] border-[#E2E8F0] dark:border-[#262626]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-[#0F172A] dark:text-[#EDEDED]">{s.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isCurrent ? "bg-green-100 dark:bg-[#052E16] text-[#16A34A]" : "bg-gray-100 text-[#64748B]"
                  }`}>
                    {isCurrent ? "CURRENT" : "SEALED"}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED] mb-1">{s.name}</h3>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] pt-2 border-t border-[#E2E8F0] dark:border-[#262626]">
                  <span>Match: {s.metrics?.match_rate_pct}</span>
                  <span>{s.metrics?.total_records} records</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "WHAT CHANGED?" COMPARISON MATRIX */}
      {comparison && (
        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626]">
            <div>
              <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED] uppercase tracking-wider">
                "WHAT CHANGED?" — SNAPSHOT SNP-002 vs SNP-003
              </h3>
              <p className="text-xs text-[#64748B]">Impact breakdown on downstream cases and settlements</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleRerunAffected(true)}
                className="px-4 py-2 rounded-lg bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] text-white font-bold text-xs"
              >
                [ RERUN AFFECTED CASES ]
              </button>
              <button
                onClick={() => handleRerunAffected(false)}
                className="px-4 py-2 rounded-lg bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#0F172A] dark:text-[#EDEDED] font-bold text-xs border border-[#E2E8F0] dark:border-[#262626]"
              >
                [ RERUN ENTIRE BATCH ]
              </button>
            </div>
          </div>

          {rerunStatus && (
            <div className="p-3.5 rounded-xl bg-green-50 dark:bg-[#052E16] text-[#16A34A] text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{rerunStatus}</span>
            </div>
          )}

          {/* Diffs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
              <span className="text-[10px] uppercase font-bold text-[#16A34A]">Records Added</span>
              <div className="text-xl font-black text-[#16A34A] mt-1">+{comparison.records_added}</div>
              <span className="text-[10px] text-[#64748B]">New RuPay & Refund items</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
              <span className="text-[10px] uppercase font-bold text-[#F59E0B]">Records Modified</span>
              <div className="text-xl font-black text-[#F59E0B] mt-1">{comparison.records_changed}</div>
              <span className="text-[10px] text-[#64748B]">Settlement UTR references</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
              <span className="text-[10px] uppercase font-bold text-[#DC2626]">Records Removed</span>
              <div className="text-xl font-black text-[#DC2626] mt-1">-{comparison.records_removed}</div>
              <span className="text-[10px] text-[#64748B]">Duplicate webhook capture</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
              <span className="text-[10px] uppercase font-bold text-[#0B72E7]">Downstream Impact</span>
              <div className="text-xl font-black text-[#0B72E7] dark:text-[#3395FF] mt-1">{comparison.affected_cases_count} Cases</div>
              <span className="text-[10px] text-[#64748B]">1 Settlement • 2 Exceptions</span>
            </div>
          </div>

          {/* Categorized Changes Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#EDEDED]">
              Detailed Change Manifest
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              {comparison.data_changes?.map((dc: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#0B72E7] dark:text-[#3395FF]">{dc.type}</span>
                    <span>{dc.entity} ({dc.id})</span>
                  </div>
                  <span className="text-[#64748B] dark:text-[#A1A1AA]">{dc.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
