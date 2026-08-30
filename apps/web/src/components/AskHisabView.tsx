"use client";

import React, { useState } from "react";
import { Search, Send, Sparkles, Layers, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Terminal, ShieldCheck } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { FormattedMarkdown } from "@/components/FormattedMarkdown";

interface AskHisabProps {
  onOpenEvidence: (paymentId: string) => void;
  onOpenException: () => void;
}

export const AskHisabView: React.FC<AskHisabProps> = ({ onOpenEvidence, onOpenException }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [showTrace, setShowTrace] = useState(true);

  const sampleQuestions = [
    "Why can't this batch close?",
    "Find all potential double-loss cases.",
    "Show me the highest-value exception.",
    "What changed between Snapshot v2 and v3?",
    "What is our Section 194-O TDS compliance status?",
  ];

  const handleAsk = async (qText?: string) => {
    const targetQ = qText || query;
    if (!targetQ.trim()) return;

    setLoading(true);
    setResponse(null);
    try {
      const data = await fetchApi<any>("/api/ask-hisab", {
        method: "POST",
        body: JSON.stringify({ query: targetQ }),
      });
      setResponse(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search Header */}
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#0B254A] flex items-center justify-center text-[#0B72E7] dark:text-[#3395FF] font-bold text-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
              ASK HISAB — NATURAL LANGUAGE FINANCIAL INVESTIGATOR
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
              Query live accounting state, exceptions, and audit proofs with zero hallucination.
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center space-x-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#64748B]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="e.g. Why can't this batch close? or Look up payment pay_90006..."
              className="w-full bg-[#F8FAFC] dark:bg-[#0E0E0E] text-[#0F172A] dark:text-[#EDEDED] text-xs pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7]"
            />
          </div>
          <button
            onClick={() => handleAsk()}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] font-semibold text-xs flex items-center space-x-1.5 disabled:opacity-50 shadow-sm transition-colors"
          >
            {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Investigate</span>
          </button>
        </div>

        {/* Question Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(sq);
                handleAsk(sq);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E0E0E] hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E] text-[11px] font-medium text-[#475569] dark:text-[#A1A1AA] border border-[#E2E8F0] dark:border-[#262626] transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Answer Container */}
      {response && (
        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-5">
          {/* Answer Text Formatted */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <FormattedMarkdown content={response.answer} />
          </div>

          {/* Evidence Action Links */}
          {response.evidence_links?.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#EDEDED]">
                  Underlying Verified Evidence & Audit Links
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.evidence_links.map((link: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626] bg-[#F8FAFC] dark:bg-[#0E0E0E] flex items-center justify-between shadow-xs"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[#0F172A] dark:text-[#EDEDED] block">
                        {link.label}
                      </span>
                      {link.amount_formatted && (
                        <span className="text-xs font-bold text-[#DC2626] block">
                          Exposure: {link.amount_formatted}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onOpenEvidence(link.target_id)}
                      className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-[#0F172A] text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
                    >
                      <span>Prove It</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Run Visibility Accordion */}
          <div className="border border-[#E2E8F0] dark:border-[#262626] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTrace(!showTrace)}
              className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#0E0E0E] flex items-center justify-between text-xs font-semibold text-[#475569] hover:text-[#0F172A] dark:hover:text-white"
            >
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-[#0B72E7]" />
                <span>Deterministic Tool Execution Trace ({response.agent_run_trace?.length || 0} tool steps verified)</span>
              </div>
              {showTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTrace && response.agent_run_trace && (
              <div className="p-4 space-y-2 bg-white dark:bg-[#111111] border-t border-[#E2E8F0] dark:border-[#262626]">
                {response.agent_run_trace.map((tr: any, idx: number) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#0F172A] dark:text-[#EDEDED] font-semibold text-[10px]">
                      STEP #{tr.step_number}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold text-[#0F172A] dark:text-[#EDEDED]">{tr.tool_name}</span>
                      <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">{tr.result_summary}</p>
                    </div>
                    <span className="text-[10px] text-[#16A34A] font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{tr.verified_records_count} records verified</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
