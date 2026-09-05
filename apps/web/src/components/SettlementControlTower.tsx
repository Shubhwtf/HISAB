"use client";

import React, { useState, useEffect } from "react";
import { Landmark, ArrowRight, Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { fetchApi } from "@/lib/api";

export const SettlementControlTower: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTowerData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi("/api/settlements/tower");
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTowerData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] p-5 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase">
            1. Total Settled Payout
          </span>
          <div className="text-2xl font-black text-[#0F172A] dark:text-[#EDEDED] mt-1">
            {data?.summary?.total_settled_payout_formatted ?? "₹0.00"}
          </div>
          <span className="text-xs text-[#64748B] mt-1 block">{data?.settlements_count ?? 0} Batches debited by Razorpay</span>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] p-5 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-[#16A34A] uppercase">
            2. Verified Bank Credits
          </span>
          <div className="text-2xl font-black text-[#16A34A] mt-1">
            {data?.summary?.total_bank_credited_formatted ?? "₹0.00"}
          </div>
          <span className="text-xs text-[#16A34A] mt-1 block">Matched to HDFC NEFT/RTGS lines</span>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] p-5 rounded-xl shadow-sm">
          <span className="text-[10px] font-bold text-[#0B72E7] dark:text-[#3395FF] uppercase">
            3. Cash in Transit
          </span>
          <div className="text-2xl font-black text-[#0B72E7] dark:text-[#3395FF] mt-1">
            {data?.summary?.cash_in_transit_formatted ?? "₹0.00"}
          </div>
          <span className="text-xs text-[#64748B] mt-1 block">Zero unexplained banking rail leak</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
              SETTLEMENT BATCH TO BANK CLEARANCE LIFECYCLE
            </h3>
            <p className="text-xs text-[#64748B]">UTR matching, fee deductions, and clearance timestamps</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E8F0] dark:border-[#262626] text-[#64748B] uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Settlement ID</th>
                <th className="py-2.5 px-3">UTR Reference</th>
                <th className="py-2.5 px-3 text-right">Gross</th>
                <th className="py-2.5 px-3 text-right">Fee & GST</th>
                <th className="py-2.5 px-3 text-right">Net Payout</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Settled At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
              {data?.timeline?.map((item: any) => (
                <tr key={item.settlement_id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#081120]">
                  <td className="py-3 px-3 font-mono font-bold text-[#0F172A] dark:text-[#EDEDED]">{item.settlement_id}</td>
                  <td className="py-3 px-3 font-mono text-[#0B72E7] dark:text-[#3395FF]">{item.utr || "PENDING"}</td>
                  <td className="py-3 px-3 text-right font-mono">{item.gross_formatted}</td>
                  <td className="py-3 px-3 text-right font-mono text-[#DC2626]">{item.fee_formatted}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#16A34A]">{item.net_payout_formatted}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 dark:bg-[#052E16] text-[#16A34A]">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#64748B]">{item.settled_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
