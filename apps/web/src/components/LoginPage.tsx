"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Shield, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Mail, 
  User, 
  Users, 
  Key, 
  Sparkles, 
  AlertCircle, 
  FileSpreadsheet,
  Globe,
  Coins,
  ChevronRight,
  Info,
  X
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface LoginPageProps {
  onLoginSuccess: (session: any) => void;
  onClose?: () => void;
  initialMode?: AuthMode;
}

type AuthMode = "SIGN_IN" | "SIGN_UP_STEP_1" | "SIGN_UP_STEP_2" | "ACCEPT_INVITE" | "ONBOARDING_CHECKLIST";

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onClose, initialMode = "SIGN_IN" }) => {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("E-Commerce / Direct-to-Consumer");
  const [orgCountry, setOrgCountry] = useState("India");
  const [orgCurrency, setOrgCurrency] = useState("INR");

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdSession, setCreatedSession] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const inv = params.get("invite");
      if (inv) {
        setInviteToken(inv);
        setAuthMode("ACCEPT_INVITE");
        loadInvitation(inv);
      }
    }
  }, []);

  const loadInvitation = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const details = await fetchApi<any>(`/api/auth/invitations/${token}`);
      setInviteDetails(details);
      setSignUpEmail(details.email || "");
    } catch (err: any) {
      setError("This invitation link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sess = await fetchApi<any>("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({
          email: signInEmail.trim(),
          password: signInPassword.trim(),
        }),
      });
      localStorage.setItem("hisab-auth-session", JSON.stringify(sess));
      onLoginSuccess(sess);
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToOrgStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      setError("Please fill out all required fields.");
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setAuthMode("SIGN_UP_STEP_2");
  };

  const handleCompleteSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setError("Please provide your organization's legal name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sess = await fetchApi<any>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          password: signUpPassword.trim(),
          org_name: orgName.trim(),
          org_type: orgType,
          country: orgCountry,
          currency: orgCurrency,
        }),
      });
      localStorage.setItem("hisab-auth-session", JSON.stringify(sess));
      setCreatedSession(sess);
      setAuthMode("ONBOARDING_CHECKLIST");
    } catch (err: any) {
      setError(err?.message || "Account creation failed. An account with this email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitationSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpPassword.trim()) {
      setError("Please enter your full name and choose a secure password.");
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sess = await fetchApi<any>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          password: signUpPassword.trim(),
          invite_token: inviteToken,
        }),
      });
      localStorage.setItem("hisab-auth-session", JSON.stringify(sess));
      onLoginSuccess(sess);
    } catch (err: any) {
      setError(err?.message || "Failed to accept invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: string) => {
    setLoading(true);
    setError(null);
    try {
      const sess = await fetchApi<any>("/api/auth/demo-signin", {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      localStorage.setItem("hisab-auth-session", JSON.stringify(sess));
      onLoginSuccess(sess);
    } catch (err: any) {
      setError(err?.message || "Demo sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0A0A] text-[#0F172A] dark:text-[#EDEDED] flex flex-col justify-center items-center p-6 font-sans relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors"
          title="Back to Landing Page"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="max-w-xl w-full mx-auto space-y-6">
        
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0B72E7] text-white shadow-lg shadow-blue-500/20 mb-1">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#EDEDED]">
            HISAB
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] max-w-sm mx-auto">
            Payment Gateway Reconciliation & Financial Assurance Control Room
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-[#2A0808] border border-red-200 dark:border-red-900/60 text-[#DC2626] dark:text-red-400 text-xs font-medium flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-7 shadow-sm space-y-5">
          
          {authMode === "SIGN_IN" && (
            <>
              <div className="border-b border-[#E2E8F0] dark:border-[#262626] pb-3.5">
                <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                  Sign In to HISAB
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                  Enter your work email and password. Your organization and role will load automatically.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] pl-9 pr-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setError("Please contact your organization administrator or use demo credentials (demo123).")}
                      className="text-[10px] text-[#0B72E7] dark:text-[#3395FF] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] pl-9 pr-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm disabled:opacity-50"
                >
                  <span>{loading ? "Signing in..." : "Sign In"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#262626] text-center text-xs">
                <span className="text-[#64748B] dark:text-[#A1A1AA]">Don&apos;t have a HISAB account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setAuthMode("SIGN_UP_STEP_1");
                  }}
                  className="font-bold text-[#0B72E7] dark:text-[#3395FF] hover:underline"
                >
                  Create account
                </button>
              </div>
            </>
          )}

          {authMode === "SIGN_UP_STEP_1" && (
            <>
              <div className="border-b border-[#E2E8F0] dark:border-[#262626] pb-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0B72E7] dark:text-[#3395FF]">
                    Step 1 of 2
                  </div>
                  <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                    Create Your Personal Account
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setAuthMode("SIGN_IN");
                  }}
                  className="text-xs text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                >
                  Back to Sign In
                </button>
              </div>

              <form onSubmit={handleProceedToOrgStep} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="e.g. Aarav Mehta"
                      className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] pl-9 pr-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="aarav@company.com"
                      className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] pl-9 pr-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm mt-2"
                >
                  <span>Continue to Organization Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}

          {authMode === "SIGN_UP_STEP_2" && (
            <>
              <div className="border-b border-[#E2E8F0] dark:border-[#262626] pb-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0B72E7] dark:text-[#3395FF]">
                    Step 2 of 2
                  </div>
                  <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                    Create Your Organization
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthMode("SIGN_UP_STEP_1")}
                  className="text-xs text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                >
                  Back
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-[#0B72E7] dark:text-[#3395FF] flex items-start space-x-2">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">You will be the OWNER / ADMINISTRATOR</span>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                    As creator, you will have full governance authority to connect Razorpay, set financial control rules, and invite team members.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCompleteSignUp} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                    Organization Legal Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Nova Commerce Pvt Ltd"
                      className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] pl-9 pr-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                    Business / Industry Type
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                  >
                    <option value="E-Commerce / Direct-to-Consumer">E-Commerce / Direct-to-Consumer</option>
                    <option value="SaaS & Digital Subscriptions">SaaS & Digital Subscriptions</option>
                    <option value="Multi-Vendor Marketplace">Multi-Vendor Marketplace</option>
                    <option value="Enterprise Retail / Omnichannel">Enterprise Retail / Omnichannel</option>
                    <option value="Fintech & Digital Services">Fintech & Digital Services</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                      Operating Country
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={orgCountry}
                        disabled
                        className="w-full bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#64748B] pl-8 pr-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                      Base Currency
                    </label>
                    <div className="relative">
                      <Coins className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={orgCurrency}
                        disabled
                        className="w-full bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#64748B] pl-8 pr-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm mt-2 disabled:opacity-50"
                >
                  <span>{loading ? "Creating organization..." : "Create Organization & Launch"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}

          {authMode === "ACCEPT_INVITE" && (
            <>
              <div className="border-b border-[#E2E8F0] dark:border-[#262626] pb-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#0B72E7] dark:text-[#3395FF]">
                  Team Member Invitation
                </div>
                <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                  Join {inviteDetails?.org_name || "Organization"}
                </h2>
              </div>

              {inviteDetails && (
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161616] border border-[#E2E8F0] dark:border-[#262626] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Invited to:</span>
                    <span className="font-bold text-[#0F172A] dark:text-white">{inviteDetails.org_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Assigned Role:</span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF] text-[11px]">
                      {inviteDetails.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">Invited by:</span>
                    <span className="text-[#0F172A] dark:text-[#EDEDED]">{inviteDetails.invited_by_name}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleAcceptInvitationSignUp} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Deepak Verma"
                    className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                    Work Email (Associated with invite)
                  </label>
                  <input
                    type="email"
                    value={signUpEmail}
                    disabled
                    className="w-full bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#64748B] px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                      Choose Password
                    </label>
                    <input
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED] mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F8FAFC] dark:bg-[#161616] text-[#0F172A] dark:text-[#EDEDED] px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] text-xs"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm mt-2 disabled:opacity-50"
                >
                  <span>{loading ? "Joining organization..." : "Accept Invitation & Enter"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}

          {authMode === "ONBOARDING_CHECKLIST" && createdSession && (
            <>
              <div className="border-b border-[#E2E8F0] dark:border-[#262626] pb-3.5 text-center">
                <div className="inline-flex p-2 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-[#EDEDED]">
                  Welcome to HISAB, {createdSession.name.split(" ")[0]}!
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1">
                  Your organization <span className="font-semibold text-[#0F172A] dark:text-white">{createdSession.org_name}</span> is ready.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-[#0F172A] dark:text-[#EDEDED]">Create personal HISAB account</span>
                  </div>
                  <span className="text-[10px] font-bold text-green-600">DONE</span>
                </div>

                <div className="p-3 rounded-xl bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-[#0F172A] dark:text-[#EDEDED]">Register organization entity</span>
                  </div>
                  <span className="text-[10px] font-bold text-green-600">DONE</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#161616] border border-[#E2E8F0] dark:border-[#262626] flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-4 h-4 rounded-full border-2 border-[#CBD5E1] dark:border-[#404040]" />
                    <span className="font-medium text-[#0F172A] dark:text-[#EDEDED]">Connect Razorpay merchant account</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#64748B]">PENDING</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#161616] border border-[#E2E8F0] dark:border-[#262626] flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-4 h-4 rounded-full border-2 border-[#CBD5E1] dark:border-[#404040]" />
                    <span className="font-medium text-[#0F172A] dark:text-[#EDEDED]">Invite finance & audit team members</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#64748B]">OPTIONAL</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#161616] border border-[#E2E8F0] dark:border-[#262626] flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-4 h-4 rounded-full border-2 border-[#CBD5E1] dark:border-[#404040]" />
                    <span className="font-medium text-[#0F172A] dark:text-[#EDEDED]">Run first financial reconciliation batch</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#64748B]">NEXT</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => onLoginSuccess(createdSession)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Connect Razorpay Account Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLoginSuccess(createdSession)}
                  className="w-full py-2 px-4 rounded-xl bg-transparent hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E] text-[#64748B] dark:text-[#A1A1AA] font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import Merchant CSV Reports Instead</span>
                </button>
              </div>
            </>
          )}

        </div>

        <div className="p-5 rounded-2xl bg-[#F1F5F9]/80 dark:bg-[#121212] border border-[#E2E8F0] dark:border-[#262626] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-[#0B72E7] dark:text-[#3395FF]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#EDEDED]">
                Demo Environment (Hackathon Sandbox)
              </span>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800">
              SEEDED DEMO DATA
            </span>
          </div>

          <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] leading-relaxed">
            Explore HISAB using pre-seeded Nova Commerce Pvt Ltd transactions, 3-tier matcher proofs, and double-loss forensics:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn("ADMIN")}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white dark:bg-[#181818] hover:bg-blue-50 dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E2E2E] text-left transition-all group"
            >
              <div className="text-[10px] font-bold text-[#0B72E7] dark:text-[#3395FF] flex items-center justify-between">
                <span>ADMIN</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="font-semibold text-xs text-[#0F172A] dark:text-[#EDEDED] mt-0.5">Shubham</div>
              <div className="text-[9px] text-[#64748B] dark:text-[#888888] truncate">Full Access & Gates</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn("FINANCE_MANAGER")}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white dark:bg-[#181818] hover:bg-blue-50 dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E2E2E] text-left transition-all group"
            >
              <div className="text-[10px] font-bold text-[#16A34A] dark:text-[#4ADE80] flex items-center justify-between">
                <span>MANAGER</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="font-semibold text-xs text-[#0F172A] dark:text-[#EDEDED] mt-0.5">Rajesh</div>
              <div className="text-[9px] text-[#64748B] dark:text-[#888888] truncate">Checker Approver</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn("ANALYST")}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white dark:bg-[#181818] hover:bg-blue-50 dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E2E2E] text-left transition-all group"
            >
              <div className="text-[10px] font-bold text-[#D97706] dark:text-[#FBBF24] flex items-center justify-between">
                <span>ANALYST</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="font-semibold text-xs text-[#0F172A] dark:text-[#EDEDED] mt-0.5">Priya</div>
              <div className="text-[9px] text-[#64748B] dark:text-[#888888] truncate">Maker & Trace Flow</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn("AUDITOR")}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white dark:bg-[#181818] hover:bg-blue-50 dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E2E2E] text-left transition-all group"
            >
              <div className="text-[10px] font-bold text-[#9333EA] dark:text-[#C084FC] flex items-center justify-between">
                <span>AUDITOR</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="font-semibold text-xs text-[#0F172A] dark:text-[#EDEDED] mt-0.5">Ananya</div>
              <div className="text-[9px] text-[#64748B] dark:text-[#888888] truncate">Read-Only Audit</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
