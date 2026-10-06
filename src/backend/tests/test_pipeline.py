import sys
from pathlib import Path

# Add backend root to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from app.models.schemas import IngestionRequest, LabBiomarker, ClinicianReviewRequest, ClaimOverride, VerdictEnum, SeverityEnum
from app.agents.synthesizer import ClinicalSynthesizer
from app.agents.decomposer import ClaimDecomposer
from app.agents.verifier import AdversarialAuditor
from app.agents.consensus import ConsensusEngine
from app.crypto.canonical_json import hash_payload, canonicalize_json
from app.crypto.merkle import MerkleTree
from app.crypto.signer import MockOrRSASigner

def test_full_pipeline_detects_renal_contraindication():
    # Setup test encounter with severe renal failure and Metformin
    req = IngestionRequest(
        physician_id="DR-TEST-001",
        raw_notes="Patient with diabetes. Start Metformin 1000mg BID.",
        lab_biomarkers=[
            LabBiomarker(biomarker="eGFR", value="22", unit="mL/min/1.73m2", reference_range=">60", is_abnormal=True),
            LabBiomarker(biomarker="Serum Creatinine", value="2.9", unit="mg/dL", reference_range="0.7-1.3", is_abnormal=True),
            LabBiomarker(biomarker="Fasting Glucose", value="180", unit="mg/dL", reference_range="70-99", is_abnormal=True)
        ]
    )

    # 1. Synthesize
    soap = ClinicalSynthesizer.synthesize("ENC-TEST-001", req)
    assert soap.encounter_id == "ENC-TEST-001"

    # 2. Decompose
    claims = ClaimDecomposer.decompose(soap)
    assert len(claims) > 0

    # 3. Adversarial Audit
    auditor = AdversarialAuditor(req.lab_biomarkers)
    verifications = auditor.audit_all(claims)

    # Assert that Metformin was caught as a critical red flag
    contraindications = [v for v in verifications if v.verdict == VerdictEnum.CRITICAL_CONTRAINDICATION]
    assert len(contraindications) >= 1
    assert "eGFR is 22" in contraindications[0].audit_critique

    # 4. Consensus Engine
    report = ConsensusEngine.evaluate("ENC-TEST-001", soap, verifications)
    assert report.status == "FLAGGED_REVIEW"
    assert report.composite_factuality_score <= 0.45

def test_hyperkalemia_contraindication_detected():
    req = IngestionRequest(
        physician_id="DR-TEST-002",
        raw_notes="Hypertensive patient. Prescribe Lisinopril 20mg daily.",
        lab_biomarkers=[
            LabBiomarker(biomarker="Blood Pressure", value="150/90", unit="mmHg", is_abnormal=True),
            LabBiomarker(biomarker="Serum Potassium", value="5.8", unit="mEq/L", reference_range="3.5-5.0", is_abnormal=True),
            LabBiomarker(biomarker="eGFR", value="75", unit="mL/min/1.73m2", is_abnormal=False)
        ]
    )

    soap = ClinicalSynthesizer.synthesize("ENC-TEST-002", req)
    claims = ClaimDecomposer.decompose(soap)
    auditor = AdversarialAuditor(req.lab_biomarkers)
    verifications = auditor.audit_all(claims)

    k_flags = [v for v in verifications if v.verdict == VerdictEnum.CRITICAL_CONTRAINDICATION]
    assert len(k_flags) >= 1
    assert "Potassium of 5.8" in k_flags[0].audit_critique

def test_clean_encounter_auto_approves():
    req = IngestionRequest(
        physician_id="DR-TEST-003",
        raw_notes="52yo female follow-up. Diet is good. Continue current routine.",
        lab_biomarkers=[
            LabBiomarker(biomarker="Fasting Blood Glucose", value="92", unit="mg/dL", is_abnormal=False),
            LabBiomarker(biomarker="Serum Potassium", value="4.2", unit="mEq/L", is_abnormal=False),
            LabBiomarker(biomarker="eGFR", value="94", unit="mL/min/1.73m2", is_abnormal=False)
        ]
    )

    soap = ClinicalSynthesizer.synthesize("ENC-TEST-003", req)
    claims = ClaimDecomposer.decompose(soap)
    auditor = AdversarialAuditor(req.lab_biomarkers)
    verifications = auditor.audit_all(claims)
    report = ConsensusEngine.evaluate("ENC-TEST-003", soap, verifications)

    assert report.status == "VERIFIED"
    assert report.composite_factuality_score >= 0.95
    assert report.flagged_claims_count == 0

def test_merkle_tree_proof_and_verification():
    leaves = [
        hash_payload({"doc": 1}),
        hash_payload({"doc": 2}),
        hash_payload({"doc": 3}),
        hash_payload({"doc": 4})
    ]
    tree = MerkleTree(leaves)
    assert tree.root is not None

    # Get proof for first document
    proof = tree.get_proof(0)
    is_valid = MerkleTree.verify_proof(leaves[0], proof, tree.root)
    assert is_valid is True

    # Tampered leaf should fail
    tampered_leaf = hash_payload({"doc": "tampered"})
    is_invalid = MerkleTree.verify_proof(tampered_leaf, proof, tree.root)
    assert is_invalid is False

def test_canonical_json_determinism():
    data1 = {"b": 2, "a": 1, "nested": {"z": 100, "m": 50}}
    data2 = {"a": 1, "nested": {"m": 50, "z": 100}, "b": 2}
    
    assert canonicalize_json(data1) == canonicalize_json(data2)
    assert hash_payload(data1) == hash_payload(data2)

def test_signer_signature():
    signer = MockOrRSASigner()
    root = "0x89bc44d7159c9d784fa720e1183c21a4f00198e3b4a22c5432a10e88256cd1b4"
    sig = signer.sign_root(root)
    assert sig is not None
    assert signer.verify_signature(root, sig) is True
