"use client";

import React, { useState } from "react";
import { 
  BookOpen, 
  Zap, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  Sparkles, 
  ExternalLink, 
  ChevronRight, 
  Send, 
  Copy, 
  Check, 
  FileText, 
  Calculator, 
  Scale, 
  ArrowRight,
  Code2,
  Lock,
  Database,
  ArrowUpRight,
  HelpCircle
} from "lucide-react";
import { MermaidViewer } from "@/components/MermaidViewer";
import { FormattedMarkdown } from "@/components/FormattedMarkdown";
import { fetchApi } from "@/lib/api";

interface DocumentationPageViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const DocumentationPageView: React.FC<DocumentationPageViewProps> = ({
  onNavigateTab = () => {},
}) => {
  const [activeSection, setActiveSection] = useState<string>("quickstart");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [docQuery, setDocQuery] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "### Welcome to HISAB Interactive Docs AI\nAsk me anything about:\n- **Razorpay Webhooks & API Integration**\n- **MDR (Merchant Discount Rate)** calculation formulas\n- **Section 194-O TDS (0.10%)** compliance\n- **3-Tier Reconciliation Algorithm** (Exact, Heuristic, Subset-Sum)\n- **Forensic Double-Loss Prevention**\n\nHow can I help your finance or engineering team today?",
    },
  ]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSendDocQuery = async (customQ?: string) => {
    const qText = customQ || docQuery;
    if (!qText.trim()) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: qText }]);
    setDocQuery("");
    setDocLoading(true);

    try {
      const res = await fetchApi<any>("/api/ask-hisab", {
        method: "POST",
        body: JSON.stringify({ query: qText }),
      });
      setChatMessages((prev) => [...prev, { sender: "ai", text: res.answer }]);
    } catch (e) {
      console.error(e);
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Unable to query docs intelligence. Please ensure backend is running." },
      ]);
    } finally {
      setDocLoading(false);
    }
  };

  const menuItems = [
    { id: "quickstart", title: "1. Razorpay Integration", icon: Zap, badge: "Setup" },
    { id: "mdr", title: "2. MDR & Gateway Economics", icon: Calculator, badge: "Commercials" },
    { id: "gst", title: "3. 18% GST & ITC Matching", icon: Scale, badge: "Tax" },
    { id: "tds194o", title: "4. Section 194-O TDS (0.10%)", icon: FileText, badge: "Statutory" },
    { id: "engine", title: "5. 3-Tier Match Engine", icon: Layers, badge: "Algorithms" },
    { id: "controls", title: "6. 7 Financial Controls", icon: ShieldCheck, badge: "Assurance" },
    { id: "doubleloss", title: "7. Double-Loss Forensics", icon: AlertTriangle, badge: "Security" },
    { id: "chatdocs", title: "8. Chat with HISAB Docs", icon: Sparkles, badge: "AI Assistant" },
  ];

  return (
    <div className="space-y-6 font-sans select-none animate-in fade-in">
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base font-bold text-[#0F172A] dark:text-[#EDEDED] tracking-tight">
                HISAB Controller Documentation & Knowledge Hub
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800">
                v1.0.4 Production
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
              Razorpay API & Webhook Rail, MDR Fee Formulas, Section 194-O TDS Invariants, and Reconciliation Engine Proofs.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab("razorpay-sync")}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Razorpay Connection Console</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-3 shadow-xs space-y-1 sticky top-20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#A1A1AA] px-3 py-1.5 block">
            Table of Contents
          </span>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all text-left ${
                  isActive
                    ? "bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#0B72E7] dark:text-[#3395FF] font-bold shadow-xs border border-[#E2E8F0] dark:border-[#333333]"
                    : "text-[#475569] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#0B72E7]" : "text-[#64748B]"}`} />
                  <span className="truncate text-xs">{item.title}</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? "bg-blue-100 text-[#0B72E7] dark:bg-blue-950 dark:text-[#3395FF]" : "bg-slate-100 dark:bg-slate-800 text-[#64748B]"
                }`}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-9 bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
          
          {activeSection === "quickstart" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  1. Razorpay Webhook & API Setup Guide
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                  HISAB operates as a real-time financial assertion gateway between Razorpay, internal order management systems, and bank account ledgers. Follow these steps to stream reconciliation events.
                </p>
              </div>

              <MermaidViewer
                chart={`
graph LR
  subgraph RazorpayGateway["Razorpay Rail"]
    RP1[Customer Checkout] --> RP2[payment.captured]
    RP2 --> RP3[settlement.processed]
    RP2 --> RP4[refund.processed]
  end

  subgraph HisabEngine["HISAB Controller"]
    RP2 -- Webhook HMAC --> H1[Webhook Ingestion]
    RP3 -- UTR Manifest --> H2[3-Tier Matcher]
    RP4 -- Double-Loss Guard --> H3[CTL_06 Scanner]
    H2 --> H4[Audit Hash Sealed]
  end

  subgraph BankRail["Acquiring Bank"]
    B1[NEFT/RTGS Credit] --> H2
  end

  classDef blue fill:#0B72E7,stroke:#0052CC,color:#fff,stroke-width:2px;
  classDef green fill:#10B981,stroke:#059669,color:#fff,stroke-width:2px;
  classDef amber fill:#F59E0B,stroke:#D97706,color:#fff,stroke-width:2px;

  class RP2,RP3 blue;
  class H2,H4 green;
  class H3 amber;
                `}
              />

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] space-y-2">
                  <span className="font-bold text-xs text-[#0F172A] dark:text-white flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#0B72E7] text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Configure Razorpay Webhook Endpoint</span>
                  </span>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                    Navigate to **Razorpay Dashboard &gt; Settings &gt; Webhooks** and add your HISAB webhook listener:
                  </p>
                  <div className="relative p-3 rounded-xl bg-[#0A0A0A] text-slate-200 font-mono text-[11px]">
                    <code>POST https://api.hisab.internal/api/razorpay/webhook</code>
                    <button
                      onClick={() => handleCopy("https://api.hisab.internal/api/razorpay/webhook", "webhook-url")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      {copiedCode === "webhook-url" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] space-y-2">
                  <span className="font-bold text-xs text-[#0F172A] dark:text-white flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#0B72E7] text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Subscribed Webhook Events</span>
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <li className="p-2.5 rounded-lg bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] font-mono">
                      <code>payment.captured</code>
                    </li>
                    <li className="p-2.5 rounded-lg bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] font-mono">
                      <code>settlement.processed</code>
                    </li>
                    <li className="p-2.5 rounded-lg bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] font-mono">
                      <code>refund.processed</code>
                    </li>
                    <li className="p-2.5 rounded-lg bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] font-mono">
                      <code>dispute.created</code>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === "mdr" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  2. Merchant Discount Rate (MDR) & Commercial Economics
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                  MDR is the commission retained by payment gateways and card networks for transaction switching.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-3">
                <span className="text-xs font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase tracking-wider block">
                  Exact Invariant Formula (Minor-Unit Paise Precision)
                </span>
                <div className="font-mono text-xs bg-white dark:bg-[#0E0E0E] p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                  MDR Fee (Paise) = round( Gross Transaction Value (Paise) × (MDR Basis Points / 10000) )
                </div>
                <p className="text-[11px] text-[#475569] dark:text-[#A1A1AA]">
                  Example: On a ₹1,000.00 (100,000 paise) Card payment with a 200 bps (2.0%) rate schedule:
                  <br />
                  <code>100,000 × 0.02 = 2,000 paise (₹20.00 MDR Fee)</code>
                </p>
              </div>

              <div className="border border-[#E2E8F0] dark:border-[#262626] rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] dark:bg-[#0E0E0E] border-b border-[#E2E8F0] dark:border-[#262626] text-[11px] font-bold text-[#64748B]">
                    <tr>
                      <th className="p-3">Payment Instrument</th>
                      <th className="p-3">Basis Points</th>
                      <th className="p-3">MDR Rate</th>
                      <th className="p-3">Interchange Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                    <tr>
                      <td className="p-3 font-semibold">Credit / Debit Cards</td>
                      <td className="p-3 font-mono">200 bps</td>
                      <td className="p-3 font-bold text-[#0B72E7]">2.00%</td>
                      <td className="p-3 text-[#64748B]">Visa/Mastercard Interchange</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Corporate & Amex Cards</td>
                      <td className="p-3 font-mono">300 bps</td>
                      <td className="p-3 font-bold text-[#0B72E7]">3.00%</td>
                      <td className="p-3 text-[#64748B]">Commercial Interchange Schedule</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Netbanking / Corporate</td>
                      <td className="p-3 font-mono">180 bps</td>
                      <td className="p-3 font-bold text-[#0B72E7]">1.80%</td>
                      <td className="p-3 text-[#64748B]">Direct Bank Gateway Fee</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">UPI Instant Rail</td>
                      <td className="p-3 font-mono">0 bps</td>
                      <td className="p-3 font-bold text-[#16A34A]">0.00% (Zero MDR)</td>
                      <td className="p-3 text-[#64748B]">RBI Sovereign Mandate</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "gst" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  3. 18.00% GST on Payment Aggregator Charges & ITC
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                  In India, payment aggregator MDR retentions are subject to 18% Goods & Services Tax (9% CGST + 9% SGST or 18% IGST).
                </p>
              </div>

              <MermaidViewer
                chart={`
graph TD
  A[Gross Payment Capture: ₹1,000.00] --> B[MDR Fee 2.0%: ₹20.00]
  B --> C[18% GST on Fee: ₹3.60]
  C --> D[Total Deduction: ₹23.60]
  A --> E[Net Settlement to Bank: ₹976.40]
  D --> F[Razorpay Monthly GST Invoice GSTR-2B]
  F --> G[Input Tax Credit ITC Claimed ₹3.60]

  classDef blue fill:#0B72E7,stroke:#0052CC,color:#fff,stroke-width:2px;
  classDef green fill:#10B981,stroke:#059669,color:#fff,stroke-width:2px;
  classDef purple fill:#8B5CF6,stroke:#6D28D9,color:#fff,stroke-width:2px;

  class A,B blue;
  class E,G green;
  class C,F purple;
                `}
              />

              <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] space-y-2 text-xs">
                <span className="font-bold text-xs text-[#0F172A] dark:text-white">
                  Input Tax Credit (ITC) Verification
                </span>
                <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] leading-relaxed">
                  HISAB aggregates every GST deduction across all captured payments and matches it against the Razorpay monthly GST invoice in GSTR-2B. This guarantees that your accounting team claims 100% of eligible Input Tax Credit without manual spreadsheet reconciliations.
                </p>
              </div>
            </div>
          )}

          {activeSection === "tds194o" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  4. Section 194-O E-Commerce TDS (0.10% / 10 bps)
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                  Section 194-O of the Indian Income Tax Act requires e-commerce operators to withhold tax at source on gross digital sales.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-3 text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  Statutory Rate & Compliance Rules
                </span>
                <ul className="space-y-2 text-[11px] text-[#475569] dark:text-[#A1A1AA]">
                  <li>• **Withholding Rate**: **0.10% (10 bps)** on Gross Merchandise Value (GMV).</li>
                  <li>• **Base Value**: Applied to the Gross Sale amount *before* deducting gateway MDR or customer refunds.</li>
                  <li>• **Form 26AS Matching**: Razorpay deposits this TDS quarterly under TAN; HISAB audits your Form 26AS & AIS withholding credit ledger.</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === "engine" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  5. Autonomous 3-Tier Reconciliation Engine Internals
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                  HISAB uses a 3-tier algorithm hierarchy designed for sub-millisecond throughput with zero mathematical drift.
                </p>
              </div>

              <MermaidViewer
                chart={`
graph TD
  Start[Raw Ingestion Records] --> T1[Tier 1: Deterministic Exact ID Match]
  T1 -- Match Found 89.2% --> M1[Reconciled & UTR Sealed]
  T1 -- Unmatched --> T2[Tier 2: Multi-Constraint Window Match]
  T2 -- Match Found 8.8% --> M2[Reconciled T+2 Tolerance]
  T2 -- Unmatched Merged Batch --> T3[Tier 3: Subset-Sum Decomposition]
  T3 -- Knapsack Solved 1.6% --> M3[Reconstructed Batch Component]
  T3 -- Residual Variance --> Anom[Open Exception Flagged for Controller Review]

  classDef green fill:#10B981,stroke:#059669,color:#fff,stroke-width:2px;
  classDef blue fill:#0B72E7,stroke:#0052CC,color:#fff,stroke-width:2px;
  classDef purple fill:#8B5CF6,stroke:#6D28D9,color:#fff,stroke-width:2px;
  classDef red fill:#EF4444,stroke:#DC2626,color:#fff,stroke-width:2px;

  class M1 green;
  class M2 blue;
  class M3 purple;
  class Anom red;
                `}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] space-y-1">
                  <span className="font-bold text-[#16A34A] block">Tier 1: Exact Match</span>
                  <span className="text-[10px] text-[#64748B] block">Latency: 0.14 ms</span>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                    O(1) hash table lookup matching Razorpay payment IDs directly to settlement UTRs.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] space-y-1">
                  <span className="font-bold text-[#0B72E7] block">Tier 2: Window Heuristic</span>
                  <span className="text-[10px] text-[#64748B] block">Latency: 1.82 ms</span>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                    T+2 settlement window matching accounting for bank clearing delays and currency conversions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] space-y-1">
                  <span className="font-bold text-[#8B5CF6] block">Tier 3: Subset-Sum</span>
                  <span className="text-[10px] text-[#64748B] block">Latency: 8.40 ms</span>
                  <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                    Dynamic programming knapsack solver decomposing bulk composite deposits into individual parent captures.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "controls" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  6. 7 Continuous Financial Controls & Invariant Proofs
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                  HISAB enforces continuous mathematical proofs across every financial touchpoint before any batch settlement sign-off.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { id: "CTL_01", title: "Order-to-Capture Completeness", rule: "All customer order receipts must correspond to a verified Razorpay captured payment payload with zero phantom checkouts." },
                  { id: "CTL_02", title: "Gateway Commercials & GST Audit", rule: "MDR fee retentions and 18% GST must match the merchant contracted basis points within ₹0.00 minor tolerance." },
                  { id: "CTL_03", title: "Settlement Clearance & Net Invariant", rule: "Net Bank Deposit = Gross Captures - MDR Fee - GST - TDS 194-O + Adjustments." },
                  { id: "CTL_04", title: "Bank Statement UTR Narration Validation", rule: "Every bank credit line must correlate with a verified Razorpay settlement manifest and matching UTR reference." },
                  { id: "CTL_05", title: "Section 194-O TDS Compliance Audit", rule: "0.10% statutory TDS deduction verified against Form 26AS and AIS quarterly withholding ledgers." },
                  { id: "CTL_06", title: "Forensic Double-Loss Outflow Blocker", rule: "Blocks payout when concurrent refund and chargeback dispute are executed on the same order." },
                  { id: "CTL_07", title: "Cryptographic Audit Hash Sealing", rule: "Every mutation generates an immutable SHA-256 Merkle chain entry for external statutory audit." },
                ].map((ctl) => (
                  <div key={ctl.id} className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] flex items-start space-x-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF] font-mono font-bold text-[10px] flex-shrink-0">
                      {ctl.id}
                    </span>
                    <div>
                      <span className="font-bold text-xs text-[#0F172A] dark:text-white block">{ctl.title}</span>
                      <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-0.5">{ctl.rule}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "doubleloss" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  7. Forensic Double-Loss Outflow Hazard Analysis
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1 leading-relaxed">
                  Double loss is the most severe silent leakage in digital commerce, where a merchant loses both inventory, manual refund, and bank chargeback.
                </p>
              </div>

              <MermaidViewer
                chart={`
graph TD
  Order[Customer Order: ₹72,000.00] --> Sale[Captured Payment: +₹72,000.00]
  Sale --> Vector1[Merchant Manual Refund: -₹72,000.00]
  Sale --> Vector2[Bank Chargeback Dispute: -₹72,500.00]
  Vector1 --> TotalLoss[Total Cash Outflow: -₹1,44,500.00]
  Vector2 --> TotalLoss
  TotalLoss --> HisabBlock[HISAB CTL_06 Intercepts & Auto-Generates Dispute Evidence Pack]

  classDef red fill:#EF4444,stroke:#DC2626,color:#fff,stroke-width:2px;
  classDef blue fill:#0B72E7,stroke:#0052CC,color:#fff,stroke-width:2px;
  classDef green fill:#10B981,stroke:#059669,color:#fff,stroke-width:2px;

  class Sale blue;
  class Vector1,Vector2,TotalLoss red;
  class HisabBlock green;
                `}
              />
            </div>
          )}

          {activeSection === "chatdocs" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#0B72E7]" />
                  <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                    8. Chat with HISAB Interactive Docs
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                  Ask any question about Razorpay integration, MDR, Section 194-O, or matching algorithms.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  "How is MDR calculated with 18% GST?",
                  "What is Section 194-O TDS rate for Razorpay?",
                  "How does Tier 3 Subset-Sum work?",
                  "How do I prevent double-loss chargebacks?",
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendDocQuery(chip)}
                    className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E0E0E] hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E] text-[11px] font-medium text-[#475569] dark:text-[#A1A1AA] border border-[#E2E8F0] dark:border-[#262626] transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] space-y-3 min-h-[340px] max-h-[500px] overflow-y-auto text-xs">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`p-4 rounded-2xl max-w-[90%] ${
                        msg.sender === "user"
                          ? "bg-[#0F172A] text-white font-medium rounded-br-none"
                          : "bg-white dark:bg-[#111111] text-[#0F172A] dark:text-[#EDEDED] border border-[#E2E8F0] dark:border-[#262626] rounded-bl-none shadow-xs"
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
                  <div className="flex items-center space-x-2 text-xs text-[#64748B] p-2">
                    <Sparkles className="w-4 h-4 animate-spin text-[#0B72E7]" />
                    <span>Synthesizing answer from verified financial docs & mathematical rules...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  value={docQuery}
                  onChange={(e) => setDocQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendDocQuery()}
                  placeholder="Ask about formulas, algorithms, Razorpay webhooks, or tax invariants..."
                  className="flex-1 bg-[#F8FAFC] dark:bg-[#0E0E0E] text-xs px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-[#0F172A] dark:text-[#EDEDED] focus:outline-none focus:border-[#0B72E7]"
                />
                <button
                  onClick={() => handleSendDocQuery()}
                  disabled={docLoading || !docQuery.trim()}
                  className="px-5 py-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-40 shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask Docs</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
