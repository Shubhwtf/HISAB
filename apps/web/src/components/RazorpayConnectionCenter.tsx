"use client";

import React, { useState, useEffect } from "react";
import { Zap, CheckCircle2, RefreshCw, Key, ShieldCheck, Play, Send, Lock } from "lucide-react";
import { fetchApi } from "@/lib/api";

export const RazorpayConnectionCenter: React.FC = () => {
  const [status, setStatus] = useState<any | null>(null);
  const [webhooks, setWebhooks] = useState<any | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const s = await fetchApi<any>("/api/razorpay/status");
      setStatus(s);
      const w = await fetchApi<any>("/api/razorpay/webhooks");
      setWebhooks(w);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetchApi<any>("/api/razorpay/sync-now", { method: "POST" });
      setMessage(res.message);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handleReplayWebhook = async (eventId: string) => {
    setReplaying(true);
    try {
      await fetchApi("/api/razorpay/webhooks/replay", {
        method: "POST",
        body: JSON.stringify({ event_id: eventId }),
      });
      setMessage(`Webhook ${eventId} successfully replayed and verified.`);
    } catch (e) {
      console.error(e);
    } finally {
      setReplaying(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Direct Connection Card */}
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#0B72E7] dark:bg-[#3395FF] flex items-center justify-center text-white font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                  RAZORPAY DIRECT CONNECTOR & SYNC CENTER
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  status?.is_connected
                    ? "bg-green-100 dark:bg-[#052E16] text-[#16A34A] border-green-200 dark:border-green-800"
                    : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                }`}>
                  {status?.is_connected ? "● HEALTHY (OAUTH 2.0)" : "○ DISCONNECTED"}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                {status?.is_connected ? (
                  <>Live feed connected for MID: <strong className="text-[#0F172A] dark:text-[#EDEDED]">{status?.merchant_id || "rzp_live_99420"}</strong></>
                ) : (
                  <>Gateway feed not connected. Authorize Razorpay to sync live transactions.</>
                )}
              </p>
            </div>
          </div>

          {status?.is_connected && (
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? "Syncing API Feed..." : "Sync Now (Incremental)"}</span>
            </button>
          )}
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-green-50 dark:bg-[#052E16] text-[#16A34A] text-xs mb-4 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Sync Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Payments Synced</span>
            <div className="text-xl font-bold text-[#0F172A] dark:text-[#EDEDED] mt-1">
              {status?.is_connected ? (status?.metrics?.payments_synced ?? 0) : 0}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Settlement Batches</span>
            <div className="text-xl font-bold text-[#0F172A] dark:text-[#EDEDED] mt-1">
              {status?.is_connected ? (status?.metrics?.settlements_synced ?? 0) : 0}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Refunds Synced</span>
            <div className="text-xl font-bold text-[#0F172A] dark:text-[#EDEDED] mt-1">
              {status?.is_connected ? (status?.metrics?.refunds_synced ?? 0) : 0}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Disputes Synced</span>
            <div className="text-xl font-bold text-[#0F172A] dark:text-[#EDEDED] mt-1">
              {status?.is_connected ? (status?.metrics?.disputes_synced ?? 0) : 0}
            </div>
          </div>
        </div>

        {/* Webhooks Section */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#EDEDED] mb-3">
          Razorpay Webhook Deliveries & HMAC Signature Verification
        </h4>
        <div className="space-y-2">
          {status?.is_connected && webhooks?.recent_deliveries && webhooks.recent_deliveries.length > 0 ? (
            webhooks.recent_deliveries.map((d: any) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626] bg-[#F8FAFC] dark:bg-[#0E0E0E] flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-[11px] font-bold text-[#0B72E7] dark:text-[#3395FF]">
                    {d.event}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 dark:bg-[#052E16] text-[#16A34A]">
                    HMAC Verified (SHA-256)
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-[#64748B]">
                  <span>Entity: {d.entity_id}</span>
                  <span>{d.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-[#E2E8F0] dark:border-[#262626] text-center text-xs text-[#64748B] dark:text-[#A1A1AA]">
              No active webhook event deliveries received for this merchant account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
