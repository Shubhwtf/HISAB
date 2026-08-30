"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronRight, CreditCard, AlertTriangle, ShieldCheck, Landmark, Compass, ArrowRight, ExternalLink } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface SearchResultItem {
  category: string;
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  target_tab: string;
  target_id?: string;
}

interface SearchResponse {
  query: string;
  total_count: number;
  results: SearchResultItem[];
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, targetId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchApi<SearchResponse>(`/api/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.results || []);
        setSelectedIndex(0);
      } catch (e) {
        console.error("Search query failed", e);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    onNavigate(item.target_tab, item.target_id);
  };

  if (!isOpen) return null;

  // Group results by category
  const categories = Array.from(new Set(results.map((r) => r.category)));

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Payments":
        return <CreditCard className="w-4 h-4 text-[#0B72E7]" />;
      case "Exceptions":
        return <AlertTriangle className="w-4 h-4 text-[#DC2626]" />;
      case "Settlements":
        return <Landmark className="w-4 h-4 text-[#16A34A]" />;
      default:
        return <Compass className="w-4 h-4 text-[#8B5CF6]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs animate-in fade-in select-none font-sans">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[560px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E2E8F0] dark:border-[#262626] flex items-center space-x-3 bg-white dark:bg-[#111111]">
          <Search className="w-5 h-5 text-[#64748B]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search payments, UTRs, batches, exceptions, views... (e.g. pay_90006, EX-10006)"
            className="flex-1 text-sm bg-transparent text-[#0F172A] dark:text-[#EDEDED] placeholder-[#94A3B8] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#64748B]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-[#64748B] rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {loading && (
            <div className="py-8 text-center text-[#64748B]">
              <span className="text-xs">Searching live ledger entities...</span>
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="py-8 text-center text-[#64748B]">
              <span className="text-xs">No records found matching &ldquo;{query}&rdquo;</span>
            </div>
          )}

          {!loading && results.length === 0 && !query && (
            <div className="py-6 px-4 space-y-3">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Quick Navigation Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { title: "Exceptions & Approvals", tab: "exceptions", desc: "Review 17 open anomalies" },
                  { title: "Forensic Double-Loss Graph", tab: "double-loss", desc: "Investigate Order 10006" },
                  { title: "Trace the Money (DAG)", tab: "trace-money", desc: "Inspect payment pay_90006" },
                  { title: "Settlement Control Tower", tab: "settlement-tower", desc: "15 Settlement batches" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onClose();
                      onNavigate(item.tab);
                    }}
                    className="p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626] bg-[#F8FAFC] dark:bg-[#0E0E0E] hover:border-[#0B72E7] text-left transition-colors group"
                  >
                    <span className="font-bold text-[#0F172A] dark:text-white block group-hover:text-[#0B72E7]">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA]">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {categories.map((category) => {
                const catResults = results.filter((r) => r.category === category);
                return (
                  <div key={category} className="space-y-1">
                    <div className="px-2 py-1 flex items-center space-x-1.5 text-[10px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider">
                      {getCategoryIcon(category)}
                      <span>{category}</span>
                    </div>

                    {catResults.map((item) => {
                      const itemGlobalIdx = results.indexOf(item);
                      const isSelected = itemGlobalIdx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(itemGlobalIdx)}
                          className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#0F172A] dark:text-white"
                              : "hover:bg-[#F8FAFC] dark:hover:bg-[#081120] text-[#334155] dark:text-[#D4D4D8]"
                          }`}
                        >
                          <div className="truncate pr-3 space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-xs text-[#0F172A] dark:text-white">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] truncate">
                              {item.subtitle}
                            </p>
                          </div>

                          <div className="flex items-center space-x-1 text-[#0B72E7] dark:text-[#3395FF] flex-shrink-0">
                            <span className="text-[11px] font-medium hidden sm:inline">Jump</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#0E0E0E] border-t border-[#E2E8F0] dark:border-[#262626] flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
          <div className="flex items-center space-x-3">
            <span>Use <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border">↑</kbd> <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border">↓</kbd> to navigate</span>
            <span><kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border">Enter</kbd> to select</span>
          </div>
          <span>HISAB Live Global Omnibox</span>
        </div>
      </div>
    </div>
  );
};
