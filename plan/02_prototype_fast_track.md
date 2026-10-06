# VeriCare AI — Fast-Track Prototype Plan (7-Day Sprint)

## 1. Goal: Deliver a Judge-Ready End-to-End Prototype

To win hackathons and secure incubation funding from bodies like ShivaTech CBII, a team needs an **end-to-end working software demonstration**, not just slides or stubs.

This 7-Day Sprint delivers a fully operational pipeline:
1. Upload clinical encounter (doctor notes + lab panel values).
2. Synthesizer Agent drafts structured SOAP note with character citations.
3. Adversarial Auditor evaluates every assertion, catching an intentional hallucination or dosage contraindication in real time.
4. Clinician Console renders side-by-side diff with green/amber/red indicators and allows 1-click override.
5. Final verified record is serialized via RFC 8785, hashed into a SHA-256 Merkle tree, and anchored to an immutable ledger receipt with a live verification certificate!

---

## 2. Day-by-Day Execution Matrix

| Day | Focus Area | Deliverables & Code Modules | Verification Check |
| :--- | :--- | :--- | :--- |
| **Day 1** | **Scaffolding & Architecture** | Modular FastAPI backend, Pydantic schemas for SOAP, Claims, and Attestations. Curate 5 realistic clinical test encounters (including 2 with dangerous contraindications). | `pytest` runs schema validation on test cases. |
| **Day 2** | **Dual-Agent Core (LangGraph / Gemini)** | Implement `synthesizer.py` (Gemini 1.5 Pro) and `decomposer.py`. Output strictly conformant JSON SOAP with source citations. | Ingest raw notes; verify valid JSON SOAP returned with citations. |
| **Day 3** | **Adversarial Auditor & Grounding** | Implement `verifier.py` (Gemini 1.5 Flash) with information asymmetry. Implement local vector/rule contraindication checker (Metformin vs eGFR, Lisinopril vs Potassium). | Auditor successfully detects and flags 100% of injected contraindications as RED. |
| **Day 4** | **Consensus & Scoring Engine** | Implement `consensus.py` calculating Factuality Score ($0.0 - 1.0$). Implement auto-routing: $\ge 0.95$ directly to crypto, $< 0.95$ to HITL alert queue. | Score properly differentiates clean vs hallucinated encounters. |
| **Day 5** | **Cryptographic Trust Service** | Implement `merkle.py` (SHA-256 tree builder + proof generator), `canonical_json.py` (RFC 8785), and digital signature mockup with RSA/ECDSA key pairs. | Alter 1 character in JSON; confirm Merkle proof verification fails. |
| **Day 6** | **Physician Audit Console (Frontend)** | Next.js + Tailwind + shadcn/ui dashboard. Interactive split-screen: Left = Source Data; Middle = Verified SOAP with color-coded badges; Right = Verification Report & Blockchain Certificate. | Live browser UI allows clicking "Override", modifying text, and clicking "Sign & Anchor". |
| **Day 7** | **End-to-End Polish, Video & Pitch** | Integrate full stack via REST/WebSockets. Record 3-minute high-impact demo video. Finalize pitch deck and documentation links. | Seamless 2-minute live demo showing upload -> hallucination detection -> physician fix -> cryptographic anchor. |

---

## 3. Pre-Packaged Clinical Demonstration Scenarios

To guarantee an impactful live presentation, the prototype includes pre-loaded interactive test cases:

### Case A: Diabetic Nephropathy with Hidden Renal Contraindication (High Drama)
- **Input:** 64-year-old male with Type 2 Diabetes. Doctor dictation mentions: *"Prescribing Metformin 1000mg BID and starting Lisinopril 20mg."*
- **Lab Panel:** `eGFR = 24 mL/min/1.73m2` (Severe Renal Impairment), `Serum Creatinine = 2.8 mg/dL`, `Potassium = 5.6 mEq/L` (Hyperkalemia).
- **VeriCare Auditor Action:**
  - 🚩 **CRITICAL RED FLAG:** Metformin is contraindicated for eGFR < 30 (Risk of fatal Lactic Acidosis).
  - 🚩 **CRITICAL RED FLAG:** Lisinopril is contraindicated in hyperkalemia (Potassium > 5.5).
  - **Verdict:** Factuality Score: `0.45` — **BLOCKED FROM LEDGER**.
- **Clinician Override:** Clinician replaces with Insulin Glargine + Nephrology consult. Score updates to `0.98` — **ATTESTATION APPROVED**.

### Case B: Clean Hypertension & Dyslipidemia Follow-up (Seamless Auto-Approval)
- **Input:** 55-year-old female follow-up for essential hypertension.
- **Lab Panel:** `Total Cholesterol = 240 mg/dL`, `LDL = 160 mg/dL`, `Blood Pressure = 142/88 mmHg`, `eGFR = 88 mL/min`.
- **VeriCare Auditor Action:**
  - 🟢 **ALL CLAIMS GROUNDED:** Atorvastatin 20mg daily + lifestyle counseling strictly supported by ACC/AHA guidelines.
  - **Verdict:** Factuality Score: `0.99` — **AUTOMATICALLY ANCHORED WITH BLOCKCHAIN RECEIPT**.
