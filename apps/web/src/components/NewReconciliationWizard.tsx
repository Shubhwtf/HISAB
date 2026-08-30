"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  FileSpreadsheet,
  Download,
  FileCheck,
  Eye,
  Check
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { DynamicDataMapper } from "@/components/DynamicDataMapper";

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewReconciliationWizard: React.FC<WizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [reconName, setReconName] = useState("August 2026 Monthly Reconciliation");
  const [dateRange, setDateRange] = useState("2026-08-01 to 2026-08-28");
  const [matchingMode, setMatchingMode] = useState("TIERED_1_TO_3");
  const [materialityThreshold, setMaterialityThreshold] = useState("5000");

  // Uploaded custom report state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContentText, setFileContentText] = useState<string>("");
  const [detectedColumns, setDetectedColumns] = useState<string[]>([
    "Txn Ref", "order_id", "Amt", "Fee", "GST", "Created", "UTR No"
  ]);
  const [detectedRowCount, setDetectedRowCount] = useState<number>(6);
  const [detectedFilename, setDetectedFilename] = useState<string>("sample_merchant_recon_export.csv");
  const [detectedSourceType, setDetectedSourceType] = useState<string>("SETTLEMENT_RECONCILIATION");
  const [sampleRowsPreview, setSampleRowsPreview] = useState<any[]>([
    { "Txn Ref": "pay_demo_101", "order_id": "order_demo_101", "Amt": "1500.00", "Fee": "30.00", "GST": "5.40", "UTR No": "UTRN992817261" },
    { "Txn Ref": "pay_demo_102", "order_id": "order_demo_102", "Amt": "4200.00", "Fee": "84.00", "GST": "15.12", "UTR No": "UTRN992817261" },
    { "Txn Ref": "pay_demo_106", "order_id": "order_demo_106", "Amt": "72250.00", "Fee": "1445.00", "GST": "260.10", "UTR No": "UTRN992817262" },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [progressEvents, setProgressEvents] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const parseCsvText = (text: string, filename: string) => {
    // Strip UTF-8 BOM if present
    const cleanText = text.replace(/^\uFEFF/, "");
    setFileContentText(cleanText);
    setDetectedFilename(filename);

    const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length > 0) {
      // Auto detect delimiter
      const firstLine = lines[0];
      let delimiter = ",";
      if (firstLine.includes("\t") && !firstLine.includes(",")) delimiter = "\t";
      else if (firstLine.includes(";") && !firstLine.includes(",")) delimiter = ";";
      else if (firstLine.includes("|") && !firstLine.includes(",")) delimiter = "|";

      const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ""));
      setDetectedColumns(headers);
      setDetectedRowCount(Math.max(1, lines.length - 1));

      // Source type heuristics
      const lowerName = filename.toLowerCase();
      const lowerHeaders = headers.map(h => h.toLowerCase());
      if (lowerName.includes("bank") || lowerHeaders.includes("narration")) {
        setDetectedSourceType("BANK_STATEMENT");
      } else if (lowerName.includes("refund") || lowerHeaders.includes("refund_id")) {
        setDetectedSourceType("REFUNDS");
      } else if (lowerName.includes("dispute") || lowerHeaders.includes("chargeback")) {
        setDetectedSourceType("DISPUTES");
      } else if (lowerName.includes("settle") || lowerHeaders.includes("utr")) {
        setDetectedSourceType("SETTLEMENT_RECONCILIATION");
      } else {
        setDetectedSourceType("PAYMENTS");
      }

      // Parse first 3 rows as sample
      const preview: any[] = [];
      for (let i = 1; i < Math.min(4, lines.length); i++) {
        const vals = lines[i].split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ""));
        const rowObj: any = {};
        headers.forEach((h, hIdx) => {
          rowObj[h] = vals[hIdx] || "";
        });
        preview.push(rowObj);
      }
      setSampleRowsPreview(preview);
    }
  };

  const handleFileProcess = (file: File) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        parseCsvText(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSampleReport = () => {
    const sampleCsv = `Txn Ref,order_id,Amt,Fee,GST,Created,UTR No,entity
pay_demo_101,order_demo_101,1500.00,30.00,5.40,2026-08-28T10:15:00Z,UTRN992817261,payment
pay_demo_102,order_demo_102,4200.00,84.00,15.12,2026-08-28T11:20:00Z,UTRN992817261,payment
pay_demo_103,order_demo_103,950.00,19.00,3.42,2026-08-28T12:00:00Z,UTRN992817261,payment
pay_demo_104,order_demo_104,8900.00,178.00,32.04,2026-08-28T14:10:00Z,UTRN992817262,payment
pay_demo_105,order_demo_105,12500.00,250.00,45.00,2026-08-28T15:45:00Z,UTRN992817262,payment
pay_demo_106,order_demo_106,72250.00,1445.00,260.10,2026-08-28T16:00:00Z,UTRN992817262,payment`;

    const blob = new Blob([sampleCsv], { type: "text/csv" });
    const file = new File([blob], "sample_merchant_recon_export.csv", { type: "text/csv" });
    setUploadedFile(file);
    parseCsvText(sampleCsv, "sample_merchant_recon_export.csv");
  };

  const handleStartRecon = async () => {
    setIsRunning(true);
    setProgressEvents([
      "▶ Initializing HISAB Engine...",
      `▶ Reading uploaded stream: ${detectedFilename} (${detectedRowCount} records)...`,
      "▶ Tier 1 Exact Matching: Resolving payment-order-settlement edges...",
      "▶ Tier 2 Constraint Matching: Evaluating MDR fee schedule & Section 194-O TDS...",
      "▶ Tier 3 Batch Decomposition: Resolving gross payout line items...",
      "▶ Running Seven Financial Controls Matrix (CTL_01 - CTL_07)...",
      "▶ Inspecting Forensic Double-Loss Outflows...",
      "✓ Reconciled successfully. Sealed into SHA-256 Audit Ledger.",
    ]);

    try {
      let resultData: any = null;
      if (uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        const res = await fetch("http://localhost:8000/api/reconcile/upload", {
          method: "POST",
          body: formData,
        });
        resultData = await res.json();
      } else {
        resultData = await fetchApi("/api/reconcile/run", { method: "POST" });
      }

      setUploadResult(resultData);
      setIsRunning(false);
    } catch (e) {
      console.error(e);
      setIsRunning(false);
    }
  };

  const handleCompleteAndClose = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden text-[#0F172A] dark:text-[#EDEDED]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#262626]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#0B72E7] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              H
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                New Reconciliation Workspace
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA]">
                Upload Merchant Financial Reports, Dynamic Schema Mapping & Immutable Snapshot
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, label: "1. Config" },
            { num: 2, label: "2. Upload CSV" },
            { num: 3, label: "3. Field Mapper" },
            { num: 4, label: "4. Snapshot & Insights" },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-2 rounded-lg border text-center transition-colors ${
                step === s.num
                  ? "bg-blue-50 dark:bg-[#0B254A] border-[#0B72E7] dark:border-[#3395FF]"
                  : "bg-[#F8FAFC] dark:bg-[#0E0E0E] border-[#E2E8F0] dark:border-[#262626]"
              }`}
            >
              <span className={`text-[10px] font-bold ${step >= s.num ? "text-[#0B72E7] dark:text-[#3395FF]" : "text-[#64748B]"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1: CONFIGURATION */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase block mb-1">
                  Reconciliation Batch Name
                </label>
                <input
                  type="text"
                  value={reconName}
                  onChange={(e) => setReconName(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E0E0E] text-[#0F172A] dark:text-[#EDEDED] text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#262626] font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase block mb-1">
                  Date Range
                </label>
                <input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E0E0E] text-[#0F172A] dark:text-[#EDEDED] text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#262626] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase block mb-1">
                  Matching Mode
                </label>
                <select
                  value={matchingMode}
                  onChange={(e) => setMatchingMode(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E0E0E] text-[#0F172A] dark:text-[#EDEDED] text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#262626]"
                >
                  <option value="TIERED_1_TO_3">Tiered Ladder (Exact → Constraint → Fuzzy)</option>
                  <option value="EXACT_ONLY">Tier 1 Exact Matcher Only</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase block mb-1">
                  Materiality Threshold (INR)
                </label>
                <input
                  type="number"
                  value={materialityThreshold}
                  onChange={(e) => setMaterialityThreshold(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E0E0E] text-[#0F172A] dark:text-[#EDEDED] text-xs px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#262626] font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] dark:bg-[#0E0E0E] rounded-xl border border-[#E2E8F0] dark:border-[#262626] text-xs text-[#64748B] dark:text-[#A1A1AA]">
              <span className="font-bold text-[#0F172A] dark:text-[#EDEDED]">Merchant:</span> Nova Commerce Pvt Ltd • <span className="font-bold text-[#0F172A] dark:text-[#EDEDED]">Profile:</span> Razorpay Standard Commercial (2.0% Cards / 0.1% TDS)
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm"
              >
                <span>Continue to Upload Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD REPORT */}
        {step === 2 && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".csv,.xlsx,.txt,.tsv"
              className="hidden"
            />

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2.5 ${
                isDragOver
                  ? "border-[#0B72E7] bg-blue-50/80 dark:bg-[#0B254A]/40"
                  : "border-[#CBD5E1] dark:border-[#333333] bg-[#F8FAFC] dark:bg-[#0E0E0E] hover:border-[#0B72E7]"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#0B72E7] text-white flex items-center justify-center mx-auto shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[#0F172A] dark:text-[#EDEDED]">
                  {uploadedFile ? `Loaded: ${uploadedFile.name}` : "Drop your financial report here or click to browse"}
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                  Supports UTF-8 CSV, UTF-8 BOM, tab/semicolon delimiters with custom headers.
                </p>
              </div>

              {detectedFilename && (
                <div className="pt-2 flex items-center justify-center space-x-2 text-xs font-mono font-semibold text-[#16A34A]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{detectedFilename} ({detectedRowCount} rows, {detectedColumns.length} headers detected)</span>
                </div>
              )}
            </div>

            {/* Quick 1-Click Load Sample Button */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] text-xs">
              <div className="flex items-center space-x-2 text-[#64748B]">
                <FileSpreadsheet className="w-4 h-4 text-[#0B72E7]" />
                <span>Test immediately with ready sample dataset:</span>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleReport}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF] font-semibold text-xs border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
              >
                Load Sample Report (6 Records)
              </button>
            </div>

            {/* Detected Columns Pills */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F172A] dark:text-[#EDEDED]">
                  Detected Column Headers ({detectedColumns.length}):
                </span>
                <span className="text-[10px] text-[#16A34A] font-semibold">✓ Source: {detectedSourceType}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {detectedColumns.map((col, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] font-mono text-[10px] text-[#0B72E7]">
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-xs font-semibold text-[#64748B]">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm"
              >
                <span>Proceed to Dynamic Field Mapping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DYNAMIC AI COLUMN MAPPING */}
        {step === 3 && (
          <DynamicDataMapper
            filename={detectedFilename}
            sourceType={detectedSourceType}
            columns={detectedColumns}
            sampleRows={sampleRowsPreview}
            onMappingsApproved={() => {
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}

        {/* STEP 4: SNAPSHOT & LIVE INSIGHTS */}
        {step === 4 && (
          <div className="space-y-4">
            {!uploadResult ? (
              <>
                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED]">
                      SEALING IMMUTABLE SNAPSHOT ({detectedFilename})
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-green-100 dark:bg-[#052E16] text-[#16A34A]">
                      READY FOR RECONCILIATION
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
                    Ready to execute automated 3-tier matching, double-loss forensics, and safe policy gating across <strong>{detectedRowCount} uploaded records</strong>.
                  </p>
                </div>

                {/* Live Progress Logs */}
                {progressEvents.length > 0 && (
                  <div className="p-4 rounded-xl bg-black text-green-400 font-mono text-xs space-y-1.5 max-h-44 overflow-y-auto">
                    {progressEvents.map((ev, idx) => (
                      <div key={idx}>{ev}</div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(3)}
                    disabled={isRunning}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-[#64748B]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartRecon}
                    disabled={isRunning}
                    className="px-6 py-2.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] text-white font-semibold text-xs shadow-sm flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Reconciling Uploaded Report...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Run Reconciliation on Uploaded Report</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* REAL INSIGHTS DERIVED FROM THAT UPLOADED DATA */
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-xl bg-green-50 dark:bg-[#052E16]/40 border border-green-200 dark:border-green-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-bold text-xs text-green-950 dark:text-green-200">
                        Reconciliation Complete for {uploadResult.filename}
                      </h4>
                      <p className="text-[11px] text-green-800 dark:text-green-300">
                        {uploadResult.rows_ingested} records ingested and reconciled into SHA-256 Audit Ledger.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100">
                    {uploadResult.snapshot_id || "SEALED"}
                  </span>
                </div>

                {/* Insights Summary Cards */}
                {uploadResult.insights && (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">Gross Turnover</span>
                      <div className="font-bold text-sm text-[#0F172A] dark:text-[#EDEDED] mt-0.5">
                        {uploadResult.insights.gross_turnover_formatted}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">Net Payout Credited</span>
                      <div className="font-bold text-sm text-[#16A34A] mt-0.5">
                        {uploadResult.insights.net_settled_formatted}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626]">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">Gateway Fees & Tax</span>
                      <div className="font-bold text-sm text-[#0F172A] dark:text-[#EDEDED] mt-0.5">
                        {uploadResult.insights.total_fees_formatted}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E0E0E] border border-[#E2E8F0] dark:border-[#262626] text-xs space-y-1.5">
                  <div className="font-semibold text-[#0F172A] dark:text-[#EDEDED]">Control Evaluation Results:</div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Discovered Exceptions:</span>
                    <span className="font-bold text-[#0F172A] dark:text-[#EDEDED]">{uploadResult.insights?.exceptions_discovered || 0} cases</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Safe Auto-Resolved by Policy Gate:</span>
                    <span className="font-bold text-[#16A34A]">{uploadResult.insights?.auto_resolved_count || 0} cases</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Escalated for Human Review:</span>
                    <span className="font-bold text-[#DC2626]">{uploadResult.insights?.escalated_count || 0} cases</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleCompleteAndClose}
                    className="px-6 py-2.5 rounded-xl bg-[#0B72E7] hover:bg-[#095BC0] text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5"
                  >
                    <span>Apply & Open Live Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
