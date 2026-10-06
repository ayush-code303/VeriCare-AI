"use client";

import React from "react";
import { FileText, TestTubes, ShieldCheck, AlertCircle, Plus, Trash2 } from "lucide-react";
import { IngestionRequest, LabBiomarker } from "@/lib/types";

interface LeftPaneIngestionProps {
  request: IngestionRequest;
  onChangeRequest: (updated: IngestionRequest) => void;
  isLoading: boolean;
}

export const LeftPaneIngestion: React.FC<LeftPaneIngestionProps> = ({
  request,
  onChangeRequest,
  isLoading,
}) => {
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeRequest({
      ...request,
      raw_notes: e.target.value,
    });
  };

  const handleAddBiomarker = () => {
    const newLab: LabBiomarker = {
      biomarker: "New Biomarker",
      value: "100",
      unit: "mg/dL",
      reference_range: "70-99",
      is_abnormal: false,
    };
    onChangeRequest({
      ...request,
      lab_biomarkers: [...request.lab_biomarkers, newLab],
    });
  };

  const handleRemoveBiomarker = (index: number) => {
    const updated = request.lab_biomarkers.filter((_, i) => i !== index);
    onChangeRequest({
      ...request,
      lab_biomarkers: updated,
    });
  };

  const handleBiomarkerChange = (index: number, field: keyof LabBiomarker, value: any) => {
    const updated = [...request.lab_biomarkers];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChangeRequest({
      ...request,
      lab_biomarkers: updated,
    });
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 flex flex-col gap-4 shadow-xl backdrop-blur-sm h-full overflow-y-auto">
      {/* Pane Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">1. Clinical Ingestion</h2>
            <p className="text-[11px] text-slate-400">Raw physician audio/notes & diagnostic lab feeds</p>
          </div>
        </div>

        {/* HIPAA Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
          <ShieldCheck className="w-3 h-3" />
          <span>HIPAA Safe Harbor De-ID Active</span>
        </div>
      </div>

      {/* Raw Notes / Audio Dictation Section */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Physician Dictation / Clinical Notes</span>
          <span className="text-[10px] text-slate-500 font-normal">Sanitized input</span>
        </label>
        <textarea
          value={request.raw_notes}
          onChange={handleNotesChange}
          disabled={isLoading}
          rows={5}
          placeholder="Enter doctor notes or dictation transcript..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 resize-none font-mono leading-relaxed"
        />
      </div>

      {/* Ground Truth Lab Biomarkers Section */}
      <div className="flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <TestTubes className="w-3.5 h-3.5 text-sky-400" />
            <span>Ground-Truth Lab Diagnostic Buffer ({request.lab_biomarkers.length})</span>
          </label>
          <button
            onClick={handleAddBiomarker}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-sky-400 text-[11px] font-medium transition cursor-pointer border border-slate-700/50"
          >
            <Plus className="w-3 h-3" />
            <span>Add Lab</span>
          </button>
        </div>

        {/* Lab Table */}
        <div className="border border-slate-800/90 rounded-xl overflow-hidden bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Biomarker</th>
                <th className="py-2 px-2">Value</th>
                <th className="py-2 px-2">Unit</th>
                <th className="py-2 px-2">Ref Range</th>
                <th className="py-2 px-2 text-center">Status</th>
                <th className="py-2 px-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
              {request.lab_biomarkers.map((lab, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-900/40 transition ${
                    lab.is_abnormal ? "bg-rose-500/5" : ""
                  }`}
                >
                  <td className="py-2 px-3 text-slate-200 font-sans font-medium">
                    {lab.biomarker}
                  </td>
                  <td className="py-2 px-2 font-bold text-slate-100">
                    <input
                      type="text"
                      value={lab.value}
                      disabled={isLoading}
                      onChange={(e) => handleBiomarkerChange(idx, "value", e.target.value)}
                      className="w-16 bg-slate-900/80 border border-slate-700/60 rounded px-1.5 py-0.5 text-center text-xs focus:outline-none focus:border-sky-500"
                    />
                  </td>
                  <td className="py-2 px-2 text-slate-400 text-[10px]">{lab.unit}</td>
                  <td className="py-2 px-2 text-slate-500 text-[10px]">{lab.reference_range || "N/A"}</td>
                  <td className="py-2 px-2 text-center">
                    {lab.is_abnormal ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Abnormal
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase bg-emerald-500/10 text-emerald-400">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => handleRemoveBiomarker(idx)}
                      disabled={isLoading}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
