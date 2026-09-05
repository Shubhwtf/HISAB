"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertOctagon, 
  Search, 
  FileCheck2, 
  Compass, 
  ShieldAlert, 
  Zap, 
  RefreshCw,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { ReconciliationSummary, fetchApi } from "@/lib/api";
import { EvidenceGraphViewer } from "@/components/EvidenceGraphViewer";
import { InitiatePaymentModal } from "@/components/InitiatePaymentModal";

interface TraceMoneyViewProps {
  summary?: ReconciliationSummary | null;
  orgName?: string;
  isRazorpayConnected?: boolean;
  onNavigateTab?: (tab: string) => void;
  onRefreshData?: () => void;
}

export const TraceMoneyView: React.FC<TraceMoneyViewProps> = ({ 
  summary, 
  orgName = "Nova Commerce Pvt Ltd",
  isRazorpayConnected = false,
  onNavigateTab,
  onRefreshData,
}) => {
  const [searchId, setSearchId] = useState<string>("pay_90006");
  const [realTraces, setRealTraces] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isQuickPaying, setIsQuickPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const data = await fetchApi<{ payments: any[]; total_count: number }>("/api/reconcile/payments?limit=15");
      if (data && data.payments && data.payments.length > 0) {
        setRealTraces(data.payments);
        // Automatically select the most recent payment
        setSearchId(data.payments[0].id);
      }
    } catch (e) {
      console.warn("Could not fetch live payments for trace:", e);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [summary?.total_payments_count]);

  const handleQuickPayment = async () => {
    setIsQuickPaying(true);
    setNotification(null);
    try {
      const res = await fetchApi<any>("/api/webhooks/simulate", {
        method: "POST",
        body: JSON.stringify({
          event_type: "payment.captured",
          amount_inr: 1500.0,
          customer_email: "checkout@merchant.com",
        }),
      });
      if (res && res.payment_id) {
        setNotification(`Payment ${res.payment_id} of ${res.amount_formatted} captured & verified! Invariant graph updated.`);
        setSearchId(res.payment_id);
        await loadPayments();
        if (onRefreshData) onRefreshData();
      }
    } catch (e: any) {
      alert(e?.message || "Failed to trigger quick payment.");
    } finally {
      setIsQuickPaying(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setSearchId(paymentId);
    setNotification(`Transaction ${paymentId} captured! Ledger and DAG updated.`);
    await loadPayments();
    if (onRefreshData) onRefreshData();
  };

  const hasData = (summary?.total_payments_count ?? 0) > 0 || realTraces.length > 0;

  // Render Connected Empty State vs Disconnected Empty State
  if (summary && !hasData) {
    return (
      <div className="space-y-6 font-sans">
        <InitiatePaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orgName={orgName}
          onPaymentSuccess={handlePaymentSuccess}
        />

        {isRazorpayConnected ? (
          <div className="bg-white dark:bg-[#111111] border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-10 text-center space-y-5 shadow-sm">
            <div className="inline-flex p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
              <Zap className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Razorpay Gateway Active & Connected</span>
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
                Ready for Transactions — Ledger Awaiting First Event
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] max-w-lg mx-auto leading-relaxed">
                <strong className="text-[#0F172A] dark:text-white">{orgName}</strong> is linked to Razorpay. Initiate a live test payment below to watch HISAB verify HMAC-SHA256 signatures, record double-entry journal items, and construct the 6-point invariant trace graph in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleQuickPayment}
                disabled={isQuickPaying}
                className="px-5 py-2.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center space-x-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${isQuickPaying ? "animate-spin" : ""}`} />
                <span>{isQuickPaying ? "Capturing Payment..." : "⚡ Initiate Test Payment (₹1,500)"}</span>
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#333333] text-[#0F172A] dark:text-[#EDEDED] hover:bg-[#F8FAFC] dark:hover:bg-[#1A1A1A] font-semibold text-xs transition-colors"
              >
                Custom Payment Studio
              </button>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("razorpay-sync")}
                  className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white text-xs font-semibold transition-colors"
                >
                  View Webhook Rails
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-10 text-center space-y-4 shadow-sm font-sans">
            <div className="inline-flex p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0B72E7] dark:text-[#3395FF]">
              <Compass className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white">No Transactions to Trace</h3>
              <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] max-w-md mx-auto mt-1">
                <strong className="text-[#0F172A] dark:text-white">{orgName}</strong> currently has no captured payments or settlement batches in the ledger. Connect Razorpay or upload CSV files to generate multi-touchpoint invariant proofs.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("razorpay-sync")}
                  className="px-4 py-2 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] text-white font-semibold text-xs transition-colors"
                >
                  Connect Razorpay
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const defaultSampleTraces = [
    {
      id: "pay_90000",
      order: "order_10000",
      type: "CLEAN_SETTLEMENT",
      gross: "₹500.00",
      fee: "₹11.80",
      net: "₹488.20",
      status: "Matched & Cleared",
      narrative: "Payment captured via Card → settled in setl_8800 → bank credit UTR778211000 matched."
    },
    {
      id: "pay_90006",
      order: "order_10006",
      type: "DOUBLE_LOSS_RISK",
      gross: "₹72,000.00",
      fee: "₹1,440.00",
      net: "-₹72,500.00",
      status: "Critical Double-Loss",
      narrative: "Manual refund -₹72,000 processed AND bank dispute -₹72,500 filed simultaneously."
    },
  ];

  const tracesToDisplay = realTraces.length > 0 ? realTraces : defaultSampleTraces;

  return (
    <div className="space-y-6 font-sans">
      <InitiatePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orgName={orgName}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {notification && (
        <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-xs text-green-800 dark:text-green-300 flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-xs text-green-600 dark:text-green-400 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                  Trace Money Flow
                </h2>
                {isRazorpayConnected && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                    ● Gateway Linked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                End-to-end lifecycle graph from Order checkout → Gateway capture → Settlement payout → Bank clearing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleQuickPayment}
              disabled={isQuickPaying}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isQuickPaying ? "animate-spin" : ""}`} />
              <span>{isQuickPaying ? "Ingesting..." : "⚡ Quick Payment (₹1,500)"}</span>
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] dark:border-[#333333] text-[#0F172A] dark:text-[#EDEDED] hover:bg-[#F8FAFC] dark:hover:bg-[#1A1A1A] font-semibold text-xs transition-colors"
            >
              Custom Event
            </button>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Search Payment ID..."
                className="bg-[#F8FAFC] dark:bg-[#0E0E0E] text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626] font-semibold w-52 text-[#0F172A] dark:text-[#EDEDED] focus:outline-none focus:border-[#0B72E7]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tracesToDisplay.map((tr) => {
            const isSelected = searchId === tr.id;
            const isAlert = tr.type === "DOUBLE_LOSS_RISK";
            return (
              <div
                key={tr.id}
                onClick={() => setSearchId(tr.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-50/70 dark:bg-[#0B254A]/40 border-[#0B72E7] dark:border-[#3395FF] shadow-sm ring-1 ring-[#0B72E7]"
                    : "bg-[#F8FAFC] dark:bg-[#0E0E0E] border-[#E2E8F0] dark:border-[#262626] hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-[#0F172A] dark:text-[#EDEDED]">
                      {tr.id}
                    </span>
                    <span className="text-[11px] text-[#64748B]">({tr.order})</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                    isAlert
                      ? "bg-red-100 dark:bg-[#3E0E0E] text-[#DC2626]"
                      : "bg-green-100 dark:bg-[#052E16] text-[#16A34A]"
                  }`}>
                    {isAlert ? <AlertOctagon className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    <span>{tr.status}</span>
                  </span>
                </div>

                <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mb-3 leading-relaxed">
                  {tr.narrative}
                </p>

                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[#E2E8F0] dark:border-[#262626]">
                  <div className="flex items-center space-x-3 text-[11px]">
                    <div>
                      <span className="text-[#64748B] text-[10px] uppercase block">Gross Sale</span>
                      <span className="font-bold text-[#0F172A] dark:text-[#EDEDED]">{tr.gross}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[10px] uppercase block">Gateway Fee</span>
                      <span className="font-medium text-[#64748B]">{tr.fee}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[10px] uppercase block">Net Credited</span>
                      <span className={`font-bold ${isAlert ? "text-[#DC2626]" : "text-[#16A34A]"}`}>
                        {tr.net}
                      </span>
                    </div>
                  </div>

                  <span className="font-semibold text-xs text-[#0B72E7] dark:text-[#3395FF] flex items-center space-x-1 hover:underline">
                    <span>Inspect Graph</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EvidenceGraphViewer initialPaymentId={searchId} />
    </div>
  );
};
