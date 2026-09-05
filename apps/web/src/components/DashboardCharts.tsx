"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Smartphone, Landmark, CheckCircle2, ShieldAlert, Zap, Layers, ArrowRight, Clock, ExternalLink } from "lucide-react";
import { fetchApi } from "@/lib/api";

export interface RailItem {
  id: string;
  name: string;
  percentage: number;
  amount: string;
  mdr: string;
  count: string;
  color: string;
}

export interface ReconTierItem {
  name: string;
  percentage: number;
  count: string;
  latency: string;
  color: string;
  desc: string;
}

export interface AnalyticsData {
  rails?: {
    total_captures: number;
    total_gross_formatted: string;
    items: RailItem[];
  };
  match_engine?: {
    matched_percentage: string;
    tiers: ReconTierItem[];
  };
}

interface DashboardChartsProps {
  analyticsData?: AnalyticsData | null;
  onNavigateToTab?: (tab: string) => void;
}

const DEFAULT_RAILS: RailItem[] = [
  { id: "cards", name: "Credit & Debit Cards", percentage: 45.2, amount: "₹22,38,100.00", mdr: "2.0% MDR", count: "114 txns", color: "#0B72E7" },
  { id: "upi", name: "UPI Instant Payments", percentage: 41.8, amount: "₹20,70,670.00", mdr: "0.0% MDR", count: "105 txns", color: "#16A34A" },
  { id: "netbanking", name: "Netbanking & Corporate Rail", percentage: 13.0, amount: "₹6,45,000.00", mdr: "1.8% MDR", count: "32 txns", color: "#F59E0B" },
];

const DEFAULT_TIERS: ReconTierItem[] = [
  { name: "Tier 1: Exact ID & UTR Match", percentage: 89.2, count: "224 txns", latency: "0.14 ms", color: "bg-[#16A34A]", desc: "Deterministic matching on Payment ID and Bank Reference" },
  { name: "Tier 2: Constraint Window Match", percentage: 8.8, count: "22 txns", latency: "1.82 ms", color: "bg-[#0B72E7]", desc: "Amount tolerance + T+2 settlement window heuristics" },
  { name: "Tier 3: Subset-Sum Decomposition", percentage: 1.6, count: "4 txns", latency: "8.40 ms", color: "bg-[#8B5CF6]", desc: "Multi-movement knapsack unbundling of merged batches" },
  { name: "Unmatched / Anomalies", percentage: 0.4, count: "1 txn", latency: "Manual", color: "bg-[#DC2626]", desc: "Open double-loss or altered UTR narration cases" },
];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ analyticsData, onNavigateToTab = () => {} }) => {
  const [activeRail, setActiveRail] = useState<string>("cards");
  const [localData, setLocalData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (!analyticsData) {
      fetchApi<AnalyticsData>("/api/reconcile/analytics")
        .then((res) => {
          if (res?.rails) setLocalData(res);
        })
        .catch(() => {});
    }
  }, [analyticsData]);

  const activeAnalytics = analyticsData || localData;
  const rails = (activeAnalytics?.rails?.items && activeAnalytics.rails.items.length > 0)
    ? activeAnalytics.rails.items
    : DEFAULT_RAILS;
  const reconTiers = (activeAnalytics?.match_engine?.tiers && activeAnalytics.match_engine.tiers.length > 0)
    ? activeAnalytics.match_engine.tiers
    : DEFAULT_TIERS;
  const totalCaptures = activeAnalytics?.rails?.total_captures ?? 251;
  const totalGrossFormatted = activeAnalytics?.rails?.total_gross_formatted ?? "₹49.54L";
  const matchedPercentage = activeAnalytics?.match_engine?.matched_percentage ?? "99.6% Matched";

  // Dynamic SVG circle stroke calculation
  const circumference = 238.76;
  const cardsItem = rails.find((r) => r.id === "cards") || rails[0];
  const upiItem = rails.find((r) => r.id === "upi") || rails[1];
  const nbItem = rails.find((r) => r.id === "netbanking") || rails[2];

  const cardsDash = ((cardsItem?.percentage || 0) / 100) * circumference;
  const upiDash = ((upiItem?.percentage || 0) / 100) * circumference;
  const nbDash = ((nbItem?.percentage || 0) / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 font-sans">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#262626]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#EDEDED]">
              Turnover by Payment Rails
            </h3>
            <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">MDR fee schedule breakdown</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
            {totalCaptures} {totalCaptures === 1 ? "Capture" : "Captures"}
          </span>
        </div>

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
              strokeDasharray={`${cardsDash.toFixed(1)} ${circumference.toFixed(1)}`}
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
              strokeDasharray={`${upiDash.toFixed(1)} ${circumference.toFixed(1)}`}
              strokeDashoffset={`-${cardsDash.toFixed(1)}`}
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
              strokeDasharray={`${nbDash.toFixed(1)} ${circumference.toFixed(1)}`}
              strokeDashoffset={`-${(cardsDash + upiDash).toFixed(1)}`}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onMouseEnter={() => setActiveRail("netbanking")}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-bold uppercase">Total Gross</span>
            <span className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">{totalGrossFormatted}</span>
          </div>
        </div>

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
            {matchedPercentage}
          </span>
        </div>

        <div className="w-full h-3.5 rounded-full bg-[#F1F5F9] dark:bg-[#1E1E1E] overflow-hidden flex my-2">
          {reconTiers.map((tier, idx) => (
            <div
              key={idx}
              className={`h-full ${tier.color} transition-all`}
              style={{ width: `${tier.percentage}%` }}
              title={`${tier.name} (${tier.percentage}%)`}
            ></div>
          ))}
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
