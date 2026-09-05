import React, { useState } from "react";
import { AlertOctagon, Clock, ExternalLink, CheckCircle, Shield } from "lucide-react";
import { DoubleLossAlertItem } from "@/lib/api";
import { DefensePackModal } from "@/components/DefensePackModal";

interface DoubleLossBannerProps {
  alerts: DoubleLossAlertItem[];
  onViewEvidence: (paymentId: string) => void;
}

export const DoubleLossBanner: React.FC<DoubleLossBannerProps> = ({ alerts, onViewEvidence }) => {
  const [activeAlertIdx, setActiveAlertIdx] = useState(0);
  const [showDefensePack, setShowDefensePack] = useState(false);

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 text-center mb-6">
        <CheckCircle className="w-8 h-8 text-[#16A34A] mx-auto mb-2" />
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">No Active Double-Loss Exposure</h3>
        <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-1">
          Forensic outflow detector is actively monitoring all refunds against incoming chargebacks.
        </p>
      </div>
    );
  }

  const alert = alerts[activeAlertIdx];

  return (
    <div className="bg-white dark:bg-[#111111] border border-red-200 dark:border-red-900/60 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-red-100 dark:border-red-900/40">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#DC2626] text-white">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED] tracking-tight">
                SIGNATURE DETECTOR: COMPOUNDED DOUBLE-LOSS OUTFLOW RISK
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-red-100 dark:bg-[#3E0E0E] text-[#DC2626] uppercase">
                CRITICAL EXPOSURE
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
              Order <span className="font-mono text-[#0F172A] dark:text-[#EDEDED] font-semibold">{alert.order_id}</span> has concurrent manual refund + active bank chargeback dispute.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewEvidence(alert.payment_id)}
            className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E0E0E] hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E] text-[#0B72E7] dark:text-[#3395FF] text-xs font-semibold border border-[#E2E8F0] dark:border-[#262626] flex items-center space-x-1.5 transition-colors"
          >
            <span>Inspect Evidence Graph</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowDefensePack(true)}
            className="px-4 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Generate Bank Defense Pack</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-5">
        <div className="bg-[#F8FAFC] dark:bg-[#0E0E0E] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626]">
          <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] uppercase font-bold">1. Original Sale Captured</span>
          <div className="text-base font-bold text-[#0F172A] dark:text-[#EDEDED] mt-1">{alert.original_payment_formatted}</div>
          <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-mono">{alert.payment_id}</span>
        </div>

        <div className="bg-[#F8FAFC] dark:bg-[#0E0E0E] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626]">
          <span className="text-[10px] text-[#DC2626] uppercase font-bold">2. Manual Refund Debited</span>
          <div className="text-base font-bold text-[#DC2626] mt-1">{alert.manual_refund_formatted}</div>
          <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA]">Credited to customer instrument</span>
        </div>

        <div className="bg-[#F8FAFC] dark:bg-[#0E0E0E] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#262626]">
          <span className="text-[10px] text-[#DC2626] uppercase font-bold">3. Bank Dispute Withheld</span>
          <div className="text-base font-bold text-[#DC2626] mt-1">{alert.chargeback_exposure_formatted}</div>
          <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA]">Principal + ₹500 fee</span>
        </div>

        <div className="bg-red-50 dark:bg-[#3E0E0E] p-3.5 rounded-xl border border-red-200 dark:border-red-900/80">
          <span className="text-[10px] text-[#DC2626] uppercase font-extrabold">Total Outflow Exposure</span>
          <div className="text-lg font-black text-[#DC2626] mt-1">{alert.total_exposure_formatted}</div>
          <span className="text-[10px] text-red-700 dark:text-red-300 font-bold">₹72k loss on ₹72k sale!</span>
        </div>
      </div>

      <div className="bg-[#F8FAFC] dark:bg-[#0E0E0E] rounded-xl p-4 border border-[#E2E8F0] dark:border-[#262626]">
        <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED] uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-[#DC2626]" />
          <span>Forensic Outflow Progression Timeline</span>
        </h4>
        <div className="space-y-2.5">
          {alert.timeline.map((event, idx) => (
            <div key={idx} className="flex items-start space-x-3 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] mt-1.5 flex-shrink-0"></span>
              <div className="flex-1">
                <span className="font-mono text-[#64748B] dark:text-[#A1A1AA] mr-2">{event.timestamp}</span>
                <span className="font-medium text-[#0F172A] dark:text-[#EDEDED]">{event.description}</span>
              </div>
              <span className={`font-mono font-bold ${event.amount_paise < 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                {event.amount_formatted}
              </span>
            </div>
          ))}
        </div>
      </div>

      <DefensePackModal
        paymentId={alert.payment_id}
        isOpen={showDefensePack}
        onClose={() => setShowDefensePack(false)}
      />
    </div>
  );
};
