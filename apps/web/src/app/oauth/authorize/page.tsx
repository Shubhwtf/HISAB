"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Shield, ArrowRight, Lock } from "lucide-react";

function OAuthAuthorizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authorizing, setAuthorizing] = useState(false);

  const clientId = searchParams.get("client_id") || "rzp_oauth_hisab_live";
  const redirectUri = searchParams.get("redirect_uri") || "http://localhost:3000/oauth/callback";
  const state = searchParams.get("state") || "hisab_auth_state";

  const handleAuthorize = () => {
    setAuthorizing(true);
    setTimeout(() => {
      router.push(`/oauth/callback?code=rzp_oauth_code_live_auth_8829&state=${state}`);
    }, 600);
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans text-slate-800 animate-in fade-in">
      {/* Razorpay Brand Blue Header */}
      <div className="bg-[#0B72E7] text-white p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-[#0B72E7] font-black text-sm flex items-center justify-center shadow-sm">
              R
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm block">Razorpay Accounts</span>
              <span className="text-[10px] text-blue-100 font-mono">OAuth 2.0 Authorization Server</span>
            </div>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono font-bold">
            SECURE
          </span>
        </div>
      </div>

      {/* Consent Content */}
      <div className="p-6 space-y-5 text-xs">
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-slate-900">Authorize HISAB Finance Controller</h2>
          <p className="text-[11px] text-slate-500">
            Merchant: <strong className="text-slate-800">Nova Commerce Pvt Ltd (MID: rzp_live_99420)</strong>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-[11px]">
          <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
            Permissions Requested:
          </div>
          <div className="flex items-center space-x-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Read payment transactions and capture statuses</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Read settlement payouts and banking UTR references</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Read refund reversals and chargeback disputes</span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-mono">
          <Lock className="w-3 h-3 text-green-600" />
          <span>Encrypted token storage • Read-only access</span>
        </div>

        {/* Action CTAs */}
        <div className="flex space-x-2.5 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={authorizing}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAuthorize}
            disabled={authorizing}
            className="flex-1 py-2.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] text-white font-semibold flex items-center justify-center space-x-1.5 shadow-md transition-colors"
          >
            {authorizing ? (
              <span>Authorizing...</span>
            ) : (
              <>
                <span>Authorize Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OAuthAuthorizePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-slate-500">Loading Razorpay Authorization...</div>}>
        <OAuthAuthorizeContent />
      </Suspense>
    </div>
  );
}
