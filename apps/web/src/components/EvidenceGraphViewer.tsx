"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, FileCheck2, AlertTriangle, Layers, CheckCircle2 } from "lucide-react";
import { PaymentDossier, fetchApi } from "@/lib/api";

interface EvidenceGraphViewerProps {
  initialPaymentId?: string;
}

export const EvidenceGraphViewer: React.FC<EvidenceGraphViewerProps> = ({ initialPaymentId = "pay_101" }) => {
  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const [dossier, setDossier] = useState<PaymentDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEdgeIdx, setSelectedEdgeIdx] = useState<number | null>(0);

  const loadEvidence = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<PaymentDossier>(`/api/evidence/${targetId}`);
      setDossier(data);
      setSelectedEdgeIdx(0);
    } catch (err: any) {
      setError(`Evidence dossier not found for '${targetId}'. Try 'pay_101' or 'pay_dbl'.`);
      setDossier(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence(initialPaymentId);
  }, [initialPaymentId]);

  return (
    <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl p-6 shadow-sm">
      {/* Header Search & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
              "PROVE IT" INTERACTIVE EVIDENCE GRAPH
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800 font-bold uppercase">
              SIGNATURE FEATURE #2
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
            Multi-touchpoint verifiable invariant proofs linking Order → Payment → Settlement → Bank.
          </p>
        </div>

        {/* Payment ID Input */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            placeholder="e.g. pay_101 or pay_dbl"
            className="bg-[#F8FAFC] dark:bg-[#0E0E0E] text-[#0F172A] dark:text-[#EDEDED] text-xs px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#262626] focus:outline-none focus:border-[#0B72E7] w-48 font-mono"
          />
          <button
            onClick={() => loadEvidence(paymentId)}
            className="px-3 py-1.5 rounded-lg bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white text-xs font-bold"
          >
            Inspect
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-[#64748B] dark:text-[#A1A1AA] text-xs animate-pulse font-mono">
          Constructing multi-touchpoint evidence graph...
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-[#3E0E0E] text-[#DC2626] text-xs mb-4">
          {error}
        </div>
      )}

      {dossier && !loading && (
        <div>
          {/* Decision Status Banner */}
          <div className="flex items-center justify-between bg-[#F8FAFC] dark:bg-[#0E0E0E] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#262626] mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${dossier.decision === 'MATCHED' ? 'bg-[#16A34A]' : 'bg-[#DC2626]'} text-white`}>
                {dossier.decision === 'MATCHED' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED]">
                    Reconciliation Status: {dossier.decision}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
                    {(dossier.overall_confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                  Order <span className="font-mono text-[#0F172A] dark:text-[#EDEDED]">{dossier.order_id}</span> • Payment <span className="font-mono text-[#0F172A] dark:text-[#EDEDED]">{dossier.payment_id}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] uppercase font-bold">Reconciled Amount</span>
              <div className="text-base font-bold text-[#16A34A]">
                ₹{(dossier.reconciled_amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Nodes Flow */}
          <div className="mb-6 overflow-x-auto pb-2">
            <div className="flex items-center justify-between min-w-[700px] gap-3">
              {dossier.evidence_graph.nodes.map((node, i) => (
                <React.Fragment key={node.id}>
                  <div className="bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] p-3.5 rounded-xl flex-1 text-center shadow-sm">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white dark:bg-[#111111] text-[#0B72E7] dark:text-[#3395FF] mb-1.5 inline-block border border-[#E2E8F0] dark:border-[#262626]">
                      {node.type}
                    </span>
                    <div className="font-mono font-bold text-[#0F172A] dark:text-[#EDEDED] text-xs mt-1 truncate">{node.id}</div>
                    {node.amount_formatted && (
                      <div className="text-xs font-bold text-[#16A34A] mt-0.5">{node.amount_formatted}</div>
                    )}
                    {node.utr && (
                      <div className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] font-mono mt-0.5 truncate">UTR: {node.utr}</div>
                    )}
                  </div>
                  {i < dossier.evidence_graph.nodes.length - 1 && (
                    <div className="flex flex-col items-center justify-center text-[#64748B] dark:text-[#A1A1AA]">
                      <ArrowRight className="w-4 h-4 text-[#0B72E7] dark:text-[#3395FF]" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Interactive Evidence Proof Points */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED] uppercase tracking-wider flex items-center space-x-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-[#0B72E7] dark:text-[#3395FF]" />
                <span>Verified Relationship Proofs</span>
              </h4>
              {dossier.evidence_graph.edges.map((edge, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedEdgeIdx(idx)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedEdgeIdx === idx
                      ? "bg-blue-50/70 dark:bg-[#0B254A]/40 border-[#0B72E7] dark:border-[#3395FF]"
                      : "bg-[#F8FAFC] dark:bg-[#0E0E0E] border-[#E2E8F0] dark:border-[#262626]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-[#0B72E7] dark:text-[#3395FF] font-mono">{edge.relationship}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#111111] text-[#64748B] dark:text-[#A1A1AA]">
                      {(edge.confidence * 100).toFixed(1)}% Proof
                    </span>
                  </div>
                  <div className="space-y-1">
                    {edge.proof_items.map((proof, pIdx) => (
                      <div key={pIdx} className="text-xs text-[#0F172A] dark:text-[#EDEDED] flex items-start space-x-1.5">
                        <span className="text-[#16A34A] font-bold">✓</span>
                        <span>{proof.replace(/^✓\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Controller Audit Steps */}
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED] uppercase tracking-wider flex items-center space-x-1.5 mb-2.5">
                <Layers className="w-3.5 h-3.5 text-[#0B72E7] dark:text-[#3395FF]" />
                <span>Controller Audit Trail Reasoning</span>
              </h4>
              <div className="bg-[#F8FAFC] dark:bg-[#0E0E0E] rounded-xl p-4 border border-[#E2E8F0] dark:border-[#262626] space-y-2 text-xs font-mono">
                {dossier.controller_reasoning.map((step, sIdx) => (
                  <div key={sIdx} className="p-2 rounded-lg bg-white dark:bg-[#111111] text-[#0F172A] dark:text-[#EDEDED] border border-[#E2E8F0] dark:border-[#262626]">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
