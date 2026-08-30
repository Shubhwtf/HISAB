"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  AlertTriangle,
  Coins,
  BarChart3,
  Database,
  Sparkles,
  Cpu,
  GitMerge,
  FileCheck,
  Eye,
  Scale,
  Search,
  Users,
  Server,
  Check,
  ExternalLink,
  ChevronRight,
  Play,
  RefreshCw,
  Sliders,
  Activity,
  Terminal,
  Sun,
  Moon,
  Info,
  Building2,
  FileText,
  Clock,
  CheckCheck,
  Flame
} from "lucide-react";

interface LandingPageProps {
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onOpenDocs: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isLoggedIn?: boolean;
  onOpenDashboard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenSignIn,
  onOpenSignUp,
  onOpenDocs,
  isDarkMode,
  onToggleDarkMode,
  isLoggedIn = false,
  onOpenDashboard,
}) => {
  const [activeTraceNode, setActiveTraceNode] = useState<string>("payment");
  const [activePipelineStep, setActivePipelineStep] = useState<number>(4);
  const [isDblLossRevealed, setIsDblLossRevealed] = useState<boolean>(true);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<string>("flow");
  const [activePolicyFilter, setActivePolicyFilter] = useState<"ALL" | "AUTO" | "ESCALATE">("ALL");

  const traceNodes: Record<string, { title: string; subtitle: string; amount: string; status: string; details: { [k: string]: string } }> = {
    order: {
      title: "Merchant Order",
      subtitle: "ORDER_90006 — Enterprise SaaS Tier 3",
      amount: "₹72,000.00",
      status: "Fulfilled",
      details: {
        "Order ID": "order_90006",
        "Customer": "Acme Tech Corp",
        "Gross Value": "₹72,000.00",
        "GST Component (18%)": "₹10,983.05",
        "Created": "2026-08-28 14:32:00 IST",
      },
    },
    payment: {
      title: "Gateway Payment",
      subtitle: "pay_90006 — Corporate Visa Credit Card",
      amount: "₹72,000.00",
      status: "Captured",
      details: {
        "Payment ID": "pay_90006",
        "MDR Fee (2.0%)": "₹1,440.00",
        "GST on Fee (18%)": "₹259.20",
        "Section 194-O TDS (0.1%)": "₹72.00",
        "Net Expected": "₹70,228.80",
      },
    },
    refund: {
      title: "Merchant Refund",
      subtitle: "rfnd_90006 — Customer Return Request",
      amount: "₹72,000.00",
      status: "Processed via Gateway",
      details: {
        "Refund ID": "rfnd_90006",
        "Triggered By": "Billing Support",
        "Reversal Date": "2026-08-29 11:15:22 IST",
        "Gateway ARN": "ARN7729104812",
        "Forensic Note": "Full principal refunded to source card",
      },
    },
    dispute: {
      title: "Bank Chargeback",
      subtitle: "disp_90006 — Issuer Fraud Claim",
      amount: "₹72,000.00",
      status: "Dispute Open",
      details: {
        "Dispute ID": "disp_90006",
        "Issuer Reason": "Fraudulent Unauthorized Charge",
        "Deduction Date": "2026-08-30 09:00:15 IST",
        "Double Loss Risk": "CRITICAL (₹72,000.00 Over-deduction)",
        "Evidence Due": "2026-09-05",
      },
    },
    settlement: {
      title: "Settlement Batch",
      subtitle: "setl_2026_08_28 — Composite Payout",
      amount: "₹1,44,500.00",
      status: "Settled",
      details: {
        "Settlement ID": "setl_2026_08_28",
        "Batch Size": "12 Transactions",
        "Gross Credits": "₹1,48,200.00",
        "Fee & Tax Deductions": "₹3,700.00",
        "Net Payout": "₹1,44,500.00",
      },
    },
    bank: {
      title: "Bank Statement Credit",
      subtitle: "HDFC Corp A/C 9948 — UTR N992817262",
      amount: "₹1,44,500.00",
      status: "Cleared",
      details: {
        "Bank Reference": "TXN_HDFC_99281",
        "UTR Number": "UTRN992817262",
        "Clearance Timestamp": "2026-08-29 06:14:00 IST",
        "Ledger Match": "100% Exact to Settlement Net",
        "Account": "HDFC Current *9948",
      },
    },
  };

  const pipelineStages = [
    { num: 1, title: "Merchant Data", desc: "Ingests raw gateway payouts, order DBs, and bank feeds." },
    { num: 2, title: "Auto Detection", desc: "Identifies delimiters, timestamps, and currency formats." },
    { num: 3, title: "Dynamic Mapping", desc: "Normalizes custom headers into canonical financial models." },
    { num: 4, title: "Immutable Snapshot", desc: "Seals reconciled dataset with cryptographic SHA-256 hash." },
    { num: 5, title: "Tier 1-3 Matching", desc: "Resolves exact keys, constraint fees, and subset-sum batches." },
    { num: 6, title: "Financial Controls", desc: "Evaluates 7-matrix invariants and Section 194-O TDS." },
    { num: 7, title: "Evidence Graph", desc: "Constructs mathematical DAG receipts for every transaction." },
    { num: 8, title: "Safe Resolution", desc: "Auto-resolves bounded items; routes material risks to humans." },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-[#0F172A] dark:text-[#F8FAFC] font-sans antialiased selection:bg-[#0B72E7] selection:text-white transition-colors duration-200">
      
      {/* ── STICKY TOP NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#27272A] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <a href="#" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#0B72E7] text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                H
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-[#0F172A] dark:text-white">
                  HISAB
                </span>
                <span className="text-[9px] font-semibold text-[#0B72E7] uppercase tracking-wider -mt-1">
                  Finance Controller
                </span>
              </div>
            </a>

            <nav className="hidden md:flex items-center space-x-1">
              <a href="#how-it-works" className="px-3 py-1.5 text-xs font-semibold text-[#475569] dark:text-[#A1A1AA] hover:text-[#0B72E7] dark:hover:text-white rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors">
                How It Works
              </a>
              <a href="#follow-money" className="px-3 py-1.5 text-xs font-semibold text-[#475569] dark:text-[#A1A1AA] hover:text-[#0B72E7] dark:hover:text-white rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors">
                Money Flow
              </a>
              <a href="#double-loss" className="px-3 py-1.5 text-xs font-semibold text-[#475569] dark:text-[#A1A1AA] hover:text-[#0B72E7] dark:hover:text-white rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors">
                Double-Loss
              </a>
              <a href="#controls" className="px-3 py-1.5 text-xs font-semibold text-[#475569] dark:text-[#A1A1AA] hover:text-[#0B72E7] dark:hover:text-white rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors">
                Controls
              </a>
              <a href="#security" className="px-3 py-1.5 text-xs font-semibold text-[#475569] dark:text-[#A1A1AA] hover:text-[#0B72E7] dark:hover:text-white rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors">
                Security
              </a>
              <a href="/docs" onClick={(e) => { e.preventDefault(); onOpenDocs(); }} className="px-3 py-1.5 text-xs font-semibold text-[#475569] dark:text-[#A1A1AA] hover:text-[#0B72E7] dark:hover:text-white rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors">
                Docs
              </a>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {isLoggedIn ? (
              <button
                onClick={onOpenDashboard}
                className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#0B72E7] text-white hover:bg-[#095bc2] shadow-sm shadow-blue-500/20 transition-all hover:shadow-md"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={onOpenSignIn}
                  className="px-3.5 py-2 text-xs font-semibold text-[#334155] dark:text-[#E4E4E7] hover:text-[#0B72E7] dark:hover:text-white rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#18181B] transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenSignUp}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#0B72E7] text-white hover:bg-[#095bc2] shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:scale-[1.02]"
                >
                  <span>Start with HISAB</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-[#F8FAFC]/80 via-white to-white dark:from-[#09090B] dark:via-[#0E0E11] dark:to-[#09090B]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0B72E70A_1px,transparent_1px),linear-gradient(to_bottom,#0B72E70A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0B72E7]/10 border border-[#0B72E7]/20 text-[#0B72E7] text-[11px] font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#0B72E7] animate-pulse"></span>
              <span>Built for modern merchant payment operations</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#0F172A] dark:text-white leading-[1.1]">
              Know Where Every <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B72E7] via-[#2563EB] to-[#38BDF8]">
                Rupee Went.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#475569] dark:text-[#A1A1AA] leading-relaxed max-w-2xl mx-auto">
              HISAB automatically reconciles payments, settlements, refunds, and chargebacks, detects financial exceptions, and gives your finance team the evidence to act with confidence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenSignUp}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0B72E7] text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:bg-[#095bc2] hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
              >
                <span>Start with HISAB</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenDocs}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-[#18181B] text-[#0F172A] dark:text-[#F8FAFC] text-sm font-bold border border-[#E2E8F0] dark:border-[#27272A] hover:bg-[#F8FAFC] dark:hover:bg-[#202024] transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <FileText className="w-4 h-4 text-[#0B72E7]" />
                <span>Explore Documentation</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-center space-x-6 text-xs text-[#64748B] dark:text-[#71717A]">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Deterministic integer math</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Section 194-O TDS compliant</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>SHA-256 Sealed Audit Ledger</span>
              </span>
            </div>
          </div>

          {/* ── HERO PRODUCT VISUALIZATION ── */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="relative rounded-2xl bg-white dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] shadow-2xl p-6 sm:p-8 overflow-hidden">
              <div className="flex items-center justify-between pb-6 border-b border-[#E2E8F0] dark:border-[#27272A]">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#64748B] dark:text-[#A1A1AA]">
                    HISAB // FORENSIC RECONCILIATION ENGINE // BATCH #SETTLEMENT_2026_08_28
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  REAL-TIME PIPELINE ACTIVE
                </span>
              </div>

              {/* FLOW CANVAS */}
              <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                
                {/* Node 1: Payment */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] relative group hover:border-[#0B72E7] transition-all">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] dark:text-[#A1A1AA]">
                    <span>PAYMENT</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">CAPTURED</span>
                  </div>
                  <div className="mt-2 font-mono text-xl font-bold text-[#0F172A] dark:text-white">
                    ₹72,000.00
                  </div>
                  <div className="mt-1 text-[11px] text-[#64748B] dark:text-[#A1A1AA] truncate">
                    pay_90006 (Visa Card)
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#27272A] text-[10px] text-[#64748B] dark:text-[#A1A1AA] flex justify-between">
                    <span>MDR: ₹1,440.00</span>
                    <span>TDS: ₹72.00</span>
                  </div>
                </div>

                {/* Node 2: The Fork (Refund + Dispute) */}
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border-2 border-red-500/30 relative">
                  <div className="flex items-center justify-between text-[11px] font-mono text-red-600 dark:text-red-400 font-bold">
                    <span>CONCURRENT OUTFLOW</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="text-[11px] font-mono bg-white dark:bg-[#18181B] p-1.5 rounded border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300">
                      <div className="flex justify-between">
                        <span>Refund:</span>
                        <span className="font-bold">₹72,000.00</span>
                      </div>
                      <span className="text-[9px] text-[#64748B]">rfnd_90006 (Gateway)</span>
                    </div>
                    <div className="text-[11px] font-mono bg-white dark:bg-[#18181B] p-1.5 rounded border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300">
                      <div className="flex justify-between">
                        <span>Dispute:</span>
                        <span className="font-bold">₹72,000.00</span>
                      </div>
                      <span className="text-[9px] text-[#64748B]">disp_90006 (Bank Hold)</span>
                    </div>
                  </div>
                </div>

                {/* Node 3: Signature Double Loss Alert */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                      <Shield className="w-3.5 h-3.5" />
                      <span>DOUBLE LOSS FLAGGED</span>
                    </div>
                    <div className="mt-2 font-mono text-xl font-bold text-red-600 dark:text-red-400">
                      ₹72,000.00
                    </div>
                    <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                      Concurrent refund and dispute on single payment.
                    </p>
                  </div>
                  <a
                    href="#double-loss"
                    className="mt-3 inline-flex items-center justify-center space-x-1 w-full py-1.5 text-[11px] font-mono font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow transition-colors"
                  >
                    <span>PROVE IT</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                {/* Node 4: Settlement & Bank */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] relative">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] dark:text-[#A1A1AA]">
                    <span>BANK CLEARANCE</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">RECONCILED</span>
                  </div>
                  <div className="mt-2 font-mono text-xl font-bold text-[#0F172A] dark:text-white">
                    ₹1,44,500.00
                  </div>
                  <div className="mt-1 text-[11px] text-[#64748B] dark:text-[#A1A1AA] truncate">
                    UTR: N992817262 (HDFC)
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#27272A] text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCheck className="w-3 h-3" />
                    <span>Subset-sum matched 12 txns</span>
                  </div>
                </div>

              </div>

              {/* FOOTER BAR */}
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#27272A] flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B] dark:text-[#A1A1AA]">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>1,000 Records Matched</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>1 Double-Loss Exception</span>
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#94A3B8]">
                  SHA-256: 7f3b89e...d4081c
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 1 — THE PROBLEM ── */}
      <section id="problem" className="py-20 bg-white dark:bg-[#09090B] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold tracking-wider text-[#0B72E7] uppercase">
              The Merchant Reality
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Your payments don&apos;t arrive as neatly as they leave.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#475569] dark:text-[#A1A1AA]">
              Customers checkout individually. But payment aggregators settle transactions in composite, bulk batches with deduction adjustments for MDR fees, GST, refunds, chargeback reserves, and Section 194-O TDS.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { q: "What was paid?", sub: "Gross payments across UPI, cards, and netbanking.", icon: Coins },
              { q: "What was refunded?", sub: "Gateway refunds vs customer returns and cancellations.", icon: RefreshCw },
              { q: "What was settled?", sub: "Lump-sum settlement payouts with aggregated fee deductions.", icon: Layers },
              { q: "What reached the bank?", sub: "UTR clearance lines on your corporate bank statement.", icon: Building2 },
              { q: "What remains unexplained?", sub: "Fee creeping, phantom chargebacks, and double losses.", icon: AlertTriangle, alert: true },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  item.alert
                    ? "bg-red-50/50 dark:bg-red-950/10 border-red-300 dark:border-red-900/50"
                    : "bg-[#F8FAFC] dark:bg-[#111113] border-[#E2E8F0] dark:border-[#27272A] hover:border-[#0B72E7]"
                }`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-[#0B72E7] shadow-sm">
                  <item.icon className="w-4 h-4" />
                </div>
                <h3 className={`mt-4 text-sm font-bold ${item.alert ? "text-red-700 dark:text-red-400" : "text-[#0F172A] dark:text-white"}`}>
                  {item.q}
                </h3>
                <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#A1A1AA] leading-relaxed">
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — HOW HISAB WORKS ── */}
      <section id="how-it-works" className="py-20 bg-[#F8FAFC] dark:bg-[#0E0E11] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold tracking-wider text-[#0B72E7] uppercase">
              End-to-End Pipeline
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              An auditable financial control loop from report to ledger.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#475569] dark:text-[#A1A1AA]">
              Every step is deterministic, sealed cryptographically, and verified by mathematical invariants.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pipelineStages.map((stage) => {
              const isSelected = activePipelineStep === stage.num;
              return (
                <div
                  key={stage.num}
                  onClick={() => setActivePipelineStep(stage.num)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-white dark:bg-[#18181B] border-[#0B72E7] shadow-lg shadow-blue-500/10 ring-2 ring-[#0B72E7]/20"
                      : "bg-white/60 dark:bg-[#111113]/60 border-[#E2E8F0] dark:border-[#27272A] hover:bg-white dark:hover:bg-[#18181B]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      isSelected ? "bg-[#0B72E7] text-white" : "bg-[#F1F5F9] dark:bg-[#27272A] text-[#64748B] dark:text-[#A1A1AA]"
                    }`}>
                      0{stage.num}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-[#0B72E7] rotate-90" : "text-[#94A3B8]"}`} />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-[#0F172A] dark:text-white">
                    {stage.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#64748B] dark:text-[#A1A1AA] leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — FOLLOW EVERY RUPEE (INTERACTIVE MONEY TRACE) ── */}
      <section id="follow-money" className="py-20 bg-white dark:bg-[#09090B] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="max-w-2xl">
              <span className="text-xs font-bold tracking-wider text-[#0B72E7] uppercase">
                Interactive Money Flow
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                Follow every rupee across every lifecycle stage.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#475569] dark:text-[#A1A1AA]">
                Click any lifecycle node below to inspect canonical ledger records, calculation receipts, and cryptographic linkages.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#F1F5F9] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-[#64748B] dark:text-[#A1A1AA]">
                Selected Node: <strong className="text-[#0B72E7] uppercase">{activeTraceNode}</strong>
              </span>
            </div>
          </div>

          {/* INTERACTIVE GRAPH CANVAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* NODES COLUMN */}
            <div className="lg:col-span-5 space-y-2.5">
              {Object.entries(traceNodes).map(([key, data]) => {
                const isActive = activeTraceNode === key;
                return (
                  <div
                    key={key}
                    onClick={() => setActiveTraceNode(key)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isActive
                        ? "bg-[#0B72E7]/10 dark:bg-[#0B72E7]/20 border-[#0B72E7] shadow-sm"
                        : "bg-[#F8FAFC] dark:bg-[#111113] border-[#E2E8F0] dark:border-[#27272A] hover:border-[#0B72E7]/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${isActive ? "bg-[#0B72E7]" : "bg-[#94A3B8]"}`}></div>
                      <div>
                        <div className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center space-x-2">
                          <span>{data.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            data.status.includes("Open") || data.status.includes("Risk")
                              ? "bg-red-500/10 text-red-500"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {data.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] font-mono mt-0.5">
                          {data.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-[#0F172A] dark:text-white">
                      {data.amount}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DETAIL INSPECTION DOSSIER */}
            <div className="lg:col-span-7">
              <div className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#27272A]">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#0B72E7] font-bold">
                        Traceability Dossier
                      </span>
                      <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                        {traceNodes[activeTraceNode].title}
                      </h3>
                    </div>
                    <span className="font-mono text-lg font-bold text-[#0F172A] dark:text-white">
                      {traceNodes[activeTraceNode].amount}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                    {Object.entries(traceNodes[activeTraceNode].details).map(([k, v]) => (
                      <div key={k} className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A]">
                        <div className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] uppercase">
                          {k}
                        </div>
                        <div className={`text-xs font-bold mt-0.5 truncate ${
                          v.includes("CRITICAL") ? "text-red-500 font-black" : "text-[#0F172A] dark:text-white"
                        }`}>
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0B72E7] shrink-0 mt-0.5" />
                    <span>
                      Cryptographic edge verified: Node connects to upstream Order and downstream Bank Transaction with zero untracked paise.
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#27272A] flex items-center justify-between text-xs text-[#64748B] dark:text-[#A1A1AA]">
                  <span>Evidence Hash: <code className="text-[#0B72E7]">sha256:4a88f...10b</code></span>
                  <button onClick={onOpenDocs} className="text-[#0B72E7] font-semibold hover:underline flex items-center space-x-1">
                    <span>Read Trace Protocol</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — SIGNATURE DOUBLE-LOSS DETECTION ── */}
      <section id="double-loss" className="py-20 bg-[#09090B] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <span className="text-xs font-bold tracking-wider text-red-400 uppercase flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-red-400" />
              <span>Signature Forensic Control</span>
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Some discrepancies aren&apos;t mistakes. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">
                They&apos;re double losses.
              </span>
            </h2>
            <p className="mt-4 text-base text-[#A1A1AA]">
              A merchant issues a legitimate customer refund of ₹72,000. Days later, the customer&apos;s bank files a formal chargeback dispute for the exact same transaction, deducting another ₹72,000. Without unified correlation, merchants lose both the inventory and 2x the cash.
            </p>
          </div>

          {/* FORENSIC COMPARISON CARD */}
          <div className="mt-12 rounded-2xl bg-[#111113] border border-red-500/30 p-6 sm:p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A]">
                <span className="text-[11px] font-mono text-[#A1A1AA]">STEP 1: ORIGINAL SALE</span>
                <div className="mt-2 font-mono text-2xl font-bold text-white">₹72,000.00</div>
                <p className="mt-1 text-xs text-[#A1A1AA]">Customer paid for enterprise subscription.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#18181B] border border-red-900/50">
                <span className="text-[11px] font-mono text-red-400 font-bold">STEP 2: CONCURRENT OUTFLOW</span>
                <div className="mt-2 font-mono text-2xl font-bold text-red-400">₹1,44,000.00</div>
                <p className="mt-1 text-xs text-[#A1A1AA]">₹72,000 Refund + ₹72,000 Dispute.</p>
              </div>

              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/50 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-mono text-red-300 font-bold">NET COMMERCIAL EXPOSURE</span>
                  <div className="mt-2 font-mono text-2xl font-bold text-red-400">-₹72,000.00</div>
                  <p className="mt-1 text-xs text-red-200">Double payout on single order.</p>
                </div>
              </div>

            </div>

            <div className="mt-6 pt-6 border-t border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-[#A1A1AA]">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>HISAB correlates gateway ARN with issuer dispute ARN to block fraudulent duplicates.</span>
              </div>
              <button
                onClick={onOpenSignUp}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg transition-colors flex items-center space-x-1.5"
              >
                <span>See How HISAB Proves It</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — AI WITH GUARDRAILS ── */}
      <section id="ai-guardrails" className="py-20 bg-white dark:bg-[#09090B] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="text-xs font-bold tracking-wider text-[#0B72E7] uppercase">
                Hybrid Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white leading-tight">
                AI explains ambiguity. <br />
                <span className="text-[#0B72E7]">Rules control money.</span>
              </h2>
              <p className="text-base text-[#475569] dark:text-[#A1A1AA] leading-relaxed">
                We believe financial software must never permit an unconstrained LLM to invent numbers, overwrite general ledgers, or bypass maker-checker governance.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { title: "Deterministic Integer Arithmetic", desc: "All money calculations use minor units (paise) with zero floating-point drift." },
                  { title: "Hard Invariant Policy Gates", desc: "Auto-resolutions are strictly bounded by merchant materiality thresholds." },
                  { title: "Mathematical Evidence Graph", desc: "Every AI hypothesis must be validated against directed acyclic graph receipts." },
                  { title: "Grounded Root-Cause Explanations", desc: "AI synthesizes clear plain-language rationales backed by raw transaction IDs." },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">{item.title}</h4>
                      <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm font-mono text-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#27272A]">
                <span className="text-[#0B72E7] font-bold">// AI_CONTROLLER_DECISION_ENGINE</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">STRICT_POLICY_ACTIVE</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A]">
                  <span className="text-[#64748B]">// Input Candidate</span>
                  <div className="text-[#0F172A] dark:text-white mt-1">Payment: pay_90006 (₹72,000) vs Dispute: disp_90006</div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A]">
                  <span className="text-[#64748B]">// Invariant Check 01: Amount Equality</span>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">✓ PASS (7200000 paise == 7200000 paise)</div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A]">
                  <span className="text-[#64748B]">// Policy Gate: Materiality Check</span>
                  <div className="text-amber-600 dark:text-amber-400 font-bold mt-1">⚠ EXCEEDS AUTO-RESOLVE THRESHOLD (₹72,000 &gt; ₹5,000)</div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-[#0B72E7]">
                  <span className="font-bold">// Action: ESCALATE_TO_FINANCE_MANAGER</span>
                  <p className="text-[10px] text-[#475569] dark:text-[#A1A1AA] mt-1 font-sans">
                    Autonomous resolution blocked by Policy Rule G_02. Evidence dossier compiled for Maker-Checker approval.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 6 — PROVE IT EVIDENCE GRAPH ── */}
      <section id="evidence" className="py-20 bg-[#F8FAFC] dark:bg-[#0E0E11] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold tracking-wider text-[#0B72E7] uppercase">
              Mathematical Verification
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Don&apos;t trust a confidence score. Follow the evidence.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#475569] dark:text-[#A1A1AA]">
              Every material exception comes with the exact records, UTR references, calculation formulas, and rules used to reach the conclusion.
            </p>
          </div>

          <div className="mt-12 rounded-2xl bg-white dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#27272A]">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#0F172A] dark:text-white">
                <FileCheck className="w-4 h-4 text-[#0B72E7]" />
                <span>EVIDENCE_GRAPH // CASE #EXC_90006</span>
              </div>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#A1A1AA]">
                STATUS: EVIDENCE SEALED
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-xs">
              {[
                { label: "1. Order", id: "order_90006", val: "₹72,000", tag: "GST 18%" },
                { label: "2. Payment", id: "pay_90006", val: "₹72,000", tag: "MDR 2%" },
                { label: "3. Refund", id: "rfnd_90006", val: "₹72,000", tag: "Gateway ARN" },
                { label: "4. Dispute", id: "disp_90006", val: "₹72,000", tag: "Issuer Hold" },
                { label: "5. Settlement", id: "setl_2026_08_28", val: "₹1,44,500", tag: "UTR Cleared" },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-center">
                  <div className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] uppercase">{item.label}</div>
                  <div className="text-xs font-bold text-[#0F172A] dark:text-white mt-1">{item.val}</div>
                  <div className="text-[10px] text-[#0B72E7] mt-0.5 truncate">{item.id}</div>
                  <span className="mt-2 inline-block text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] text-xs space-y-2">
              <div className="font-bold text-[#0F172A] dark:text-white flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-[#0B72E7]" />
                <span>Forensic Conclusion</span>
              </div>
              <p className="text-[#64748B] dark:text-[#A1A1AA] text-xs leading-relaxed">
                Payment <code>pay_90006</code> was credited to merchant in settlement <code>setl_2026_08_28</code>. Merchant subsequently issued full refund <code>rfnd_90006</code>. Simultaneously, issuing bank placed a dispute hold <code>disp_90006</code>. HISAB confirms a ₹72,000 over-exposure and recommends submitting refund proof to bank to release dispute reserve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7 — FROM EXCEPTION TO ACTION ── */}
      <section id="action" className="py-20 bg-white dark:bg-[#09090B] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold tracking-wider text-[#0B72E7] uppercase">
              Governance & Approvals
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Not every decision should be automated.
            </h2>
            <p className="mt-4 text-base text-[#475569] dark:text-[#A1A1AA]">
              HISAB categorizes financial anomalies with mathematical honesty: automatically clearing benign rounding tolerances while escalating commercial risks to human finance leaders.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#111113] border border-emerald-500/30">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>LOW RISK (&lt; ₹500)</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-[#0F172A] dark:text-white">
                Safe Auto-Resolution
              </h3>
              <p className="mt-2 text-xs text-[#64748B] dark:text-[#A1A1AA] leading-relaxed">
                Minor rounding variances on MDR fees, sub-rupee GST fraction mismatches, and confirmed timing differences are auto-cleared into journal buffers.
              </p>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#27272A] text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                Action: Auto-Resolved &amp; Logged
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#111113] border border-amber-500/30">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>AMBIGUOUS (Timing / Fees)</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-[#0F172A] dark:text-white">
                Maker-Checker Proposed
              </h3>
              <p className="mt-2 text-xs text-[#64748B] dark:text-[#A1A1AA] leading-relaxed">
                Delayed bank UTR clearances or unmapped batch lines are paired with proposed matches for one-click Analyst review and Manager sign-off.
              </p>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#27272A] text-[11px] font-mono text-amber-600 dark:text-amber-400">
                Action: Route to Inbox for Sign-off
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-500/40">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>CRITICAL EXPOSURE</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-red-700 dark:text-red-400">
                Mandatory Escalation
              </h3>
              <p className="mt-2 text-xs text-[#64748B] dark:text-[#A1A1AA] leading-relaxed">
                Double losses, missing bank credits &gt; ₹5,000, and Section 194-O TDS breaches trigger automated alerts with evidence dossiers for Executive approval.
              </p>
              <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-900/40 text-[11px] font-mono text-red-600 dark:text-red-400 font-bold">
                Action: Freeze Payout &amp; Escalate
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 8 — REAL-TIME CONTROL ROOM PREVIEW ── */}
      <section id="controls" className="py-20 bg-[#F8FAFC] dark:bg-[#0E0E11] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#0B72E7] uppercase">
                Control Center
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                Live Financial Control Room
              </h2>
            </div>
            <div className="mt-3 md:mt-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold border border-amber-500/20">
                ● ILLUSTRATIVE DEMO METRICS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm">
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA]">Reconciliation Rate</span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">99.8%</div>
              <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-1 block">Tier 1-3 algorithmic matching</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm">
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA]">Unresolved Exposure</span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">₹72,000</div>
              <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-1 block">1 material exception pending</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm">
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA]">Gross Reconciled</span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white">₹1.48 Cr</div>
              <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-1 block">Current monthly batch volume</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm">
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA]">Cryptographic Chain</span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-[#0B72E7]">100% PASS</div>
              <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-1 block">SHA-256 tamper-proof ledger</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 9 — DATA SOURCES ── */}
      <section id="sources" className="py-20 bg-white dark:bg-[#09090B] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold tracking-wider text-[#0B72E7] uppercase">
              Universal Ingestion
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Bring your merchant reports together.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#475569] dark:text-[#A1A1AA]">
              Connect your payment platform when credentials are configured, or import CSV, TSV, and Excel reports directly with automatic schema detection.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center font-mono text-xs">
            {[
              "Gateway Payments",
              "Settlement Payouts",
              "Bank Statements",
              "Customer Refunds",
              "Chargeback Disputes",
              "Section 194-O TDS",
            ].map((name, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A]">
                <Database className="w-5 h-5 mx-auto text-[#0B72E7] mb-2" />
                <span className="font-bold text-[#0F172A] dark:text-white">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 10 — ENTERPRISE SECURITY ── */}
      <section id="security" className="py-20 bg-[#F8FAFC] dark:bg-[#0E0E11] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold tracking-wider text-[#0B72E7] uppercase">
              Enterprise Governance
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              Bank-grade security and organizational isolation.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Tenant Isolation", desc: "Every job, ledger entry, and transaction belongs strictly to its organization in PostgreSQL.", icon: Building2 },
              { title: "Role-Based RBAC", desc: "Distinct access tiers: Admin, Finance Manager, Analyst, and Auditor.", icon: Users },
              { title: "Immutable Snapshots", desc: "Reconciliation runs are sealed into immutable historical snapshots.", icon: Lock },
              { title: "Maker-Checker Controls", desc: "Material adjustments require multi-eye approval before ledger commitment.", icon: Shield },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-[#111113] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#0B72E7]/10 text-[#0B72E7] flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#0F172A] dark:text-white">{item.title}</h3>
                <p className="mt-1.5 text-xs text-[#64748B] dark:text-[#A1A1AA] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 11 — DOCUMENTATION CALLOUT ── */}
      <section className="py-16 bg-white dark:bg-[#09090B] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#111116] dark:to-[#181824] border border-[#0B72E7]/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#0B72E7] uppercase tracking-wider">
                Engineering &amp; Compliance Hub
              </span>
              <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white">
                Explore the complete HISAB technical documentation.
              </h3>
              <p className="text-sm text-[#475569] dark:text-[#A1A1AA] max-w-xl">
                Read in-depth guides on the Seven Financial Controls, Section 194-O TDS rules, double-loss detection math, and REST API schemas.
              </p>
            </div>
            <button
              onClick={onOpenDocs}
              className="px-6 py-3 rounded-xl bg-[#0B72E7] hover:bg-[#095bc2] text-white font-bold text-xs shadow-md transition-all whitespace-nowrap flex items-center space-x-2"
            >
              <span>View Technical Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION 12 — FINAL CTA ── */}
      <section className="py-20 bg-[#F8FAFC] dark:bg-[#0E0E11] border-t border-[#E2E8F0] dark:border-[#27272A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#0F172A] dark:text-white">
            Stop asking where the mismatch is. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B72E7] to-[#38BDF8]">
              Start knowing why.
            </span>
          </h2>
          <p className="text-base text-[#475569] dark:text-[#A1A1AA] max-w-xl mx-auto">
            HISAB turns payment reconciliation into an explainable, auditable financial control loop.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenSignUp}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0B72E7] text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:bg-[#095bc2] hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
            >
              <span>Start with HISAB</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenDocs}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-[#18181B] text-[#0F172A] dark:text-[#F8FAFC] text-sm font-bold border border-[#E2E8F0] dark:border-[#27272A] hover:bg-[#F8FAFC] dark:hover:bg-[#202024] transition-all"
            >
              Read the Documentation
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 bg-white dark:bg-[#09090B] border-t border-[#E2E8F0] dark:border-[#27272A] text-xs text-[#64748B] dark:text-[#71717A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-[#0B72E7] text-white flex items-center justify-center font-bold text-xs">
              H
            </div>
            <span className="font-bold text-[#0F172A] dark:text-white">HISAB Finance Controller</span>
            <span>—</span>
            <span>Follow every rupee. Explain every mismatch.</span>
          </div>

          <div className="flex items-center space-x-6">
            <a href="/docs" onClick={(e) => { e.preventDefault(); onOpenDocs(); }} className="hover:text-[#0B72E7] transition-colors">Documentation</a>
            <a href="#how-it-works" className="hover:text-[#0B72E7] transition-colors">Architecture</a>
            <a href="#security" className="hover:text-[#0B72E7] transition-colors">Security</a>
            <span>&copy; {new Date().getFullYear()} HISAB Platform</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
