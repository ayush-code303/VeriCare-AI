"use client";

import React, { useState } from "react";
import { Lock, ShieldAlert, CheckCircle2, RefreshCw, AlertOctagon, Terminal } from "lucide-react";
import { verifyRecordIntegrity } from "@/lib/api";
import { SOAPRecord, LedgerAnchorResponse } from "@/lib/types";

interface TamperProofVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  soap: SOAPRecord | null;
  anchorReceipt: LedgerAnchorResponse | null;
}

export const TamperProofVerifierModal: React.FC<TamperProofVerifierModalProps> = ({
  isOpen,
  onClose,
  soap,
  anchorReceipt,
}) => {
  const [editableJson, setEditableJson] = useState<string>(
    soap ? JSON.stringify(soap, null, 2) : "{\n  \"message\": \"No active SOAP record loaded. Select a case first.\"\n}"
  );
  const [merkleRoot, setMerkleRoot] = useState<string>(anchorReceipt?.merkle_root || "0x89bc44d7159c9d784fa720e1183c21a4f00198e3b4a22c5432a10e88256cd1b4");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Sync state when props change
  React.useEffect(() => {
    if (soap) {
      setEditableJson(JSON.stringify(soap, null, 2));
    }
    if (anchorReceipt) {
      setMerkleRoot(anchorReceipt.merkle_root);
    }
  }, [soap, anchorReceipt]);

  if (!isOpen) return null;

  const handleSimulateTampering = () => {
    try {
      const parsed = JSON.parse(editableJson);
      if (parsed.plan && parsed.plan.length > 0) {
        parsed.plan[0].description = "TAMPERED: Altered dosage by unauthorized third party.";
      } else {
        parsed.subjective = { ...parsed.subjective, chief_complaint: "TAMPERED: Post-hoc forged note." };
      }
      setEditableJson(JSON.stringify(parsed, null, 2));
    } catch {
      setEditableJson(editableJson + " /* TAMPERED */");
    }
  };

  const handleRestoreOriginal = () => {
    if (soap) {
      setEditableJson(JSON.stringify(soap, null, 2));
    }
  };

  const handleRunVerification = async () => {
    setIsVerifying(true);
    setResult(null);
    try {
      const parsedSoap = JSON.parse(editableJson);
      const proof = anchorReceipt?.merkle_proof || [];
      const res = await verifyRecordIntegrity({
        soap_record: parsedSoap,
        merkle_root: merkleRoot,
        proof: proof,
      });
      setResult(res);
    } catch (e: any) {
      setResult({
        is_authentic: false,
        tamper_detected: true,
        verification_status: `ERROR: ${e.message || "Invalid JSON"}`,
        verified_at: new Date().toISOString(),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Zero-Gas Public Cryptographic Verifier</h3>
              <p className="text-xs text-slate-400">Mathematical non-repudiation & tamper-detection tester</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateTampering}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Simulate Malicious Alteration (Tamper)</span>
            </button>
            <button
              onClick={handleRestoreOriginal}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition"
            >
              Restore Authentic Record
            </button>
          </div>

          <button
            onClick={handleRunVerification}
            disabled={isVerifying}
            className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-900/30"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying Merkle Proof...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify Court Admissibility</span>
              </>
            )}
          </button>
        </div>

        {/* JSON Editor Box */}
        <div className="flex flex-col gap-1.5 flex-1 min-h-[220px]">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>SOAP JSON Document Payload (RFC 8785 Evaluator)</span>
          </label>
          <textarea
            value={editableJson}
            onChange={(e) => setEditableJson(e.target.value)}
            className="w-full flex-1 min-h-[200px] max-h-[300px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-300 font-mono focus:outline-none focus:border-sky-500 overflow-y-auto"
          />
        </div>

        {/* Anchored Merkle Root Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-400">Anchored Polygon Merkle Root</label>
          <input
            type="text"
            value={merkleRoot}
            onChange={(e) => setMerkleRoot(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-purple-300 font-mono"
          />
        </div>

        {/* Verification Result Banner */}
        {result && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              result.is_authentic
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 safe-glow"
                : "bg-rose-950/50 border-rose-500/60 text-rose-300 danger-glow"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {result.is_authentic ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {result.is_authentic
                    ? "✓ 100% AUTHENTIC MEDICAL RECORD"
                    : "✗ CRITICAL INTEGRITY FAILURE: RECORD HAS BEEN TAMPERED"}
                </div>
                <div className="text-[11px] opacity-90">
                  {result.is_authentic
                    ? "Canonical SHA-256 hash mathematically matches the anchored Polygon Merkle proof."
                    : "The computed SHA-256 hash differs from the anchored Merkle root. Document invalid in court."}
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono opacity-75 shrink-0 text-right">
              {result.verified_at ? new Date(result.verified_at).toLocaleTimeString() : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
