"use client";

import React, { useState } from "react";
import { BarChart3, Info, ArrowDownRight, ArrowUpRight, CheckCircle2 } from "lucide-react";

export const InteractiveWaterfallChart: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const steps = [
    { label: "Gross Captured Revenue", amount: "₹49,53,770.00", delta: "+₹49.54L", type: "positive", height: 100, color: "bg-[#0B72E7]", desc: "Total customer order value captured via Cards, UPI, and Netbanking rails" },
    { label: "Gateway MDR Charges", amount: "-₹80,120.30", delta: "-₹80.12k", type: "negative", height: 14, color: "bg-[#DC2626]", desc: "Blended ~2.0% gateway fee retention on processed card & netbanking volume" },
    { label: "18% GST on MDR Fee", amount: "-₹14,421.65", delta: "-₹14.42k", type: "negative", height: 8, color: "bg-[#F59E0B]", desc: "Statutory 18% Goods & Services Tax levied strictly on payment gateway service fees" },
    { label: "Section 194-O E-Commerce TDS", amount: "-₹4,953.77", delta: "-₹4.95k", type: "negative", height: 6, color: "bg-[#8B5CF6]", desc: "Amended 0.10% (10 bps) statutory tax withholding deposited directly under merchant PAN" },
    { label: "Customer Reversals & Refunds", amount: "-₹37,200.00", delta: "-₹37.20k", type: "negative", height: 10, color: "bg-[#DC2626]", desc: "Principal debited to customers for return orders (original MDR retained per RBI rules)" },
    { label: "Net Cleared Bank Settlement", amount: "₹48,17,074.28", delta: "₹48.17L", type: "total", height: 97, color: "bg-[#16A34A]", desc: "Final immutable funds credited to merchant current bank account via RBI NEFT/RTGS rail" },
  ];

  return (
    <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm mb-6 font-sans space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED] tracking-tight">
              Razorpay Settlement Waterfall & Fee Decomposition
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
              Minor-unit integer arithmetic breakdown verifying 0 paise drift across MDR, 18% GST, Section 194-O TDS, and Net Payouts.
            </p>
          </div>
        </div>

        <span className="text-[10px] px-3 py-1 rounded-full font-bold bg-green-50 dark:bg-[#052E16] text-[#16A34A] border border-green-200 dark:border-green-800 flex items-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Zero Minor-Unit Drift</span>
        </span>
      </div>

      {/* Step Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((step, idx) => {
          const isHovered = hoveredIdx === idx;
          const isTotal = step.type === "total" || step.type === "positive";
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isHovered
                  ? "bg-blue-50/60 dark:bg-[#0B254A]/30 border-[#0B72E7] dark:border-[#3395FF] shadow-sm"
                  : "bg-[#F8FAFC] dark:bg-[#0E0E0E] border-[#E2E8F0] dark:border-[#262626] hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider block truncate">
                  {step.label.split(" ")[0]} {step.label.split(" ")[1]}
                </span>
                {step.type === "positive" && <ArrowUpRight className="w-3.5 h-3.5 text-[#0B72E7]" />}
                {step.type === "negative" && <ArrowDownRight className="w-3.5 h-3.5 text-[#DC2626]" />}
                {step.type === "total" && <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />}
              </div>

              <div className={`text-xs font-bold tracking-tight ${isTotal ? 'text-[#0F172A] dark:text-[#EDEDED]' : 'text-[#DC2626]'}`}>
                {step.amount}
              </div>

              <div className="flex items-center space-x-1.5 mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#262626]">
                <span className={`w-2 h-2 rounded-full ${step.color}`}></span>
                <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-semibold">{step.delta}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Explanation Bar */}
      <div className="bg-[#F8FAFC] dark:bg-[#0E0E0E] rounded-xl p-3.5 border border-[#E2E8F0] dark:border-[#262626] flex items-start space-x-3 text-xs">
        <Info className="w-4 h-4 text-[#0B72E7] dark:text-[#3395FF] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold text-[#0F172A] dark:text-[#EDEDED]">
            {hoveredIdx !== null ? steps[hoveredIdx].label : "Accounting Policy Invariant"}:
          </span>{" "}
          <span className="text-[#64748B] dark:text-[#A1A1AA] leading-relaxed">
            {hoveredIdx !== null
              ? steps[hoveredIdx].desc
              : "Gross captured revenue (₹49,53,770.00) minus gateway MDR (₹80,120.30), 18% GST (₹14,421.65), statutory 0.10% Section 194-O TDS (₹4,953.77), and customer reversals (₹37,200.00) perfectly reconciles to net bank settlement of ₹48,17,074.28."}
          </span>
        </div>
      </div>
    </div>
  );
};
