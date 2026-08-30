"use client";

import React, { useState, useEffect } from "react";
import { ControlSummaryItem, fetchApi } from "@/lib/api";

export const ControlsMatrixView: React.FC = () => {
  const [controls, setControls] = useState<ControlSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadControls = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<{ controls: ControlSummaryItem[] }>("/api/controls/summary");
      setControls(data.controls || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadControls();
  }, []);

  return (
    <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
              THE SEVEN FINANCIAL CONTROLS MATRIX
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800 font-bold uppercase">
              CONTINUOUS ASSURANCE
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
            Real-time invariant checking across accuracy, completeness, occurrence, classification, and measurement.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-[#64748B] dark:text-[#A1A1AA]">Loading controls status...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {controls.map((ctl) => {
            const isPass = ctl.status === "PASS";
            const isFail = ctl.status === "FAIL";
            return (
              <div
                key={ctl.control_id}
                className={`p-4 rounded-xl border transition-colors ${
                  isFail
                    ? "bg-red-50/70 dark:bg-[#3E0E0E]/40 border-red-200 dark:border-red-900/60"
                    : isPass
                    ? "bg-[#F8FAFC] dark:bg-[#0E0E0E] border-[#E2E8F0] dark:border-[#262626]"
                    : "bg-amber-50/70 dark:bg-[#382503]/40 border-amber-200 dark:border-amber-800/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#0B72E7] dark:text-[#3395FF]">
                    {ctl.control_id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isPass
                        ? "bg-green-100 dark:bg-[#052E16] text-[#16A34A]"
                        : isFail
                        ? "bg-red-100 dark:bg-[#3E0E0E] text-[#DC2626] font-extrabold"
                        : "bg-amber-100 dark:bg-[#382503] text-[#F59E0B]"
                    }`}
                  >
                    {ctl.status}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED] mb-1">{ctl.control_name}</h3>
                <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] font-medium block mb-3">
                  Assertion: <span className="text-[#0F172A] dark:text-[#EDEDED]">{ctl.financial_assertion}</span>
                </span>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#E2E8F0] dark:border-[#262626] font-mono">
                  <span className="text-[#64748B] dark:text-[#A1A1AA]">Active Exceptions:</span>
                  <span className={ctl.active_exceptions_count > 0 ? "text-[#F59E0B] font-bold" : "text-[#64748B] dark:text-[#A1A1AA]"}>
                    {ctl.active_exceptions_count}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 font-mono">
                  <span className="text-[#64748B] dark:text-[#A1A1AA]">Exposure:</span>
                  <span className={ctl.total_exposure_paise > 0 ? "text-[#DC2626] font-bold" : "text-[#64748B] dark:text-[#A1A1AA]"}>
                    {ctl.total_exposure_formatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
