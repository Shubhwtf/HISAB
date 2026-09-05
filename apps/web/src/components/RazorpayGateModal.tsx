"use client";

import React, { useState } from "react";
import { 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Sparkles
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface GateModalProps {
  isOpen: boolean;
  onConnected: () => void;
  onExploreDemo: () => void;
  onClose?: () => void;
}

export const RazorpayGateModal: React.FC<GateModalProps> = ({
  isOpen,
  onConnected,
  onExploreDemo,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"API_KEY" | "SANDBOX">("API_KEY");
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [environment, setEnvironment] = useState<"TEST" | "LIVE">("TEST");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectWithApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyId.trim() || !keySecret.trim()) {
      setError("Please enter both Key ID and Key Secret from your Razorpay Dashboard.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetchApi<any>("/api/auth/razorpay/connect", {
        method: "POST",
        body: JSON.stringify({
          auth_type: "API_KEY",
          key_id: keyId.trim(),
          key_secret: keySecret.trim(),
          webhook_secret: webhookSecret.trim() || undefined,
          environment: environment,
        }),
      });

      setSuccessMsg(res.message || "Connected successfully!");
      setTimeout(() => {
        onConnected();
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Failed to verify or connect Razorpay account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchApi("/api/auth/razorpay-oauth-connect", { method: "POST" });
      onConnected();
    } catch (err: any) {
      setError(err?.message || "Sandbox connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#0B72E7] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
              Connect Razorpay Account
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
              Ingest live payments, settlement batches, refunds, and dispute feeds.
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex p-1 rounded-xl bg-[#F1F5F9] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab("API_KEY"); setError(null); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === "API_KEY"
                ? "bg-white dark:bg-[#27272A] text-[#0B72E7] dark:text-white shadow-sm"
                : "text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Credentials (Recommended)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("SANDBOX"); setError(null); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === "SANDBOX"
                ? "bg-white dark:bg-[#27272A] text-[#0B72E7] dark:text-white shadow-sm"
                : "text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Demo Sandbox</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {activeTab === "API_KEY" ? (
          <form onSubmit={handleConnectWithApiKey} className="space-y-3.5 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#0F172A] dark:text-white">
                  Key ID <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-[#64748B]">Environment:</span>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as any)}
                    className="text-[11px] font-mono py-0.5 px-2 rounded border border-[#E2E8F0] dark:border-[#27272A] bg-[#F8FAFC] dark:bg-[#18181B] text-[#0F172A] dark:text-white focus:outline-none"
                  >
                    <option value="TEST">TEST</option>
                    <option value="LIVE">LIVE</option>
                  </select>
                </div>
              </div>
              <input
                type="text"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                placeholder="rzp_test_... or rzp_live_..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#0F172A] dark:text-white font-mono placeholder:font-sans placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#0B72E7]/20 focus:border-[#0B72E7] transition-all"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-white mb-1">
                Key Secret <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder="Enter your Razorpay Key Secret"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#0F172A] dark:text-white font-mono placeholder:font-sans placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#0B72E7]/20 focus:border-[#0B72E7] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-white mb-1">
                Webhook Secret <span className="text-[10px] text-[#64748B] font-normal">(Optional, for verifying HMAC signatures)</span>
              </label>
              <input
                type="text"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Secret configured in Razorpay Webhooks tab"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#0F172A] dark:text-white font-mono placeholder:font-sans placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#0B72E7]/20 focus:border-[#0B72E7] transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#095bc2] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with Razorpay API...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Test &amp; Connect Razorpay Account</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-[#64748B] dark:text-[#71717A] flex items-center space-x-1.5 justify-center">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>Encrypted with AES-256-GCM. Raw secrets are never stored in plaintext.</span>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-xs space-y-2.5">
              <div className="flex items-center space-x-2 text-[#0F172A] dark:text-white font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Simulated MID: <strong className="font-mono">rzp_live_99420</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-[#0F172A] dark:text-white font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Preloaded with 1,000 real-world Indian fintech payment records</span>
              </div>
              <div className="flex items-center space-x-2 text-[#0F172A] dark:text-white font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Simulates full Razorpay settlements, TDS, and double-loss forensics</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleSandboxConnect}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#095bc2] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Connect Live Demo Feed (Nova Commerce)</span>
                  </>
                )}
              </button>

              <button
                onClick={onExploreDemo}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] hover:bg-[#F1F5F9] dark:hover:bg-[#202024] text-[#0F172A] dark:text-white font-semibold text-xs border border-[#E2E8F0] dark:border-[#27272A] flex items-center justify-center space-x-2 transition-all"
              >
                <span>Browse Control Room Directly</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
