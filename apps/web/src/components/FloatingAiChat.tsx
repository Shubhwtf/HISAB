"use client";

import React, { useState } from "react";
import { Sparkles, X, Send, ExternalLink, Terminal, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { FormattedMarkdown } from "@/components/FormattedMarkdown";

interface FloatingAiChatProps {
  onOpenEvidence: (paymentId: string) => void;
  onOpenException: () => void;
}

export const FloatingAiChat: React.FC<FloatingAiChatProps> = ({
  onOpenEvidence,
  onOpenException,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "ai",
      text: "### Ask HISAB Financial Assistant\n- **Continuous Assurance**: Grounded queries across live ledger entities\n- **Zero Hallucinations**: Every claim backed by deterministic tool execution\n\nHow can I assist your reconciliation analysis today?",
    }
  ]);

  const quickPrompts = [
    "Why can't this batch close?",
    "Find all potential double-loss cases.",
    "Show me the highest-value exception.",
    "What is our Section 194-O TDS status?",
  ];

  const handleSend = async (customQuery?: string) => {
    const qText = customQuery || query;
    if (!qText.trim()) return;

    const userMsg = { sender: "user", text: qText };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const data = await fetchApi<any>("/api/ask-hisab", {
        method: "POST",
        body: JSON.stringify({ query: qText }),
      });

      const aiMsg = {
        sender: "ai",
        text: data.answer,
        evidence_links: data.evidence_links,
        agent_run_trace: data.agent_run_trace,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Unable to query financial ledger. Please check backend connection." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Bottom-Right Circular Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full bg-[#0F172A] hover:bg-[#1E293B] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] shadow-2xl flex items-center justify-center transition-transform hover:scale-105 group p-3.5"
          title="Open Ask HISAB AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 fill-current" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#16A34A] border-2 border-[#0F172A] dark:border-white"></span>
          </div>
        </button>
      )}

      {/* Floating Chat Drawer / Pop-up Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 md:w-[440px] h-[580px] bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 font-sans">
          {/* Header */}
          <div className="h-14 bg-[#0F172A] dark:bg-[#1E1E1E] text-white px-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0B72E7] flex items-center justify-center font-bold text-xs text-white">
                H
              </div>
              <div>
                <h3 className="font-bold text-xs">Ask HISAB AI</h3>
                <span className="text-[10px] text-slate-300 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  <span>Grounded Financial Investigator</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3.5 rounded-xl max-w-[90%] ${
                    msg.sender === "user"
                      ? "bg-[#0F172A] text-white font-medium rounded-br-none"
                      : "bg-[#F8FAFC] dark:bg-[#0E0E0E] text-[#0F172A] dark:text-[#EDEDED] border border-[#E2E8F0] dark:border-[#262626] rounded-bl-none"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <span className="text-xs leading-relaxed">{msg.text}</span>
                  ) : (
                    <FormattedMarkdown content={msg.text} />
                  )}
                </div>

                {/* Evidence Links in AI Response */}
                {msg.evidence_links?.length > 0 && (
                  <div className="mt-2 space-y-1.5 w-full">
                    {msg.evidence_links.map((link: any, lIdx: number) => (
                      <div
                        key={lIdx}
                        className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] flex items-center justify-between text-[11px]"
                      >
                        <div className="truncate pr-2">
                          <span className="text-[#0F172A] dark:text-[#EDEDED] font-semibold block truncate">
                            {link.label}
                          </span>
                          {link.amount_formatted && (
                            <span className="text-[#DC2626] font-bold block">
                              Exposure: {link.amount_formatted}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onOpenEvidence(link.target_id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] text-[10px] font-semibold flex items-center space-x-1 flex-shrink-0"
                        >
                          <span>Prove It</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-[#64748B] p-2">
                <Sparkles className="w-4 h-4 animate-spin text-[#0B72E7]" />
                <span>Querying financial ledger & evaluating assertions...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts Strip */}
          <div className="px-3 py-2 border-t border-[#E2E8F0] dark:border-[#262626] bg-[#F8FAFC] dark:bg-[#0E0E0E] flex items-center space-x-1.5 overflow-x-auto text-[11px]">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] text-[#475569] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white font-medium"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-[#E2E8F0] dark:border-[#262626] bg-white dark:bg-[#111111]">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about payments, TDS, exceptions..."
                className="flex-1 bg-[#F8FAFC] dark:bg-[#0E0E0E] text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-[#0F172A] dark:text-[#EDEDED] focus:outline-none focus:border-[#0B72E7]"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !query.trim()}
                className="p-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
