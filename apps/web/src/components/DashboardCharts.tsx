"use client";

import React, { useState } from "react";
import { CreditCard, Smartphone, Landmark, CheckCircle2, ShieldAlert, Zap, Layers, ArrowRight, Clock, ExternalLink } from "lucide-react";

interface DashboardChartsProps {
  onNavigateToTab?: (tab: string) => void;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ onNavigateToTab = () => {} }) => {
  const [activeRail, setActiveRail] = useState<string>("cards");

  const rails = [
    { id: "cards", name: "Credit & Debit Cards", icon: CreditCard, percentage: 45.2, amount: "₹22,38,100.00", mdr: "2.0% MDR", count: "114 txns", color: "#0B72E7" },
    { id: "upi", name: "UPI Instant Payments", icon: Smartphone, percentage: 41.8, amount: "₹20,70,670.00", mdr: "0.0% MDR", count: "105 txns", color: "#16A34A" },
    { id: "netbanking", name: "Netbanking & Corporate Rail", icon: Landmark, percentage: 13.0, amount: "₹6,45,000.00", mdr: "1.8% MDR", count: "32 txns", color: "#F59E0B" },
  ];

  const reconTiers = [
    { name: "Tier 1: Exact ID & UTR Match", percentage: 89.2, count: "224 txns", latency: "0.14 ms", color: "bg-[#16A34A]", desc: "Deterministic matching on Payment ID and Bank Reference" },
    { name: "Tier 2: Constraint Window Match", percentage: 8.8, count: "22 txns", latency: "1.82 ms", color: "bg-[#0B72E7]", desc: "Amount tolerance + T+2 settlement window heuristics" },
    { name: "Tier 3: Subset-Sum Decomposition", percentage: 1.6, count: "4 txns", latency: "8.40 ms", color: "bg-[#8B5CF6]", desc: "Multi-movement knapsack unbundling of merged batches" },
    { name: "Unmatched / Anomalies", percentage: 0.4, count: "1 txn", latency: "Manual", color: "bg-[#DC2626]", desc: "Open double-loss or altered UTR narration cases" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 font-sans">
      {/* 1. Payment Method Volume Distribution & Rails */}
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#262626]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#EDEDED]">
              Turnover by Payment Rails
            </h3>
            <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">MDR fee schedule breakdown</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
            251 Captures
          </span>
        </div>

        {/* SVG Donut Chart */}
        <div className="flex items-center justify-center my-2 relative">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" className="text-[#F1F5F9] dark:text-[#1E293B]" strokeWidth="14" />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#0B72E7"
              strokeWidth="14"
              strokeDasharray="107.9 238.7"
              strokeDashoffset="0"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onMouseEnter={() => setActiveRail("cards")}
            />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#16A34A"
              strokeWidth="14"
              strokeDasharray="99.8 238.7"
              strokeDashoffset="-107.9"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onMouseEnter={() => setActiveRail("upi")}
            />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="14"
              strokeDasharray="31.0 238.7"
              strokeDashoffset="-207.7"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onMouseEnter={() => setActiveRail("netbanking")}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-bold uppercase">Total Gross</span>
            <span className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">₹49.54L</span>
          </div>
        </div>

        {/* Rail Items List */}
        <div className="space-y-2 pt-1">
          {rails.map((rail) => {
            const isSelected = activeRail === rail.id;
            return (
              <div
                key={rail.id}
                onMouseEnter={() => setActiveRail(rail.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-50/60 dark:bg-[#0B254A]/30 border-[#0B72E7] dark:border-[#3395FF]"
                    : "bg-[#F8FAFC] dark:bg-[#0E0E0E] border-[#E2E8F0] dark:border-[#262626] hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rail.color }}></span>
                    <span className="font-semibold text-[#0F172A] dark:text-[#EDEDED]">{rail.name}</span>
                  </div>
                  <span className="font-bold text-[#0F172A] dark:text-[#EDEDED]">{rail.percentage}%</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                  <span>{rail.count} • {rail.mdr}</span>
                  <span className="font-semibold text-[#0F172A] dark:text-[#EDEDED]">{rail.amount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Reconciliation Engine Ladder & Match Velocity */}
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#262626]">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-[#0B72E7]" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#EDEDED]">
                Match Engine Ladder Velocity
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">3-Tier Automated Decomposition</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 dark:bg-[#052E16] text-[#16A34A]">
            99.6% Matched
          </span>
        </div>

        {/* Stacked Resolution Bar */}
        <div className="w-full h-3.5 rounded-full bg-[#F1F5F9] dark:bg-[#1E1E1E] overflow-hidden flex my-2">
          <div className="h-full bg-[#16A34A]" style={{ width: "89.2%" }} title="Tier 1 Exact (89.2%)"></div>
          <div className="h-full bg-[#0B72E7]" style={{ width: "8.8%" }} title="Tier 2 Constraint (8.8%)"></div>
          <div className="h-full bg-[#8B5CF6]" style={{ width: "1.6%" }} title="Tier 3 Subset-Sum (1.6%)"></div>
          <div className="h-full bg-[#DC2626]" style={{ width: "0.4%" }} title="Anomalies (0.4%)"></div>
        </div>

        <div className="space-y-2.5 pt-1 text-xs">
          {reconTiers.map((tier, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${tier.color}`}></span>
                  <span className="font-semibold text-[#0F172A] dark:text-[#EDEDED] text-[11px]">{tier.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs">{tier.percentage}%</span>
                  <span className="text-[10px] text-[#64748B] flex items-center space-x-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{tier.latency}</span>
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] leading-tight pl-4">
                {tier.desc} ({tier.count})
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
