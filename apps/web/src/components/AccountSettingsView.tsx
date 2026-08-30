"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Shield, 
  Zap, 
  User, 
  Key, 
  LogOut, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Check, 
  UserPlus, 
  Trash2, 
  Lock,
  AlertCircle,
  Mail,
  Send,
  MoreVertical,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface AccountSettingsViewProps {
  userRole: string;
  userName: string;
  orgName?: string;
  userEmail?: string;
  onRoleSwitched?: (newRole: string, newName: string) => void;
  onLogout: () => void;
}

interface Member {
  membership_id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  is_owner: boolean;
  joined_at: string;
}

interface PendingInvite {
  invitation_id: string;
  email: string;
  role: string;
  token: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
}

interface RazorpayStatus {
  org_id: string;
  merchant_id: string | null;
  merchant_name: string | null;
  environment: string;
  status: string;
  is_connected: boolean;
  masked_client_id: string | null;
  connected_by_user_name: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  userRole,
  userName,
  orgName: propOrgName = "Nova Commerce Pvt Ltd",
  userEmail: propUserEmail,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [orgName, setOrgName] = useState(propOrgName);
  const [gstin, setGstin] = useState<string>("");
  const [isEditingGstin, setIsEditingGstin] = useState(false);
  const [tempGstin, setTempGstin] = useState("");
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("ANALYST");
  const [lastCreatedInviteLink, setLastCreatedInviteLink] = useState<string | null>(null);

  const [rzpStatus, setRzpStatus] = useState<RazorpayStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  const isAdmin = userRole === "ADMIN";

  useEffect(() => {
    if (propOrgName) setOrgName(propOrgName);
    loadMembersData();
    loadRazorpayStatus();
  }, [propOrgName]);

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadMembersData = async () => {
    try {
      const data = await fetchApi<any>("/api/auth/members");
      setMembers(data.members || []);
      setPendingInvites(data.pending_invitations || []);
      if (data.org_name) setOrgName(data.org_name);
      if (data.gstin !== undefined) {
        setGstin(data.gstin);
        setTempGstin(data.gstin);
      }
    } catch (err: any) {
      console.error("Failed to load members:", err);
    }
  };

  const handleSaveGstin = async () => {
    try {
      const res = await fetchApi<any>("/api/auth/organization", {
        method: "PATCH",
        body: JSON.stringify({ gstin: tempGstin.trim() }),
      });
      setGstin(res.gstin || tempGstin.trim());
      setIsEditingGstin(false);
      showNotice("success", "GSTIN / Tax ID updated successfully.");
    } catch (err: any) {
      showNotice("error", err?.message || "Failed to update GSTIN.");
    }
  };

  const loadRazorpayStatus = async () => {
    try {
      const status = await fetchApi<RazorpayStatus>("/api/auth/razorpay/status");
      setRzpStatus(status);
    } catch (err: any) {
      console.error("Failed to load Razorpay status:", err);
    }
  };

  const handleConnectRazorpay = async () => {
    if (!isAdmin) return;
    setSyncing(true);
    try {
      await fetchApi("/api/auth/razorpay/connect", {
        method: "POST",
        body: JSON.stringify({
          merchant_id: "rzp_live_99420",
          merchant_name: orgName,
        }),
      });
      showNotice("success", `Razorpay gateway successfully connected for ${orgName}.`);
      loadRazorpayStatus();
    } catch (err: any) {
      showNotice("error", err?.message || "Failed to connect Razorpay.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showNotice("error", "Permission Denied: Only Admins can invite team members.");
      return;
    }
    if (!inviteEmail.trim()) return;

    setLoading(true);
    try {
      const res = await fetchApi<any>("/api/auth/invitations", {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      setLastCreatedInviteLink(res.invite_link);
      showNotice("success", `Invitation created for ${inviteEmail}.`);
      setInviteEmail("");
      loadMembersData();
    } catch (err: any) {
      showNotice("error", err?.message || "Failed to create invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (membershipId: string, newRole: string) => {
    if (!isAdmin) return;
    try {
      await fetchApi(`/api/auth/members/${membershipId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      showNotice("success", "Member role updated successfully.");
      loadMembersData();
    } catch (err: any) {
      showNotice("error", err?.message || "Failed to update role.");
    }
  };

  const handleToggleStatus = async (membershipId: string, currentStatus: string) => {
    if (!isAdmin) return;
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await fetchApi(`/api/auth/members/${membershipId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      showNotice("success", `Member status changed to ${newStatus}.`);
      loadMembersData();
    } catch (err: any) {
      showNotice("error", err?.message || "Failed to update status.");
    }
  };

  const handleRemoveMember = async (membershipId: string, memberName: string) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from the organization?`)) return;
    try {
      await fetchApi(`/api/auth/members/${membershipId}`, {
        method: "DELETE",
      });
      showNotice("success", `${memberName} has been removed.`);
      loadMembersData();
    } catch (err: any) {
      showNotice("error", err?.message || "Failed to remove member.");
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await fetchApi("/api/razorpay/sync-now", { method: "POST" });
      showNotice("success", "Live Razorpay sync completed.");
      loadRazorpayStatus();
    } catch (err: any) {
      showNotice("error", "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectRazorpay = async () => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to disconnect Razorpay for this organization?")) return;
    try {
      await fetchApi("/api/auth/razorpay/disconnect", { method: "POST" });
      showNotice("success", "Razorpay disconnected.");
      loadRazorpayStatus();
    } catch (err: any) {
      showNotice("error", err?.message || "Failed to disconnect.");
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    if (key === "mid") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedInvite(key);
      setTimeout(() => setCopiedInvite(null), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#EDEDED]">
          Account & Organization Settings
        </h1>
        <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1">
          Manage your organization profile, team members & roles, Razorpay connection, and active session.
        </p>
      </div>

      {notice && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2.5 ${
          notice.type === "success" 
            ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" 
            : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
        }`}>
          {notice.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#262626] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                Organization Profile
              </h2>
              <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">Entity Details & Statutory Tax Identifiers</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 dark:bg-[#052E16] text-[#16A34A] border border-green-200 dark:border-green-900">
            Active Merchant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Legal Business Entity</span>
            <div className="font-bold text-[#0F172A] dark:text-[#EDEDED] mt-1">{orgName}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Operating Country / Currency</span>
            <div className="font-semibold text-[#0F172A] dark:text-[#EDEDED] mt-1">India · INR (₹)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#64748B] uppercase">GSTIN / Tax ID</span>
              {isAdmin && !isEditingGstin && (
                <button
                  onClick={() => setIsEditingGstin(true)}
                  className="text-[10px] text-[#0B72E7] dark:text-[#3395FF] hover:underline font-semibold"
                >
                  {gstin ? "Edit" : "Configure"}
                </button>
              )}
            </div>

            {isEditingGstin ? (
              <div className="mt-1.5 flex items-center space-x-1.5">
                <input
                  type="text"
                  value={tempGstin}
                  onChange={(e) => setTempGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AABCN8890K1Z9"
                  maxLength={15}
                  className="w-full bg-white dark:bg-[#161616] px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#262626] font-mono text-xs uppercase"
                  autoFocus
                />
                <button
                  onClick={handleSaveGstin}
                  className="px-2.5 py-1 rounded-lg bg-[#0B72E7] text-white font-semibold text-[11px] shadow-xs flex-shrink-0"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setTempGstin(gstin);
                    setIsEditingGstin(false);
                  }}
                  className="px-2 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#262626] text-[#64748B] text-[11px] flex-shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="font-mono font-semibold text-[#0F172A] dark:text-[#EDEDED] mt-1">
                {gstin ? gstin : <span className="text-[#64748B] font-normal italic">Pending Configuration</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#262626] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                Users & Access Management
              </h2>
              <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                Organization Roles, Permissions & Four-Eyes Governance
              </span>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setLastCreatedInviteLink(null);
                setShowInviteModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </button>
          )}
        </div>

        {showInviteModal && (
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#161616] border border-[#E2E8F0] dark:border-[#262626] space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#0F172A] dark:text-white">
                Invite New Team Member to {orgName}
              </span>
              <button onClick={() => setShowInviteModal(false)} className="text-xs text-[#64748B] hover:text-[#0F172A] dark:hover:text-white">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="w-full bg-white dark:bg-[#111111] px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                  Assign Organization Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-white dark:bg-[#111111] px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-xs"
                >
                  <option value="FINANCE_MANAGER">Finance Manager (Checker & Approver)</option>
                  <option value="ANALYST">Analyst (Maker & Trace Flow)</option>
                  <option value="AUDITOR">Auditor (Read-Only Assurance)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-xl bg-[#0B72E7] text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{loading ? "Generating..." : "Create Invitation"}</span>
                </button>
              </div>
            </form>

            {lastCreatedInviteLink && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <span className="text-[10px] font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase block">Invitation Link Generated</span>
                  <span className="font-mono text-[11px] text-[#64748B] dark:text-[#A1A1AA] truncate block">
                    {lastCreatedInviteLink}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(lastCreatedInviteLink, "link")}
                  className="px-3 py-1.5 rounded-lg bg-[#0B72E7] text-white font-semibold text-xs flex items-center space-x-1 flex-shrink-0"
                >
                  {copiedInvite === "link" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInvite === "link" ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="border border-[#E2E8F0] dark:border-[#262626] rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] dark:bg-[#161616] border-b border-[#E2E8F0] dark:border-[#262626] text-[10px] uppercase font-bold text-[#64748B]">
              <tr>
                <th className="p-3">Team Member</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#262626]">
              {members.map((m) => (
                <tr key={m.membership_id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#141414] transition-colors">
                  <td className="p-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#0B72E7] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#0F172A] dark:text-[#EDEDED] flex items-center space-x-1.5">
                          <span>{m.name}</span>
                          {m.is_owner && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                              OWNER
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#888888] font-mono">{m.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    {isAdmin && !m.is_owner ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m.membership_id, e.target.value)}
                        className="bg-[#F1F5F9] dark:bg-[#1C1C1C] px-2 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#2E2E2E] font-mono text-[11px] font-semibold text-[#0F172A] dark:text-[#EDEDED]"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="FINANCE_MANAGER">FINANCE_MANAGER</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="AUDITOR">AUDITOR</option>
                      </select>
                    ) : (
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#0F172A] dark:text-[#EDEDED]">
                        {m.role}
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === "ACTIVE"
                        ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
                    }`}>
                      {m.status}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    {isAdmin && !m.is_owner ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleStatus(m.membership_id, m.status)}
                          className="px-2 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#2E2E2E] text-[10px] font-semibold text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                        >
                          {m.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleRemoveMember(m.membership_id, m.name)}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Remove access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#64748B]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pendingInvites.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Pending Invitations ({pendingInvites.length})
            </div>
            <div className="space-y-1.5">
              {pendingInvites.map((inv) => (
                <div key={inv.invitation_id} className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161616] border border-[#E2E8F0] dark:border-[#262626] flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                    <span className="font-mono text-xs font-semibold text-[#0F172A] dark:text-white">{inv.email}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                      {inv.role}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-[#64748B]">Invited by {inv.invited_by}</span>
                    <button
                      onClick={() => handleCopy(`http://localhost:3000/?invite=${inv.token}`, inv.token)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-[#222222] border border-[#E2E8F0] dark:border-[#333333] text-[10px] font-semibold text-[#0B72E7] dark:text-[#3395FF] flex items-center space-x-1"
                    >
                      {copiedInvite === inv.token ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedInvite === inv.token ? "Copied" : "Copy Link"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#262626] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                Organization Razorpay Connection
              </h2>
              <span className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                Direct Merchant OAuth 2.0 Integration & Automated Ingestion
              </span>
            </div>
          </div>

          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            rzpStatus?.is_connected
              ? "bg-green-100 dark:bg-[#052E16] text-[#16A34A] border-green-200 dark:border-green-900"
              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900"
          }`}>
            {rzpStatus?.is_connected ? "● Connected" : "○ Disconnected"}
          </span>
        </div>

        <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
          This connection belongs to <span className="font-semibold text-[#0F172A] dark:text-white">{orgName}</span>. 
          Individual team members reconcile financial batches without requiring personal Razorpay developer credentials.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Merchant ID (MID)</span>
            <div className="flex items-center justify-between mt-1">
              <span className={`font-mono font-bold ${rzpStatus?.is_connected ? "text-[#0B72E7] dark:text-[#3395FF]" : "text-[#64748B]"}`}>
                {rzpStatus?.is_connected ? (rzpStatus?.merchant_id || "rzp_live_99420") : "Not Connected"}
              </span>
              {rzpStatus?.is_connected && rzpStatus?.merchant_id && (
                <button onClick={() => handleCopy(rzpStatus.merchant_id!, "mid")} className="text-[#64748B] hover:text-[#0F172A]">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Connected By</span>
            <div className="font-semibold text-[#0F172A] dark:text-[#EDEDED] mt-1">
              {rzpStatus?.is_connected ? (rzpStatus?.connected_by_user_name || "Admin") : "—"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Last Gateway Sync</span>
            <div className="font-semibold text-[#0F172A] dark:text-[#EDEDED] mt-1">
              {rzpStatus?.is_connected ? "Just now" : "Never"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {rzpStatus?.is_connected ? (
            <>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="px-4 py-2 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Syncing Gateway..." : "Sync Now"}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleDisconnectRazorpay}
                  className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold text-xs transition-colors"
                >
                  Disconnect Gateway
                </button>
              )}
            </>
          ) : (
            isAdmin && (
              <button
                onClick={handleConnectRazorpay}
                disabled={syncing}
                className="px-4 py-2 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{syncing ? "Connecting Gateway..." : "Connect Razorpay Gateway"}</span>
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <div className="text-xs text-[#64748B] dark:text-[#888888]">
          Signed in as <span className="font-semibold text-[#0F172A] dark:text-white">{userName}</span> ({userRole})
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 text-red-600 border border-red-200 dark:border-red-900/60 font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of HISAB</span>
        </button>
      </div>

    </div>
  );
};
