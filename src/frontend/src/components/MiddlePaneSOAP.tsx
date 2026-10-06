"use client";

import React from "react";
import { Stethoscope, CheckCircle, AlertTriangle, AlertOctagon, Sparkles, HeartPulse, Pill, Layers } from "lucide-react";
import { SOAPRecord, ClaimVerification, Severity } from "@/lib/types";

interface MiddlePaneSOAPProps {
  soap: SOAPRecord | null;
  verifications: ClaimVerification[];
  selectedClaimId: string | null;
  onSelectClaim: (claimId: string) => void;
  isLoading: boolean;
}

export const MiddlePaneSOAP: React.FC<MiddlePaneSOAPProps> = ({
  soap,
  verifications,
  selectedClaimId,
  onSelectClaim,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-xl backdrop-blur-sm h-full min-h-[450px]">
        <div className="w-12 h-12 rounded-full border-2 border-sky-500 border-t-transparent animate-spin flex items-center justify-center text-sky-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="text-sm font-bold text-slate-200">Dual-Agent Synthesis & Decomposition Active...</div>
        <p className="text-xs text-slate-400 text-center max-w-xs">
          Agent 1 is structuring the SOAP note while Agent 2 executes independent adversarial audits.
        </p>
      </div>
    );
  }

  if (!soap) {
    return (
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-xl backdrop-blur-sm h-full min-h-[450px] text-center">
        <Layers className="w-10 h-10 text-slate-600" />
        <div className="text-sm font-bold text-slate-300">Awaiting Clinical Ingestion</div>
        <p className="text-xs text-slate-500 max-w-xs">
          Select a clinical scenario or enter custom patient notes and click &quot;Run Multi-Agent Verification&quot;.
        </p>
      </div>
    );
  }

  // Helper to find claim verification for an assertion
  const findVerification = (textSnippet: string): ClaimVerification | undefined => {
    return verifications.find((v) =>
      v.assertion_text.toLowerCase().includes(textSnippet.toLowerCase()) ||
      textSnippet.toLowerCase().includes(v.assertion_text.toLowerCase())
    );
  };

  const renderBadge = (verification?: ClaimVerification) => {
    if (!verification) return null;

    const isSelected = selectedClaimId === verification.claim_id;
    let badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    let Icon = CheckCircle;

    if (verification.severity === "RED") {
      badgeClass = "bg-rose-500/20 text-rose-300 border-rose-500/60 danger-glow";
      Icon = AlertOctagon;
    } else if (verification.severity === "AMBER") {
      badgeClass = "bg-amber-500/15 text-amber-300 border-amber-500/40";
      Icon = AlertTriangle;
    }

    return (
      <button
        onClick={() => onSelectClaim(verification.claim_id)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${badgeClass} ${
          isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-105" : ""
        }`}
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span>{verification.claim_id}: {verification.verdict.replace("_", " ")}</span>
      </button>
    );
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 flex flex-col gap-4 shadow-xl backdrop-blur-sm h-full overflow-y-auto">
      {/* Pane Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">2. AI Synthesized SOAP Record</h2>
            <p className="text-[11px] text-slate-400">Structured clinical draft with character-span claim badges</p>
          </div>
        </div>

        <div className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {soap.encounter_id}
        </div>
      </div>

      {/* S - Subjective */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
            [S] Subjective
          </span>
        </div>
        <div className="text-xs text-slate-200">
          <span className="font-semibold text-slate-400">Chief Complaint: </span>
          {soap.subjective.chief_complaint}
        </div>
        <div className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
          <span className="font-semibold text-slate-400">HPI: </span>
          {soap.subjective.history_of_present_illness}
        </div>
      </div>

      {/* O - Objective */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5" />
            [O] Objective Vitals & Labs
          </span>
        </div>

        {/* Vitals pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          {Object.entries(soap.objective.vitals).map(([k, v]) => (
            <div key={k} className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-center">
              <div className="text-[10px] text-slate-500 uppercase">{k.replace("_", " ")}</div>
              <div className="font-bold text-slate-200">{String(v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* A - Assessment */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
          [A] Clinical Assessment (ICD-10)
        </span>
        <div className="flex flex-col gap-2">
          {soap.assessment.map((item, idx) => {
            const ver = findVerification(item.diagnosis_name);
            return (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <span>{item.diagnosis_name}</span>
                    {item.icd10_code && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-sky-950 text-sky-300 border border-sky-800">
                        ICD-10: {item.icd10_code}
                      </span>
                    )}
                  </div>
                  {renderBadge(ver)}
                </div>
                <p className="text-[11px] text-slate-400">{item.clinical_rationale}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* P - Plan */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5" />
            [P] Management Plan & Interventions
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {soap.plan.map((planItem, idx) => {
            const ver = findVerification(planItem.drug_name || planItem.description);
            const isRed = ver?.severity === "RED";

            return (
              <div
                key={idx}
                className={`border rounded-lg p-2.5 flex flex-col gap-1.5 transition-all ${
                  isRed
                    ? "bg-rose-950/30 border-rose-700/60 shadow-md shadow-rose-950/50"
                    : "bg-slate-900/60 border-slate-800"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {planItem.action_type}
                    </span>
                    {planItem.drug_name && (
                      <span className="text-xs font-bold text-slate-100">
                        {planItem.drug_name} {planItem.dosage}
                      </span>
                    )}
                  </div>
                  {renderBadge(ver)}
                </div>
                <p className="text-[11px] text-slate-300">{planItem.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
