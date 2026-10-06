# VeriCare AI — API Specifications (REST & OpenAPI)

## 1. Overview
The VeriCare AI backend exposes a high-throughput REST API adhering to OpenAPI 3.1 standards. All endpoints require TLS 1.3 encryption and Bearer JWT authentication with role-based access control (Clinician, Auditor, Admin).

---

## 2. Core Endpoints

### 2.1 Ingestion & Session Creation
- **Endpoint:** `POST /api/v1/encounters/ingest`
- **Description:** Ingests raw doctor dictation/notes and lab panel files, sanitizes PHI per HIPAA Safe Harbor, and establishes a secure encounter session.
- **Request Body (Multipart Form or JSON):**
  ```json
  {
    "physician_id": "DR-8841",
    "raw_notes": "62yo male with fatigue. Fasting glucose 185 mg/dL. Elevated creatinine noted. Started on metformin 500mg.",
    "lab_biomarkers": [
      {
        "biomarker": "Fasting Blood Glucose",
        "value": "185",
        "unit": "mg/dL",
        "reference_range": "70-99 mg/dL"
      },
      {
        "biomarker": "Serum Creatinine",
        "value": "2.4",
        "unit": "mg/dL",
        "reference_range": "0.7-1.3 mg/dL"
      },
      {
        "biomarker": "eGFR",
        "value": "28",
        "unit": "mL/min/1.73m2",
        "reference_range": "> 60 mL/min/1.73m2"
      }
    ]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "encounter_id": "c7a8b941-8f20-410a-9d93-1e248b671a52",
    "deidentified_session_id": "SESS-DEID-99214",
    "status": "INGESTED",
    "biomarkers_extracted_count": 3
  }
  ```

---

### 2.2 Trigger Dual-Agent Verification Pipeline
- **Endpoint:** `POST /api/v1/encounters/{encounter_id}/verify`
- **Description:** Launches the asynchronous multi-agent pipeline (Synthesizer, Claim Decomposer, Adversarial Auditor, and Consensus Engine).
- **Response (200 OK):**
  ```json
  {
    "encounter_id": "c7a8b941-8f20-410a-9d93-1e248b671a52",
    "status": "FLAGGED_REVIEW",
    "composite_factuality_score": 0.74,
    "total_claims_evaluated": 5,
    "grounded_claims_count": 3,
    "flagged_claims_count": 2,
    "synthesized_soap": {
      "subjective": { ... },
      "objective": { ... },
      "assessment": [ ... ],
      "plan": [ ... ]
    },
    "verification_report": [
      {
        "claim_id": "CLM-001",
        "section": "assessment",
        "statement": "Patient has elevated fasting glucose indicative of diabetes.",
        "verdict": "STRONG_SUPPORT",
        "confidence": 0.98,
        "evidence_citation": "Fasting Blood Glucose 185 mg/dL (ref: 70-99)"
      },
      {
        "claim_id": "CLM-004",
        "section": "plan",
        "statement": "Administer Metformin 500mg daily.",
        "verdict": "CRITICAL_CONTRAINDICATION",
        "confidence": 0.20,
        "auditor_critique": "DANGEROUS: Metformin is strictly contraindicated in patients with eGFR < 30 mL/min due to risk of fatal lactic acidosis. Patient eGFR is 28 mL/min.",
        "flag_severity": "RED"
      }
    ]
  }
  ```

---

### 2.3 Clinician HITL Review & Override Sign-Off
- **Endpoint:** `POST /api/v1/encounters/{encounter_id}/review`
- **Description:** Allows an authorized physician to modify flagged statements, provide clinical justification, and approve the finalized medical summary.
- **Request Body:**
  ```json
  {
    "physician_id": "DR-8841",
    "claim_overrides": [
      {
        "claim_id": "CLM-004",
        "action": "REPLACE",
        "new_statement": "Hold Metformin. Initiate Insulin Glargine 10 units subcutaneous at bedtime due to severe renal impairment (eGFR 28 mL/min).",
        "physician_note": "Corrected renal contraindication identified by VeriCare Auditor."
      }
    ],
    "physician_digital_signature_token": "AUTH-SIG-TOKEN-7712"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "encounter_id": "c7a8b941-8f20-410a-9d93-1e248b671a52",
    "status": "APPROVED",
    "composite_factuality_score": 0.99,
    "ready_for_attestation": true
  }
  ```

---

### 2.4 Cryptographic Ledger Anchoring
- **Endpoint:** `POST /api/v1/encounters/{encounter_id}/anchor`
- **Description:** Hashes the finalized canonical SOAP record, incorporates it into the active Merkle tree, signs the batch, and anchors it to Polygon PoS.
- **Response (200 OK):**
  ```json
  {
    "encounter_id": "c7a8b941-8f20-410a-9d93-1e248b671a52",
    "canonical_sha256": "3a9f8b2d18400192e213b2c6cf159e19d701a5e1286e1026bb43a054238e55e2",
    "merkle_root": "0x89bc44d7159c9d784fa720e1183c21a4f00198e3b4a22c5432a10e88256cd1b4",
    "merkle_proof": [
      "0x42f1b8a...",
      "0x7c20a9e..."
    ],
    "blockchain_receipt": {
      "network": "Polygon Amoy Testnet (Chain ID 80002)",
      "contract_address": "0x3918aBc45E20F71a938E1103c8022aE8e0F7e31B",
      "tx_hash": "0xfa10e74b39...821c",
      "block_number": 14920841,
      "anchored_at": "2026-10-06T13:25:00Z"
    }
  }
  ```

---

### 2.5 Public Zero-Gas Record Verification
- **Endpoint:** `POST /api/v1/verify-record`
- **Description:** Publicly validates any exported clinical record against the immutable blockchain ledger.
- **Request Body:**
  ```json
  {
    "soap_record": { ... },
    "merkle_proof": [ ... ],
    "merkle_root": "0x89bc44d7159c9d784fa720e1183c21a4f00198e3b4a22c5432a10e88256cd1b4"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "is_authentic": true,
    "tampered": false,
    "anchored_timestamp": "2026-10-06T13:25:00Z",
    "contract_verified": true,
    "issuer": "St. Jude Memorial Health Network (NPI 1942083921)"
  }
  ```
