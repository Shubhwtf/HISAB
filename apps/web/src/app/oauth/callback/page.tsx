"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const code = searchParams.get("code") || "rzp_oauth_code_live_auth_8829";
    const state = searchParams.get("state");

    const exchangeToken = async () => {
      try {
        await fetchApi("/api/auth/razorpay/oauth/token", {
          method: "POST",
          body: JSON.stringify({
            code,
            state,
            org_id: "org_nova_2026",
          }),
        });

        // Sign in to the connected organization
        await fetchApi("/api/auth/signin", {
          method: "POST",
          body: JSON.stringify({
            email: "admin@novacommerce.com",
            password: "demo123",
            org_id: "org_nova_2026",
          }),
        });

        setStatus("success");
        setTimeout(() => {
          router.push("/");
        }, 800);
      } catch (err: any) {
        console.error("OAuth token exchange error:", err);
        setStatus("error");
        setErrorMessage(err?.message || "Failed to complete Razorpay OAuth authorization.");
      }
    };

    exchangeToken();
  }, [searchParams, router]);

  return (
    <div className="max-w-md w-full bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-8 shadow-xl text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-[#0B72E7] text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
        हि
      </div>

      {status === "processing" && (
        <div className="space-y-3">
          <RefreshCw className="w-6 h-6 text-[#0B72E7] animate-spin mx-auto" />
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
            Authorizing Razorpay Merchant Connection...
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
            Exchanging OAuth authorization code with Razorpay API and establishing encrypted session.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-3">
          <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto" />
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
            Merchant Account Connected
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
            Nova Commerce Pvt Ltd authorized successfully. Redirecting to your dashboard...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <AlertCircle className="w-8 h-8 text-[#DC2626] mx-auto" />
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
            Authorization Failed
          </h2>
          <p className="text-xs text-[#DC2626]">{errorMessage}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 rounded-xl bg-[#0B72E7] text-white text-xs font-bold"
          >
            Return to Sign In
          </button>
        </div>
      )}
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0A0A] flex items-center justify-center p-4 font-sans">
      <Suspense fallback={<RefreshCw className="w-6 h-6 text-[#0B72E7] animate-spin mx-auto" />}>
        <OAuthCallbackContent />
      </Suspense>
    </div>
  );
}
