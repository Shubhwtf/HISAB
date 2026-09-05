"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Play, 
  RefreshCw, 
  ChevronRight, 
  FileText, 
  Search, 
  Activity, 
  Bell, 
  User, 
  Copy, 
  Check, 
  LogOut, 
  Settings, 
  Shield, 
  ExternalLink, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Building2
} from "lucide-react";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { DocumentationHubModal } from "@/components/DocumentationHubModal";

interface TopNavProps {
  activeTabTitle: string;
  onRunRecon: () => void;
  onOpenNewRecon: () => void;
  onOpenReport: () => void;
  onOpenInitiatePayment?: () => void;
  isRunning: boolean;
  lastUpdated: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userName?: string;
  userRole?: string;
  orgName?: string;
  userEmail?: string;
  onLogout?: () => void;
  onSelectTab?: (tab: string, targetId?: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTabTitle,
  onRunRecon,
  onOpenNewRecon,
  onOpenReport,
  onOpenInitiatePayment,
  isRunning,
  lastUpdated,
  userName = "Shubham Verma",
  userRole = "ADMIN",
  orgName = "Nova Commerce Pvt Ltd",
  userEmail = "admin@novacommerce.com",
  onLogout = () => {},
  onSelectTab = () => {},
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHealthMenu, setShowHealthMenu] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [copiedMid, setCopiedMid] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      } else if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (healthRef.current && !healthRef.current.contains(event.target as Node)) {
        setShowHealthMenu(false);
      }
      if (announceRef.current && !announceRef.current.contains(event.target as Node)) {
        setShowAnnouncements(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyMid = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText("rzp_live_99420");
    setCopiedMid(true);
    setTimeout(() => setCopiedMid(false), 2000);
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-[#262626] px-6 flex items-center justify-between z-50 select-none text-[#F8FAFC]">
        <div className="flex items-center space-x-3">
          <div 
            onClick={() => onSelectTab("overview")} 
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img src="/logo.svg" alt="HISAB Logo" className="w-7 h-7 rounded-lg object-contain" />
            <span className="font-bold text-white text-sm tracking-tight font-sans">HISAB</span>
          </div>

          <span className="text-[#444444]">/</span>

          <div className="flex items-center gap-1 font-sans text-[0.875rem] font-medium leading-[1.25rem] tracking-[0px] text-white opacity-80">
            <span className="text-[#AAAAAA] hover:text-white transition-colors cursor-pointer" onClick={() => onSelectTab("overview")}>
              Reconciliation
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#666666]" />
            <span className="text-white font-medium">{activeTabTitle}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div 
            onClick={() => setShowSearchModal(true)}
            className="relative w-full cursor-pointer group"
          >
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#666666] group-hover:text-white transition-colors" />
            <div className="w-full bg-[#171717] hover:bg-[#1F1F1F] border border-[#2E2E2E] hover:border-[#444444] text-xs text-[#777777] group-hover:text-[#CCCCCC] pl-8 pr-12 py-1.5 rounded-xl transition-all flex items-center justify-between">
              <span>Search payments, UTRs, batches...</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-[#262626] text-[#888888] rounded border border-[#333333]">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onOpenInitiatePayment && (
            <button
              onClick={onOpenInitiatePayment}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Initiate Gateway Test Payment"
            >
              <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="hidden sm:inline text-[11px] font-semibold">Test Payment</span>
            </button>
          )}

          <a
            href="/docs"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#171717] hover:bg-[#262626] border border-[#2E2E2E] hover:border-[#444444] text-xs text-[#CCCCCC] hover:text-white transition-all shadow-xs"
            title="Open HISAB Documentation Site"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0B72E7]" />
            <span className="hidden sm:inline text-[11px] font-medium text-[#DDDDDD]">Docs</span>
          </a>

          <div className="relative" ref={healthRef}>
            <button
              onClick={() => setShowHealthMenu(!showHealthMenu)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-[#171717] hover:bg-[#262626] border border-[#2E2E2E] text-xs text-[#AAAAAA] transition-colors"
              title="View API Engine Health"
            >
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span className="hidden lg:inline text-[11px] font-medium text-[#DDDDDD]">API Health</span>
            </button>

            {showHealthMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl shadow-xl p-4 text-xs text-[#0F172A] dark:text-[#EDEDED] z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#262626] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-[#16A34A]" />
                    <span className="font-bold text-[#0F172A] dark:text-white">System & API Status</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 dark:bg-green-950 text-[#16A34A]">
                    100% Operational
                  </span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] dark:text-[#A1A1AA]">FastAPI Gateway</span>
                    <span className="text-[#16A34A] font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Healthy (11.4ms)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] dark:text-[#A1A1AA]">Razorpay Webhook Rail</span>
                    <span className="text-[#16A34A] font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Connected</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] dark:text-[#A1A1AA]">PostgreSQL / SQLite Storage</span>
                    <span className="text-[#16A34A] font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>922 Records</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] dark:text-[#A1A1AA]">Redis InMemory Cache</span>
                    <span className="text-[#16A34A] font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active (0.4ms)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] dark:text-[#A1A1AA]">3-Tier Matcher Engine</span>
                    <span className="text-[#16A34A] font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>0 Minor-Drift</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={announceRef}>
            <button
              onClick={() => setShowAnnouncements(!showAnnouncements)}
              className="p-2 rounded-lg bg-[#171717] hover:bg-[#262626] border border-[#2E2E2E] text-[#AAAAAA] hover:text-white transition-colors relative"
              title="Announcements"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0B72E7]"></span>
            </button>

            {showAnnouncements && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl shadow-xl p-4 text-xs text-[#0F172A] dark:text-[#EDEDED] z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#262626] pb-2">
                  <span className="font-bold text-[#0F172A] dark:text-white">Announcements & Updates</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                    v1.0.4 Live
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161616] border border-[#E2E8F0] dark:border-[#262626] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A] dark:text-white text-[11px]">Section 194-O TDS Rate Applied</span>
                      <span className="text-[9px] text-[#64748B]">Today</span>
                    </div>
                    <p className="text-[10px] text-[#64748B] dark:text-[#A1A1AA]">
                      Amended 0.10% (10 bps) e-commerce operator tax schedule active for Form 26AS matching.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161616] border border-[#E2E8F0] dark:border-[#262626] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A] dark:text-white text-[11px]">Double-Loss Scanner Active</span>
                      <span className="text-[9px] text-[#64748B]">Yesterday</span>
                    </div>
                    <p className="text-[10px] text-[#64748B] dark:text-[#A1A1AA]">
                      Real-time concurrent refund + chargeback dispute detector actively blocking risky batch payouts.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#171717] border border-[#2E2E2E] text-xs">
            <Building2 className="w-3.5 h-3.5 text-[#0B72E7] dark:text-[#3395FF]" />
            <span className="font-semibold text-white text-xs truncate max-w-[150px]">{orgName}</span>
            <span className="text-[#555555]">·</span>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-[#3395FF] border border-blue-800">
              {userRole}
            </span>
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-[#171717] hover:bg-[#262626] border border-[#2E2E2E] transition-colors focus:outline-none"
            >
              <div className="w-6 h-6 rounded-lg bg-[#0B72E7] text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                {initials}
              </div>
              <span className="hidden sm:inline text-xs text-[#DDDDDD] font-medium">
                {userName.split(" ")[0]}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl shadow-xl p-4 text-xs text-[#0F172A] dark:text-[#EDEDED] z-50 space-y-3">
                <div className="flex items-center space-x-3 pb-3 border-b border-[#E2E8F0] dark:border-[#262626]">
                  <div className="w-10 h-10 rounded-xl bg-[#0B72E7] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {initials}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-[#0F172A] dark:text-white text-xs truncate">{userName}</div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] font-mono truncate">{userEmail}</div>
                    <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800">
                      {userRole}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#161616] border border-[#E2E8F0] dark:border-[#262626] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B] dark:text-[#A1A1AA]">Merchant Entity:</span>
                    <span className="font-semibold text-[#0F172A] dark:text-white">{orgName}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B] dark:text-[#A1A1AA]">Merchant ID (MID):</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-[#0B72E7] dark:text-[#3395FF]">rzp_live_99420</span>
                      <button
                        onClick={handleCopyMid}
                        className="text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                        title="Copy MID"
                      >
                        {copiedMid ? <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <a
                    href="/docs"
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[#475569] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E] transition-colors text-left font-medium"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#0B72E7]" />
                    <span>Documentation Site</span>
                  </a>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSelectTab("account-settings");
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[#475569] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E] transition-colors text-left font-medium"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Account & Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSelectTab("razorpay-sync");
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[#475569] dark:text-[#A1A1AA] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E] transition-colors text-left font-medium"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#0B72E7]" />
                    <span>Razorpay API & Webhooks</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#262626]">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={(tab, targetId) => {
          onSelectTab(tab, targetId);
        }}
      />
    </>
  );
};
