"use client";

import React, { useState } from "react";
import { Sliders, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";
import { fetchApi } from "@/lib/api";

export const PolicySimulatorView: React.FC = () => {
  const [threshold, setThreshold] = useState(5000);
  const [allowFuzzy, setAllowFuzzy] = useState(true);
  const [allowMinorFee, setAllowMinorFee] = useState(true);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<any>("/api/simulator/evaluate", {
        method: "POST",
        body: JSON.stringify({
          materiality_threshold_paise: threshold * 100,
          allow_fuzzy_utr_auto_resolve: allowFuzzy,
          allow_minor_fee_auto_resolve: allowMinorFee,
        }),
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
              WHAT-IF POLICY & THRESHOLD SIMULATOR
            </h2>
            <p className="text-xs text-[#64748B]">
              Simulate workload reduction & safety tolerances without mutating database records
            </p>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED] block mb-2">
              Materiality Threshold: ₹{threshold.toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="20000"
              step="500"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-2 bg-[#E2E8F0] dark:bg-[#1E1E1E] rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-[#64748B] mt-1 block">
              Exceptions below this threshold can be auto-resolved if clean proof exists.
            </span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={allowFuzzy}
                onChange={(e) => setAllowFuzzy(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#0B72E7]"
              />
              <span>Allow Fuzzy UTR Narration Auto-Resolve</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={allowMinorFee}
                onChange={(e) => setAllowMinorFee(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#0B72E7]"
              />
              <span>Allow Minor Gateway Fee Rounding Auto-Resolve</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
              <span>Simulate Policy Impact</span>
            </button>
          </div>
        </div>

        {/* Results Card */}
        {result && (
          <div className="p-5 rounded-xl border border-[#E2E8F0] dark:border-[#262626] bg-[#F8FAFC] dark:bg-[#0E0E0E] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#EDEDED]">
              Simulation Projected Impact
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white dark:bg-[#111111] rounded-lg border border-[#E2E8F0] dark:border-[#262626]">
                <span className="text-[10px] text-[#64748B] font-bold">Auto-Resolved</span>
                <div className="text-lg font-bold text-[#16A34A]">{result.simulation_results?.auto_resolved_count} items</div>
              </div>

              <div className="p-3 bg-white dark:bg-[#111111] rounded-lg border border-[#E2E8F0] dark:border-[#262626]">
                <span className="text-[10px] text-[#64748B] font-bold">Human Review Required</span>
                <div className="text-lg font-bold text-[#F59E0B]">{result.simulation_results?.human_review_required_count} items</div>
              </div>

              <div className="p-3 bg-white dark:bg-[#111111] rounded-lg border border-[#E2E8F0] dark:border-[#262626]">
                <span className="text-[10px] text-[#64748B] font-bold">Workload Reduction</span>
                <div className="text-lg font-bold text-[#0B72E7]">{result.simulation_results?.workload_reduction_pct}</div>
              </div>

              <div className="p-3 bg-white dark:bg-[#111111] rounded-lg border border-[#E2E8F0] dark:border-[#262626]">
                <span className="text-[10px] text-[#64748B] font-bold">Safety Verdict</span>
                <div className="text-xs font-bold text-[#16A34A] mt-1">{result.simulation_results?.safety_verdict}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
