from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid

class SeverityEnum(str, Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"

class VerdictEnum(str, Enum):
    STRONG_SUPPORT = "STRONG_SUPPORT"
    PARTIAL_SUPPORT = "PARTIAL_SUPPORT"
    UNSUBSTANTIATED = "UNSUBSTANTIATED"
    CRITICAL_CONTRAINDICATION = "CRITICAL_CONTRAINDICATION"
    FABRICATED_CLAIM = "FABRICATED_CLAIM"

class LabBiomarker(BaseModel):
    biomarker: str
    value: str
    unit: str
    reference_range: Optional[str] = None
    is_abnormal: Optional[bool] = False

class IngestionRequest(BaseModel):
    physician_id: str
    raw_notes: str
    lab_biomarkers: List[LabBiomarker] = []

class AtomicClaim(BaseModel):
    claim_id: str
    section: str # subjective, objective, assessment, plan
    assertion_text: str
    claim_type: str # DIAGNOSIS, LAB_RESULT, DRUG_PRESCRIPTION, SYMPTOM

class ClaimVerification(BaseModel):
    claim_id: str
    assertion_text: str
    section: str
    verdict: VerdictEnum
    factuality_score: float = Field(ge=0.0, le=1.0)
    severity: SeverityEnum
    audit_critique: str
    ground_truth_citation: Optional[str] = None

class SOAPSubjective(BaseModel):
    chief_complaint: str
    history_of_present_illness: str
    review_of_systems: List[str] = []

class SOAPObjective(BaseModel):
    vitals: Dict[str, Any] = {}
    physical_exam: List[str] = []
    laboratory_findings: List[LabBiomarker] = []

class SOAPAssessmentItem(BaseModel):
    diagnosis_name: str
    icd10_code: Optional[str] = None
    clinical_rationale: str
    supporting_biomarkers: List[str] = []

class SOAPPlanItem(BaseModel):
    action_type: str # MEDICATION, LAB_ORDER, REFERRAL, LIFESTYLE
    description: str
    drug_name: Optional[str] = None
    dosage: Optional[str] = None
    contraindication_cleared: bool = True

class SOAPRecord(BaseModel):
    encounter_id: str
    subjective: SOAPSubjective
    objective: SOAPObjective
    assessment: List[SOAPAssessmentItem]
    plan: List[SOAPPlanItem]

class VerificationReport(BaseModel):
    encounter_id: str
    status: str # VERIFIED, FLAGGED_REVIEW, APPROVED
    composite_factuality_score: float
    total_claims_evaluated: int
    grounded_claims_count: int
    flagged_claims_count: int
    synthesized_soap: SOAPRecord
    claim_verifications: List[ClaimVerification]

class ClaimOverride(BaseModel):
    claim_id: str
    action: str # REPLACE, DISCARD, ACCEPT
    new_statement: Optional[str] = None
    physician_note: str

class ClinicianReviewRequest(BaseModel):
    physician_id: str
    claim_overrides: List[ClaimOverride]
    signature_token: Optional[str] = None

class LedgerAnchorResponse(BaseModel):
    encounter_id: str
    canonical_sha256: str
    merkle_root: str
    merkle_proof: List[str]
    blockchain_network: str
    contract_address: str
    tx_hash: str
    block_number: int
    timestamp_iso: str
