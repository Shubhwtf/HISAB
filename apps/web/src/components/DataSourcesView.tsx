"use client";

import React, { useState, useEffect } from "react";
import { Database, CheckCircle2, RefreshCw } from "lucide-react";
import { fetchApi } from "@/lib/api";

export const DataSourcesView: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);

  const loadSources = async () => {
    try {
      const data = await fetchApi<any[]>("/api/sources");
      setSources(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
              DATA SOURCE CONNECTIONS & HEALTH STATUS
            </h2>
            <p className="text-xs text-[#64748B]">
              Explicitly identifying integration feeds. Never presenting simulated feeds as live.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((src) => (
            <div
              key={src.id}
              className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#262626] bg-[#F8FAFC] dark:bg-[#0E0E0E] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0F172A] dark:text-[#EDEDED]">{src.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  src.badge === "TEST_MODE" ? "bg-amber-100 text-[#F59E0B]" :
                  src.badge === "FILE_IMPORT" ? "bg-blue-100 text-[#0B72E7]" :
                  "bg-purple-100 text-[#8B5CF6]"
                }`}>
                  {src.badge}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">{src.details}</p>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] pt-2 border-t border-[#E2E8F0] dark:border-[#262626]">
                <span>{src.records_count} Ingested Records</span>
                <span className="text-[#16A34A] font-bold">✓ {src.status} ({src.last_sync})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
