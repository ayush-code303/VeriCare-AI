# VeriCare AI — Security, Compliance & Data Governance

## 1. Regulatory Frameworks Adherence

VeriCare AI is architected from day one to comply with the most stringent global and regional healthcare data regulations:
- **HIPAA (Health Insurance Portability and Accountability Act)** — Privacy, Security, and Breach Notification Rules (US).
- **DPDP Act 2023 (Digital Personal Data Protection Act)** — India’s national framework for processing digital personal and sensitive health data.
- **NABH (National Accreditation Board for Hospitals & Healthcare Providers)** — Clinical record auditing and data governance standards in India.
- **GDPR Article 9** — Processing of special categories of personal data (health biometrics).

---

## 2. PHI De-Identification Pipeline (HIPAA Safe Harbor)

To protect patient privacy prior to invoking cloud LLM inference engines (Gemini 1.5 Pro / Flash), the ingestion service automatically eliminates all 18 HIPAA Safe Harbor identifiers:

```
[Raw Dictation] -> [Presidio / SpaCy NER] -> [Regex Pattern Matcher] -> [Sanitized Payload]
```

### Identifier Stripping Checklist:
1. Names & aliases
2. Geographic subdivisions smaller than state
3. Dates directly related to an individual (birth, admission, discharge)
4. Telephone and fax numbers
5. Email addresses
6. Social Security / Aadhaar numbers
7. Medical Record Numbers (MRN)
8. Health plan beneficiary numbers
9. Account numbers
10. Certificate/license numbers
11. Vehicle identifiers and serial numbers
12. Device identifiers and serial numbers
13. Web URLs
14. IP address numbers
15. Biometric identifiers (finger/voice prints)
16. Full-face photographic images
17. Any other unique identifying number or characteristic

**Re-Identification Architecture:** Patient MRNs are encrypted with AES-256-GCM using an ephemeral hospital-held secret key. The LLM processes only an opaque pseudonym (`SESS-UUID-xxxx`). Only the hospital EHR gateway holds the key to re-associate verified summaries with the patient record.

---

## 3. Zero Training Data Retention (ZTR) LLM Contracts

A primary concern for Chief Medical Information Officers (CMIOs) is whether third-party AI providers train future models on their patient encounters.

1. **Enterprise API Tiers:** VeriCare AI strictly connects to Google Cloud Vertex AI / Gemini Enterprise endpoints governed by **Business Associate Agreements (BAA)** and **Zero Data Retention** clauses.
2. **Opt-Out Guarantees:** Patient prompts, intermediate agent reasoning traces, and lab numbers are processed exclusively in RAM during the ephemeral inference lifecycle and are immediately flushed. No prompt data is cached or utilized for foundation model fine-tuning.

---

## 4. Encryption in Transit and at Rest

| Scope | Cryptographic Standard | Implementation |
| :--- | :--- | :--- |
| **Data in Transit** | TLS 1.3 | Strict cipher suites (`TLS_AES_256_GCM_SHA384`); HTTP Strict Transport Security (HSTS) with 1-year preload. |
| **Data at Rest** | AES-256-GCM | PostgreSQL tables and vector storage encrypted with customer-managed encryption keys (CMEK) via Google Cloud KMS / AWS KMS. |
| **Ledger Anchor Hashes** | SHA-256 / Merkle Trees | Document contents are never exposed on-chain. Only one-way cryptographic Merkle roots are committed to Polygon. |
| **Audit Logs** | Append-Only HMAC | Verification logs and clinician override decisions write to an immutable audit ledger protected by write-once-read-many (WORM) storage. |

---

## 5. Role-Based Access Control (RBAC)

VeriCare AI employs granular RBAC with Principle of Least Privilege:

| Role | Permitted Actions | Restricted Actions |
| :--- | :--- | :--- |
| **Attending Physician** | Ingest encounters, review AI summaries, override claims, digitally sign attestations. | Cannot alter cryptographic Merkle proofs or ledger settings. |
| **Clinical Auditor** | View verification reports, inspect factuality scores, view audit trail certificates. | Cannot modify clinical notes or prescribe medications. |
| **Hospital Compliance Officer**| Export court-admissible audit packs, verify blockchain proofs, review DPDP compliance logs. | Cannot view un-deidentified patient records without dual-custody authorization. |
| **System Admin** | Manage service uptime, configure vector indices, rotate API keys. | Strictly zero access to PHI or clinical records. |
