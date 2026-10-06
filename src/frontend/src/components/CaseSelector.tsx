"use client";

import React from "react";
import { Play, Sparkles, AlertOctagon, CheckCircle2, Stethoscope, RefreshCw } from "lucide-react";
import { ClinicalTestCase } from "@/lib/types";

interface CaseSelectorProps {
  cases: ClinicalTestCase[];
  selectedCaseId: string;
  onSelectCase: (testCase: ClinicalTestCase) => void;
  isLoading: boolean;
  onRunPipeline: () => void;
}

export const CaseSelector: React.FC<CaseSelectorProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  isLoading,
  onRunPipeline,
}) => {
  return (
    <div className="px-6 py-2 max-w-[1700px] mx-auto">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Cases Title & Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r-0 sm:border-r border-slate-800">
            <Stethoscope className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Clinical Scenarios
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {cases.map((c, index) => {
              const isSelected = c.case_id === selectedCaseId;
              const isDanger = c.case_title.toLowerCase().includes("contraindication") || c.case_title.toLowerCase().includes("hyperkalemia");

              return (
                <button
                  key={c.case_id}
                  onClick={() => onSelectCase(c)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? isDanger
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-900/30"
                        : "bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-md shadow-sky-900/30"
                      : "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {isDanger ? (
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Case {index + 1}: {c.case_title.split("(")[0].trim()}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Run Ingestion & Multi-Agent Verification Button */}
        <button
          onClick={onRunPipeline}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-600/30 hover:shadow-sky-500/50 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying Encounter...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Multi-Agent Verification</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
