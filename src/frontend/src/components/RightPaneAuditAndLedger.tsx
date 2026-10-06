"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  Lock,
  ExternalLink,
  Cpu,
  Key,
  Flame,
  ArrowRight,
  Sparkles,
  Edit3,
  RefreshCw,
  Award
} from "lucide-react";
import {
  VerificationReport,
  LedgerAnchorResponse,
  ClaimVerification,
} from "@/lib/types";
import { formatAddress } from "@/lib/utils";

interface RightPaneAuditAndLedgerProps {
  report: VerificationReport | null;
  anchorReceipt: LedgerAnchorResponse | null;
  selectedClaimId: string | null;
  onSelectClaim: (claimId: string) => void;
  onClinicianOverride: (claimId: string, newStatement: string, physicianNote: string) => Promise<void>;
  onAnchorToLedger: () => Promise<void>;
  isOverriding: boolean;
  isAnchoring: boolean;
}

export const RightPaneAuditAndLedger: React.FC<RightPaneAuditAndLedgerProps> = ({
  report,
  anchorReceipt,
  selectedClaimId,
  onSelectClaim,
  onClinicianOverride,
  onAnchorToLedger,
  isOverriding,
  isAnchoring,
}) => {
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [targetClaimId, setTargetClaimId] = useState<string>("");
  const [newStatement, setNewStatement] = useState<string>("");
  const [physicianNote, setPhysicianNote] = useState<string>("");

  if (!report) {
    return (
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-xl backdrop-blur-sm h-full min-h-[450px] text-center">
        <Lock className="w-10 h-10 text-slate-600" />
        <div className="text-sm font-bold text-slate-300">3. Audit & Ledger Inactive</div>
        <p className="text-xs text-slate-500 max-w-xs">
          Run multi-agent verification to inspect adversarial critiques, Factuality Scores, and cryptographic receipts.
        </p>
      </div>
    );
  }

  const isFlagged = report.status === "FLAGGED_REVIEW";
  const isApproved = report.status === "APPROVED";
  const isVerified = report.status === "VERIFIED";

  const scorePercentage = Math.round(report.composite_factuality_score * 100);

  // Quick preset override for Renal contraindication
  const handleOpenOverride = (claim: ClaimVerification) => {
    setTargetClaimId(claim.claim_id);
    if (claim.assertion_text.toLowerCase().includes("metformin")) {
      setNewStatement("Prescribe Insulin Glargine 10 units subcutaneous daily with Nephrology consult.");
      setPhysicianNote("Replaced Metformin with basal insulin due to severe renal impairment (eGFR 24 mL/min/1.73m2).");
    } else if (claim.assertion_text.toLowerCase().includes("lisinopril")) {
      setNewStatement("Hold Lisinopril pending repeat potassium normalization.");
      setPhysicianNote("Withheld ACE-inhibitor due to baseline hyperkalemia (K 5.6 mEq/L).");
    } else {
      setNewStatement(claim.assertion_text);
      setPhysicianNote("Physician clinical judgment override and sign-off.");
    }
    setOverrideModalOpen(true);
  };

  const submitOverride = async () => {
    if (!targetClaimId || !newStatement) return;
    await onClinicianOverride(targetClaimId, newStatement, physicianNote);
    setOverrideModalOpen(false);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 flex flex-col gap-4 shadow-xl backdrop-blur-sm h-full overflow-y-auto">
      {/* Pane Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">3. Adversarial Audit & Ledger</h2>
            <p className="text-[11px] text-slate-400">Factuality scoring & cryptographic anchoring</p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
            isFlagged
              ? "bg-rose-500/20 text-rose-300 border-rose-500/50 danger-glow"
              : isApproved
              ? "bg-sky-500/20 text-sky-300 border-sky-500/50"
              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
          }`}
        >
          {isFlagged ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>HITL Review Required</span>
            </>
          ) : isApproved ? (
            <>
              <Award className="w-3.5 h-3.5" />
              <span>Clinician Authorized</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Auto-Verified (Safe)</span>
            </>
          )}
        </div>
      </div>

      {/* Factuality & Safety Score Gauge Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            Composite Factuality Score
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                isFlagged ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {report.composite_factuality_score.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">/ 1.00 (Threshold: 0.95)</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Grounded: <span className="text-emerald-400 font-bold">{report.grounded_claims_count}</span> | Flagged: <span className="text-rose-400 font-bold">{report.flagged_claims_count}</span>
          </div>
        </div>

        {/* Mini Meter Bar */}
        <div className="w-28 flex flex-col gap-1.5 text-right">
          <div className="text-[10px] font-mono font-bold text-slate-300">
            {scorePercentage}% Safe
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isFlagged
                  ? "bg-rose-500"
                  : isApproved
                  ? "bg-sky-400"
                  : "bg-emerald-400"
              }`}
              style={{ width: `${Math.min(scorePercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Adversarial Auditor Critique List */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Adversarial Safety Audits ({report.claim_verifications.length})</span>
          <span className="text-[10px] text-slate-500">Information Asymmetry</span>
        </label>

        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {report.claim_verifications.map((v) => {
            const isRed = v.severity === "RED";
            const isAmber = v.severity === "AMBER";
            const isSelected = selectedClaimId === v.claim_id;

            return (
              <div
                key={v.claim_id}
                onClick={() => onSelectClaim(v.claim_id)}
                className={`border rounded-xl p-3 flex flex-col gap-2 transition cursor-pointer ${
                  isRed
                    ? "bg-rose-950/40 border-rose-600/70"
                    : isAmber
                    ? "bg-amber-950/30 border-amber-600/50"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                } ${isSelected ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-950" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    {v.claim_id} • {v.section.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isRed
                          ? "bg-rose-500 text-white"
                          : isAmber
                          ? "bg-amber-500 text-slate-950"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {v.verdict.replace("_", " ")}
                    </span>
                    {isRed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenOverride(v);
                        }}
                        className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Override</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-200">{v.assertion_text}</div>

                {/* Audit Critique */}
                <div className="text-[11px] text-slate-400 bg-slate-900/70 p-2 rounded border border-slate-800">
                  <span className="font-semibold text-slate-300">Critique: </span>
                  {v.audit_critique}
                </div>

                {v.ground_truth_citation && (
                  <div className="text-[10px] text-sky-400/90 font-mono">
                    Citation: {v.ground_truth_citation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cryptographic Attestation & Ledger Anchoring */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Cryptographic Trust Layer
            </span>
          </div>
          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            Polygon PoS (Amoy)
          </span>
        </div>

        {!anchorReceipt ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-slate-400">
              {isFlagged
                ? "⚠️ Document blocked from blockchain ledger due to clinical contraindication. Clinician override required."
                : "Record is verified and ready for deterministic RFC 8785 Merkle batch anchoring."}
            </p>
            <button
              onClick={onAnchorToLedger}
              disabled={isFlagged || isAnchoring}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                isFlagged
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110 shadow-purple-900/40 cursor-pointer"
              }`}
            >
              {isAnchoring ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Merkle Root & Signing...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign & Anchor to Polygon Ledger</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Live Anchored Receipt Details */
          <div className="flex flex-col gap-2 text-xs font-mono bg-slate-900/80 p-3 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between text-emerald-400 font-bold font-sans">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Anchored & Signed</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Block #{anchorReceipt.block_number}</span>
            </div>

            {/* Document Hash */}
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-[9px] text-slate-500 uppercase">RFC 8785 Canonical SHA-256</span>
              <span className="text-[10px] text-sky-300 truncate">{anchorReceipt.canonical_sha256}</span>
            </div>

            {/* Merkle Root */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-500 uppercase">Merkle Batch Root</span>
              <span className="text-[10px] text-purple-300 truncate">{anchorReceipt.merkle_root}</span>
            </div>

            {/* Tx Hash with link */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-sans font-medium">Tx Hash:</span>
              <a
                href={`https://amoy.polygonscan.com/tx/${anchorReceipt.tx_hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
              >
                <span>{formatAddress(anchorReceipt.tx_hash, 8)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Clinician Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100">Physician Clinical Override ({targetClaimId})</h3>
              </div>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Replacement Clinical Assertion / Prescription</label>
                <textarea
                  value={newStatement}
                  onChange={(e) => setNewStatement(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Physician Clinical Rationale & Justification</label>
                <input
                  type="text"
                  value={physicianNote}
                  onChange={(e) => setPhysicianNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitOverride}
                disabled={isOverriding}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                {isOverriding ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Apply Override & Re-evaluate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
