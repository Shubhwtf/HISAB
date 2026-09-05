"use client";

import React, { useState } from "react";
import { 
  Zap, 
  X, 
  CheckCircle2, 
  CreditCard, 
  Smartphone, 
  Building, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface InitiatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgName?: string;
  onPaymentSuccess: (paymentId: string) => void;
  defaultAmount?: number;
}

export const InitiatePaymentModal: React.FC<InitiatePaymentModalProps> = ({
  isOpen,
  onClose,
  orgName = "Merchant Organization",
  onPaymentSuccess,
  defaultAmount = 1500,
}) => {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [method, setMethod] = useState<"card" | "upi" | "netbanking">("upi");
  const [eventType, setEventType] = useState<"payment.captured" | "refund.processed" | "dispute.created">("payment.captured");
  const [customerEmail, setCustomerEmail] = useState("merchant.customer@example.com");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const presets = [
    { label: "₹500", value: 500, desc: "Standard Card" },
    { label: "₹1,500", value: 1500, desc: "Instant UPI" },
    { label: "₹5,000", value: 5000, desc: "B2B Netbanking" },
    { label: "₹72,000", value: 72000, desc: "Double-Loss Alert" },
  ];

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessResult(null);

    try {
      const finalAmount = customAmount ? parseFloat(customAmount) : amount;
      if (isNaN(finalAmount) || finalAmount <= 0) {
        throw new Error("Please enter a valid amount greater than ₹0.");
      }

      const res = await fetchApi<any>("/api/webhooks/simulate", {
        method: "POST",
        body: JSON.stringify({
          event_type: eventType,
          amount_inr: finalAmount,
          customer_email: customerEmail.trim() || "customer@merchant.com",
        }),
      });

      if (res && res.success) {
        setSuccessResult(res);
        onPaymentSuccess(res.payment_id);
      } else {
        throw new Error(res?.message || "Payment initiation failed.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to trigger payment event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccessResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] dark:border-[#262626] bg-[#F8FAFC] dark:bg-[#161616]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0B72E7] dark:text-[#3395FF] flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                Initiate Gateway Transaction
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
                Organization: <span className="font-semibold text-[#0F172A] dark:text-white">{orgName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222222] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-5">
          {successResult ? (
            <div className="space-y-5 py-2">
              <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/80 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-green-900 dark:text-green-300">
                      Payment Successfully Ingested & Verified!
                    </h3>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                      HMAC SHA-256 signature verified. Invariants matched and ledger updated in real time.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-green-200 dark:border-green-800/50 font-mono">
                  <div className="p-2 rounded-lg bg-white/70 dark:bg-black/40">
                    <span className="text-[#64748B] block text-[10px] uppercase font-sans">Payment ID</span>
                    <span className="font-bold text-[#0F172A] dark:text-white">{successResult.payment_id}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/70 dark:bg-black/40">
                    <span className="text-[#64748B] block text-[10px] uppercase font-sans">Amount Ingested</span>
                    <span className="font-bold text-[#16A34A]">{successResult.amount_formatted}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/70 dark:bg-black/40 col-span-2">
                    <span className="text-[#64748B] block text-[10px] uppercase font-sans">HMAC SHA-256 Signature</span>
                    <span className="text-[10px] truncate block text-slate-700 dark:text-slate-300">{successResult.signature}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setSuccessResult(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#333333] text-xs font-semibold text-[#0F172A] dark:text-white hover:bg-slate-50 dark:hover:bg-[#1A1A1A] transition-colors"
                >
                  Initiate Another
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  View on Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* EVENT TYPE SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider block">
                  Select Transaction Event Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEventType("payment.captured")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      eventType === "payment.captured"
                        ? "border-[#0B72E7] bg-blue-50/70 dark:bg-blue-950/40 text-[#0B72E7] dark:text-[#3395FF] ring-1 ring-[#0B72E7]"
                        : "border-[#E2E8F0] dark:border-[#262626] text-[#64748B] hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-[11px]">Sale Capture</div>
                    <div className="text-[10px] opacity-75 font-normal">payment.captured</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventType("refund.processed")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      eventType === "refund.processed"
                        ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500"
                        : "border-[#E2E8F0] dark:border-[#262626] text-[#64748B] hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-[11px]">Refund Outflow</div>
                    <div className="text-[10px] opacity-75 font-normal">refund.processed</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventType("dispute.created")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      eventType === "dispute.created"
                        ? "border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-600 dark:text-red-400 ring-1 ring-red-500"
                        : "border-[#E2E8F0] dark:border-[#262626] text-[#64748B] hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-[11px]">Chargeback Risk</div>
                    <div className="text-[10px] opacity-75 font-normal">dispute.created</div>
                  </button>
                </div>
              </div>

              {/* AMOUNT SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider block">
                  Amount (INR)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleSelectPreset(p.value)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        amount === p.value && !customAmount
                          ? "border-[#0B72E7] bg-blue-50 dark:bg-blue-950/40 text-[#0B72E7] dark:text-[#3395FF] font-bold"
                          : "border-[#E2E8F0] dark:border-[#262626] text-[#0F172A] dark:text-[#EDEDED] hover:bg-slate-50 dark:hover:bg-[#1A1A1A]"
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[9px] text-[#64748B] truncate">{p.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-[#64748B]">₹</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder={`Or enter custom amount (current: ₹${amount.toLocaleString("en-IN")})`}
                      className="w-full bg-[#F8FAFC] dark:bg-[#0E0E0E] text-xs pl-7 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-[#0F172A] dark:text-white focus:outline-none focus:border-[#0B72E7]"
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider block">
                  Payment Rail
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("upi")}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold ${
                      method === "upi"
                        ? "border-[#0B72E7] bg-blue-50 dark:bg-blue-950/40 text-[#0B72E7] dark:text-[#3395FF]"
                        : "border-[#E2E8F0] dark:border-[#262626] text-[#64748B]"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI (Instant)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("card")}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold ${
                      method === "card"
                        ? "border-[#0B72E7] bg-blue-50 dark:bg-blue-950/40 text-[#0B72E7] dark:text-[#3395FF]"
                        : "border-[#E2E8F0] dark:border-[#262626] text-[#64748B]"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card (Visa/MC)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("netbanking")}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold ${
                      method === "netbanking"
                        ? "border-[#0B72E7] bg-blue-50 dark:bg-blue-950/40 text-[#0B72E7] dark:text-[#3395FF]"
                        : "border-[#E2E8F0] dark:border-[#262626] text-[#64748B]"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Netbanking</span>
                  </button>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-2 flex items-center justify-between border-t border-[#E2E8F0] dark:border-[#262626]">
                <div className="flex items-center space-x-1.5 text-[11px] text-[#64748B]">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  <span>HMAC-SHA256 Authenticated</span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#333333] text-xs font-semibold text-[#0F172A] dark:text-white hover:bg-slate-50 dark:hover:bg-[#1A1A1A] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying & Ingesting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Fire Payment Event</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
