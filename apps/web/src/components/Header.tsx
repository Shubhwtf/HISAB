"use client";

import React from "react";
import { ShieldCheck, Play, RefreshCw, Layers, Database, Sun, Moon } from "lucide-react";

interface HeaderProps {
  onRunRecon: () => void;
  isRunning: boolean;
  lastUpdated: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onRunRecon, 
  isRunning, 
  lastUpdated, 
  isDarkMode, 
  onToggleDarkMode 
}) => {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#070D18]/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0B72E7] to-[#0C2340] flex items-center justify-center shadow-md shadow-[#0B72E7]/20">
            <span className="font-extrabold text-white tracking-wider text-base">हि</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">HISAB</span>
              <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-blue-50 dark:bg-blue-950 text-[#0B72E7] dark:text-[#3395FF] border border-blue-200 dark:border-blue-800 tracking-wider uppercase">
                FINANCE CONTROLLER
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Gateway Recon • <span className="text-gray-800 dark:text-gray-200 font-semibold">Nova Commerce Pvt Ltd</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/90 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-gray-800 dark:text-gray-300">Razorpay Feed Active</span>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <span>Sync: {lastUpdated}</span>
          </div>

          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 transition-colors"
            title={isDarkMode ? "Switch to Razorpay Light Mode" : "Switch to Razorpay Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#0B72E7]" />}
          </button>

          <button
            onClick={onRunRecon}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0B72E7] hover:bg-[#095bc0] dark:bg-[#3395FF] dark:hover:bg-[#2084f0] text-white font-bold text-xs shadow-md shadow-[#0B72E7]/25 disabled:opacity-50 transition-all duration-150 active:scale-95"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Reconciling...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Reconcile Engine</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
