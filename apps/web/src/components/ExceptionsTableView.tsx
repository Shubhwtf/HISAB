"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search
} from "lucide-react";
import { ExceptionItem, fetchApi } from "@/lib/api";

interface ExceptionsTableViewProps {
  onSelectException?: (id: string) => void;
}

export const ExceptionsTableView: React.FC<ExceptionsTableViewProps> = ({ onSelectException }) => {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const data = await fetchApi<{ items: ExceptionItem[] }>(`/api/controls/exceptions${query}`);
      setExceptions(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await fetchApi(`/api/controls/exceptions/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          justification: "Manual human controller clearance and fee schedule alignment",
          actor_id: "FINANCE_OPERATOR",
          resolution_type: "MANUAL_CLEARANCE",
        }),
      });
      await loadExceptions();
    } catch (e) {
      console.error(e);
    } finally {
      setResolvingId(null);
    }
  };

  const handleEscalate = async (id: string) => {
    setResolvingId(id);
    try {
      await fetchApi(`/api/controls/exceptions/${id}/escalate`, {
        method: "POST",
        body: JSON.stringify({
          reason: "High exposure or double-loss anomaly requires senior finance review",
          assigned_to: "HEAD_OF_FINANCE",
          actor_id: "FINANCE_OPERATOR",
        }),
      });
      await loadExceptions();
    } catch (e) {
      console.error(e);
    } finally {
      setResolvingId(null);
    }
  };

  useEffect(() => {
    loadExceptions();
    setCurrentPage(1);
  }, [statusFilter]);

  // Filtered and Paginated Items
  const filteredItems = exceptions.filter((exc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      exc.id.toLowerCase().includes(q) ||
      exc.category.toLowerCase().includes(q) ||
      exc.root_cause.toLowerCase().includes(q) ||
      (exc.affected_records && JSON.stringify(exc.affected_records).toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-4 font-sans">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626]">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
              EXCEPTIONS & SAFE POLICY GATE AUDIT
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-[#382503] text-[#F59E0B] border border-amber-200 dark:border-amber-800 font-semibold uppercase">
              POLICY INVARIANTS
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
            Reviewing deterministic and AI-flagged variances before automated or manual settlement sign-off.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search exceptions..."
              className="bg-[#F8FAFC] dark:bg-[#0E0E0E] text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#262626] w-48 text-[#0F172A] dark:text-[#EDEDED]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-[#F8FAFC] dark:bg-[#0E0E0E] p-1 rounded-lg border border-[#E2E8F0] dark:border-[#262626] text-xs">
            {["ALL", "OPEN", "ESCALATED", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                  statusFilter === st
                    ? "bg-[#0F172A] dark:bg-[#1E1E1E] text-white font-semibold"
                    : "text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-[#64748B] dark:text-[#A1A1AA] flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B72E7]" />
          <span>Loading exception ledger...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-xs text-[#64748B] dark:text-[#A1A1AA]">
          No exceptions match the selected filter. Click 'Run Reconcile Engine' to evaluate fresh dataset.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] dark:border-[#262626]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#0E0E0E] border-b border-[#E2E8F0] dark:border-[#262626] text-[#64748B] dark:text-[#A1A1AA] uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 font-semibold">Exception ID</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold">Severity</th>
                  <th className="py-3 px-3 font-semibold">Root Cause</th>
                  <th className="py-3 px-3 text-right font-semibold">Financial Impact</th>
                  <th className="py-3 px-3 text-center font-semibold">Status</th>
                  <th className="py-3 px-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                {paginatedItems.map((exc) => {
                  const isCrit = exc.severity === "CRITICAL" || exc.category.includes("DOUBLE_LOSS");
                  const isResolved = exc.status === "RESOLVED";
                  return (
                    <tr key={exc.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#081120] transition-colors">
                      <td className="py-3 px-3 font-medium text-[#0F172A] dark:text-[#EDEDED] whitespace-nowrap">
                        {exc.id}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#0F172A] dark:text-[#EDEDED]">
                          {exc.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase flex items-center space-x-1 w-max ${
                            isCrit 
                              ? "bg-red-100 dark:bg-[#3E0E0E] text-[#DC2626]" 
                              : "bg-amber-100 dark:bg-[#382503] text-[#F59E0B]"
                          }`}
                        >
                          {isCrit ? <AlertOctagon className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          <span>{exc.severity}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#0F172A] dark:text-[#EDEDED] max-w-xs truncate" title={exc.root_cause}>
                        {exc.root_cause}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-[#DC2626] whitespace-nowrap">
                        {exc.financial_impact_formatted}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isResolved
                              ? "bg-green-100 dark:bg-[#052E16] text-[#16A34A]"
                              : exc.status === "ESCALATED"
                              ? "bg-red-100 dark:bg-[#3E0E0E] text-[#DC2626]"
                              : "bg-amber-100 dark:bg-[#382503] text-[#F59E0B]"
                          }`}
                        >
                          {exc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isResolved ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleResolve(exc.id)}
                              disabled={resolvingId === exc.id}
                              className="px-2.5 py-1 rounded-lg bg-[#16A34A] hover:bg-[#15803d] text-white text-[11px] font-medium transition-colors"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleEscalate(exc.id)}
                              disabled={resolvingId === exc.id}
                              className="px-2.5 py-1 rounded-lg bg-[#DC2626] hover:bg-[#b91c1c] text-white text-[11px] font-medium transition-colors"
                            >
                              Escalate
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                            {exc.resolution_method || "RESOLVED"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Clean Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-[#64748B] dark:text-[#A1A1AA]">
            <div className="flex items-center space-x-2">
              <span>Showing</span>
              <span className="font-semibold text-[#0F172A] dark:text-[#EDEDED]">
                {filteredItems.length > 0 ? startIndex + 1 : 0} – {Math.min(startIndex + pageSize, filteredItems.length)}
              </span>
              <span>of</span>
              <span className="font-semibold text-[#0F172A] dark:text-[#EDEDED]">{filteredItems.length} exceptions</span>

              <span className="mx-2 text-[#CBD5E1]">|</span>

              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#F8FAFC] dark:bg-[#0E0E0E] px-2 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#262626] text-xs font-semibold"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Page Navigation Buttons */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#262626] hover:bg-[#F8FAFC] dark:hover:bg-[#081120] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === pageNum
                      ? "bg-[#0F172A] dark:bg-[#1E1E1E] text-white"
                      : "border border-[#E2E8F0] dark:border-[#262626] hover:bg-[#F8FAFC] dark:hover:bg-[#081120]"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#262626] hover:bg-[#F8FAFC] dark:hover:bg-[#081120] disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
