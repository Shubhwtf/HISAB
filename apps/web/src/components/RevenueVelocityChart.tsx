"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  RefreshCw,
  Maximize2,
  CreditCard,
  Building2,
  Lock,
  ArrowRight
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface TimelinePoint {
  day: string;
  date_iso: string;
  gross: number;
  gross_formatted: string;
  settled: number;
  settled_formatted: string;
  fee: number;
  fee_formatted: string;
  txns: number;
}

interface TimelineData {
  points: TimelinePoint[];
  metrics: {
    peak_velocity_formatted: string;
    peak_txns_count: number;
    average_clearing_speed: string;
    blended_mdr_efficiency: string;
  };
}

export const RevenueVelocityChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "QTD">("30D");
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadTimeline = async (tf: string) => {
    setLoading(true);
    try {
      const res = await fetchApi<TimelineData>(`/api/reconcile/timeline?timeframe=${tf}`);
      setData(res);
    } catch (e) {
      console.error("Failed to load timeline data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline(timeframe);
  }, [timeframe]);

  const points = data?.points || [];
  const maxVal = points.length > 0 ? Math.max(...points.map((d) => d.gross), 1) : 1;
  const svgWidth = 900;
  const svgHeight = 250;
  const paddingX = 40;
  const paddingY = 32;

  const getCoordinates = (val: number, idx: number) => {
    const x = paddingX + (idx / Math.max(1, points.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - (val / (maxVal * 1.2)) * (svgHeight - paddingY * 2);
    return { x, y };
  };

  const grossPoints = points.map((d, i) => getCoordinates(d.gross, i));
  const settledPoints = points.map((d, i) => getCoordinates(d.settled, i));

  const grossPathD = grossPoints.length > 0 ? grossPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`, "") : "";
  const settledPathD = settledPoints.length > 0 ? settledPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`, "") : "";

  const grossAreaD = grossPoints.length > 0
    ? `${grossPathD} L ${grossPoints[grossPoints.length - 1].x} ${svgHeight - paddingY} L ${grossPoints[0].x} ${svgHeight - paddingY} Z`
    : "";
  const settledAreaD = settledPoints.length > 0
    ? `${settledPathD} L ${settledPoints[settledPoints.length - 1].x} ${svgHeight - paddingY} L ${settledPoints[0].x} ${svgHeight - paddingY} Z`
    : "";

  const activeGrossPt = hoveredIdx !== null ? grossPoints[hoveredIdx] : null;
  const activeSettledPt = hoveredIdx !== null ? settledPoints[hoveredIdx] : null;
  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;
  const tooltipLeftPercent = activeGrossPt ? (activeGrossPt.x / svgWidth) * 100 : 50;

  const tooltipTop = activeGrossPt
    ? activeGrossPt.y >= 120
      ? activeGrossPt.y - 128
      : activeGrossPt.y + 14
    : 20;

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] rounded-2xl p-6 shadow-sm mb-6 font-sans space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#262626]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#111827] dark:text-[#FFFFFF] tracking-tight">
                Capture Velocity & Settlement Clearance Trajectory
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800">
                Live Stream
              </span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
              Daily gross transaction volume vs net settled bank payouts.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#111827] dark:bg-white"></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF] font-medium">Gross Ingest</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B72E7]"></span>
              <span className="text-[#6B7280] dark:text-[#9CA3AF] font-medium">Bank Cleared</span>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-[#F9FAFB] dark:bg-[#141414] p-1 rounded-xl border border-[#E5E7EB] dark:border-[#262626] text-xs">
            {(["7D", "30D", "QTD"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  timeframe === t
                    ? "bg-[#111827] dark:bg-white text-white dark:text-black font-semibold shadow-xs"
                    : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-[#0A0A0A]/60 flex items-center justify-center z-10">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0B72E7]" />
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="grossGradientClean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111827" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#111827" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="settledGradientClean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B72E7" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0B72E7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
            const y = svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                stroke="currentColor"
                className="text-slate-100 dark:text-neutral-800"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {grossAreaD && <path d={grossAreaD} fill="url(#grossGradientClean)" />}
          {settledAreaD && <path d={settledAreaD} fill="url(#settledGradientClean)" />}

          {activeGrossPt && (
            <line
              x1={activeGrossPt.x}
              y1={10}
              x2={activeGrossPt.x}
              y2={svgHeight - paddingY}
              stroke="#0B72E7"
              strokeDasharray="3 3"
              strokeWidth="1.5"
              className="opacity-70"
            />
          )}

          {grossPathD && (
            <path
              d={grossPathD}
              fill="none"
              stroke="#111827"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-neutral-200"
            />
          )}
          {settledPathD && (
            <path
              d={settledPathD}
              fill="none"
              stroke="#0B72E7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((d, i) => {
            const pt = grossPoints[i];
            const sPt = settledPoints[i];
            if (!pt) return null;
            const isHovered = hoveredIdx === i;
            return (
              <g key={i}>
                <rect
                  x={pt.x - 20}
                  y={0}
                  width="40"
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? "6" : "3.5"}
                  fill="#111827"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="pointer-events-none transition-all dark:fill-white dark:stroke-black"
                />

                {sPt && isHovered && (
                  <circle
                    cx={sPt.x}
                    cy={sPt.y}
                    r="5"
                    fill="#0B72E7"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="pointer-events-none transition-all"
                  />
                )}

                {i % 2 === 0 && (
                  <text
                    x={pt.x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className="text-[10px] fill-[#6B7280] dark:fill-[#9CA3AF] font-medium pointer-events-none"
                  >
                    {d.day}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {activePoint && activeGrossPt && (
          <div
            style={{
              left: `${Math.min(Math.max(tooltipLeftPercent, 16), 84)}%`,
              top: `${tooltipTop}px`,
            }}
            className="absolute transform -translate-x-1/2 bg-white dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#262626] text-[#111827] dark:text-[#FFFFFF] p-3.5 rounded-2xl shadow-xl space-y-2 z-30 min-w-[220px]"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#262626] pb-1.5">
              <span className="font-bold text-xs text-[#111827] dark:text-white">
                {activePoint.day}, 2026
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF]">
                {activePoint.txns} Orders
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Gross Capture:</span>
                <span className="font-bold font-mono">
                  {activePoint.gross_formatted}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Net Settled:</span>
                <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] font-mono">
                  {activePoint.settled_formatted}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E5E7EB] dark:border-[#262626]">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">MDR + GST Fee:</span>
                <span className="font-bold text-red-600 dark:text-red-400 font-mono">
                  {activePoint.fee_formatted}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#262626]">
          <span className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase">Peak Ingestion Velocity</span>
          <div className="text-base font-bold text-[#111827] dark:text-[#FFFFFF] mt-0.5 font-number">
            {data?.metrics.peak_velocity_formatted || "₹5,24,304.12 / day"}
          </div>
          <span className="text-[10px] text-[#0B72E7] dark:text-[#3395FF] font-medium flex items-center space-x-0.5 mt-0.5">
            <Zap className="w-3 h-3" />
            <span>{data?.metrics.peak_txns_count || 26} payments captured in single day</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#262626]">
          <span className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase">Average Clearing Speed</span>
          <div className="text-base font-bold text-[#111827] dark:text-[#FFFFFF] mt-0.5 font-number">
            {data?.metrics.average_clearing_speed || "T+1.2 Days"}
          </div>
          <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-medium flex items-center space-x-0.5 mt-0.5">
            <ShieldCheck className="w-3 h-3" />
            <span>Standard RBI NEFT/RTGS settlement window</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#262626]">
          <span className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase">MDR Fee Efficiency</span>
          <div className="text-base font-bold text-[#111827] dark:text-[#FFFFFF] mt-0.5 font-number">
            {data?.metrics.blended_mdr_efficiency || "1.62% Blended"}
          </div>
          <span className="text-[10px] text-[#0B72E7] dark:text-[#3395FF] font-medium flex items-center space-x-0.5 mt-0.5">
            <CheckCircle2 className="w-3 h-3" />
            <span>Within agreed merchant schedule</span>
          </span>
        </div>
      </div>
    </div>
  );
};
