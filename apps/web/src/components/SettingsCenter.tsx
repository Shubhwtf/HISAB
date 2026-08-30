"use client";

import React, { useState } from "react";
import { Settings, ShieldCheck, Building2, Key, Users, Sliders, Bell } from "lucide-react";

export const SettingsCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState("organization");

  return (
    <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-3 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
            SETTINGS & RECONCILIATION CONFIGURATION
          </h2>
          <p className="text-xs text-[#64748B]">
            Organization profile, Razorpay credentials, fee schedules, and control rules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sub Tabs */}
        <div className="space-y-1">
          {[
            { id: "organization", label: "Organization Profile" },
            { id: "fees", label: "Fee & Tax Rules" },
            { id: "users", label: "Users & Access" },
            { id: "audit", label: "Security & Audit" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setActiveSubTab(st.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeSubTab === st.id
                  ? "bg-[#0B72E7] dark:bg-[#3395FF] text-white"
                  : "text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-4 text-xs">
          {activeSubTab === "organization" && (
            <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
              <h4 className="font-bold text-[#0F172A] dark:text-[#EDEDED]">Merchant Entity</h4>
              <div>• Legal Name: <strong>Nova Commerce Pvt Ltd</strong></div>
              <div>• GSTIN: <strong>27AABCN8890K1Z9</strong></div>
              <div>• Merchant ID: <strong>rzp_live_99420</strong></div>
              <div>• Operating Currency: <strong>INR (₹)</strong></div>
            </div>
          )}

          {activeSubTab === "fees" && (
            <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
              <h4 className="font-bold text-[#0F172A] dark:text-[#EDEDED]">MDR Schedules & Statutory Tax</h4>
              <div>• Standard Domestic Cards: <strong>2.00% MDR + 18% GST</strong></div>
              <div>• Unified Payments Interface (UPI): <strong>0.00% MDR</strong></div>
              <div>• Netbanking & Corporate: <strong>1.80% MDR + 18% GST</strong></div>
              <div>• Section 194-O TDS Rate: <strong>0.10% (Finance Act 2024 Amended)</strong></div>
            </div>
          )}

          {activeSubTab === "users" && (
            <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
              <h4 className="font-bold text-[#0F172A] dark:text-[#EDEDED]">Team & Role-Based Access</h4>
              <div>• Shubham Verma — <strong>Finance Controller (Admin)</strong></div>
              <div>• Priya Sharma — <strong>Reconciliation Analyst (Maker)</strong></div>
              <div>• Rajesh Gupta — <strong>Finance Manager (Checker)</strong></div>
            </div>
          )}

          {activeSubTab === "audit" && (
            <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
              <h4 className="font-bold text-[#0F172A] dark:text-[#EDEDED]">Cryptographic Ledger Invariants</h4>
              <div>• Hash Standard: <strong>SHA-256 Hash Chained</strong></div>
              <div>• Tamper Verification: <strong>Verified 100% Secure</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
