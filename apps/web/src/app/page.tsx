"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { LoginPage } from "@/components/LoginPage";
import { MetricsRibbon } from "@/components/MetricsRibbon";
import { DashboardCharts } from "@/components/DashboardCharts";
import { RevenueVelocityChart } from "@/components/RevenueVelocityChart";
import { InteractiveWaterfallChart } from "@/components/InteractiveWaterfallChart";
import { DoubleLossBanner } from "@/components/DoubleLossBanner";
import { DoubleLossFlowGraph } from "@/components/DoubleLossFlowGraph";
import { EvidenceGraphViewer } from "@/components/EvidenceGraphViewer";
import { AuditLedgerViewer } from "@/components/AuditLedgerViewer";
import { BenchmarkComparisonView } from "@/components/BenchmarkComparisonView";
import { ControlsMatrixView } from "@/components/ControlsMatrixView";
import { ExceptionsTableView } from "@/components/ExceptionsTableView";
import { NewReconciliationWizard } from "@/components/NewReconciliationWizard";
import { BatchControlRoomView } from "@/components/BatchControlRoomView";
import { SettlementControlTower } from "@/components/SettlementControlTower";
import { TraceMoneyView } from "@/components/TraceMoneyView";
import { MakerCheckerInbox } from "@/components/MakerCheckerInbox";
import { DailyFinanceBrief } from "@/components/DailyFinanceBrief";
import { RazorpayConnectionCenter } from "@/components/RazorpayConnectionCenter";
import { SnapshotManagerView } from "@/components/SnapshotManagerView";
import { AskHisabView } from "@/components/AskHisabView";
import { PolicySimulatorView } from "@/components/PolicySimulatorView";
import { AccountingExportView } from "@/components/AccountingExportView";
import { DataSourcesView } from "@/components/DataSourcesView";
import { SettingsCenter } from "@/components/SettingsCenter";
import { AccountSettingsView } from "@/components/AccountSettingsView";
import { DocumentationPageView } from "@/components/DocumentationPageView";
import { FloatingAiChat } from "@/components/FloatingAiChat";
import { ExecutiveReportModal } from "@/components/ExecutiveReportModal";
import { RazorpayGateModal } from "@/components/RazorpayGateModal";
import { 
  ReconciliationSummary, 
  DoubleLossAlertItem, 
  fetchApi 
} from "@/lib/api";
import { Shield, Zap, RefreshCw, FileSpreadsheet, Lock } from "lucide-react";

const ROLE_ALLOWED_TABS: Record<string, Set<string>> = {
  ADMIN: new Set([
    "overview", "batch-control", "double-loss", "exceptions", "trace-money", "settlement-tower",
    "controls", "ask-hisab", "snapshots", "daily-brief", "accounting", "simulator", "razorpay-sync", "audit", "benchmark", "account-settings", "docs"
  ]),
  FINANCE_MANAGER: new Set([
    "overview", "batch-control", "double-loss", "exceptions", "trace-money", "settlement-tower",
    "controls", "ask-hisab", "snapshots", "daily-brief", "accounting", "audit", "benchmark", "account-settings", "docs"
  ]),
  ANALYST: new Set([
    "overview", "exceptions", "trace-money", "settlement-tower",
    "controls", "ask-hisab", "benchmark", "account-settings", "docs"
  ]),
  AUDITOR: new Set([
    "overview", "trace-money", "settlement-tower",
    "controls", "snapshots", "daily-brief", "audit", "benchmark", "account-settings", "docs"
  ]),
};

export default function ControlRoomPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [isRazorpayConnected, setIsRazorpayConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [doubleLossAlerts, setDoubleLossAlerts] = useState<DoubleLossAlertItem[]>([]);
  const [inspectedPaymentId, setInspectedPaymentId] = useState<string>("pay_90006");
  const [isRunningRecon, setIsRunningRecon] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGateOpen, setIsGateOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("hisab-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    const verifySession = async () => {
      const savedSession = localStorage.getItem("hisab-auth-session");
      if (!savedSession) {
        setIsLoggedIn(false);
        setIsLoadingAuth(false);
        return;
      }

      try {
        const sess = JSON.parse(savedSession);
        if (!sess || !sess.token) {
          localStorage.removeItem("hisab-auth-session");
          setIsLoggedIn(false);
          setIsLoadingAuth(false);
          return;
        }

        const verified = await fetchApi<any>("/api/auth/me");
        if (verified && verified.role) {
          setUserRole(verified.role);
          setUserName(verified.name);
          setUserEmail(verified.email || "");
          setOrgName(verified.org_name || "");
          setIsRazorpayConnected(Boolean(verified.is_razorpay_connected));
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem("hisab-auth-session");
          setIsLoggedIn(false);
        }
      } catch (e) {
        console.warn("Session verification failed, redirecting to login:", e);
        localStorage.removeItem("hisab-auth-session");
        setIsLoggedIn(false);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    verifySession();
  }, []);

  const handleToggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("hisab-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("hisab-theme", "light");
    }
  };

  const loadDashboardData = async () => {
    try {
      const summaryData = await fetchApi<ReconciliationSummary>("/api/reconcile/summary");
      setSummary(summaryData);

      const dblData = await fetchApi<{ alerts: DoubleLossAlertItem[] }>("/api/controls/double-loss");
      setDoubleLossAlerts(dblData.alerts || []);
      setLastUpdated(new Date().toLocaleTimeString());

      const rzpStatus = await fetchApi<any>("/api/auth/razorpay/status");
      if (rzpStatus && typeof rzpStatus.is_connected === "boolean") {
        setIsRazorpayConnected(rzpStatus.is_connected);
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    }
  };

  const handleRunReconciliation = async () => {
    setIsRunningRecon(true);
    try {
      await fetchApi("/api/reconcile/run", { method: "POST" });
      await loadDashboardData();
    } catch (e) {
      console.error("Reconciliation run failed:", e);
    } finally {
      setIsRunningRecon(false);
    }
  };

  const handleInspectEvidence = (paymentId: string) => {
    setInspectedPaymentId(paymentId);
    setActiveTab("trace-money");
  };

  const handleLoginSuccess = (session: any) => {
    localStorage.setItem("hisab-auth-session", JSON.stringify(session));
    setUserRole(session.role);
    setUserName(session.name);
    if (session.email) setUserEmail(session.email);
    if (session.org_name) setOrgName(session.org_name);
    if (typeof session.is_razorpay_connected === "boolean") {
      setIsRazorpayConnected(session.is_razorpay_connected);
    }
    setIsLoggedIn(true);
    setIsLoadingAuth(false);
    loadDashboardData();
  };

  const handleLogout = () => {
    localStorage.removeItem("hisab-auth-session");
    setIsLoggedIn(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboardData();
    }
  }, [isLoggedIn]);

  const tabTitles: Record<string, string> = {
    overview: "Executive Dashboard & Financial Analytics",
    "batch-control": "Batch Control Room & Closure Gate",
    "double-loss": "Signature Double-Loss Outflow Forensics",
    controls: "The Seven Financial Controls Matrix",
    exceptions: "Exceptions Inbox & Maker-Checker Approvals",
    "trace-money": "Financial Timeline & Trace Money Flow",
    "settlement-tower": "Settlement Control Tower & Cash in Transit",
    "ask-hisab": "Ask HISAB — Natural Language Financial Investigator",
    snapshots: "Immutable Snapshots & 'What Changed?' Diffs",
    "razorpay-sync": "Razorpay Direct Connector & Webhook Ingestion",
    "daily-brief": "Daily Finance Brief & Risk Matrix",
    accounting: "Accounting Export & Double-Entry Journal Batches",
    simulator: "What-If Policy & Materiality Simulator",
    audit: "Immutable Cryptographic Audit Ledger (SHA-256)",
    benchmark: "3-Way Comparative Evaluation Benchmark Matrix",
    sources: "Data Source Integrations & Health Status",
    settings: "Settings & Merchant Reconciliation Configuration",
    "account-settings": "Account & Settings",
    docs: "Documentation & Knowledge Hub",
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0A0A] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 border-4 border-[#0B72E7] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-[#64748B] dark:text-[#A1A1AA] tracking-wider uppercase">
          Verifying HISAB Security Session...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0A0A] text-[#0F172A] dark:text-[#EDEDED] font-sans transition-colors">
      <TopNav
        activeTabTitle={tabTitles[activeTab] || "Dashboard"}
        onRunRecon={handleRunReconciliation}
        onOpenNewRecon={() => setIsWizardOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        isRunning={isRunningRecon}
        lastUpdated={lastUpdated}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        userName={userName}
        userRole={userRole}
        orgName={orgName}
        userEmail={userEmail}
        onLogout={handleLogout}
        onSelectTab={(tab, targetId) => {
          setActiveTab(tab);
          if (targetId) setInspectedPaymentId(targetId);
        }}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openExceptionsCount={summary?.open_exceptions_count}
        hasDoubleLoss={doubleLossAlerts.length > 0}
        onOpenNewRecon={() => setIsWizardOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        userRole={userRole}
        userName={userName}
        onLogout={handleLogout}
      />

      <div className="pl-[270px] pt-16 min-h-screen">
        <main className="w-full max-w-[1600px] mx-auto px-6 lg:px-24 py-6 pb-20">
          {(activeTab === "overview" || activeTab === "batch-control") && (
            <MetricsRibbon summary={summary} />
          )}

          <div className="space-y-6">
            {!(ROLE_ALLOWED_TABS[userRole] || ROLE_ALLOWED_TABS.ADMIN).has(activeTab) ? (
              <div className="bg-white dark:bg-[#111111] border border-amber-200 dark:border-amber-900/60 rounded-2xl p-10 text-center space-y-4 shadow-sm font-sans">
                <div className="inline-flex p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Role-Based Access Control: Restricted View</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] max-w-md mx-auto mt-1">
                    Your current role (<strong className="text-[#0F172A] dark:text-white">{userRole}</strong>) does not have authorization to view or execute operations in this domain. Please contact your organization administrator to upgrade permissions.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("overview")}
                  className="px-4 py-2 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Return to Executive Overview
                </button>
              </div>
            ) : (
              <>
            {activeTab === "overview" && (
              <>
                {isRazorpayConnected ? (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] flex items-center justify-between text-xs shadow-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#0F172A] dark:text-white">Razorpay Merchant Gateway</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                            ● Connected
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] dark:text-[#888888] mt-0.5">
                          Organization: <span className="font-semibold text-[#0F172A] dark:text-white">{orgName}</span> · MID: <span className="font-mono text-[#0B72E7] dark:text-[#3395FF]">rzp_live_99420</span> · Last synced: {lastUpdated}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleRunReconciliation}
                        disabled={isRunningRecon}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRunningRecon ? "animate-spin" : ""}`} />
                        <span>{isRunningRecon ? "Syncing..." : "Sync Now"}</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("razorpay-sync")}
                        className="px-3.5 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#2E2E2E] text-[#64748B] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white font-semibold text-xs transition-colors"
                      >
                        View Connection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] shadow-sm space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0B72E7] dark:text-[#3395FF]">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Welcome to HISAB — Financial Control Room</h2>
                        <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                          Connect your organization&apos;s Razorpay account to sync live gateway data, or import merchant reconciliation CSV reports to begin.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2.5 pt-1">
                      <button
                        onClick={() => setActiveTab("razorpay-sync")}
                        className="px-4 py-2 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Connect Razorpay</span>
                      </button>
                      <button
                        onClick={() => setIsWizardOpen(true)}
                        className="px-4 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#333333] text-[#0F172A] dark:text-[#EDEDED] hover:bg-[#F8FAFC] dark:hover:bg-[#1A1A1A] font-semibold text-xs flex items-center space-x-1.5"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>New Reconciliation (Import CSV)</span>
                      </button>
                    </div>
                  </div>
                )}

                {summary && summary.total_payments_count > 0 ? (
                  <>
                    <RevenueVelocityChart />
                    <InteractiveWaterfallChart />
                    <DashboardCharts onNavigateToTab={setActiveTab} />
                    {doubleLossAlerts.length > 0 && (
                      <DoubleLossBanner alerts={doubleLossAlerts} onViewEvidence={handleInspectEvidence} />
                    )}
                  </>
                ) : (
                  <div className="p-8 rounded-2xl bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] text-center space-y-4 shadow-sm">
                    <div className="inline-flex p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0B72E7] dark:text-[#3395FF]">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A] dark:text-white">No Reconciliation Records Processed</h3>
                      <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] max-w-md mx-auto mt-1">
                        <strong className="text-[#0F172A] dark:text-white">{orgName}</strong> currently has 0 captured transactions and ₹0.00 turnover. Connect Razorpay to sync live gateway feeds or upload merchant settlement CSVs to begin.
                      </p>
                    </div>
                    <div className="flex items-center justify-center space-x-3 pt-2">
                      <button
                        onClick={() => setActiveTab("razorpay-sync")}
                        className="px-4 py-2.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center space-x-2 shadow-sm transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Connect Razorpay Gateway</span>
                      </button>
                      <button
                        onClick={() => setIsWizardOpen(true)}
                        className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#333333] text-[#0F172A] dark:text-white font-semibold text-xs flex items-center space-x-2 hover:bg-[#F8FAFC] dark:hover:bg-[#1A1A1A] transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Upload Merchant Reports</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "batch-control" && (
              <BatchControlRoomView
                summary={summary}
                orgName={orgName}
                onNavigateToExceptions={() => setActiveTab("exceptions")}
                onNavigateToEvidence={() => setActiveTab("trace-money")}
              />
            )}

            {activeTab === "double-loss" && (
              <>
                <DoubleLossBanner alerts={doubleLossAlerts} onViewEvidence={handleInspectEvidence} />
                <DoubleLossFlowGraph alerts={doubleLossAlerts} orgName={orgName} />
              </>
            )}

            {activeTab === "controls" && (
              <ControlsMatrixView />
            )}

            {activeTab === "exceptions" && (
              <div className="space-y-6">
                <MakerCheckerInbox />
                <ExceptionsTableView />
              </div>
            )}

            {activeTab === "trace-money" && (
              <TraceMoneyView
                summary={summary}
                orgName={orgName}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === "settlement-tower" && (
              <SettlementControlTower />
            )}

            {activeTab === "ask-hisab" && (
              <AskHisabView
                onOpenEvidence={handleInspectEvidence}
                onOpenException={() => setActiveTab("exceptions")}
              />
            )}

            {activeTab === "snapshots" && (
              <SnapshotManagerView orgName={orgName} />
            )}

            {activeTab === "razorpay-sync" && (
              <RazorpayConnectionCenter />
            )}

            {activeTab === "daily-brief" && (
              <DailyFinanceBrief />
            )}

            {activeTab === "accounting" && (
              <AccountingExportView />
            )}

            {activeTab === "simulator" && (
              <PolicySimulatorView />
            )}

            {activeTab === "audit" && (
              <AuditLedgerViewer />
            )}

            {activeTab === "benchmark" && (
              <BenchmarkComparisonView />
            )}

            {activeTab === "sources" && (
              <DataSourcesView />
            )}

            {activeTab === "settings" && (
              <SettingsCenter />
            )}

            {activeTab === "account-settings" && (
              <AccountSettingsView
                userRole={userRole}
                userName={userName}
                orgName={orgName}
                userEmail={userEmail}
                onRoleSwitched={(r, n) => {
                  setUserRole(r);
                  setUserName(n);
                  loadDashboardData();
                }}
                onLogout={handleLogout}
              />
            )}

            {activeTab === "docs" && (
              <DocumentationPageView onNavigateTab={setActiveTab} />
            )}
              </>
            )}
          </div>
        </main>
      </div>

      <FloatingAiChat
        onOpenEvidence={handleInspectEvidence}
        onOpenException={() => setActiveTab("exceptions")}
      />

      <NewReconciliationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={loadDashboardData}
      />

      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <RazorpayGateModal
        isOpen={isGateOpen}
        onConnected={() => setIsGateOpen(false)}
        onExploreDemo={() => setIsGateOpen(false)}
      />
    </div>
  );
}
