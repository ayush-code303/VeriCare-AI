import sys
from pathlib import Path

# Add backend root to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from app.models.schemas import IngestionRequest, LabBiomarker
from app.agents.synthesizer import ClinicalSynthesizer
from app.agents.decomposer import ClaimDecomposer
from app.agents.verifier import AdversarialAuditor
from app.agents.consensus import ConsensusEngine
from app.crypto.canonical_json import hash_payload
from app.crypto.merkle import MerkleTree
from app.crypto.signer import MockOrRSASigner

def test_full_pipeline_detects_renal_contraindication():
    # Setup test encounter with severe renal failure and Metformin
    req = IngestionRequest(
        physician_id="DR-TEST",
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
    contraindications = [v for v in verifications if v.verdict.value == "CRITICAL_CONTRAINDICATION"]
    assert len(contraindications) >= 1
    assert "eGFR is 22" in contraindications[0].audit_critique

    # 4. Consensus Engine
    report = ConsensusEngine.evaluate("ENC-TEST-001", soap, verifications)
    assert report.status == "FLAGGED_REVIEW"
    assert report.composite_factuality_score <= 0.45

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

def test_signer_signature():
    signer = MockOrRSASigner()
    root = "0x89bc44d7159c9d784fa720e1183c21a4f00198e3b4a22c5432a10e88256cd1b4"
    sig = signer.sign_root(root)
    assert sig is not None
    assert signer.verify_signature(root, sig) is True
