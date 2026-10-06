# VeriCare AI — Data Models & Schemas Specification

## 1. Relational Database Schema (PostgreSQL + pgvector)

VeriCare AI maintains complete auditability across raw inputs, agent iterations, human-in-the-loop decisions, and cryptographic receipts.

```mermaid
erDiagram
    PATIENTS ||--o{ CLINICAL_ENCOUNTERS : has
    CLINICAL_ENCOUNTERS ||--o{ CLAIM_VERIFICATIONS : generates
    CLINICAL_ENCOUNTERS ||--o{ HITL_AUDITS : requires
    CLINICAL_ENCOUNTERS ||--|| LEDGER_ANCHORS : produces
    CLINICAL_ENCOUNTERS ||--o{ LAB_GROUND_TRUTH : includes

    PATIENTS {
        uuid patient_id PK
        string encrypted_mrn
        jsonb deid_metadata
        timestamp created_at
        timestamp updated_at
    }

    CLINICAL_ENCOUNTERS {
        uuid encounter_id PK
        uuid patient_id FK
        string physician_id
        text raw_clinical_notes
        jsonb raw_lab_payload
        jsonb soap_synthesized
        string status
        float composite_confidence_score
        timestamp created_at
    }

    LAB_GROUND_TRUTH {
        uuid ground_truth_id PK
        uuid encounter_id FK
        string biomarker_name
        string reported_value
        string unit
        string reference_range
        int character_start
        int character_end
    }

    CLAIM_VERIFICATIONS {
        uuid claim_id PK
        uuid encounter_id FK
        string section
        text atomic_claim
        float grounding_score
        string verification_verdict
        text auditor_critique
        jsonb evidence_citations
        timestamp evaluated_at
    }

    HITL_AUDITS {
        uuid audit_id PK
        uuid encounter_id FK
        string reviewing_physician_id
        jsonb original_claim_state
        jsonb overridden_claim_state
        text physician_notes
        timestamp reviewed_at
    }

    LEDGER_ANCHORS {
        uuid anchor_id PK
        uuid encounter_id FK
        string canonical_sha256
        string merkle_root
        jsonb merkle_proof
        string tx_hash
        int block_number
        string chain_id
        string digital_signature
        timestamp anchored_at
    }
```

---

## 2. Structured SOAP JSON Schema

The Synthesizer Agent strictly validates against this JSON schema prior to dispatching claims to the Auditor.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VeriCareSOAPRecord",
  "type": "object",
  "required": [
    "encounter_id",
    "subjective",
    "objective",
    "assessment",
    "plan",
    "source_citations"
  ],
  "properties": {
    "encounter_id": { "type": "string", "format": "uuid" },
    "patient_session_id": { "type": "string" },
    "subjective": {
      "type": "object",
      "required": ["chief_complaint", "history_of_present_illness", "review_of_systems"],
      "properties": {
        "chief_complaint": { "type": "string" },
        "history_of_present_illness": { "type": "string" },
        "review_of_systems": { "type": "array", "items": { "type": "string" } }
      }
    },
    "objective": {
      "type": "object",
      "required": ["vitals", "physical_exam", "laboratory_findings"],
      "properties": {
        "vitals": {
          "type": "object",
          "properties": {
            "blood_pressure": { "type": "string" },
            "heart_rate_bpm": { "type": "integer" },
            "temperature_celsius": { "type": "number" },
            "spO2_percent": { "type": "integer" }
          }
        },
        "physical_exam": { "type": "array", "items": { "type": "string" } },
        "laboratory_findings": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["biomarker", "value", "unit", "is_abnormal"],
            "properties": {
              "biomarker": { "type": "string" },
              "value": { "type": "string" },
              "unit": { "type": "string" },
              "reference_range": { "type": "string" },
              "is_abnormal": { "type": "boolean" },
              "source_span_start": { "type": "integer" },
              "source_span_end": { "type": "integer" }
            }
          }
        }
      }
    },
    "assessment": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["diagnosis_name", "icd10_code", "clinical_rationale", "supporting_biomarkers"],
        "properties": {
          "diagnosis_name": { "type": "string" },
          "icd10_code": { "type": "string" },
          "clinical_rationale": { "type": "string" },
          "supporting_biomarkers": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "plan": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["action_type", "description", "contraindication_cleared"],
        "properties": {
          "action_type": { "type": "string", "enum": ["MEDICATION", "LAB_ORDER", "REFERRAL", "LIFESTYLE", "MONITORING"] },
          "description": { "type": "string" },
          "drug_name": { "type": "string" },
          "dosage": { "type": "string" },
          "frequency": { "type": "string" },
          "contraindication_cleared": { "type": "boolean" }
        }
      }
    },
    "source_citations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["claim_text", "source_evidence_text", "confidence"],
        "properties": {
          "claim_text": { "type": "string" },
          "source_evidence_text": { "type": "string" },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
        }
      }
    }
  }
}
```

---

## 3. FHIR R4 Standard Mapping

VeriCare AI guarantees seamless hospital EHR interoperability by providing bidirectional transformation to **HL7 FHIR R4** resources:

| VeriCare Entity | HL7 FHIR R4 Resource | Mapping Notes |
| :--- | :--- | :--- |
| Patient Entity | `Patient` | Encrypted MRN stored in `identifier.value`; PII stripped per Safe Harbor. |
| Encounter Entity | `Encounter` | Standard clinical encounter with `status` and `participant` (physician). |
| SOAP Objective Labs | `Observation` | Coded with LOINC codes (e.g. `4548-4` for HbA1c); contains exact numeric values and reference ranges. |
| SOAP Assessment | `Condition` | Coded with ICD-10-CM codes; links to supporting `Observation` resources via `evidence.detail`. |
| SOAP Plan (Meds) | `MedicationRequest` | Coded with RxNorm codes; dosage and timing mapped to `dosageInstruction`. |
| Attestation Proof | `Provenance` & `Binary` | Embeds the SHA-256 Merkle root, Polygon transaction hash, and physician RSA signature in `signature` and `target`. |
