"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Download } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface ReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportUploadModal: React.FC<ReportUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a Razorpay Settlement Recon CSV file.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/reconcile/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status: ${res.statusText}`);
      }

      const data = await res.json();
      setUploadResult(data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to process custom reconciliation report.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleCsv = `payment_id,order_id,amount,fee,tax,method,settlement_id
pay_usr_101,order_usr_101,5000.00,100.00,18.00,card,setl_usr_8801
pay_usr_102,order_usr_102,12000.00,240.00,43.20,netbanking,setl_usr_8801
pay_usr_103,order_usr_103,2500.00,0.00,0.00,upi,setl_usr_8801
pay_usr_104,order_usr_104,72000.00,1440.00,259.20,card,setl_usr_8802`;
    
    const blob = new Blob([sampleCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "razorpay_sample_recon.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#262626] rounded-xl max-w-lg w-full p-6 shadow-xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#262626] mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#0B254A] text-[#0B72E7] dark:text-[#3395FF]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EDEDED]">
                Upload Merchant Settlement Report
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
                Razorpay Settlement CSV, Bank Statement MT940 / CSV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#1E1E1E] text-[#64748B] dark:text-[#A1A1AA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#E2E8F0] dark:border-[#262626] hover:border-[#0B72E7] dark:hover:border-[#3395FF] rounded-xl p-6 text-center cursor-pointer bg-[#F8FAFC] dark:bg-[#0E0E0E] transition-colors mb-4"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.json"
            className="hidden"
          />
          <FileText className="w-8 h-8 text-[#0B72E7] dark:text-[#3395FF] mx-auto mb-2" />
          {file ? (
            <div>
              <span className="text-xs font-bold text-[#0F172A] dark:text-[#EDEDED] block truncate">
                {file.name}
              </span>
              <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA]">
                {(file.size / 1024).toFixed(1)} KB • Click to change file
              </span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-[#0F172A] dark:text-[#EDEDED] block">
                Click or drag Razorpay Settlement Recon CSV
              </span>
              <span className="text-[10px] text-[#64748B] dark:text-[#A1A1AA] mt-1 block">
                Supports standard payment_id, order_id, amount, fee, tax, method columns
              </span>
            </div>
          )}
        </div>

        {/* Sample Template Download */}
        <div className="flex items-center justify-between text-xs pb-4 mb-4 border-b border-[#E2E8F0] dark:border-[#262626]">
          <span className="text-[#64748B] dark:text-[#A1A1AA]">Need a template?</span>
          <button
            onClick={handleDownloadSample}
            className="flex items-center space-x-1 text-[#0B72E7] dark:text-[#3395FF] font-semibold hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample CSV</span>
          </button>
        </div>

        {/* Status / Results */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-[#3E0E0E] text-[#DC2626] text-xs mb-4 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploadResult && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-[#052E16] text-[#16A34A] text-xs mb-4 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>
              Ingested {uploadResult.rows_ingested} records. Full reconciliation executed successfully!
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#F1F5F9] dark:bg-[#1E1E1E] text-[#64748B] dark:text-[#A1A1AA] text-xs font-semibold hover:bg-[#E2E8F0] dark:hover:bg-[#334155]"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0B72E7] hover:bg-[#095BC0] dark:bg-[#3395FF] dark:hover:bg-[#1C84F6] text-white text-xs font-bold disabled:opacity-50"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing Recon...</span>
              </>
            ) : (
              <span>Run Reconcile on Report</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
