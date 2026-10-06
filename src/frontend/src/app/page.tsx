"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { StatsRibbon } from "@/components/StatsRibbon";
import { CaseSelector } from "@/components/CaseSelector";
import { LeftPaneIngestion } from "@/components/LeftPaneIngestion";
import { MiddlePaneSOAP } from "@/components/MiddlePaneSOAP";
import { RightPaneAuditAndLedger } from "@/components/RightPaneAuditAndLedger";
import { TamperProofVerifierModal } from "@/components/TamperProofVerifierModal";
import {
  checkBackendHealth,
  fetchSystemStats,
  fetchSampleCases,
  ingestAndVerifyEncounter,
  submitClinicianReview,
  anchorEncounterToLedger,
} from "@/lib/api";
import {
  IngestionRequest,
  VerificationReport,
  LedgerAnchorResponse,
  ClinicalTestCase,
  SystemStats,
} from "@/lib/types";

export default function HomePage() {
  const [backendConnected, setBackendConnected] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [cases, setCases] = useState<ClinicalTestCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("CASE-001");

  // Active Encounter State
  const [ingestionRequest, setIngestionRequest] = useState<IngestionRequest>({
    physician_id: "DR-4019",
    raw_notes: "64yo male patient presents for diabetic routine review. Feeling persistently fatigued. Glucose poorly managed. Plan to maintain Metformin 1000mg BID and add Lisinopril 20mg for blood pressure control.",
    lab_biomarkers: [
      { biomarker: "Fasting Blood Glucose", value: "194", unit: "mg/dL", reference_range: "70-99", is_abnormal: true },
      { biomarker: "HbA1c", value: "9.4", unit: "%", reference_range: "< 5.7", is_abnormal: true },
      { biomarker: "Serum Creatinine", value: "2.8", unit: "mg/dL", reference_range: "0.7-1.3", is_abnormal: true },
      { biomarker: "eGFR", value: "24", unit: "mL/min/1.73m2", reference_range: "> 60", is_abnormal: true },
      { biomarker: "Serum Potassium", value: "5.6", unit: "mEq/L", reference_range: "3.5-5.0", is_abnormal: true },
    ],
  });

  const [verificationReport, setVerificationReport] = useState<VerificationReport | null>(null);
  const [anchorReceipt, setAnchorReceipt] = useState<LedgerAnchorResponse | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);
  const [isAnchoring, setIsAnchoring] = useState(false);

  // Modal State
  const [verifierModalOpen, setVerifierModalOpen] = useState(false);

  // Mount State to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Initial Load
  useEffect(() => {
    setMounted(true);
    async function init() {
      const health = await checkBackendHealth();
      setBackendConnected(health.status === "healthy");

      const systemStats = await fetchSystemStats();
      if (systemStats) setStats(systemStats);

      const sampleCases = await fetchSampleCases();
      if (sampleCases && sampleCases.length > 0) {
        setCases(sampleCases);
        setSelectedCaseId(sampleCases[0].case_id);
        setIngestionRequest(sampleCases[0].payload);
      }
    }
    init();
  }, []);

  // Handle case selection
  const handleSelectCase = (testCase: ClinicalTestCase) => {
    setSelectedCaseId(testCase.case_id);
    setIngestionRequest(testCase.payload);
    setVerificationReport(null);
    setAnchorReceipt(null);
    setSelectedClaimId(null);
  };

  // Run multi-agent verification pipeline
  const handleRunPipeline = async () => {
    setIsLoading(true);
    setAnchorReceipt(null);
    setSelectedClaimId(null);
    try {
      const report = await ingestAndVerifyEncounter(ingestionRequest);
      setVerificationReport(report);
    } catch (err: any) {
      alert(`Pipeline error: ${err.message || "Failed to communicate with backend."}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Clinician HITL Override
  const handleClinicianOverride = async (
    claimId: string,
    newStatement: string,
    physicianNote: string
  ) => {
    if (!verificationReport) return;
    setIsOverriding(true);
    try {
      const updatedReport = await submitClinicianReview(
        verificationReport.encounter_id,
        "DR-4019",
        [
          {
            claim_id: claimId,
            action: "REPLACE",
            new_statement: newStatement,
            physician_note: physicianNote,
          },
        ]
      );
      setVerificationReport(updatedReport);
    } catch (err: any) {
      alert(`Override error: ${err.message}`);
    } finally {
      setIsOverriding(false);
    }
  };

  // Anchor to Polygon Ledger
  const handleAnchorToLedger = async () => {
    if (!verificationReport) return;
    setIsAnchoring(true);
    try {
      const receipt = await anchorEncounterToLedger(verificationReport.encounter_id);
      setAnchorReceipt(receipt);
    } catch (err: any) {
      alert(`Ledger anchoring error: ${err.message}`);
    } finally {
      setIsAnchoring(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      {/* 1. Master Header */}
      <Header
        backendConnected={backendConnected}
        onOpenVerifierModal={() => setVerifierModalOpen(true)}
      />

      {/* 2. Key Performance Indicators Ribbon */}
      <StatsRibbon stats={stats} />

      {/* 3. Clinical Scenario Selector */}
      <CaseSelector
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelectCase={handleSelectCase}
        isLoading={isLoading}
        onRunPipeline={handleRunPipeline}
      />

      {/* 4. Main 3-Pane Split Screen Workspace */}
      <main className="flex-1 px-6 py-4 max-w-[1700px] mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pane 1: Clinical Ingestion */}
        <section className="h-[calc(100vh-270px)] min-h-[560px]">
          <LeftPaneIngestion
            request={ingestionRequest}
            onChangeRequest={setIngestionRequest}
            isLoading={isLoading}
          />
        </section>

        {/* Pane 2: AI Synthesized SOAP Note */}
        <section className="h-[calc(100vh-270px)] min-h-[560px]">
          <MiddlePaneSOAP
            soap={verificationReport?.synthesized_soap || null}
            verifications={verificationReport?.claim_verifications || []}
            selectedClaimId={selectedClaimId}
            onSelectClaim={(id) => setSelectedClaimId(id)}
            isLoading={isLoading}
          />
        </section>

        {/* Pane 3: Adversarial Audit & Ledger */}
        <section className="h-[calc(100vh-270px)] min-h-[560px]">
          <RightPaneAuditAndLedger
            report={verificationReport}
            anchorReceipt={anchorReceipt}
            selectedClaimId={selectedClaimId}
            onSelectClaim={(id) => setSelectedClaimId(id)}
            onClinicianOverride={handleClinicianOverride}
            onAnchorToLedger={handleAnchorToLedger}
            isOverriding={isOverriding}
            isAnchoring={isAnchoring}
          />
        </section>
      </main>

      {/* 5. Zero-Gas Public Proof Verifier Modal */}
      <TamperProofVerifierModal
        isOpen={verifierModalOpen}
        onClose={() => setVerifierModalOpen(false)}
        soap={verificationReport?.synthesized_soap || null}
        anchorReceipt={anchorReceipt}
      />
    </div>
  );
}
