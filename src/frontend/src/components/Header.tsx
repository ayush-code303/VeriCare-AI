"use client";

import React from "react";
import { ShieldCheck, Activity, Cpu, Lock, Sparkles, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  backendConnected: boolean;
  onOpenVerifierModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected, onOpenVerifierModal }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Platform Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-emerald-400 p-[2px] flex items-center justify-center shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-sky-400" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-indigo-200 to-emerald-300 bg-clip-text text-transparent">
                VeriCare AI
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                Multi-Agent Cognitive Core
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Autonomous Clinical Verification & Cryptographic Ledger Anchoring
            </p>
          </div>
        </div>

        {/* Status badges & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Public Zero-Gas Verifier Button */}
          <button
            onClick={onOpenVerifierModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-all text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Public Proof Verifier</span>
          </button>

          {/* Blockchain network badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Polygon Amoy (80002)</span>
          </div>

          {/* Backend Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className={backendConnected ? "text-slate-300" : "text-rose-400"}>
              {backendConnected ? "Backend Connected (Port 8000)" : "Backend Offline"}
            </span>
          </div>

          {/* Physician ID pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-sky-200 text-xs font-medium">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Clinician: DR-4019</span>
          </div>
        </div>
      </div>
    </header>
  );
};
