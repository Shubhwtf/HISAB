"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Layers, 
  Network, 
  Lock, 
  BarChart3, 
  AlertOctagon, 
  Sun, 
  Moon,
  Sliders,
  Landmark,
  Compass,
  FileSpreadsheet,
  FileText,
  Zap,
  Settings,
  Sparkles,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  BookOpen
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openExceptionsCount?: number;
  hasDoubleLoss?: boolean;
  onOpenNewRecon: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userRole: string;
  userName: string;
  onLogout: () => void;
}

const ROLE_ALLOWED_TABS: Record<string, Set<string>> = {
  ADMIN: new Set([
    "overview", "batch-control", "double-loss", "exceptions", "trace-money", "settlement-tower",
    "controls", "ask-hisab", "snapshots", "daily-brief", "accounting", "simulator", "razorpay-sync", "audit", "benchmark", "account-settings"
  ]),
  FINANCE_MANAGER: new Set([
    "overview", "batch-control", "double-loss", "exceptions", "trace-money", "settlement-tower",
    "controls", "ask-hisab", "snapshots", "daily-brief", "accounting", "audit", "benchmark", "account-settings"
  ]),
  ANALYST: new Set([
    "overview", "exceptions", "trace-money", "settlement-tower",
    "controls", "ask-hisab", "benchmark", "account-settings"
  ]),
  AUDITOR: new Set([
    "overview", "trace-money", "settlement-tower",
    "controls", "snapshots", "daily-brief", "audit", "benchmark", "account-settings"
  ]),
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openExceptionsCount = 0,
  hasDoubleLoss = false,
  onOpenNewRecon,
  isDarkMode,
  onToggleDarkMode,
  userRole = "ADMIN",
  userName,
}) => {
  const [showAllTabs, setShowAllTabs] = useState(false);

  const allowed = ROLE_ALLOWED_TABS[userRole] || ROLE_ALLOWED_TABS.ADMIN;

  const primaryNav = [
    { id: "overview", label: "Executive Dashboard", icon: LayoutDashboard },
    { id: "batch-control", label: "Batch Control Room", icon: Layers },
    { id: "double-loss", label: "Double-Loss Forensics", icon: AlertOctagon, alert: hasDoubleLoss },
    { id: "exceptions", label: "Exceptions & Approvals", icon: UserCheck, badge: openExceptionsCount },
    { id: "trace-money", label: "Trace Money Flow", icon: Compass },
    { id: "settlement-tower", label: "Settlement Tower", icon: Landmark },
  ].filter(item => allowed.has(item.id));

  const secondaryNav = [
    { id: "controls", label: "Financial Controls", icon: ShieldAlert },
    { id: "ask-hisab", label: "Ask HISAB AI", icon: Sparkles },
    { id: "snapshots", label: "Snapshots & Diffs", icon: Network },
    { id: "daily-brief", label: "Daily Finance Brief", icon: FileText },
    { id: "accounting", label: "Accounting Export", icon: FileSpreadsheet },
    { id: "simulator", label: "Policy Simulator", icon: Sliders },
    { id: "razorpay-sync", label: "Razorpay Sync", icon: Zap },
    { id: "audit", label: "Audit Ledger", icon: Lock },
    { id: "benchmark", label: "Benchmark Matrix", icon: BarChart3 },
    { id: "account-settings", label: "Account & Settings", icon: Settings },
  ].filter(item => allowed.has(item.id));

  return (
    <aside className="fixed top-16 left-0 bottom-0 w-[270px] bg-white dark:bg-[#111111] border-r border-[#E2E8F0] dark:border-[#262626] flex flex-col justify-between z-40 select-none text-[#0F172A] dark:text-[#EDEDED]">
      {/* Top CTA Section */}
      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        {/* "+ NEW RECONCILIATION" Button & Theme Toggle */}
        <div className="p-3.5 flex items-center space-x-2 border-b border-[#E2E8F0] dark:border-[#262626] flex-shrink-0">
          {userRole !== "AUDITOR" ? (
            <button
              onClick={onOpenNewRecon}
              className="flex-1 py-2 px-3.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] dark:bg-[#F8FAFC] dark:hover:bg-[#E2E8F0] text-white dark:text-[#0F172A] font-medium text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Reconciliation</span>
            </button>
          ) : (
            <div className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-[#64748B] text-[11px] font-medium text-center border border-slate-200 dark:border-slate-800">
              Auditor Read-Only Mode
            </div>
          )}

          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-[#475569] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E] border border-[#E2E8F0] dark:border-[#262626] transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-0.5 overflow-y-auto flex-1 text-[13.5px] leading-5 tracking-[0px]">
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider">
            Reconciliation
          </div>
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#0F172A] dark:text-white font-semibold shadow-xs"
                    : "text-[#475569] dark:text-[#A1A1AA] hover:bg-[#F8FAFC] dark:hover:bg-[#161616] hover:text-[#0F172A] dark:hover:text-white font-normal"
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0F172A] dark:text-white' : 'text-[#64748B] dark:text-[#A1A1AA]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.alert && (
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
                )}

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {secondaryNav.length > 0 && (
            <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#262626] mt-2">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-[10px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider">
                  Assurance & Operations
                </span>
                {secondaryNav.length > 4 && (
                  <button
                    onClick={() => setShowAllTabs(!showAllTabs)}
                    className="text-[10px] text-[#64748B] hover:text-[#0F172A] dark:hover:text-white flex items-center space-x-0.5 font-medium"
                  >
                    <span>{showAllTabs ? "Less" : "More"}</span>
                    {showAllTabs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {(showAllTabs ? secondaryNav : secondaryNav.slice(0, 4)).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? "bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#0F172A] dark:text-white font-semibold shadow-xs"
                        : "text-[#475569] dark:text-[#A1A1AA] hover:bg-[#F8FAFC] dark:hover:bg-[#161616] hover:text-[#0F172A] dark:hover:text-white font-normal"
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0F172A] dark:text-white' : 'text-[#64748B] dark:text-[#A1A1AA]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Pinned Profile & Account Settings (Razorpay Style) */}
      <div className="p-3 border-t border-[#E2E8F0] dark:border-[#262626] flex-shrink-0 bg-white dark:bg-[#111111]">
        <button
          onClick={() => setActiveTab("account-settings")}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            activeTab === "account-settings"
              ? "bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#0F172A] dark:text-white border-[#CBD5E1] dark:border-[#333333] font-semibold"
              : "border-[#E2E8F0] dark:border-[#262626] hover:bg-[#F8FAFC] dark:hover:bg-[#161616] text-[#475569]"
          }`}
        >
          <div className="flex items-center space-x-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-[#0B72E7] text-white font-semibold text-xs flex items-center justify-center flex-shrink-0">
              {userName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="truncate text-left">
              <span className={`text-xs block truncate leading-tight ${activeTab === 'account-settings' ? 'text-[#0F172A] dark:text-white font-semibold' : 'text-[#0F172A] dark:text-[#EDEDED] font-medium'}`}>
                {userName}
              </span>
              <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] block truncate leading-tight mt-0.5">
                Account & Settings
              </span>
            </div>
          </div>
          <Settings className={`w-4 h-4 flex-shrink-0 ${activeTab === 'account-settings' ? 'text-[#0F172A] dark:text-white' : 'text-[#64748B]'}`} />
        </button>
      </div>
    </aside>
  );
};
