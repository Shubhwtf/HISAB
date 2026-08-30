"use client";

import React, { useState } from "react";
import { Zap, ShieldCheck, ArrowRight, RefreshCw, X, CheckCircle2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface GateModalProps {
  isOpen: boolean;
  onConnected: () => void;
  onExploreDemo: () => void;
}

export const RazorpayGateModal: React.FC<GateModalProps> = ({
  isOpen,
  onConnected,
  onExploreDemo,
}) => {
  const [connecting, setConnecting] = useState(false);

  if (!isOpen) return null;

  const handleOAuthConnect = async () => {
    setConnecting(true);
    try {
      await fetchApi("/api/auth/razorpay-oauth-connect", { method: "POST" });
      onConnected();
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#0B72E7] dark:bg-[#3395FF] flex items-center justify-center text-white mx-auto mb-3 shadow-md">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A] dark:text-[#EDEDED]">
            Connect Razorpay Merchant Account
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1">
            HISAB requires authorization to ingest your merchant payments, settlements, and dispute feeds.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] text-xs space-y-2">
          <div className="flex items-center space-x-2 text-[#0F172A] dark:text-[#EDEDED] font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>Read-only access to Payments & Settlements</span>
          </div>
          <div className="flex items-center space-x-2 text-[#0F172A] dark:text-[#EDEDED] font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>Encrypted token storage at rest (AES-256)</span>
          </div>
          <div className="flex items-center space-x-2 text-[#0F172A] dark:text-[#EDEDED] font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>Admin-managed Organization credentials</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleOAuthConnect}
            disabled={connecting}
            className="w-full py-3 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-colors"
          >
            {connecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Connect Razorpay (OAuth 2.0)</span>
              </>
            )}
          </button>

          <button
            onClick={onExploreDemo}
            className="w-full py-2.5 px-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E] text-[#0F172A] dark:text-[#EDEDED] font-bold text-xs border border-[#E2E8F0] dark:border-[#262626] flex items-center justify-center space-x-2 transition-colors"
          >
            <span>Explore Demo Mode (Nova Commerce)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
