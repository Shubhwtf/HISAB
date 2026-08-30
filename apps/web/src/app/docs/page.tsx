"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Search, 
  Sun, 
  Moon, 
  LayoutDashboard, 
  Zap, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Calculator, 
  Scale, 
  Sparkles, 
  Users, 
  Code2, 
  Copy, 
  Check, 
  ChevronRight, 
  Send, 
  Terminal, 
  Database, 
  Lock, 
  ArrowRight,
  X,
  Compass,
  Activity,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Shield,
  ArrowUpRight,
  MessageSquare,
  Sliders,
  AlertOctagon
} from "lucide-react";
import { MermaidViewer } from "@/components/MermaidViewer";
import { FormattedMarkdown } from "@/components/FormattedMarkdown";
import { fetchApi } from "@/lib/api";

interface DocItem {
  id: string;
  title: string;
  icon: any;
  summary: string;
  anchors: Array<{ id: string; label: string }>;
}

interface SectionItem {
  id: string;
  label: string;
  icon: any;
  categoryName: string;
  docs: DocItem[];
}

export default function DocsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("intro");
  const [activeDocId, setActiveDocId] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [docQuery, setDocQuery] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "### HISAB Documentation AI\nAutonomous technical documentation and architecture assistant with full context across all HISAB specifications, formulas, continuous controls, algorithms, and APIs.",
    },
  ]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, docLoading]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendDocQuery = async (customQ?: string) => {
    const qText = customQ || docQuery;
    if (!qText.trim()) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: qText }]);
    if (!customQ) setDocQuery("");
    setDocLoading(true);

    try {
      const res = await fetchApi<any>("/api/ask-hisab", {
        method: "POST",
        body: JSON.stringify({ query: qText, mode: "docs" }),
      });
      setChatMessages((prev) => [...prev, { sender: "ai", text: res.answer }]);
    } catch (e) {
      console.error(e);
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Unable to reach HISAB intelligence gateway. Ensure the FastAPI backend is running on port 8000." },
      ]);
    } finally {
      setDocLoading(false);
    }
  };

  const sections: SectionItem[] = [
    {
      id: "intro",
      label: "Introduction",
      icon: BookOpen,
      categoryName: "GETTING STARTED",
      docs: [
        { id: "overview", title: "Overview & Mission", icon: BookOpen, summary: "The multi-billion dollar reconciliation problem and HISAB mission", anchors: [{ id: "problem-statement", label: "Reconciliation Blindspot" }, { id: "failure-modes", label: "Systemic Failure Modes" }, { id: "hisab-mission", label: "The HISAB Solution" }] },
        { id: "ledgers", title: "4-Way Ledgers & Rules", icon: ShieldCheck, summary: "Orders, Payments, Settlements, and Bank Statement ledgers", anchors: [{ id: "four-ledgers", label: "The 4-Way Ledger Model" }, { id: "core-capabilities", label: "Continuous Guardrails" }] },
        { id: "money-trail", title: "4-Way Money Trail Flow", icon: Activity, summary: "Real-time money journey from customer checkout to bank credit", anchors: [{ id: "flow-diagram", label: "End-to-End Flowchart" }, { id: "lifecycle-breakdown", label: "Lifecycle Stage Breakdown" }] },
        { id: "quickstart", title: "60-Second Quickstart", icon: Zap, summary: "Local development setup, gateway verification, and health checks", anchors: [{ id: "local-startup", label: "Local Environment Startup" }, { id: "health-verification", label: "Gateway Verification" }] },
        { id: "razorpay-ingest", title: "Razorpay Webhook Rail", icon: Terminal, summary: "Subscribing to payment, settlement, and dispute webhooks", anchors: [{ id: "webhook-setup", label: "Endpoint Setup" }, { id: "events", label: "Supported Events & Payloads" }, { id: "signature-verify", label: "HMAC Verification & Security" }] },
        { id: "env-config", title: "Environment Configuration", icon: Database, summary: "Database, Redis, Groq AI, and Razorpay secrets", anchors: [{ id: "env-vars", label: "Core Variables & Secrets" }, { id: "redis-cache", label: "Redis Caching & Lock Topology" }] },
      ],
    },
    {
      id: "architecture",
      label: "Architecture",
      icon: Layers,
      categoryName: "ARCHITECTURE & ENGINES",
      docs: [
        { id: "working", title: "Internal Working Pipeline", icon: Layers, summary: "Event ingestion to Merkle cryptographic sealing", anchors: [{ id: "pipeline", label: "Event Pipeline Flow" }, { id: "state-lifecycle", label: "State Transition Machine" }, { id: "event-driven", label: "Event Ingestion & Idempotency" }] },
        { id: "engine", title: "3-Tier Matcher Engine", icon: Compass, summary: "Exact ID, Window Heuristic, and Subset-Sum Knapsack", anchors: [{ id: "tier1", label: "Tier 1: Exact Match (0.14ms)" }, { id: "tier2", label: "Tier 2: Window Match (1.82ms)" }, { id: "tier3", label: "Tier 3: Subset-Sum Knapsack (8.4ms)" }, { id: "benchmark", label: "Throughput Benchmarks" }] },
        { id: "invariants", title: "Mathematical Invariants", icon: Lock, summary: "Strict zero-tolerance minor unit assertions", anchors: [{ id: "proof-formulas", label: "Net Settlement Formula" }, { id: "zero-drift", label: "Zero-Tolerance Paise Proof" }, { id: "merkle-proof", label: "Merkle Tree Batch Sealing" }] },
        { id: "idempotency-engine", title: "Redis Idempotency & Resilience", icon: Zap, summary: "Distributed mutex locks, replay attack defense, and crash recovery", anchors: [{ id: "distributed-locks", label: "Distributed Mutex Locks" }, { id: "dedup-gate", label: "Webhook Deduplication Gate" }, { id: "crash-recovery", label: "Crash Recovery & Replay" }] },
      ],
    },
    {
      id: "governance",
      label: "Governance",
      icon: Users,
      categoryName: "GOVERNANCE & AUDIT",
      docs: [
        { id: "collaboration", title: "Maker-Checker Dual Control", icon: Users, summary: "Four-Eyes Principle, draft workflows, and supervisor sign-offs", anchors: [{ id: "four-eyes", label: "The Four-Eyes Principle" }, { id: "maker-flow", label: "Maker Action & Packaging" }, { id: "checker-review", label: "Supervisor Review & Sign-off" }] },
        { id: "audit-trail", title: "Cryptographic Audit Ledger", icon: Lock, summary: "Append-only SHA-256 hash chains and statutory auditor assurance", anchors: [{ id: "append-only", label: "Append-Only Hash Chain" }, { id: "statutory-compliance", label: "Auditor Assurance" }, { id: "tamper-evident", label: "Tamper Verification" }] },
        { id: "access-roles", title: "Role-Based Access Control", icon: ShieldCheck, summary: "Four-tier role matrix, least-privilege policies, and JWT security", anchors: [{ id: "roles-matrix", label: "Four-Tier Role Matrix" }, { id: "least-privilege", label: "Least-Privilege Policy" }, { id: "session-security", label: "JWT Session Security" }] },
        { id: "policy-limits", title: "Thresholds & Write-Off Policies", icon: Sliders, summary: "Materiality bands, automated freezes, and supervisor override rules", anchors: [{ id: "materiality-thresholds", label: "Materiality Bands" }, { id: "override-rules", label: "Supervisor Override Rules" }, { id: "payout-freeze", label: "Automated Payout Freeze" }] },
      ],
    },
    {
      id: "api",
      label: "API",
      icon: Code2,
      categoryName: "API REFERENCE",
      docs: [
        { id: "api-reconcile", title: "Reconciliation Endpoints", icon: Code2, summary: "Run jobs, query summaries, stream timelines, and query records", anchors: [{ id: "post-reconcile", label: "POST /api/reconcile/run" }, { id: "get-summary", label: "GET /api/reconcile/summary" }, { id: "get-timeline", label: "GET /api/reconcile/timeline" }, { id: "get-records", label: "GET /api/reconcile/records" }] },
        { id: "api-controls", title: "Financial Controls Endpoints", icon: ShieldCheck, summary: "Query control violations, exception inboxes, and double-loss risks", anchors: [{ id: "get-controls-summary", label: "GET /api/controls/summary" }, { id: "get-exceptions", label: "GET /api/controls/exceptions" }, { id: "get-doubleloss", label: "GET /api/controls/double-loss" }] },
        { id: "api-evidence", title: "Evidence & Trace Endpoints", icon: Activity, summary: "Fetch 4-way transaction evidence records and interactive graph data", anchors: [{ id: "get-evidence", label: "GET /api/evidence/{payment_id}" }, { id: "get-graph", label: "GET /api/evidence/graph/{payment_id}" }] },
        { id: "api-audit", title: "Audit & Merkle Proofs Endpoints", icon: Lock, summary: "Immutable audit ledgers and SHA-256 batch proof verification", anchors: [{ id: "get-ledger", label: "GET /api/audit/ledger" }, { id: "get-verify", label: "GET /api/audit/verify/{log_id}" }, { id: "get-merkle", label: "GET /api/audit/merkle-root" }] },
        { id: "api-approvals", title: "Maker-Checker Approvals Endpoints", icon: CheckCircle2, summary: "Submit and review dual-control operational sign-offs", anchors: [{ id: "get-approvals-pending", label: "GET /api/approvals/pending" }, { id: "post-approvals-submit", label: "POST /api/approvals/submit" }] },
        { id: "api-sources", title: "Data Sources & Sync Endpoints", icon: Terminal, summary: "Direct CSV/JSON file ingestion and live Razorpay webhook dispatcher", anchors: [{ id: "post-upload", label: "POST /api/sources/upload" }, { id: "post-sync", label: "POST /api/razorpay/sync" }] },
        { id: "api-reports", title: "Reports & Daily Brief Endpoints", icon: FileText, summary: "Executive finance summaries and PDF dispute evidence generation", anchors: [{ id: "get-daily-brief", label: "GET /api/reports/daily-brief" }, { id: "get-download-pdf", label: "GET /api/reports/download-pdf" }] },
      ],
    },
    {
      id: "mechanics",
      label: "Mechanics",
      icon: Calculator,
      categoryName: "FINANCIAL MECHANICS",
      docs: [
        { id: "mdr", title: "MDR Calculation & Interchange", icon: Calculator, summary: "Minor unit basis point formulas and card interchange", anchors: [{ id: "mdr-formula", label: "Paise Invariant Formula" }, { id: "rate-schedules", label: "Card & UPI Schedules" }, { id: "interchange-cost", label: "Interchange Network Costs" }] },
        { id: "gst", title: "18% GST & GSTR-2B ITC", icon: Scale, summary: "Input Tax Credit claiming and tax invoice matching", anchors: [{ id: "gst-flow", label: "GST Deduction Flowchart" }, { id: "itc-matching", label: "GSTR-2B ITC Matching" }, { id: "gstr2b-reconciliation", label: "Monthly Tax Audit" }] },
        { id: "tds194o", title: "Section 194-O E-Commerce TDS", icon: FileText, summary: "0.10% withholding schedule and Form 26AS matching", anchors: [{ id: "tds-schedule", label: "Statutory Rate (0.10%)" }, { id: "form-26as", label: "Form 26AS / AIS Audit" }, { id: "quarterly-tan-audit", label: "Quarterly TAN Filing" }] },
        { id: "composite-settlements", title: "Net Payout & Batch Decomposition", icon: Layers, summary: "Lump-sum bank transfers and float timeline reconciliation", anchors: [{ id: "net-payout-formula", label: "Net Settlement Equation" }, { id: "batch-manifest", label: "Settlement Batch Manifest" }, { id: "bank-float-timeline", label: "T+2 Bank Float Timeline" }] },
      ],
    },
    {
      id: "controls",
      label: "Controls",
      icon: ShieldCheck,
      categoryName: "CONTINUOUS CONTROLS",
      docs: [
        { id: "controls-overview", title: "7 Core Financial Assertions", icon: ShieldCheck, summary: "Continuous assertions across payments, fees, and banks", anchors: [{ id: "ctl-list", label: "Controls 01 through 07" }, { id: "assertion-matrix", label: "Assertion Verification Matrix" }, { id: "continuous-monitoring", label: "Continuous Audit Loop" }] },
        { id: "controls-deepdive", title: "Control Catalog Deep-Dive", icon: Compass, summary: "Detailed specifications for CTL_01 to CTL_07", anchors: [{ id: "ctl-01-03", label: "CTL_01 to CTL_03 (Ingestion & Fees)" }, { id: "ctl-04-05", label: "CTL_04 to CTL_05 (Banks & TDS)" }, { id: "ctl-06-07", label: "CTL_06 to CTL_07 (Double-Loss & Sealing)" }] },
        { id: "controls-engine", title: "Automated Violation Interceptors", icon: AlertTriangle, summary: "Quarantine routing, exception dispatching, and SLA management", anchors: [{ id: "violation-handling", label: "Violation Interception Pipeline" }, { id: "quarantine-queue", label: "Quarantine Queue Isolation" }, { id: "sla-enforcement", label: "Resolution SLA Timers" }] },
      ],
    },
    {
      id: "forensics",
      label: "Forensics",
      icon: AlertTriangle,
      categoryName: "DOUBLE-LOSS FORENSICS",
      docs: [
        { id: "doubleloss", title: "Double-Loss Exploit Anatomy", icon: AlertTriangle, summary: "Detecting concurrent refund and chargeback vectors", anchors: [{ id: "hazard-vector", label: "Double-Loss Vector" }, { id: "collision-timeline", label: "Timing Attack Mechanics" }, { id: "impact-analysis", label: "Financial Impact Analysis" }] },
        { id: "forensics-fsm", title: "Surveillance State Machine", icon: Activity, summary: "Real-time surveillance FSM and quarantine interceptors", anchors: [{ id: "surveillance-state-machine", label: "Surveillance FSM States" }, { id: "realtime-intercept", label: "Real-time Webhook Intercept" }, { id: "quarantine-lock", label: "Settlement Quarantine Lock" }] },
        { id: "evidence-pack", title: "1-Click Dispute Defense Pack", icon: FileText, summary: "Automated signed PDF dispute packet generation and submission", anchors: [{ id: "evidence-pack", label: "Dispute Defense Bundle" }, { id: "pdf-generator", label: "Signed PDF Engine" }, { id: "razorpay-dispute-api", label: "Razorpay Dispute API Submission" }] },
      ],
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      categoryName: "AI DOCS COPILOT",
      docs: [],
    },
  ];

  const currentSection = sections.find((s) => s.id === activeSectionId) || sections[0];
  const allDocs = sections.flatMap((s) => s.docs.map((d) => ({ ...d, category: s.categoryName, sectionId: s.id })));
  const currentDoc = allDocs.find((d) => d.id === activeDocId) || allDocs[0];

  const handleSelectSection = (sec: SectionItem) => {
    setActiveSectionId(sec.id);
    if (sec.docs.length > 0) {
      setActiveDocId(sec.docs[0].id);
    }
  };

  const handleSelectDoc = (docId: string) => {
    setActiveDocId(docId);
  };

  const filteredDocs = searchQuery.trim()
    ? allDocs.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-[#0A0A0A] text-[#EDEDED]" : "bg-[#FFFFFF] text-[#000000]"} font-sans select-none transition-colors`}>
      <header className="sticky top-0 z-50 h-16 bg-[#0A0A0A] border-b border-[#262626] select-none text-white">
        <div className="w-full max-w-[92rem] mx-auto px-6 lg:px-12 flex items-center justify-between h-full">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity">
              <img src="/logo.svg" alt="HISAB Logo" className="w-7 h-7 rounded-lg object-contain" />
              <span className="font-bold text-white text-[1rem] tracking-tight font-sans">HISAB</span>
            </Link>
            <span className="text-[#444444]">/</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-[1rem] text-[#A1A1AA]">Docs</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#1A1A1A] text-[#EDEDED] border border-[#333333]">
                v1.0.4 Live
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-6 relative">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#71717A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation, formulas, APIs..."
                className="w-full bg-[#141414] hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] border border-[#27272A] focus:border-[#52525B] text-sm text-[#EDEDED] placeholder-[#71717A] pl-9 pr-10 py-2 rounded-xl focus:outline-none transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-[#71717A] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="absolute right-3 top-2.5 px-1.5 py-0.5 text-[10px] font-mono bg-[#27272A] text-[#A1A1AA] rounded border border-[#3F3F46]">
                  ⌘K
                </kbd>
              )}
            </div>

            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#27272A] rounded-2xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto text-sm text-[#111827] dark:text-white space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A1A1AA] px-3 py-1.5 block">
                  Matching Documents ({filteredDocs.length})
                </span>
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => {
                    const Icon = doc.icon;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setActiveSectionId(doc.sectionId);
                          setActiveDocId(doc.id);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#27272A] transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4 text-[#0B72E7]" />
                          <div>
                            <div className="font-semibold text-sm text-[#111827] dark:text-white">{doc.title}</div>
                            <div className="text-xs text-[#6B7280] dark:text-[#A1A1AA]">{doc.category}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-[#6B7280] text-sm">
                    No matching documentation articles found for "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-[#141414] hover:bg-[#27272A] border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors"
              title="Toggle Light / Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
            </button>

            <Link
              href="/"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-sm font-bold shadow-sm transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <nav className="sticky top-16 z-40 bg-[#FAFAFA] dark:bg-[#0E0E0E] border-b border-[#E5E7EB] dark:border-[#262626] select-none">
        <div className="w-full max-w-[92rem] mx-auto px-6 lg:px-12 py-1 flex items-center justify-start gap-3 overflow-hidden text-[0.875rem] font-semibold leading-[1.25rem] tracking-[0px]">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isTabActive = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => handleSelectSection(sec)}
                className={`flex items-center space-x-1.5 px-2 py-1.5 transition-all font-sans relative ${
                  isTabActive
                    ? "text-[#000000] dark:text-[#FFFFFF] font-bold border-b-[2.5px] border-[#000000] dark:border-white"
                    : "text-[#6B7280] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-white border-b-[2.5px] border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isTabActive ? "text-[#0B72E7]" : "text-[#71717A]"}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="w-full max-w-[92rem] mx-auto px-6 lg:px-12 py-8">
        {activeSectionId === "chat" ? (
          <div className="w-full max-w-4xl mx-auto h-[calc(100vh-14rem)] min-h-[580px] bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#262626] rounded-3xl p-6 lg:p-7 shadow-xs flex flex-col overflow-hidden animate-in fade-in">
            <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-4 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B72E7] dark:text-[#3395FF]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#09090B] dark:text-white tracking-tight">
                    Chat with HISAB AI
                  </h1>
                  <p className="text-sm text-[#27272A] dark:text-[#A1A1AA] mt-0.5 font-medium">
                    Autonomous Documentation & Architecture Copilot with full context across all HISAB specifications.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => setChatMessages([chatMessages[0]])}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1A1A1A] text-[#27272A] dark:text-[#A1A1AA] hover:text-red-500 text-xs font-semibold transition-colors cursor-pointer"
                  title="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div
              ref={chatScrollRef}
              className="p-4 lg:p-5 rounded-2xl bg-[#FAFAFA] dark:bg-[#0E0E0E] border border-[#E5E7EB] dark:border-[#262626] space-y-4 flex-1 min-h-0 overflow-y-auto text-[15px] leading-relaxed my-4"
            >
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`p-4 rounded-2xl max-w-[92%] ${
                      msg.sender === "user"
                        ? "bg-[#0B72E7] text-white font-medium rounded-br-none"
                        : "bg-white dark:bg-[#161616] text-[#09090B] dark:text-[#EDEDED] border border-[#E5E7EB] dark:border-[#262626] rounded-bl-none shadow-xs font-normal"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <span>{msg.text}</span>
                    ) : (
                      <FormattedMarkdown content={msg.text} />
                    )}
                  </div>
                </div>
              ))}

              {docLoading && (
                <div className="flex items-center space-x-2 text-sm text-[#27272A] dark:text-[#A1A1AA] p-2">
                  <Sparkles className="w-4 h-4 animate-spin text-[#0B72E7]" />
                  <span>Searching full documentation with Groq AI...</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-3 border-t border-[#E5E7EB] dark:border-[#262626] flex-shrink-0 bg-white dark:bg-[#111111] sticky bottom-0 z-10">
              <input
                type="text"
                value={docQuery}
                onChange={(e) => setDocQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendDocQuery()}
                placeholder="Search documentation, formulas, architecture, or APIs..."
                className="flex-1 bg-[#FAFAFA] dark:bg-[#0E0E0E] text-[15px] px-4 py-3.5 rounded-2xl border border-[#E5E7EB] dark:border-[#262626] text-[#09090B] dark:text-[#EDEDED] focus:outline-none focus:border-[#0B72E7] dark:focus:border-white font-medium placeholder:text-[#71717A] shadow-xs"
              />
              <button
                onClick={() => handleSendDocQuery()}
                disabled={docLoading || !docQuery.trim()}
                className="px-6 py-3.5 rounded-2xl bg-[#0B72E7] hover:bg-[#095ec4] text-white text-[14px] font-semibold flex items-center space-x-2 disabled:opacity-40 shadow-xs transition-colors cursor-pointer flex-shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <aside className="lg:col-span-3 bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#262626] rounded-2xl p-4 shadow-xs space-y-3 sticky top-28 max-h-[82vh] overflow-y-auto">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A1A1AA] px-2.5 block">
                  {currentSection.categoryName}
                </span>
                <div className="space-y-1">
                  {currentSection.docs.map((doc) => {
                    const Icon = doc.icon;
                    const isActive = activeDocId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => handleSelectDoc(doc.id)}
                        style={{
                          fontFamily: '"Inter", "Inter Fallback Arial", Arial',
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          fontStyle: "normal",
                          textDecorationLine: "none",
                          lineHeight: "1.25rem",
                          letterSpacing: "0px",
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left ${
                          isActive
                            ? "bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#000000] dark:text-[#FFFFFF] font-bold border border-slate-300 dark:border-zinc-700 shadow-xs"
                            : "text-[#000000] dark:text-[#E4E4E7] hover:text-black dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#161616]"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#0B72E7]" : "text-[#52525B]"}`} />
                          <span className="truncate">{doc.title}</span>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 text-[#0B72E7]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <main className="lg:col-span-6 space-y-8 bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#262626] rounded-3xl p-6 lg:p-10 shadow-xs text-[15px] leading-relaxed text-[#111827] dark:text-[#D1D5DB]">
              
              {activeDocId === "overview" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>Executive Overview</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Introduction & Platform Mission
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      HISAB is an autonomous financial assertion engine and reconciliation gateway built for high-velocity merchants, payment aggregators, and fintechs. It continuously proves mathematical invariants between customer checkouts, gateway authorizations, settlement batches, and acquiring bank credit statements with zero tolerance for balance drift.
                    </p>
                  </div>

                  <div id="problem-statement" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <BookOpen className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        The Multi-Billion Dollar Reconciliation Blindspot
                      </h3>
                    </div>

                    <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      Every high-growth merchant processing online payments across UPI, Credit Cards, Netbanking, and Wallets suffers from significant financial opacity. Transactions are split across disparate systems: the e-commerce store database, the payment gateway dashboard, settlement reports, and banking portals.
                    </p>
                    <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      Traditional reconciliation relies on manual spreadsheet exports that are executed days or weeks after funds settle. By then, overcharged fees, unrecovered chargebacks, and missing deposits are lost in accounting noise.
                    </p>
                  </div>

                  <div id="failure-modes" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Four Systemic Industry Failure Modes
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-red-600 dark:text-red-400 block text-xs">1. Aggregator Fee Leakage</span>
                        <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Gateways silently deduct interchange spreads, GST surcharges, and gateway fees without transparent transaction-level basis point auditing.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-red-600 dark:text-red-400 block text-xs">2. Double-Loss Hazard Outflows</span>
                        <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          When an operator issues a customer refund while a bank chargeback dispute is simultaneously approved, merchants lose 200%+ of the order value.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-red-600 dark:text-red-400 block text-xs">3. Lumped Composite Deposits</span>
                        <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Bank accounts receive a single net NEFT lump sum (e.g. ₹18,42,110.40) representing 2,000+ orders, making manual line-item tracking impossible.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-red-600 dark:text-red-400 block text-xs">4. IEEE-754 Floating-Point Drift</span>
                        <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Standard software calculates taxes and basis points in floating-point decimals, accumulating rounding errors that trigger statutory audit non-compliance.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div id="hisab-mission" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        The HISAB Autonomous Solution
                      </h3>
                    </div>

                    <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      HISAB replaces reactive batch audits with a proactive, real-time assertion pipeline. Every captured transaction is validated against contractual fee schedules, isolated upon anomaly detection, and cryptographically sealed into an append-only Merkle ledger.
                    </p>
                  </div>
                </article>
              )}

              {activeDocId === "ledgers" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Ledger Topology</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      The 4-Way Ledger Architecture & Capabilities
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      HISAB maintains four synchronized financial ledgers to form a closed-loop accounting model. Any financial variance is isolated to the specific touchpoint where it occurred.
                    </p>
                  </div>

                  <div id="four-ledgers" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                      The Four Core Ledgers
                    </h3>
                    <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      HISAB maintains a strictly typed 4-way ledger model, joining every transaction across the entire lifecycle:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-[#09090B] dark:text-white block">Orders Ledger</span>
                        <p className="text-[#27272A] dark:text-[#A1A1AA] leading-relaxed">Customer checkout cart, GMV, and order timestamps from the merchant shop.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block">Payments Ledger</span>
                        <p className="text-[#27272A] dark:text-[#A1A1AA] leading-relaxed">Razorpay capture payloads, interchange networks, and MDR retentions.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-purple-600 dark:text-purple-400 block">Settlements Ledger</span>
                        <p className="text-[#27272A] dark:text-[#A1A1AA] leading-relaxed">Aggregator payout batches, deductions, adjustments, and UTR records.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">Bank Statement</span>
                        <p className="text-[#27272A] dark:text-[#A1A1AA] leading-relaxed">Actual acquiring bank NEFT/RTGS statement lines with matching UTRs.</p>
                      </div>
                    </div>
                  </div>

                  <div id="core-capabilities" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                      Continuous Guardrails & Capabilities
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block text-xs">Sub-Millisecond 3-Tier Matcher</span>
                        <p className="text-[#27272A] dark:text-[#A1A1AA] leading-relaxed">
                          Exact O(1) matching, multi-constraint window search, and subset-sum dynamic programming knapsack solvers.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block text-xs">Zero-Tolerance Integer Arithmetic</span>
                        <p className="text-[#27272A] dark:text-[#A1A1AA] leading-relaxed">
                          Every value is processed in 64-bit integer paise, guaranteeing zero floating-point accumulation drift.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block text-xs">Automated Double-Loss Blocker</span>
                        <p className="text-[#27272A] dark:text-[#A1A1AA] leading-relaxed">
                          Monitors concurrent refunds and chargeback disputes, freezing unauthorized payouts automatically.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block text-xs">Cryptographic Merkle Proofs</span>
                        <p className="text-[#27272A] dark:text-[#A1A1AA] leading-relaxed">
                          Seals reconciled batches into binary SHA-256 Merkle tree roots for statutory auditor validation.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "money-trail" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Activity className="w-4 h-4" />
                      <span>Money Trail Architecture</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      End-to-End 4-Way Money Trail Flow
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      Follow the complete financial lifecycle of a ₹1,000.00 transaction from the checkout button click to the bank account deposit and Merkle sealing.
                    </p>
                  </div>

                  <div id="flow-diagram" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                      Real-Time Money Journey Flowchart
                    </h3>
                    <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      Transactions flow through deterministic verification gates across merchant, aggregator, bank, and controller rails:
                    </p>

                    <MermaidViewer
                      chart={`
graph LR
  subgraph OrderRail["1. Merchant Checkout"]
    O1[Customer Checkout: ₹1,000.00] --> O2[Order Record Created]
  end

  subgraph GatewayRail["2. Razorpay Gateway"]
    O2 --> G1[payment.captured Webhook]
    G1 --> G2[MDR: ₹20.00 + GST: ₹3.60]
    G1 --> G3[TDS 194-O: ₹1.00]
    G2 --> G4[Net Settlement Batch: ₹975.40]
    G3 --> G4
  end

  subgraph BankRail["3. Acquiring Bank"]
    G4 --> B1[Bank NEFT Credit Line: ₹975.40]
    B1 --> B2[UTR Reference Matched]
  end

  subgraph HisabRail["4. HISAB Assertion"]
    G1 --> H1[Integer Paise Assertion]
    G4 --> H2[3-Tier Matcher Engine]
    B2 --> H2
    H2 --> H3[Merkle Hash Sealed: 0.00 Drift]
  end
                      `}
                    />
                  </div>

                  <div id="lifecycle-breakdown" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                      4-Stage Processing Lifecycle
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block text-xs">Stage 1: Merchant Cart Authorization</span>
                        <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Customer triggers checkout. Order created in PostgreSQL. Payment authorization event dispatched via webhook.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block text-xs">Stage 2: Aggregator Capture & Deduction</span>
                        <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Razorpay captures payment. MDR (200 bps = ₹20.00), GST (18% = ₹3.60), and TDS 194-O (10 bps = ₹1.00) calculated in integer paise.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block text-xs">Stage 3: Bank Credit Settlement</span>
                        <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Acquiring bank credits merchant account with ₹975.40 via NEFT. UTR reference matched against settlement manifest.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block text-xs">Stage 4: Assertion & Cryptographic Seal</span>
                        <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          HISAB 3-tier matcher proves balance conservation: ₹1,000.00 - ₹24.60 = ₹975.40. Root hash sealed to ledger.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "quickstart" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Zap className="w-4 h-4" />
                      <span>Developer Onboarding</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      60-Second Rapid Quickstart
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      Get the entire HISAB environment running locally with the FastAPI assertion backend, Redis deduplication cache, and Next.js reactive controller dashboard.
                    </p>
                  </div>

                  <div id="local-startup" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Terminal className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Local Environment Startup
                      </h3>
                    </div>

                    <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      Execute these two commands in separate terminal sessions:
                    </p>

                    <div className="relative p-5 rounded-2xl bg-[#0A0A0A] text-slate-200 font-mono text-xs space-y-2">
                      <div className="text-slate-400"># 1. Start FastAPI Backend Gateway (Port 8000)</div>
                      <code>uvicorn apps.api.main:app --host 0.0.0.0 --port 8000</code>
                      <div className="text-slate-400 pt-2"># 2. Start Next.js Operations Portal (Port 3000)</div>
                      <code>npm --prefix apps/web run start</code>
                      <button
                        onClick={() => handleCopy("uvicorn apps.api.main:app --host 0.0.0.0 --port 8000\nnpm --prefix apps/web run start", "start-cmd")}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                      >
                        {copiedId === "start-cmd" ? <Check className="w-4 h-4 text-[#0B72E7]" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  <div id="health-verification" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Gateway Verification & Health Check
                      </h3>
                    </div>

                    <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      Verify that the backend assertion gateway is responding by checking the reconciliation summary endpoint:
                    </p>

                    <div className="p-3 rounded-xl bg-[#0A0A0A] font-mono text-xs text-[#0B72E7] dark:text-[#3395FF]">
                      curl -s http://localhost:8000/api/reconcile/summary
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "razorpay-ingest" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Terminal className="w-4 h-4" />
                      <span>Real-Time Integration Rail</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Razorpay Webhook Ingestion & Security Rail
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      The Webhook Rail acts as HISAB&apos;s real-time ingestion gateway for asynchronous payment aggregator events. It captures payment authorizations, fee retentions, bank settlement transfers, and dispute filings with guaranteed at-least-once delivery, idempotency locking, and cryptographic HMAC verification.
                    </p>
                  </div>

                  <div id="webhook-setup" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Terminal className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Webhook Endpoint Setup & Dashboard Configuration
                      </h3>
                    </div>

                    <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      Follow these steps to link your Razorpay Merchant Dashboard directly to the HISAB real-time assertion controller:
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block">Step 1: Open Razorpay Dashboard</span>
                        <p className="text-[#52525B] dark:text-[#A1A1AA]">Navigate to Settings &gt; Webhooks &gt; Add New Webhook.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block">Step 2: Enter Ingestion Webhook URL</span>
                        <div className="font-mono text-[11px] p-2.5 rounded bg-slate-100 dark:bg-[#161616] text-[#0B72E7] dark:text-[#3395FF]">
                          https://your-domain.com/api/razorpay/webhook
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block">Step 3: Define High-Entropy Secret</span>
                        <p className="text-[#52525B] dark:text-[#A1A1AA]">
                          Generate a random 32-character string and save it to your `.env` as `RAZORPAY_WEBHOOK_SECRET`.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block">Step 4: Enable Required Events</span>
                        <p className="text-[#52525B] dark:text-[#A1A1AA]">
                          Select `payment.captured`, `settlement.processed`, `refund.processed`, and `dispute.created`.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div id="events" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Zap className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Supported Ingestion Events & Payload Schemas
                      </h3>
                    </div>

                    <div className="border border-[#E5E7EB] dark:border-[#262626] rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-white dark:bg-[#0A0A0A] font-bold text-[#52525B] dark:text-[#A1A1AA] border-b border-[#E5E7EB] dark:border-[#262626]">
                          <tr>
                            <th className="p-3">Webhook Event</th>
                            <th className="p-3">Trigger Condition</th>
                            <th className="p-3">HISAB Controller Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626]">
                          <tr>
                            <td className="p-3 font-mono font-bold text-[#0B72E7]">payment.captured</td>
                            <td className="p-3 text-[#18181B] dark:text-[#D4D4D8]">Customer transaction authorized & captured</td>
                            <td className="p-3 text-[#18181B] dark:text-[#D4D4D8]">Normalizes currency into paise, audits contractual MDR schedule, and records transaction in Payments Ledger.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">settlement.processed</td>
                            <td className="p-3 text-[#18181B] dark:text-[#D4D4D8]">Aggregator closes batch and issues bank transfer</td>
                            <td className="p-3 text-[#18181B] dark:text-[#D4D4D8]">Extracts settlement UTR, triggers 3-tier matcher to reconcile individual parent checkouts against the lumped deposit.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">refund.processed</td>
                            <td className="p-3 text-[#18181B] dark:text-[#D4D4D8]">Refund initiated by customer or operator</td>
                            <td className="p-3 text-[#18181B] dark:text-[#D4D4D8]">Updates ledger with reverse fee offsets and passes order ID to CTL_06 Double-Loss surveillance.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold text-red-600 dark:text-red-400">dispute.created</td>
                            <td className="p-3 text-[#18181B] dark:text-[#D4D4D8]">Issuing bank raises customer chargeback</td>
                            <td className="p-3 text-[#18181B] dark:text-[#D4D4D8]">Checks for concurrent refund collisions; auto-compiles signed dispute evidence package if double-loss hazard detected.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-[#09090B] dark:text-white block">Sample Ingestion Payload (`payment.captured`):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "entity": "event",
  "account_id": "acc_BF03vH0J7y6zKq",
  "event": "payment.captured",
  "contains": ["payment"],
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_O7sJ92KxLp81Qz",
        "amount": 100000,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_EK54a9d7FkZ0lQ",
        "method": "card",
        "card": {
          "network": "Visa",
          "type": "credit"
        },
        "fee": 2360,
        "tax": 360,
        "created_at": 1772323200
      }
    }
  }
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="signature-verify" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        HMAC SHA-256 Signature Verification & Replay Protection
                      </h3>
                    </div>

                    <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      Every incoming HTTP request contains an `X-Razorpay-Signature` header. HISAB computes the SHA-256 HMAC hash of the raw payload body using the shared secret and executes a constant-time string comparison (`hmac.compare_digest`) to prevent timing attacks.
                    </p>

                    <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                      <div className="text-slate-400"># Production Webhook Guard (Python / FastAPI)</div>
                      <pre>{`import hmac
import hashlib
from fastapi import Header, HTTPException, Request

async def verify_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(...)
):
    raw_body = await request.body()
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "").encode("utf-8")
    
    # Compute SHA-256 digest of raw payload bytes
    computed = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
    
    # Constant-time comparison protects against side-channel timing attacks
    if not hmac.compare_digest(computed, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid HMAC webhook signature")
        
    return await request.json()`}</pre>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "env-config" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Database className="w-4 h-4" />
                      <span>Infrastructure & Config</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Environment Configuration & Secrets Management
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      HISAB follows the Twelve-Factor App methodology for strict separation of code and configuration. All database connections, API credentials, AI keys, and cryptographic secrets are injected via environment variables.
                    </p>
                  </div>

                  <div id="env-vars" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Database className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Core Environment Variables Reference
                      </h3>
                    </div>

                    <div className="border border-[#E5E7EB] dark:border-[#262626] rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-white dark:bg-[#0A0A0A] font-bold text-[#52525B] dark:text-[#A1A1AA] border-b border-[#E5E7EB] dark:border-[#262626]">
                          <tr>
                            <th className="p-3">Variable Name</th>
                            <th className="p-3">Required</th>
                            <th className="p-3">Default / Example</th>
                            <th className="p-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626] font-mono">
                          <tr>
                            <td className="p-3 font-bold text-[#0B72E7]">DATABASE_URL</td>
                            <td className="p-3 text-red-600 dark:text-red-400">Yes</td>
                            <td className="p-3">sqlite+aiosqlite:///data/hisab.db</td>
                            <td className="p-3 font-sans text-[#18181B] dark:text-[#D4D4D8]">Asynchronous SQL database connection string for SQLite or PostgreSQL (`postgresql+asyncpg://...`).</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold text-[#0B72E7]">REDIS_URL</td>
                            <td className="p-3 text-red-600 dark:text-red-400">Yes</td>
                            <td className="p-3">redis://localhost:6379/0</td>
                            <td className="p-3 font-sans text-[#18181B] dark:text-[#D4D4D8]">Redis host URI for sub-millisecond timeline cache, distributed reconciliation locks, and deduplication.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold text-[#0B72E7]">GROQ_API_KEY</td>
                            <td className="p-3 text-red-600 dark:text-red-400">Yes</td>
                            <td className="p-3">gsk_9a8f7c...</td>
                            <td className="p-3 font-sans text-[#18181B] dark:text-[#D4D4D8]">API authorization key for the Llama-3.3-70B financial analysis intelligence assistant.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold text-[#0B72E7]">LLM_MODEL</td>
                            <td className="p-3 text-[#52525B] dark:text-[#A1A1AA]">Optional</td>
                            <td className="p-3">llama-3.3-70b-versatile</td>
                            <td className="p-3 font-sans text-[#18181B] dark:text-[#D4D4D8]">Target Groq LLM model identifier for natural language financial analytics.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold text-[#0B72E7]">RAZORPAY_KEY_ID</td>
                            <td className="p-3 text-red-600 dark:text-red-400">Yes</td>
                            <td className="p-3">rzp_live_99420...</td>
                            <td className="p-3 font-sans text-[#18181B] dark:text-[#D4D4D8]">Razorpay merchant API Key ID used for synchronous sync operations.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold text-[#0B72E7]">RAZORPAY_KEY_SECRET</td>
                            <td className="p-3 text-red-600 dark:text-red-400">Yes</td>
                            <td className="p-3">rzp_sec_99420...</td>
                            <td className="p-3 font-sans text-[#18181B] dark:text-[#D4D4D8]">Razorpay API Key Secret for authenticated REST calls.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold text-[#0B72E7]">RAZORPAY_WEBHOOK_SECRET</td>
                            <td className="p-3 text-red-600 dark:text-red-400">Yes</td>
                            <td className="p-3">whsec_8841a...</td>
                            <td className="p-3 font-sans text-[#18181B] dark:text-[#D4D4D8]">Shared secret string used to verify incoming HMAC SHA-256 webhook signatures.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold text-[#0B72E7]">JWT_SECRET_KEY</td>
                            <td className="p-3 text-red-600 dark:text-red-400">Yes</td>
                            <td className="p-3">hisab_jwt_sec_...</td>
                            <td className="p-3 font-sans text-[#18181B] dark:text-[#D4D4D8]">Cryptographic secret for signing dual-control Maker-Checker approvals and sessions.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-[#09090B] dark:text-white block">Copyable `.env` Production Template:</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto">
                        <pre>{`# Primary Relational Database (SQLite for dev, PostgreSQL for prod)
DATABASE_URL=sqlite+aiosqlite:///data/generated/hisab.db

# Sub-Millisecond Redis Cache & Lock Engine
REDIS_URL=redis://localhost:6379/0

# Groq LLM Assistant Key & Model Target
GROQ_API_KEY=gsk_your_groq_api_key_here
LLM_MODEL=llama-3.3-70b-versatile

# Razorpay Merchant Gateway Credentials
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=rzp_sec_your_key_secret
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Governance Dual-Control JWT Signing Secret
JWT_SECRET_KEY=hisab_jwt_secret_high_entropy_random_string_2026`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="redis-cache" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                        <Layers className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Redis Caching, Idempotency & Distributed Lock Topology
                      </h3>
                    </div>

                    <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      HISAB integrates Redis as a critical performance and consistency layer across three distinct namespaces:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block">1. Deduplication Gate</span>
                        <div className="font-mono text-[10px] text-[#52525B] dark:text-[#A1A1AA]">idempotency:event_id</div>
                        <p className="text-[#18181B] dark:text-[#D4D4D8] leading-relaxed">
                          TTL: 86,400s (24h). Atomic SET NX locks prevent duplicate financial mutations when gateways retry webhooks.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block">2. Timeline Cache</span>
                        <div className="font-mono text-[10px] text-[#52525B] dark:text-[#A1A1AA]">cache:timeline:date</div>
                        <p className="text-[#18181B] dark:text-[#D4D4D8] leading-relaxed">
                          TTL: 300s (5m). Stores pre-aggregated velocity and settlement metrics for 0.4ms instant dashboard rendering.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block">3. Distributed Lock</span>
                        <div className="font-mono text-[10px] text-[#52525B] dark:text-[#A1A1AA]">lock:recon:batch</div>
                        <p className="text-[#18181B] dark:text-[#D4D4D8] leading-relaxed">
                          TTL: 60s. Mutual exclusion lock guaranteeing only one matching run executes per batch concurrently.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              )}

                  {activeDocId === "working" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <Layers className="w-4 h-4" />
                          <span>Architecture Internals</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          Internal Working & Pipeline Architecture
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          HISAB functions as an autonomous, deterministic assertion gateway situated between payment aggregators (Razorpay), internal order databases, and acquiring banks. It ensures zero financial drift through a continuous multi-stage pipeline.
                        </p>
                      </div>

                      <div id="pipeline" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          End-to-End Ingestion to Merkle Sealing Pipeline
                        </h3>
                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Every transaction passes through four deterministic processing stages before financial books are updated and closed:
                        </p>

                        <MermaidViewer
                          chart={`
graph TD
  A[Raw Webhook / CSV Ingestion] --> B[HMAC SHA-256 Signature Verification]
  B --> C[Idempotency & Deduplication Filter]
  C --> D[SQLite / PostgreSQL Relational Commit]
  D --> E[Continuous 7-Control Assertion Pass]
  E -- Invariants Satisfied --> F[Tier 1-3 Reconciliation Engine]
  E -- Variance Detected --> G[Maker-Checker Exception Isolation Queue]
  F --> H[SHA-256 Merkle Tree Leaf Construction]
  H --> I[Sealed Root Hash & Immutable Audit Log]
                          `}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block text-xs">1. INGESTION RAIL</span>
                            <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                              Accepts raw webhooks and batch manifests. Validates payload headers, parses currency strings into 64-bit integer paise, and normalizes ISO timestamps.
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block text-xs">2. ASSERTION PASS</span>
                            <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                              Evaluates the Seven Continuous Controls in memory. If any rule fails (e.g. MDR discrepancy &gt; 0 paise), the record is immediately quarantined.
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-amber-600 dark:text-amber-400 block text-xs">3. EXCEPTION ISOLATION</span>
                            <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                              Quarantined transactions enter the dual-control Maker-Checker inbox. Payout settlements on suspect batches are frozen until signed by a supervisor.
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-purple-600 dark:text-purple-400 block text-xs">4. MERKLE SEALING</span>
                            <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                              Reconciled batches are hashed into a binary SHA-256 Merkle tree. The root hash is logged to the append-only ledger for external statutory audit.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div id="state-lifecycle" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Transaction State Transition Machine
                        </h3>
                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Every payment record in the database transitions through a strictly enforced finite-state machine (FSM). Illegal state transitions (such as settling a refunded payment without an offset entry) are mathematically blocked at the database engine level.
                        </p>

                        <MermaidViewer
                          chart={`
stateDiagram-v2
  [*] --> INITIATED: Customer Checkout
  INITIATED --> CAPTURED: Razorpay payment.captured
  CAPTURED --> SETTLEMENT_ALLOCATED: Settlement Batch Ingested
  SETTLEMENT_ALLOCATED --> RECONCILED: 3-Tier Match Passed & Bank Credited
  SETTLEMENT_ALLOCATED --> VARIANCE_FLAGGED: Control Invariant Broken
  VARIANCE_FLAGGED --> MANUAL_REVIEW: Maker Drafts Resolution
  MANUAL_REVIEW --> RECONCILED: Checker Approves
  MANUAL_REVIEW --> REJECTED: Checker Denies
  RECONCILED --> SEALED: Merkle Root Hash Generated
  SEALED --> [*]
                          `}
                        />
                      </div>

                      <div id="event-driven" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Event Ingestion & Redis Idempotency Gate
                        </h3>
                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          To prevent race conditions and duplicate double-counting from payment gateway webhook retries, HISAB implements atomic idempotency locking powered by Redis.
                        </p>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-2">
                          <div className="text-slate-400"># Atomic Redis Idempotency Guard (Python / FastAPI)</div>
                          <pre>{`async def ingest_webhook_event(event_id: str, payload: dict, redis: Redis):
    # Set atomic idempotency lock with 24-hour expiration
    is_new = await redis.set(f"idempotency:{event_id}", "LOCKED", nx=True, ex=86400)
    if not is_new:
        return {"status": "SKIPPED_DUPLICATE_EVENT", "event_id": event_id}
    
    # Process event within atomic database transaction
    async with get_db_session() as session:
        await process_transaction_event(payload, session)
        await append_audit_log(event_id, "EVENT_INGESTED", session)`}</pre>
                        </div>
                      </div>
                    </article>
                  )}

                  {activeDocId === "engine" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <Compass className="w-4 h-4" />
                          <span>Matching Engine Internals</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          3-Tier Reconciliation Algorithm Engine
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          HISAB achieves a 99.4%+ automated reconciliation match rate by orchestrating a 3-tier algorithm cascade. Instead of running expensive combinatorial algorithms on all records, transactions are filtered progressively from deterministic $O(1)$ lookups down to dynamic programming knapsack solvers.
                        </p>
                      </div>

                      <MermaidViewer
                        chart={`
graph TD
  Start[Un-reconciled Ingestion Ledger] --> T1[Tier 1: Deterministic Exact ID Match]
  T1 -- 89.2% Direct Match --> M1[Reconciled & UTR Sealed]
  T1 -- 10.8% Unmatched --> T2[Tier 2: Multi-Constraint Window Match]
  T2 -- 8.8% Heuristic Match --> M2[Reconciled T+2 Tolerance]
  T2 -- 2.0% Composite Deposit --> T3[Tier 3: Subset-Sum Knapsack Solver]
  T3 -- 1.6% Knapsack Decomposed --> M3[Reconstructed Batch Components]
  T3 -- 0.4% Residual Variance --> Anom[Isolated to Dual-Control Exception Queue]
                        `}
                      />

                      <div id="tier1" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                          <div>
                            <span className="text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider block">Tier 1 Algorithm</span>
                            <h3 className="font-bold text-base text-[#09090B] dark:text-white">Deterministic Exact Key Lookup</h3>
                          </div>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7] border border-blue-200 dark:border-blue-800">
                            O(1) Hash Map · 0.14 ms / batch
                          </span>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Indexes orders by primary composite keys `(payment_id, order_id, amount_paise)`. If a settlement manifest contains the exact `payment_id` with matching currency paise, the record clears in constant time $O(1)$.
                        </p>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                          <div className="text-slate-400"># Tier 1 In-Memory Hash Join</div>
                          <pre>{`def match_tier_1_exact(unmatched_payments, settlement_records):
    settlement_map = {s.payment_id: s for s in settlement_records}
    matched = []
    
    for payment in unmatched_payments:
        if payment.id in settlement_map:
            settlement = settlement_map[payment.id]
            if payment.amount_paise == settlement.gross_amount_paise:
                matched.append((payment, settlement, "TIER_1_EXACT"))
                
    return matched`}</pre>
                        </div>
                      </div>

                      <div id="tier2" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                          <div>
                            <span className="text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider block">Tier 2 Algorithm</span>
                            <h3 className="font-bold text-base text-[#09090B] dark:text-white">Multi-Constraint Window Matcher</h3>
                          </div>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            O(N log N) Range Search · 1.82 ms
                          </span>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          For unlinked gateway records (e.g. UPI transactions with missing `pay_` prefixes or asynchronous Netbanking credits), Tier 2 applies a multi-constraint bounding box:
                        </p>

                        <ul className="space-y-1.5 text-xs text-[#27272A] dark:text-[#D4D4D8] list-disc list-inside font-normal">
                          <li><strong>Temporal Constraint</strong>: Captured timestamp within [T - 2 days, T + 2 days] of bank settlement date.</li>
                          <li><strong>Fee Net Constraint</strong>: Gross - MDR - GST - Deposit = 0 paise.</li>
                          <li><strong>Customer Correlation</strong>: Levenshtein name distance &ge; 0.92 or last 4 digits of virtual account number.</li>
                        </ul>
                      </div>

                      <div id="tier3" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                          <div>
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Tier 3 Algorithm</span>
                            <h3 className="font-bold text-base text-[#09090B] dark:text-white">Subset-Sum Knapsack Decomposition</h3>
                          </div>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            O(N · W) Dynamic Programming · 8.40 ms
                          </span>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          When payment aggregators lump hundreds of individual checkouts into a single lumped bank transfer (e.g. one ₹14,20,500.00 credit for 142 distinct orders), Tier 3 executes a 0/1 Subset-Sum Knapsack algorithm to decompose the bulk credit into its exact constituent transactions with 0 paise residual tolerance.
                        </p>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                          <div className="text-slate-400"># DP Subset-Sum Knapsack Form (Paise Minor Units)</div>
                          <pre>{`def knapsack_subset_sum(target_paise: int, candidate_payments: list):
    dp = {0: []}
    for p in candidate_payments:
        net = p.net_settled_paise
        for current_sum in list(dp.keys()):
            new_sum = current_sum + net
            if new_sum == target_paise:
                return dp[current_sum] + [p]  # Zero-Tolerance Match Found
            if new_sum < target_paise and new_sum not in dp:
                dp[new_sum] = dp[current_sum] + [p]
    return None  # Un-decomposed residual`}</pre>
                        </div>
                      </div>

                      <div id="benchmark" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Algorithm Throughput & Latency Benchmarks (10,000 Transactions)
                        </h3>
                        <div className="border border-[#E5E7EB] dark:border-[#262626] rounded-2xl overflow-hidden text-xs">
                          <table className="w-full text-left font-mono">
                            <thead className="bg-[#FAFAFA] dark:bg-[#161616] border-b border-[#E5E7EB] dark:border-[#262626] font-bold text-[#27272A] dark:text-[#A1A1AA]">
                              <tr>
                                <th className="p-3">Engine Stage</th>
                                <th className="p-3">Throughput (tx/sec)</th>
                                <th className="p-3">p50 Latency</th>
                                <th className="p-3">p99 Latency</th>
                                <th className="p-3">Memory Footprint</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626]">
                              <tr>
                                <td className="p-3 font-sans font-semibold text-[#0B72E7]">Tier 1 Exact Hash Lookup</td>
                                <td className="p-3">714,000 tx/sec</td>
                                <td className="p-3">0.14 ms</td>
                                <td className="p-3">0.42 ms</td>
                                <td className="p-3">42 MB</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-sans font-semibold text-emerald-600 dark:text-emerald-400">Tier 2 Window Matcher</td>
                                <td className="p-3">54,000 tx/sec</td>
                                <td className="p-3">1.82 ms</td>
                                <td className="p-3">3.40 ms</td>
                                <td className="p-3">118 MB</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-sans font-semibold text-purple-600 dark:text-purple-400">Tier 3 Knapsack Solver</td>
                                <td className="p-3">12,500 tx/sec</td>
                                <td className="p-3">8.40 ms</td>
                                <td className="p-3">14.20 ms</td>
                                <td className="p-3">256 MB</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </article>
                  )}

                  {activeDocId === "invariants" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <Lock className="w-4 h-4" />
                          <span>Mathematical Assurance</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          Mathematical Invariant Proofs & Cryptographic Sealing
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          Financial systems must be immune to IEEE-754 floating-point drift and un-allocated balances. HISAB models all money as 64-bit integer paise and verifies mathematical balance equations across every ledger entry.
                        </p>
                      </div>

                      <div id="proof-formulas" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">Invariant #1</span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Paise Net Settlement Equation
                          </h3>
                        </div>

                        <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] font-mono text-sm text-[#09090B] dark:text-white overflow-x-auto">
                          {"Net Settled (Paise) = Gross Captures - MDR Fee - 18% GST - TDS 194-O ± Adjustments"}
                        </div>

                        <div className="space-y-2 text-xs text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          <p>
                            Where all terms are non-negative 64-bit integers:
                          </p>
                          <ul className="space-y-1 font-mono list-disc list-inside">
                            <li>MDR Fee = floor((Gross × bps) / 10000 + 0.5)</li>
                            <li>GST = floor((MDR Fee × 1800) / 10000 + 0.5)</li>
                            <li>TDS 194-O = floor((Gross × 10) / 10000 + 0.5)</li>
                          </ul>
                        </div>
                      </div>

                      <div id="zero-drift" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-mono font-bold text-xs">Invariant #2</span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Zero-Tolerance Conservation Proof
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          For any batch of N orders and M bank credit entries, the global conservation law guarantees that no money is created or destroyed:
                        </p>

                        <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] font-mono text-sm text-[#09090B] dark:text-white overflow-x-auto">
                          {"Σ Gross_i - Σ (MDR_i + GST_i + TDS_i) - Σ BankCredit_j = 0  (Zero-Drift Invariant)"}
                        </div>

                        <p className="text-xs text-[#27272A] dark:text-[#A1A1AA]">
                          If the sum evaluates to even ±1 paise variance, HISAB halts batch closure and issues an alert to the Controller.
                        </p>
                      </div>

                      <div id="merkle-proof" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 rounded bg-purple-600 text-white font-mono font-bold text-xs">Proof Seal</span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            SHA-256 Binary Merkle Tree Sealing
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Reconciled transactions are compiled into an immutable binary Merkle tree. The Merkle root hash provides cryptographic proof of all transactions in the settlement cycle:
                        </p>

                        <MermaidViewer
                          chart={`
graph TD
  Root["Merkle Root Hash: 8f4a1324..."] --> H01["Hash(H0 + H1)"]
  Root --> H23["Hash(H2 + H3)"]
  H01 --> H0["Hash(Tx 001)"]
  H01 --> H1["Hash(Tx 002)"]
  H23 --> H2["Hash(Tx 003)"]
  H23 --> H3["Hash(Tx 004)"]
                          `}
                        />
                      </div>
                    </article>
                  )}

                  {activeDocId === "idempotency-engine" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <Zap className="w-4 h-4" />
                          <span>Fault Tolerance & Lock Engine</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          Redis Distributed Idempotency & Fault Tolerance
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          Payment gateways retry asynchronous webhooks up to 12 times upon network timeout. HISAB couples Redis atomic locks with database transaction boundaries to achieve zero double-counting, zero race conditions, and complete crash resilience.
                        </p>
                      </div>

                      <div id="distributed-locks" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                            <Lock className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Distributed Mutex Locks for Batch Matching
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          When a reconciliation job is triggered, the worker acquires a cluster-wide mutual exclusion lock on `lock:recon:batch:{'{tenant}'}` with a 60-second self-healing TTL. Concurrent trigger requests receive an immediate `409 Conflict (Reconciliation already in progress)` status.
                        </p>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                          <div className="text-slate-400"># Distributed Redis Lock Pattern</div>
                          <pre>{`async def acquire_batch_lock(redis: Redis, batch_id: str):
    lock_key = f"lock:recon:{batch_id}"
    token = str(uuid.uuid4())
    acquired = await redis.set(lock_key, token, nx=True, ex=60)
    if not acquired:
        raise HTTPException(status_code=409, detail="Batch reconciliation currently in execution")
    return token`}</pre>
                        </div>
                      </div>

                      <div id="dedup-gate" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                            <Zap className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Atomic Webhook Deduplication Gate
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Incoming payloads are filtered through `idempotency:{'{event_id}'}`. If an identical event payload arrives while the first execution is processing, the gateway discards the duplicate with HTTP `200 OK (Event already acknowledged)` without triggering duplicate database writes.
                        </p>
                      </div>

                      <div id="crash-recovery" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Crash Recovery & Ledger Replay
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          In the event of an abrupt process termination during a matching run, un-sealed records remain in `SETTLEMENT_ALLOCATED` state. Upon service restart, the reconciliation engine replays all un-sealed events from the last verified Merkle checkpoint.
                        </p>
                      </div>
                    </article>
                  )}

                  {activeDocId === "mdr" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <Calculator className="w-4 h-4" />
                          <span>Financial Mechanics</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          Merchant Discount Rate (MDR) & Interchange Fee Economics
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          MDR is the aggregate processing fee retained by payment aggregators, card networks (Visa/Mastercard/RuPay), and acquiring banks. In HISAB, every fee deduction is audited in integer minor units (paise) down to the contractual basis point.
                        </p>
                      </div>

                      <div id="mdr-formula" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                            <Calculator className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Paise Minor-Unit Invariant Formula
                          </h3>
                        </div>

                        <div className="font-mono text-sm bg-white dark:bg-[#0A0A0A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#262626] text-[#09090B] dark:text-white overflow-x-auto">
                          MDR Fee (Paise) = round( Gross Transaction Amount (Paise) × (MDR Basis Points / 10000) )
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Example: On a ₹1,000.00 (100,000 paise) Standard Domestic Credit Card transaction at 200 bps (2.00%):
                          <br />
                          <code className="font-bold text-[#0B72E7] dark:text-[#3395FF]">100,000 × 0.02 = 2,000 paise (₹20.00 MDR Fee)</code>
                        </p>
                      </div>

                      <div id="rate-schedules" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Payment Rail Interchange Schedule Reference
                        </h3>

                        <div className="border border-[#E5E7EB] dark:border-[#262626] rounded-2xl overflow-hidden text-xs">
                          <table className="w-full text-left font-mono">
                            <thead className="bg-[#FAFAFA] dark:bg-[#161616] border-b border-[#E5E7EB] dark:border-[#262626] font-bold text-[#27272A] dark:text-[#A1A1AA]">
                              <tr>
                                <th className="p-3.5">Payment Instrument</th>
                                <th className="p-3.5">Basis Points</th>
                                <th className="p-3.5">MDR Rate</th>
                                <th className="p-3.5">Regulatory Basis</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626]">
                              <tr>
                                <td className="p-3.5 font-sans font-semibold">Standard Domestic Cards</td>
                                <td className="p-3.5">200 bps</td>
                                <td className="p-3.5 font-bold text-[#0B72E7]">2.00%</td>
                                <td className="p-3.5 text-[#52525B] dark:text-[#A1A1AA]">Visa/Mastercard Interchange Schedule</td>
                              </tr>
                              <tr>
                                <td className="p-3.5 font-sans font-semibold">Corporate & Amex Cards</td>
                                <td className="p-3.5">300 bps</td>
                                <td className="p-3.5 font-bold text-[#0B72E7]">3.00%</td>
                                <td className="p-3.5 text-[#52525B] dark:text-[#A1A1AA]">Commercial Card Premium Tier</td>
                              </tr>
                              <tr>
                                <td className="p-3.5 font-sans font-semibold">Netbanking / Direct Debit</td>
                                <td className="p-3.5">180 bps</td>
                                <td className="p-3.5 font-bold text-[#0B72E7]">1.80%</td>
                                <td className="p-3.5 text-[#52525B] dark:text-[#A1A1AA]">Direct Bank Gateway Fee</td>
                              </tr>
                              <tr>
                                <td className="p-3.5 font-sans font-semibold">UPI Instant Payment Rail</td>
                                <td className="p-3.5">0 bps</td>
                                <td className="p-3.5 font-bold text-[#0B72E7]">0.00% (Zero MDR)</td>
                                <td className="p-3.5 text-[#52525B] dark:text-[#A1A1AA]">RBI Sovereign Mandate</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div id="interchange-cost" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <Scale className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Interchange Network Cost Breakdown
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Of the total 200 bps retained on a credit card payment, the fee is split between:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                            <span className="font-bold text-[#09090B] dark:text-white block">Issuing Bank Interchange (140 bps)</span>
                            <p className="text-[#52525B] dark:text-[#A1A1AA]">Compensates cardholder bank for credit risk and loyalty rewards.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                            <span className="font-bold text-[#09090B] dark:text-white block">Card Network Assessment (20 bps)</span>
                            <p className="text-[#52525B] dark:text-[#A1A1AA]">Visa / Mastercard switch routing and fraud score scoring.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                            <span className="font-bold text-[#09090B] dark:text-white block">Aggregator Acquirer Margin (40 bps)</span>
                            <p className="text-[#52525B] dark:text-[#A1A1AA]">Razorpay platform margin for developer APIs and instant settlement.</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  )}

                  {activeDocId === "gst" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <Scale className="w-4 h-4" />
                          <span>Tax Compliance</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          18.00% GST on Gateway Retentions & GSTR-2B ITC Matching
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          Payment gateway processing fees in India are subject to 18% Goods and Services Tax (9% CGST + 9% SGST or 18% IGST). HISAB correlates every individual GST charge to ensure 100% recovery of eligible Input Tax Credit (ITC).
                        </p>
                      </div>

                      <div id="gst-flow" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          GST Deduction & Tax Invoice Flowchart
                        </h3>

                        <MermaidViewer
                          chart={`
graph TD
  A[Gross Payment Capture: ₹1,000.00] --> B[MDR Fee 2.0%: ₹20.00]
  B --> C[18% GST on Fee: ₹3.60]
  C --> D[Total Deduction: ₹23.60]
  A --> E[Net Settlement to Bank: ₹976.40]
  D --> F[Razorpay Monthly GST Invoice GSTR-2B]
  F --> G[Input Tax Credit ITC Claimed: ₹3.60]
                          `}
                        />
                      </div>

                      <div id="itc-matching" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            GSTR-2B Input Tax Credit (ITC) Verification
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          HISAB aggregates all micro-GST charges across the month and performs a checksum comparison against the Razorpay monthly GST tax invoice uploaded to the GST Portal in Form GSTR-2B:
                        </p>

                        <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] font-mono text-xs text-[#0B72E7] dark:text-[#3395FF] overflow-x-auto">
                          Σ GST_deducted (Paise) == GSTR-2B_Invoice_Tax_Amount (Paise) ± 0 paise
                        </div>
                      </div>

                      <div id="gstr2b-reconciliation" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Monthly Tax Audit & GSTIN Verification
                        </h3>
                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Prevents loss of tax credit caused by mismatched GSTIN numbers, incorrect HSN/SAC codes (997159 - Financial intermediation services), or delayed invoice uploads by the payment aggregator.
                        </p>
                      </div>
                    </article>
                  )}

                  {activeDocId === "tds194o" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5">
                          <FileText className="w-4 h-4" />
                          <span>Direct Tax Compliance · Income Tax Act 1961</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          Section 194-O E-Commerce TDS (0.10% / 10 bps)
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          Under Section 194-O of the Indian Income Tax Act, 1961, e-commerce operators and payment aggregators are legally mandated to deduct Tax Deducted at Source (TDS) at <strong>0.10% (10 basis points)</strong> on the gross amount of sales facilitated through digital checkout platforms.
                        </p>
                      </div>

                      <div id="tds-schedule" className="space-y-5 p-6 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/70 dark:border-amber-800/60 pb-3">
                          <div>
                            <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block text-xs">
                              Statutory Rule & Base Invariant
                            </span>
                            <h3 className="font-bold text-base text-[#09090B] dark:text-white mt-0.5">
                              0.10% Gross Value Withholding Mandate
                            </h3>
                          </div>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            10 bps · Minor Unit Paise
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-[#09090B] dark:text-white block text-sm">
                              Statutory Withholding Rate
                            </span>
                            <p className="text-[#27272A] dark:text-[#D4D4D8] leading-relaxed">
                              <strong>0.10% (10 basis points)</strong> levied on the Gross Merchandise Value (GMV) for participants with valid PAN. Rate increases to <strong>5.00%</strong> under Section 206AA if PAN is missing or invalid.
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-[#09090B] dark:text-white block text-sm">
                              Base Invariant Timing
                            </span>
                            <p className="text-[#27272A] dark:text-[#D4D4D8] leading-relaxed">
                              Withholding applies to the <strong>Gross Sale amount</strong> <em>before</em> deducting payment gateway MDR fees, GST, or customer cancellation refunds. Downstream refunds do not automatically reverse statutory TDS.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-1.5 border border-[#262626]">
                          <div className="text-slate-400"># Section 194-O Integer Paise Formula (0.10% = 10 bps)</div>
                          <pre>{`def calculate_194o_tds(gross_amount_paise: int, has_pan: bool = True) -> int:
    bps = 10 if has_pan else 500  # 0.10% vs 5.00%
    return round((gross_amount_paise * bps) / 10000)

# Example: ₹10,000.00 Order (10,00,000 Paise)
# TDS = (10,00,000 * 10) / 10,000 = 1,000 Paise = ₹10.00`}</pre>
                        </div>
                      </div>

                      <div id="form-26as" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                            <FileText className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Form 26AS & Annual Information Statement (AIS) Audit
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          HISAB continuously correlates quarterly TDS withholdings deducted by payment aggregators against credit entries deposited under the merchant TAN on the Income Tax Department TRACES portal.
                        </p>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-[#E5E7EB] dark:border-[#262626] rounded-xl overflow-hidden">
                            <thead className="bg-[#F1F5F9] dark:bg-[#1F1F1F] text-[#09090B] dark:text-[#EDEDED]">
                              <tr>
                                <th className="p-3 font-semibold">Audit Checkpoint</th>
                                <th className="p-3 font-semibold">Aggregator Deduction Manifest</th>
                                <th className="p-3 font-semibold">TRACES Form 26AS / AIS Ledger</th>
                                <th className="p-3 font-semibold">Assertion Rule</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626] text-[#27272A] dark:text-[#D4D4D8]">
                              <tr className="bg-white dark:bg-[#111111]">
                                <td className="p-3 font-medium text-[#09090B] dark:text-white">Deductor TAN Match</td>
                                <td className="p-3 font-mono">Aggregator TAN (e.g. BLRR01234E)</td>
                                <td className="p-3 font-mono">26AS Section 194-O Part A</td>
                                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">Exact TAN Match</td>
                              </tr>
                              <tr className="bg-white dark:bg-[#111111]">
                                <td className="p-3 font-medium text-[#09090B] dark:text-white">Gross Transaction Base</td>
                                <td className="p-3 font-mono">Σ Gross Payouts (Paise)</td>
                                <td className="p-3 font-mono">Total Amount Credited (₹)</td>
                                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">Variance = 0 Paise</td>
                              </tr>
                              <tr className="bg-white dark:bg-[#111111]">
                                <td className="p-3 font-medium text-[#09090B] dark:text-white">TDS Deposited Amount</td>
                                <td className="p-3 font-mono">Σ Withheld 0.10% (Paise)</td>
                                <td className="p-3 font-mono">Total TDS Deposited (₹)</td>
                                <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">Exact Credit Match</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div id="quarterly-tan-audit" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Form 16A Certificate Cross-Matching & Reconciliation
                        </h3>
                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          When quarterly Form 16A TDS certificates are generated at the close of Q1, Q2, Q3, and Q4, HISAB performs automated batch cross-matching between the digitally signed Form 16A gross totals and the internal transactional TDS withholding sub-ledger.
                        </p>

                        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-[#18181B] dark:text-[#D4D4D8] space-y-1.5">
                          <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block">
                            Control CTL_05 Continuous Invariant:
                          </span>
                          <p>
                            <code>assert abs(settlement_batch.tds_paise - round(settlement_batch.gross_paise * 0.001)) == 0</code>
                          </p>
                          <p className="text-[#64748B] dark:text-[#A1A1AA] pt-1">
                            Any uncredited or mismatched withholding is automatically queued in the Exceptions Inbox for tax team resolution.
                          </p>
                        </div>
                      </div>
                    </article>
                  )}

                  {activeDocId === "composite-settlements" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <Layers className="w-4 h-4" />
                          <span>Settlement Mechanics</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          Net Payout & Settlement Batch Decomposition
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          Payment aggregators settle funds in composite batches, transferring a single lumped NEFT/RTGS credit for thousands of individual checkouts. HISAB decomposes bulk settlements and tracks the T+2 bank float cycle.
                        </p>
                      </div>

                      <div id="net-payout-formula" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                            <Calculator className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Batch Net Payout Calculation
                          </h3>
                        </div>

                        <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] font-mono text-sm text-[#09090B] dark:text-white overflow-x-auto">
                          {"Net Bank Transfer = Σ(Gross Captures) - Σ(MDR Fees) - Σ(GST) - Σ(TDS 194-O) - Σ(Refunds) ± Adjustments"}
                        </div>
                      </div>

                      <div id="batch-manifest" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Settlement Batch Manifest Structure
                        </h3>
                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Each aggregator payout includes a manifest grouping all constituent transactions under a single Unique Transaction Reference (UTR) issued by the Reserve Bank of India settlement switch.
                        </p>
                      </div>

                      <div id="bank-float-timeline" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                            <Activity className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            T+2 Bank Float & Escrow Settlement Timeline
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Funds captured on day T sit in the aggregator nodals/escrow accounts and credit the merchant current account on T+1 or T+2 (excluding bank holidays). HISAB monitors bank float aging and triggers SLA breach alerts when settlement delays exceed contractual windows.
                        </p>
                      </div>
                    </article>
                  )}

                  {activeDocId === "controls-overview" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Continuous Controls</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          The 7 Continuous Financial Controls Matrix
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          HISAB enforces continuous mathematical proofs across every financial touchpoint before any batch settlement sign-off.
                        </p>
                      </div>

                      <div id="ctl-list" className="space-y-3">
                        {[
                          { id: "CTL_01", title: "Order-to-Capture Completeness", rule: "All customer order receipts must correspond to a verified Razorpay captured payment payload with zero phantom checkouts." },
                          { id: "CTL_02", title: "Gateway Commercials & GST Audit", rule: "MDR fee retentions and 18% GST must match the merchant contracted basis points within ₹0.00 minor tolerance." },
                          { id: "CTL_03", title: "Settlement Clearance & Net Invariant", rule: "Net Bank Deposit = Gross Captures - MDR Fee - GST - TDS 194-O + Adjustments." },
                          { id: "CTL_04", title: "Bank Statement UTR Narration Validation", rule: "Every bank credit line must correlate with a verified Razorpay settlement manifest and matching UTR reference." },
                          { id: "CTL_05", title: "Section 194-O TDS Compliance Audit", rule: "0.10% statutory TDS deduction verified against Form 26AS and AIS quarterly withholding ledgers." },
                          { id: "CTL_06", title: "Forensic Double-Loss Outflow Blocker", rule: "Blocks payout when concurrent refund and chargeback dispute are executed on the same order." },
                          { id: "CTL_07", title: "Cryptographic Audit Hash Sealing", rule: "Every mutation generates an immutable SHA-256 Merkle chain entry for external statutory audit." },
                        ].map((ctl) => (
                          <div key={ctl.id} className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626] flex items-start space-x-3.5">
                            <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF] font-mono font-bold text-xs flex-shrink-0">
                              {ctl.id}
                            </span>
                            <div>
                              <span className="font-bold text-sm text-[#09090B] dark:text-white block">{ctl.title}</span>
                              <p className="text-xs text-[#27272A] dark:text-[#D4D4D8] mt-0.5 leading-relaxed font-normal">{ctl.rule}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div id="assertion-matrix" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Assertion Verification Matrix
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Controls run concurrently across every ingestion batch, verifying integrity at the Minor Unit (Paise) level with zero tolerance for balance drift.
                        </p>
                      </div>

                      <div id="continuous-monitoring" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Continuous Audit Loop & Automated Interception
                        </h3>
                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Whenever an assertion fails, the transaction is automatically quarantined, prevented from polluting financial ledgers, and routed to the Maker-Checker Exception Inbox for supervisor resolution.
                        </p>
                      </div>
                    </article>
                  )}

                  {activeDocId === "controls-deepdive" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <Compass className="w-4 h-4" />
                          <span>Control Catalog Deep-Dive</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          Comprehensive Specification for Controls 01 through 07
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          Detailed mathematical definitions, trigger conditions, and resolution rules for each continuous control in the HISAB assertion engine.
                        </p>
                      </div>

                      <div id="ctl-01-03" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          CTL_01 to CTL_03 (Ingestion & Fee Assertions)
                        </h3>
                        <div className="space-y-3 text-xs">
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-[#0B72E7] block">CTL_01: Order-to-Capture Completeness</span>
                            <p className="text-[#27272A] dark:text-[#D4D4D8] leading-relaxed">Asserts that for every order row O_i, there exists a corresponding gateway payment capture P_i where O_i.amount == P_i.amount. Flagged as phantom checkouts if unmatched after 30 minutes.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-[#0B72E7] block">CTL_02: Commercials & GST Audit</span>
                            <p className="text-[#27272A] dark:text-[#D4D4D8] leading-relaxed">Asserts that aggregator deductions match contractual rate schedules MDR = round(Gross * bps / 10000) and GST = round(MDR * 0.18). Flags over-deductions greater than 0 paise.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-[#0B72E7] block">CTL_03: Net Settlement Balance Invariant</span>
                            <p className="text-[#27272A] dark:text-[#D4D4D8] leading-relaxed">Asserts conservation of funds across each batch manifest: Net == Gross - MDR - GST - TDS +/- Offsets.</p>
                          </div>
                        </div>
                      </div>

                      <div id="ctl-04-05" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          CTL_04 to CTL_05 (Bank Statement & TDS Withholding)
                        </h3>
                        <div className="space-y-3 text-xs">
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-purple-600 dark:text-purple-400 block">CTL_04: Bank UTR Narration Validation</span>
                            <p className="text-[#27272A] dark:text-[#D4D4D8] leading-relaxed">Matches bank statement NEFT credit lines against settlement UTRs within ₹0.00 minor unit tolerance and validates actual bank credit timestamps.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-purple-600 dark:text-purple-400 block">CTL_05: Section 194-O TDS Compliance</span>
                            <p className="text-[#27272A] dark:text-[#D4D4D8] leading-relaxed">Audits the 10 bps direct tax withholding on gross GMV and prepares reconciliation schedules for Form 26AS matching.</p>
                          </div>
                        </div>
                      </div>

                      <div id="ctl-06-07" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          CTL_06 to CTL_07 (Double-Loss Blocker & Audit Sealing)
                        </h3>
                        <div className="space-y-3 text-xs">
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-red-600 dark:text-red-400 block">CTL_06: Forensic Double-Loss Blocker</span>
                            <p className="text-[#27272A] dark:text-[#D4D4D8] leading-relaxed">Monitors concurrent customer refunds and issuing bank chargebacks on the same order, instantly freezing payout settlements.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block">CTL_07: Cryptographic Merkle Sealing</span>
                            <p className="text-[#27272A] dark:text-[#D4D4D8] leading-relaxed">Calculates a binary SHA-256 Merkle root hash across all reconciled transaction leaves and seals the batch permanently into the immutable audit ledger.</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  )}

                  {activeDocId === "controls-engine" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Exception Handling</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          Automated Violation Interceptors & Quarantine Engine
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          When financial controls detect anomalies, the assertion engine intercepts mutations in real time, routes suspect records to the quarantine queue, and triggers SLA-driven alerts.
                        </p>
                      </div>

                      <div id="violation-handling" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Violation Interception Pipeline
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Interceptions occur before any batch reaches the `SEALED` state, preventing compromised or drifting entries from polluting downstream general ledger (GL) exports.
                        </p>
                      </div>

                      <div id="quarantine-queue" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Quarantine Queue Isolation Architecture
                        </h3>
                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Quarantined records are isolated into a specialized database partition (`exceptions_quarantine`) with full 4-way trace telemetry attached for rapid analyst diagnosis.
                        </p>
                      </div>

                      <div id="sla-enforcement" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                            <Zap className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Resolution SLA Enforcement
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          High-severity exceptions (e.g. `CTL_06` double-loss hazard or `CTL_03` balance drift &gt; ₹10,000) initiate a 24-hour resolution timer. If un-reviewed by a Finance Manager within SLA, automated escalation notifications are dispatched to the Finance Controller.
                        </p>
                      </div>
                    </article>
                  )}

                  {activeDocId === "doubleloss" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Forensic Security</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          Signature Double-Loss Outflow Forensics
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          Double loss occurs when a merchant issues a manual refund while the customer concurrently initiates an issuing bank chargeback dispute, resulting in a catastrophic 200%+ cash leakage.
                        </p>
                      </div>

                      <div id="hazard-vector" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          The Double-Loss Outflow Vector
                        </h3>

                        <MermaidViewer
                          chart={`
graph TD
  Order[Customer Order: ₹72,000.00] --> Sale[Captured Payment: +₹72,000.00]
  Sale --> Vector1[Merchant Manual Refund: -₹72,000.00]
  Sale --> Vector2[Bank Chargeback Dispute: -₹72,500.00]
  Vector1 --> TotalLoss[Total Cash Outflow: -₹1,44,500.00]
  Vector2 --> TotalLoss
  TotalLoss --> HisabBlock[HISAB CTL_06 Intercepts & Auto-Generates Dispute Evidence Pack]
                          `}
                        />
                      </div>

                      <div id="collision-timeline" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Collision Timing Mechanics
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Exploiters take advantage of the 24-48 hour propagation latency between issuing bank chargeback filings and payment gateway dashboard visibility. By requesting a customer service refund immediately after filing a bank dispute, they trigger two separate debit streams from the merchant account.
                        </p>
                      </div>

                      <div id="impact-analysis" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Financial Impact on High-Value B2C / D2C Merchants
                        </h3>
                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Beyond the loss of goods (100%) and refund cash (100%), banks impose chargeback penalty fees (typically ₹500 - ₹2,000 per dispute), causing cumulative losses of 205% to 220% per exploited transaction.
                        </p>
                      </div>
                    </article>
                  )}

                  {activeDocId === "forensics-fsm" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                          <Activity className="w-4 h-4" />
                          <span>Real-Time Surveillance</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          Surveillance State Machine & Real-Time Interception
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          HISAB continuously tracks the lifecycle state of every order across both refund and dispute channels simultaneously, maintaining an in-memory surveillance index for instant hazard detection.
                        </p>
                      </div>

                      <div id="surveillance-state-machine" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Surveillance FSM Lifecycle States
                        </h3>

                        <MermaidViewer
                          chart={`
stateDiagram-v2
  [*] --> NORMAL: Payment Captured
  NORMAL --> REFUND_PENDING: refund.processed Received
  NORMAL --> DISPUTE_OPEN: dispute.created Received
  REFUND_PENDING --> DOUBLE_LOSS_ALERT: dispute.created Received
  DISPUTE_OPEN --> DOUBLE_LOSS_ALERT: refund.processed Received
  DOUBLE_LOSS_ALERT --> SETTLEMENT_FROZEN: Automated Quarantine
  SETTLEMENT_FROZEN --> EVIDENCE_COMPILED: Signed PDF Dispute Pack Ready
  EVIDENCE_COMPILED --> RESOLVED: Gateway Reversal Accepted
  RESOLVED --> [*]
                          `}
                        />
                      </div>

                      <div id="realtime-intercept" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                            <Zap className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Sub-Millisecond Webhook Interception
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          When a `refund.processed` or `dispute.created` webhook arrives, HISAB evaluates the order history in Redis within 0.4ms. If an existing refund or dispute is detected on the same `order_id`, it immediately transitions the order to `DOUBLE_LOSS_ALERT`.
                        </p>
                      </div>

                      <div id="quarantine-lock" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                            <Lock className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Settlement Quarantine & Payout Lock
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Places an atomic settlement lock on the affected batch, preventing closure until the dispute package is submitted and signed off by a Finance Manager.
                        </p>
                      </div>
                    </article>
                  )}

                  {activeDocId === "evidence-pack" && (
                    <article className="space-y-8">
                      <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
                          <FileText className="w-4 h-4" />
                          <span>Automated Dispute Defense</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                          1-Click Dispute Defense & PDF Evidence Packaging
                        </h1>
                        <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                          Winning cardholder disputes requires submitting concrete, multi-system evidence before strict acquiring bank deadlines. HISAB auto-compiles signed PDF dispute packages for 1-click submission.
                        </p>
                      </div>

                      <div id="evidence-pack" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <FileText className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            Dispute Defense Bundle Architecture
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          The auto-generated dispute defense package contains:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                            <span className="font-bold text-[#09090B] dark:text-white block">1. Refund ARN Reference Proof</span>
                            <p className="text-[#52525B] dark:text-[#A1A1AA]">Acquirer Reference Number (ARN) proving the refund credit was already transmitted to cardholder account.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                            <span className="font-bold text-[#09090B] dark:text-white block">2. Bank Statement Credit Match</span>
                            <p className="text-[#52525B] dark:text-[#A1A1AA]">Verified bank statement line confirming the exact date and UTR of the refund outflow.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                            <span className="font-bold text-[#09090B] dark:text-white block">3. Courier Proof of Delivery (POD)</span>
                            <p className="text-[#52525B] dark:text-[#A1A1AA]">Delivery confirmation tracking, recipient signature, and GPS coordinates.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                            <span className="font-bold text-[#09090B] dark:text-white block">4. Cryptographic Ledger Hash</span>
                            <p className="text-[#52525B] dark:text-[#A1A1AA]">SHA-256 immutable audit chain stamp certifying zero prior chargeback liability.</p>
                          </div>
                        </div>
                      </div>

                      <div id="pdf-generator" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                          Signed PDF Compilation Engine
                        </h3>
                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Compiles all documents into a single bank-compliant PDF (`application/pdf`) formatted according to Visa Dispute Resolution and Mastercard Chargeback Management guidelines.
                        </p>
                      </div>

                      <div id="razorpay-dispute-api" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                        <div className="flex items-center space-x-2.5">
                          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                            <Terminal className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                            1-Click Razorpay Dispute API Dispatch
                          </h3>
                        </div>

                        <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] leading-relaxed font-normal">
                          Operators can submit the defense package directly to Razorpay via authenticated REST integration (`POST /api/reports/download-pdf`) with automatic status tracking in the HISAB dashboard.
                        </p>
                      </div>
                    </article>
                  )}

                  {activeDocId === "api-reconcile" && (
                    <article className="space-y-8">
                      <div id="post-reconcile" className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Code2 className="w-4 h-4" />
                      <span>Reconciliation REST Engine</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Reconciliation & Settlement API Endpoints
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      The Reconciliation API drives the core automated 3-tier assertion pipeline. It matches captured payment gateway payloads against aggregator settlement manifests and acquiring bank credit statements, isolates mathematical discrepancies into the dual-control exception queue, and seals reconciled batches with a tamper-evident SHA-256 Merkle root.
                    </p>
                  </div>

                  <div className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">POST</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/reconcile/run</code>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800">
                        Idempotent Execution
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Triggers an instantaneous multi-tier reconciliation run across all un-cleared payments in the SQLite/PostgreSQL database. It performs Tier 1 Exact ID matching ($O(1)$), evaluates the Tier 2 multi-constraint settlement window ($T+2$), and executes Tier 3 knapsack subset-sum decomposition for composite bank credits. Upon completion, it commits the state transition, updates matching statuses, logs an immutable audit event, and returns the cryptographic Merkle root hash.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Headers:</span>
                      <div className="p-3 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] font-mono text-xs text-[#18181B] dark:text-[#D4D4D8] space-y-1">
                        <div>Authorization: Bearer hisab_sec_live_9f823a...</div>
                        <div>Content-Type: application/json</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Request Body Schema (JSON):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto relative">
                        <pre>{`{
  "batch_id": "batch_settlement_2026_08_30",
  "force_recompute": false,
  "tolerance_window_days": 2
}`}</pre>
                        <button 
                          onClick={() => handleCopy('{\n  "batch_id": "batch_settlement_2026_08_30",\n  "force_recompute": false,\n  "tolerance_window_days": 2\n}', 'req-rec-run')}
                          className="absolute right-3 top-3 text-slate-400 hover:text-white"
                        >
                          {copiedId === "req-rec-run" ? <Check className="w-3.5 h-3.5 text-[#0B72E7]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "success": true,
  "batch_id": "batch_settlement_2026_08_30",
  "total_records_processed": 500,
  "reconstructed_mappings_count": 472,
  "total_exceptions_found": 28,
  "auto_resolved_count": 14,
  "escalated_count": 14,
  "unresolved_exposure_paise": 108746830,
  "unresolved_exposure_formatted": "₹10,87,468.30",
  "execution_time_ms": 11.42,
  "merkle_root": "8f4a1324b899e12089408b0451a8f614532c589b2512a8907a9b0c2e3d5412fa"
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="get-summary" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/reconcile/summary</code>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Redis Cached (0.4ms)
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Computes global financial turnover and reconciliation KPIs across all four ledgers. It returns aggregate gross turnover, total order volume, settled vs unmapped payment counts, total refunds, total chargebacks, open exception tallies, and total unallocated financial exposure in paise minor units.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "gross_turnover_paise": 524304120,
  "gross_turnover_formatted": "₹52,43,041.20",
  "total_orders_count": 500,
  "total_payments_count": 500,
  "settled_payments_count": 472,
  "unmapped_payments_count": 28,
  "total_settlements_count": 48,
  "total_refunds_count": 18,
  "total_disputes_count": 6,
  "total_bank_credits_count": 48,
  "open_exceptions_count": 14,
  "unresolved_exposure_paise": 108746830,
  "unresolved_exposure_formatted": "₹10,87,468.30"
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="get-timeline" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/reconcile/timeline</code>
                      </div>
                      <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">Time-Series Stream</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Generates a chronological daily velocity stream comparing gross customer checkout volume against bank-cleared settlement payouts. Used directly by the interactive Velocity Trajectory chart.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Query Parameters:</span>
                      <div className="border border-[#E5E7EB] dark:border-[#262626] rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-white dark:bg-[#0A0A0A] font-bold text-[#52525B] dark:text-[#A1A1AA] border-b border-[#E5E7EB] dark:border-[#262626]">
                            <tr>
                              <th className="p-2.5">Parameter</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Default</th>
                              <th className="p-2.5">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626] font-mono">
                            <tr>
                              <td className="p-2.5 text-[#0B72E7]">timeframe</td>
                              <td className="p-2.5">String</td>
                              <td className="p-2.5">"30D"</td>
                              <td className="p-2.5 text-[#18181B] dark:text-[#D4D4D8] font-sans">Window filter: `7D`, `30D`, `QTD`, `YTD`</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "points": [
    {
      "day": "Aug 20",
      "date_iso": "2026-08-20T00:00:00Z",
      "gross": 342100,
      "gross_formatted": "₹3,421.00",
      "settled": 334574,
      "settled_formatted": "₹3,345.74",
      "fee": 7526,
      "fee_formatted": "₹75.26",
      "txns": 18
    }
  ],
  "metrics": {
    "peak_velocity_formatted": "₹5,24,304.12 / day",
    "peak_txns_count": 26,
    "average_clearing_speed": "T+1.2 Days",
    "blended_mdr_efficiency": "1.62% Blended"
  }
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="get-records" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/reconcile/records</code>
                      </div>
                      <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">Paginated 4-Way Records</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Fetches paginated transaction records combining the order payload, gateway payment receipt, settlement UTR, and bank statement line into a unified record for financial auditing.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Query Parameters:</span>
                      <div className="border border-[#E5E7EB] dark:border-[#262626] rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-white dark:bg-[#0A0A0A] font-bold text-[#52525B] dark:text-[#A1A1AA] border-b border-[#E5E7EB] dark:border-[#262626]">
                            <tr>
                              <th className="p-2.5">Parameter</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Default</th>
                              <th className="p-2.5">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626] font-mono">
                            <tr>
                              <td className="p-2.5 text-[#0B72E7]">page</td>
                              <td className="p-2.5">Integer</td>
                              <td className="p-2.5">1</td>
                              <td className="p-2.5 text-[#18181B] dark:text-[#D4D4D8] font-sans">Current page number</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 text-[#0B72E7]">limit</td>
                              <td className="p-2.5">Integer</td>
                              <td className="p-2.5">50</td>
                              <td className="p-2.5 text-[#18181B] dark:text-[#D4D4D8] font-sans">Page size limit (Max: 100)</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 text-[#0B72E7]">status</td>
                              <td className="p-2.5">String</td>
                              <td className="p-2.5">"ALL"</td>
                              <td className="p-2.5 text-[#18181B] dark:text-[#D4D4D8] font-sans">Status filter: `MATCHED`, `UNMATCHED`, `VARIANCE`, `ALL`</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "total": 500,
  "page": 1,
  "limit": 50,
  "records": [
    {
      "payment_id": "pay_90001",
      "order_id": "order_80001",
      "amount_paise": 100000,
      "amount_formatted": "₹1,000.00",
      "fee_paise": 2000,
      "gst_paise": 360,
      "net_settled_paise": 97640,
      "utr_number": "UTR2026083091823",
      "status": "MATCHED",
      "match_tier": "TIER_1_EXACT"
    }
  ]
}`}</pre>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "api-controls" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Financial Controls Engine</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Financial Controls & Double-Loss API
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      Continuous real-time surveillance endpoints for monitoring the Seven Financial Controls (CTL_01 to CTL_07), querying open exception tickets, resolving discrepancies through audit-logged actions, and retrieving double-loss forensic hazard warnings.
                    </p>
                  </div>

                  <div id="get-controls-summary" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/controls/summary</code>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7]">
                        Controls Matrix Status
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Evaluates all 7 continuous controls in real-time, aggregating active exception counts, open financial exposure in paise, and control health statuses (`PASS`, `WARN`, `FAIL`).
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "controls": [
    {
      "control_id": "CTL_01_SETTLEMENT_BANK",
      "control_name": "Settlement-to-Bank Mismatch",
      "financial_assertion": "Accuracy",
      "status": "PASS",
      "active_exceptions_count": 0,
      "total_exposure_paise": 0,
      "total_exposure_formatted": "₹0.00"
    },
    {
      "control_id": "CTL_06_DOUBLE_LOSS",
      "control_name": "Potential Double-Loss Outflow Risk",
      "financial_assertion": "Compounded Outflow (Signature #1)",
      "status": "FAIL",
      "active_exceptions_count": 2,
      "total_exposure_paise": 14450000,
      "total_exposure_formatted": "₹1,44,500.00"
    }
  ]
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="get-exceptions" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/controls/exceptions</code>
                      </div>
                      <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">Exception Inbox Query</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Retrieves all flagged financial variance tickets, filtering by lifecycle state (`OPEN`, `RESOLVED`, `ESCALATED`, `SUPPRESSED`) and severity level (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Query Parameters:</span>
                      <div className="border border-[#E5E7EB] dark:border-[#262626] rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-white dark:bg-[#0A0A0A] font-bold text-[#52525B] dark:text-[#A1A1AA] border-b border-[#E5E7EB] dark:border-[#262626]">
                            <tr>
                              <th className="p-2.5">Parameter</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Default</th>
                              <th className="p-2.5">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626] font-mono">
                            <tr>
                              <td className="p-2.5 text-[#0B72E7]">status</td>
                              <td className="p-2.5">String</td>
                              <td className="p-2.5">"OPEN"</td>
                              <td className="p-2.5 text-[#18181B] dark:text-[#D4D4D8] font-sans">Filter by ticket state: `OPEN`, `RESOLVED`, `ESCALATED`, `ALL`</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 text-[#0B72E7]">category</td>
                              <td className="p-2.5">String</td>
                              <td className="p-2.5">null</td>
                              <td className="p-2.5 text-[#18181B] dark:text-[#D4D4D8] font-sans">Category filter: `DOUBLE_LOSS`, `FEE_MISMATCH`, `BANK_CREDIT_UNMATCHED`</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "total_exceptions": 14,
  "exceptions": [
    {
      "exception_id": "exp_01",
      "category": "DOUBLE_LOSS",
      "severity": "CRITICAL",
      "order_id": "ord_99014",
      "payment_id": "pay_77201",
      "financial_impact_paise": 7250000,
      "financial_impact_formatted": "₹72,500.00",
      "description": "Double-Loss Hazard: Concurrent refund and bank chargeback detected on same order.",
      "status": "OPEN",
      "created_at": "2026-08-30T01:14:00Z"
    }
  ]
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="get-doubleloss" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-red-600 text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/controls/double-loss</code>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                        Collision Hazard Detector
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Scans the entire transaction ledger specifically for order identifiers that exhibit concurrent merchant-initiated refunds alongside active payment gateway chargeback disputes.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "total_double_loss_hazards": 2,
  "total_hazard_exposure_paise": 14450000,
  "total_hazard_exposure_formatted": "₹1,44,500.00",
  "alerts": [
    {
      "order_id": "ord_99014",
      "payment_id": "pay_77201",
      "refund_amount_paise": 7200000,
      "dispute_amount_paise": 7250000,
      "hazard_exposure_paise": 14450000,
      "dispute_status": "UNDER_REVIEW",
      "recommendation": "Submit signed dispute packet before cut-off date."
    },
    {
      "order_id": "ord_99018",
      "payment_id": "pay_77205",
      "refund_amount_paise": 4500000,
      "dispute_amount_paise": 4500000,
      "hazard_exposure_paise": 9000000,
      "dispute_status": "NEEDS_EVIDENCE",
      "recommendation": "Freeze settlement payout and upload ARN proof."
    }
  ]
}`}</pre>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "api-evidence" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Activity className="w-4 h-4" />
                      <span>Evidence & Trace Rail</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Evidence & 4-Way Money Trail API
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      Auditors and controllers can query the full 4-way provenance path for any individual transaction or render an interactive Directed Acyclic Graph (DAG) of the money flow.
                    </p>
                  </div>

                  <div id="get-evidence" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/evidence/&#123;payment_id&#125;</code>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                        4-Way Money Trail
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Performs an end-to-end trace joining internal order records, PG capture timestamps, fee deductions (MDR + GST + 194-O TDS), settlement batch allocations, and bank credit statement references with UTR numbers.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "payment_id": "pay_90006",
  "order": {
    "order_id": "order_80006",
    "customer_name": "Ananya Sharma",
    "gross_paise": 150000,
    "gross_formatted": "₹1,500.00",
    "created_at": "2026-08-28T14:22:10Z"
  },
  "gateway_capture": {
    "payment_id": "pay_90006",
    "method": "CARD",
    "card_network": "VISA",
    "mdr_fee_paise": 3000,
    "gst_paise": 540,
    "tds_paise": 150,
    "net_settled_paise": 146310,
    "status": "CAPTURED"
  },
  "settlement": {
    "settlement_id": "set_33019",
    "utr": "HDFCN2026082988172",
    "cleared_at": "2026-08-29T06:30:00Z"
  },
  "bank_statement": {
    "account_number": "XXXXXX9012",
    "credit_paise": 146310,
    "narration": "NEFT-RAZORPAY-HDFCN2026082988172",
    "value_date": "2026-08-29"
  }
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="get-graph" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/evidence/graph/&#123;payment_id&#125;</code>
                      </div>
                      <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">Interactive DAG Graph Nodes</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Outputs nodes and edges representing the exact flow of funds, fee deductions, and clearing status for visual DAG graph rendering in the UI.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "nodes": [
    { "id": "order", "label": "Order #80006", "amount": "₹1,500.00", "type": "origin" },
    { "id": "payment", "label": "Razorpay Pay #90006", "amount": "₹1,500.00", "type": "gateway" },
    { "id": "fees", "label": "MDR (₹30.00) + GST (₹5.40)", "amount": "-₹35.40", "type": "deduction" },
    { "id": "settlement", "label": "Batch #33019", "amount": "₹1,463.10", "type": "settlement" },
    { "id": "bank", "label": "HDFC UTR #88172", "amount": "₹1,463.10", "type": "bank_credit" }
  ],
  "edges": [
    { "from": "order", "to": "payment" },
    { "from": "payment", "to": "fees" },
    { "from": "payment", "to": "settlement" },
    { "from": "settlement", "to": "bank" }
  ]
}`}</pre>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "api-audit" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Lock className="w-4 h-4" />
                      <span>Cryptographic Audit Trail</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Audit Ledger & Merkle Proofs API
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      Every write action, batch settlement clearance, and maker-checker approval is recorded in an immutable append-only ledger protected by SHA-256 hash chaining.
                    </p>
                  </div>

                  <div id="get-ledger" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/audit/ledger</code>
                      </div>
                      <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">Append-Only Chain</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Streams the chronological cryptographic audit log. Each record includes the preceding block hash, current entry hash, actor ID, action type, payload delta diff, and ISO 8601 timestamp.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "total_entries": 128,
  "chain_valid": true,
  "entries": [
    {
      "log_id": "audit_88102",
      "action": "BATCH_RECONCILIATION_COMPLETED",
      "actor_id": "SYSTEM_WORKER_01",
      "target_batch_id": "batch_2026_08_30_001",
      "prev_hash": "c4ca4238a0b923820dcc509a6f75849b",
      "entry_hash": "a87ff679a2f3e71d9181a67b7542122c",
      "timestamp": "2026-08-30T01:55:00Z"
    }
  ]
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="get-verify" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/audit/verify/&#123;log_id&#125;</code>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        Cryptographic Tamper Check
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Recomputes the SHA-256 hash of an individual audit entry against its stored payload and parent hash, proving that the entry has not been altered or tampered with.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "log_id": "audit_88102",
  "is_valid": true,
  "verified_at": "2026-08-30T02:25:10Z",
  "expected_hash": "a87ff679a2f3e71d9181a67b7542122c",
  "calculated_hash": "a87ff679a2f3e71d9181a67b7542122c",
  "integrity_status": "INTACT"
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="get-merkle" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/audit/merkle-root</code>
                      </div>
                      <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">Merkle Tree Batch Seal</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Returns the root hash and intermediate Merkle proof branches for a settlement batch, enabling third-party auditors to verify any individual transaction against the sealed batch without exposing confidential customer metadata.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "batch_id": "batch_2026_08_30_001",
  "leaf_count": 500,
  "merkle_root": "8f4a1324b899e12089408b0451a8f614532c589b2512a8907a9b0c2e3d5412fa",
  "algorithm": "SHA-256",
  "sealed_timestamp": "2026-08-30T01:55:00Z"
}`}</pre>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "api-approvals" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Governance Rails</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Maker-Checker Approvals & Dual-Control API
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      Enforces the Four-Eyes principle for all material financial adjustments, manual write-offs, and dispute evidence submissions.
                    </p>
                  </div>

                  <div id="get-approvals-pending" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/approvals/pending</code>
                      </div>
                      <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">Pending Review Queue</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Retrieves all active resolution drafts submitted by Makers that require a Checker (Supervisor) sign-off before financial changes are applied to the ledger.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "total_pending": 3,
  "requests": [
    {
      "approval_request_id": "appr_77192",
      "exception_id": "exp_01",
      "action_type": "FEE_WRITE_OFF",
      "amount_paise": 2400,
      "amount_formatted": "₹24.00",
      "justification": "Verified aggregator interchange spike due to commercial card swipe schedule difference.",
      "maker_id": "OPERATOR_PRIYA_SHAH",
      "status": "PENDING_CHECKER_REVIEW",
      "created_at": "2026-08-30T02:20:00Z"
    }
  ]
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="post-approvals-submit" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">POST</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/approvals/submit</code>
                      </div>
                      <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">Draft Resolution Submission</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Submitted by a Maker proposing a financial write-off or manual variance resolution. The proposal is queued until an authorized Checker signs it.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Request Body (JSON):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "exception_id": "exp_01",
  "action_type": "FEE_WRITE_OFF",
  "amount_paise": 2400,
  "justification": "Verified aggregator interchange spike due to commercial card swipe schedule difference.",
  "maker_id": "OPERATOR_PRIYA_SHAH"
}`}</pre>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "approval_request_id": "appr_77192",
  "status": "PENDING_CHECKER_REVIEW",
  "created_at": "2026-08-30T02:20:00Z",
  "requires_checker_role": "SUPERVISOR_FINANCE"
}`}</pre>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "api-sources" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Terminal className="w-4 h-4" />
                      <span>Ingestion Pipeline</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Data Sources & Razorpay Sync API
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      Upload raw multi-rail CSV/JSON transaction manifests or trigger real-time synchronization with the Razorpay Merchant API.
                    </p>
                  </div>

                  <div id="post-upload" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">POST</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/sources/upload</code>
                      </div>
                      <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">Multipart Form File Ingestion</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Parses and ingests raw merchant files (Orders, PG Settlements, or Bank Statements). Validates column types, standardizes timestamps to UTC ISO 8601, converts rupee decimals to minor unit paise, and performs schema validation.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "success": true,
  "filename": "razorpay_settlement_aug2026.csv",
  "records_ingested": 500,
  "source_type": "PG_SETTLEMENT_MANIFEST",
  "sha256_checksum": "7c9e53b49911e2f...a"
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="post-sync" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">POST</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/razorpay/sync</code>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7]">
                        Direct Gateway Pull
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Polls the official Razorpay Merchant API via secure credentials to fetch all captured payments, processed refunds, active disputes, and batch settlements within the specified date range.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Request Body (JSON):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "from_date": "2026-08-01T00:00:00Z",
  "to_date": "2026-08-30T23:59:59Z",
  "sync_types": ["PAYMENTS", "REFUNDS", "SETTLEMENTS", "DISPUTES"]
}`}</pre>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "status": "COMPLETED",
  "records_synced": 500,
  "new_payments_count": 42,
  "new_settlements_count": 4,
  "last_synced_at": "2026-08-30T02:29:00Z"
}`}</pre>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "api-reports" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <FileText className="w-4 h-4" />
                      <span>Executive Intelligence</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Daily Brief & PDF Evidence Export API
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      Synthesizes high-level executive summaries with cash velocity and generates tamper-proof PDF dispute evidence dossiers.
                    </p>
                  </div>

                  <div id="get-daily-brief" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/reports/daily-brief</code>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7]">
                        AI Synthesized Brief
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Synthesizes a daily natural language finance summary highlighting net settled volume, fee leakage detected, open chargebacks, and recommended actions for the CFO.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Body (200 OK):</span>
                      <div className="p-4 rounded-xl bg-[#0A0A0A] text-[#3395FF] font-mono text-xs overflow-x-auto">
                        <pre>{`{
  "date": "2026-08-30",
  "headline": "Reconciliation match rate at 96.31% with ₹10.87L open exception exposure across 28 un-cleared payments.",
  "key_findings": [
    "Gross order volume reached ₹52.43L across 500 customer checkouts.",
    "2 Double-Loss hazard vectors detected and blocked on ord_99014 and ord_99018.",
    "Blended MDR efficiency observed at 1.62%, within contracted rate parameters."
  ],
  "recommended_actions": [
    "Submit automated dispute evidence pack for pay_77201 before Razorpay 7-day arbitration cut-off."
  ]
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div id="get-download-pdf" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#262626] pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2.5 py-1 rounded bg-[#0B72E7] text-white font-mono font-bold text-xs">GET</span>
                        <code className="font-mono text-sm font-bold text-[#09090B] dark:text-white">/api/reports/download-pdf</code>
                      </div>
                      <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">Binary PDF Stream</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#09090B] dark:text-white">What this endpoint does:</h4>
                      <p className="text-sm text-[#18181B] dark:text-[#D4D4D8] mt-1 leading-relaxed font-normal">
                        Generates a digitally signed dispute defense dossier formatted as a PDF, embedding payment gateway logs, bank UTR records, and ARN delivery receipts.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Query Parameters:</span>
                      <div className="border border-[#E5E7EB] dark:border-[#262626] rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-white dark:bg-[#0A0A0A] font-bold text-[#52525B] dark:text-[#A1A1AA] border-b border-[#E5E7EB] dark:border-[#262626]">
                            <tr>
                              <th className="p-2.5">Parameter</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Default</th>
                              <th className="p-2.5">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626] font-mono">
                            <tr>
                              <td className="p-2.5 text-[#0B72E7]">type</td>
                              <td className="p-2.5">String</td>
                              <td className="p-2.5">"double_loss"</td>
                              <td className="p-2.5 text-[#18181B] dark:text-[#D4D4D8] font-sans">Report category: `double_loss`, `reconciliation_certificate`, `audit_log`</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 text-[#0B72E7]">id</td>
                              <td className="p-2.5">String</td>
                              <td className="p-2.5">null</td>
                              <td className="p-2.5 text-[#18181B] dark:text-[#D4D4D8] font-sans">Target reference ID: exception ticket ID or payment ID</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#52525B] dark:text-[#A1A1AA] uppercase block">Response Headers (200 OK):</span>
                      <div className="p-3 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] font-mono text-xs text-[#18181B] dark:text-[#D4D4D8] space-y-1">
                        <div>Content-Type: application/pdf</div>
                        <div>Content-Disposition: attachment; filename="HISAB_Dispute_Defense_exp_01.pdf"</div>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "collaboration" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Users className="w-4 h-4" />
                      <span>Governance & Dual-Control</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Maker-Checker Dual-Control Governance
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      In high-velocity financial operations, un-reviewed ledger mutations and unilateral write-offs represent significant internal control hazards. HISAB mandates a cryptographic Four-Eyes dual-authorization workflow for all material financial adjustments, dispute defense packages, and manual exception clearances.
                    </p>
                  </div>

                  <div id="four-eyes" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Users className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        The Four-Eyes Principle & Segregation of Duties
                      </h3>
                    </div>

                    <p className="text-sm text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      Under statutory financial guidelines (including RBI Master Directions on Payment Aggregators and SOC 1 Type II compliance), no single operator possesses the authority to create and unilaterally execute a financial variance write-off.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] block">1. The Maker (Analyst)</span>
                        <p className="text-xs text-[#27272A] dark:text-[#A1A1AA] leading-relaxed">
                          Identifies variance exceptions from the 4-way matching engine, investigates underlying transaction trails, selects an accounting adjustment category, and compiles the evidence packet into a pending draft resolution.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-purple-600 dark:text-purple-400 block">2. The Checker (Supervisor / Manager)</span>
                        <p className="text-xs text-[#27272A] dark:text-[#A1A1AA] leading-relaxed">
                          Independently reviews the transaction trace, verifies fee contract calculations, inspects bank statement credit lines, and digitally signs the approval or rejection with mandatory audit justification notes.
                        </p>
                      </div>
                    </div>

                    <MermaidViewer
                      chart={`
graph TD
  A[Maker Discovers Exception] --> B[Package 4-Way Evidence & Justification]
  B --> C[Submit to Dual-Control Approval Inbox]
  C --> D[Checker Inspects Trace & Policy Thresholds]
  D -- Reject Ticket --> E[Return to Maker with Audit Feedback]
  D -- Approve Resolution --> F[Execute Ledger Mutation]
  F --> G[Cryptographic SHA-256 Audit Log Sealed]
                      `}
                    />
                  </div>

                  <div id="maker-flow" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Activity className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Maker Workflow & Evidence Packaging
                      </h3>
                    </div>

                    <p className="text-sm text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      When an analyst opens an exception ticket in the HISAB Exceptions Inbox, the system automatically bundles all relevant entities into an immutable evidence container:
                    </p>

                    <div className="border border-[#E5E7EB] dark:border-[#262626] rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-white dark:bg-[#0A0A0A] font-bold text-[#27272A] dark:text-[#A1A1AA] border-b border-[#E5E7EB] dark:border-[#262626]">
                          <tr>
                            <th className="p-3">Bundle Entity</th>
                            <th className="p-3">Source System</th>
                            <th className="p-3">Verification Target</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626]">
                          <tr>
                            <td className="p-3 font-mono font-bold text-[#0B72E7]">Internal Order Record</td>
                            <td className="p-3">Merchant OMS / Database</td>
                            <td className="p-3 text-[#52525B] dark:text-[#A1A1AA]">Order ID, gross customer checkout amount, GST rate breakdown.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">Gateway Authorization</td>
                            <td className="p-3">Razorpay Webhook Rail</td>
                            <td className="p-3 text-[#52525B] dark:text-[#A1A1AA]">Payment ID, method (Credit Card/UPI), contractual MDR and tax withholdings.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">Settlement Manifest</td>
                            <td className="p-3">Aggregator Settlement Batch</td>
                            <td className="p-3 text-[#52525B] dark:text-[#A1A1AA]">Settlement UTR, batch grouping timestamp, net lump-sum payout amount.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">Bank Statement Credit</td>
                            <td className="p-3">Acquiring Bank MT940 / CAMT.053</td>
                            <td className="p-3 text-[#52525B] dark:text-[#A1A1AA]">Bank reference ARN, actual deposit timestamp, account balance credit.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div id="checker-review" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Supervisor Review & Digital Sign-off Execution
                      </h3>
                    </div>

                    <p className="text-sm text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      The Checker inspects the draft ticket, verifies that the variance falls within authorized policy bands, and executes the resolution via authenticated API signature:
                    </p>

                    <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                      <div className="text-slate-400"># Checker Sign-off Request Payload (POST /api/approvals/submit)</div>
                      <pre>{`{
  "approval_id": "appr_99812",
  "decision": "APPROVED",
  "checker_user_id": "usr_mgr_rajesh_gupta",
  "checker_role": "FINANCE_MANAGER",
  "resolution_type": "MDR_SCHEDULE_VARIANCE_WRITE_OFF",
  "authorized_amount_paise": 2460,
  "justification_note": "Verified against Razorpay rate schedule amendment v2.4 (effective Aug 1). Approved.",
  "signature_timestamp": "2026-08-30T02:45:00Z"
}`}</pre>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "audit-trail" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Lock className="w-4 h-4" />
                      <span>Cryptographic Assurance</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Cryptographic Audit Ledger & Compliance Engine
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      Every transaction state transition, manual operator adjustment, exception clearance, and batch closure is permanently recorded in an append-only cryptographic audit ledger. Forward-linked SHA-256 hash chaining ensures mathematical tamper-evidence for statutory audits.
                    </p>
                  </div>

                  <div id="append-only" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Lock className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Append-Only SHA-256 Hash Chain Structure
                      </h3>
                    </div>

                    <p className="text-sm text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      Each audit log entry computes its hash by incorporating the hash of the preceding entry in the sequence:
                    </p>

                    <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] font-mono text-xs text-[#0B72E7] dark:text-[#3395FF] overflow-x-auto">
                      H_n = SHA256( H_(n-1) || Payload_n || Timestamp_n || UserRole_n || ActionCode_n )
                    </div>

                    <p className="text-sm text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      If an unauthorized party attempts to alter a historical database row, the calculated SHA-256 hash immediately diverges from the stored hash, causing all downstream chain validations to fail with an integrity alert.
                    </p>

                    <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                      <div className="text-slate-400"># Audit Log Entry JSON Schema</div>
                      <pre>{`{
  "log_id": "audit_88102",
  "sequence_index": 1042,
  "parent_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "entry_hash": "a87ff679a2f3e71d9181a67b7542122c451b6e41b9d4e5f6a7b8c9d0e1f2a3b4",
  "action": "APPROVAL_SIGN_OFF",
  "actor_id": "usr_mgr_rajesh_gupta",
  "actor_role": "FINANCE_MANAGER",
  "target_entity": "exp_batch_2026_08_30_001",
  "payload_summary": "Manual clearance of 2 paise micro-rounding variance",
  "timestamp": "2026-08-30T02:45:00.182Z"
}`}</pre>
                    </div>
                  </div>

                  <div id="statutory-compliance" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Statutory Auditor Compliance & Standards Mapping
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block">SOC 1 Type II & SOC 2</span>
                        <p className="text-[#52525B] dark:text-[#A1A1AA]">Continuous control monitoring over processing integrity, financial completeness, and data availability.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block">RBI Master Directions</span>
                        <p className="text-[#52525B] dark:text-[#A1A1AA]">Escrow account reconciliation guidelines, T+2 settlement turnaround times, and merchant payout assertions.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block">Section 143 Companies Act</span>
                        <p className="text-[#52525B] dark:text-[#A1A1AA]">Internal Financial Controls (IFC) testing with immutable proof of dual authorization for material write-offs.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1">
                        <span className="font-bold text-[#09090B] dark:text-white block">Section 194-O Income Tax</span>
                        <p className="text-[#52525B] dark:text-[#A1A1AA]">1% e-commerce operator TDS deductions reconciled quarterly against Form 26AS portal deposits.</p>
                      </div>
                    </div>
                  </div>

                  <div id="tamper-evident" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Terminal className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Tamper-Evident Verification Walkthrough
                      </h3>
                    </div>

                    <p className="text-sm text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      External auditors can verify any ledger slice on demand by invoking the cryptographic audit verification endpoint:
                    </p>

                    <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                      <div className="text-slate-400"># Verify Chain Integrity (curl command)</div>
                      <pre>{`curl -X GET "http://localhost:8000/api/audit/verify/audit_88102" \\
  -H "Authorization: Bearer auditor_session_token_live"`}</pre>
                    </div>
                  </div>
                </article>
              )}

              {activeDocId === "access-roles" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Security Architecture</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Role-Based Access Control (RBAC) & Session Security
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      HISAB implements strict Principle of Least Privilege (PoLP) access controls. User permissions are partitioned across four granular operational tiers with enforced token rotation and session invalidation.
                    </p>
                  </div>

                  <div id="roles-matrix" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Four-Tier Role Permission Hierarchy
                      </h3>
                    </div>

                    <div className="border border-[#E5E7EB] dark:border-[#262626] rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-white dark:bg-[#0A0A0A] font-bold text-[#27272A] dark:text-[#A1A1AA] border-b border-[#E5E7EB] dark:border-[#262626]">
                          <tr>
                            <th className="p-3">Role</th>
                            <th className="p-3">Typical Persona</th>
                            <th className="p-3">Maker Rights</th>
                            <th className="p-3">Checker Rights</th>
                            <th className="p-3">System Scope</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262626]">
                          <tr>
                            <td className="p-3 font-mono font-bold text-red-600 dark:text-red-400">ADMIN</td>
                            <td className="p-3">Finance Controller / Head of Tech</td>
                            <td className="p-3">Draft Tickets</td>
                            <td className="p-3">All Thresholds</td>
                            <td className="p-3 text-[#52525B] dark:text-[#A1A1AA]">Full access, gateway credentials, webhook secrets, user provisioning.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">FINANCE_MANAGER</td>
                            <td className="p-3">Accounting Lead / Supervisor</td>
                            <td className="p-3">Draft Tickets</td>
                            <td className="p-3">&le; ₹1,00,000</td>
                            <td className="p-3 text-[#52525B] dark:text-[#A1A1AA]">Batch closure authorization, Maker ticket sign-off, policy overrides.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold text-[#0B72E7]">ANALYST</td>
                            <td className="p-3">Reconciliation Analyst</td>
                            <td className="p-3">Create Drafts</td>
                            <td className="p-3 text-red-500">None</td>
                            <td className="p-3 text-[#52525B] dark:text-[#A1A1AA]">Run reconciliations, inspect money trace flows, attach evidence packets.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">AUDITOR</td>
                            <td className="p-3">External Statutory Auditor</td>
                            <td className="p-3 text-red-500">None</td>
                            <td className="p-3 text-red-500">None</td>
                            <td className="p-3 text-[#52525B] dark:text-[#A1A1AA]">Read-only access to cryptographic ledger, Merkle roots, and compliance reports.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div id="least-privilege" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Lock className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Least-Privilege Route & Action Middleware
                      </h3>
                    </div>

                    <p className="text-sm text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      API endpoints enforce RBAC decorators in FastAPI backend handlers. If an Analyst attempts to approve a ticket or an Auditor attempts to trigger a batch closure, the gateway intercepts the request with a `403 Forbidden` response and logs a security violation:
                    </p>

                    <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                      <div className="text-slate-400"># FastAPI RBAC Enforcement Decorator</div>
                      <pre>{`from fastapi import Depends, HTTPException, status

def require_roles(allowed_roles: list[str]):
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker

@router.post("/api/approvals/submit")
async def approve_resolution(
    payload: ApprovalSubmission,
    user = Depends(require_roles(["ADMIN", "FINANCE_MANAGER"]))
):
    return await execute_checker_approval(payload, user)`}</pre>
                    </div>
                  </div>

                  <div id="session-security" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Terminal className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        JWT Token Expiration & Instant Invalidation
                      </h3>
                    </div>

                    <p className="text-sm text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      HISAB issues HS256-signed JWT tokens with a 15-minute sliding TTL. When a user logs out or an administrator revokes access, the token unique ID (`jti`) is added to a Redis blocklist (`revoked_tokens:&#123;jti&#125;`) with matching expiration, instantly invalidating the session across all active browser windows.
                    </p>
                  </div>
                </article>
              )}

              {activeDocId === "policy-limits" && (
                <article className="space-y-8">
                  <div className="border-b border-[#E5E7EB] dark:border-[#262626] pb-5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider mb-1.5">
                      <Sliders className="w-4 h-4" />
                      <span>Materiality Governance</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#09090B] dark:text-white tracking-tight">
                      Financial Materiality Bands & Write-Off Policies
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#27272A] dark:text-[#D4D4D8] mt-2 leading-relaxed font-normal">
                      Balancing financial accuracy with operational velocity requires strict materiality tolerance bands. HISAB allows controllers to set automated clearance thresholds for micro-rounding while enforcing mandatory escalation paths for material anomalies.
                    </p>
                  </div>

                  <div id="materiality-thresholds" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <Sliders className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Three-Tier Materiality Tolerance Bands
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">Band 1: Auto-Clear</span>
                        <div className="font-mono text-xs text-[#0B72E7]">Variance &le; 2 paise</div>
                        <p className="text-[#52525B] dark:text-[#A1A1AA]">
                          Standard IEEE-754 currency conversion rounding difference. Auto-cleared to Rounding Offset Ledger.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-amber-600 dark:text-amber-400 block">Band 2: Maker-Checker</span>
                        <div className="font-mono text-xs text-[#0B72E7]">2 paise &lt; Var &le; ₹10,000</div>
                        <p className="text-[#52525B] dark:text-[#A1A1AA]">
                          Requires Analyst investigation, dispute category assignment, and Finance Manager digital sign-off.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] space-y-1.5">
                        <span className="font-bold text-red-600 dark:text-red-400 block">Band 3: Executive Freeze</span>
                        <div className="font-mono text-xs text-[#0B72E7]">Variance &gt; ₹10,000</div>
                        <p className="text-[#52525B] dark:text-[#A1A1AA]">
                          Automated payout freeze on batch. Requires Controller / CFO level authorization and bank notification.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div id="override-rules" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Supervisor Override & Escalation Matrix
                      </h3>
                    </div>

                    <p className="text-sm text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      When unusual gateway outages or card network settlement delays cause cluster variances (e.g. 50+ UPI transactions delayed by bank switch maintenance), a Finance Manager can execute a batch override. Overrides require two concurrent checkers for cumulative amounts exceeding ₹50,000.
                    </p>
                  </div>

                  <div id="payout-freeze" className="space-y-4 p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E7EB] dark:border-[#262626]">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                        <AlertOctagon className="w-4 h-4" />
                      </span>
                      <h3 className="font-bold text-base text-[#09090B] dark:text-white">
                        Automated Payout Freeze Invariant (CTL_06)
                      </h3>
                    </div>

                    <p className="text-sm text-[#27272A] dark:text-[#D4D4D8] leading-relaxed font-normal">
                      If Control `CTL_06` detects a double-loss attempt (where a customer receives both an instant refund and an issuing bank chargeback credit on the same `order_id`), HISAB instantly freezes settlement batch closure:
                    </p>

                    <div className="p-4 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                      <div className="text-slate-400"># Payout Freeze Invariant Condition</div>
                      <pre>{`if transaction.has_refund and transaction.has_chargeback:
    batch.freeze_closure(reason="CTL_06_DOUBLE_LOSS_RISK")
    pdf_evidence = generate_dispute_package(transaction)
    notify_finance_controller(transaction, pdf_evidence)`}</pre>
                    </div>
                  </div>
                </article>
              )}

            </main>

            <aside className="lg:col-span-3 bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#262626] rounded-2xl p-5 shadow-xs space-y-4 sticky top-28">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A1A1AA] block">
                On this page
              </span>
              <div className="space-y-1.5 text-sm">
                {currentDoc.anchors.length > 0 ? (
                  currentDoc.anchors.map((anchor) => (
                    <a
                      key={anchor.id}
                      href={`#${anchor.id}`}
                      className="block px-3 py-2 rounded-xl text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A1A1A] transition-colors"
                    >
                      {anchor.label}
                    </a>
                  ))
                ) : (
                  <span className="text-xs text-[#A1A1AA] px-3 block">No additional sub-headings</span>
                )}
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#262626] space-y-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase block">Need Support?</span>
                <button
                  onClick={() => {
                    setActiveSectionId("chat");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Ask Docs AI</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </aside>

          </div>
        )}

      </div>

      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-[#0B72E7] hover:bg-[#095ec4] text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
          title="Open Docs AI Copilot"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {isCopilotOpen && (
        <div className="lg:hidden fixed bottom-6 right-6 z-50 w-96 max-w-[92vw] h-[520px] bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#262626] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          <div className="h-12 bg-[#0A0A0A] text-white px-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#0B72E7]" />
              <span className="font-bold text-xs">HISAB Docs AI Copilot</span>
            </div>
            <button
              onClick={() => setIsCopilotOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-[#A1A1AA] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-2.5 rounded-xl max-w-[90%] ${
                    msg.sender === "user"
                      ? "bg-[#0B72E7] text-white font-medium rounded-br-none"
                      : "bg-[#F8FAFC] dark:bg-[#1A1A1A] text-[#09090B] dark:text-[#EDEDED] border border-[#E5E7EB] dark:border-[#262626] rounded-bl-none"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <span>{msg.text}</span>
                  ) : (
                    <FormattedMarkdown content={msg.text} />
                  )}
                </div>
              </div>
            ))}
            {docLoading && (
              <div className="flex items-center space-x-2 text-xs text-[#71717A] p-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#0B72E7]" />
                <span>Searching docs...</span>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[#E5E7EB] dark:border-[#262626] flex items-center space-x-2">
            <input
              type="text"
              value={docQuery}
              onChange={(e) => setDocQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendDocQuery()}
              placeholder="Quick search docs..."
              className="flex-1 bg-[#FAFAFA] dark:bg-[#0E0E0E] text-xs px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262626] text-[#09090B] dark:text-[#EDEDED] focus:outline-none focus:border-[#0B72E7]"
            />
            <button
              onClick={() => handleSendDocQuery()}
              disabled={docLoading || !docQuery.trim()}
              className="p-2 rounded-xl bg-[#0B72E7] hover:bg-[#095ec4] text-white text-xs font-semibold flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
