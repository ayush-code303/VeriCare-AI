import sys
import copy
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).parent.parent))
from main import app

client = TestClient(app)

def test_health_and_stats():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    stats_res = client.get("/api/v1/stats")
    assert stats_res.status_code == 200
    assert "contraindication_detection_rate" in stats_res.json()

def test_sample_cases_and_end_to_end_flow():
    # 1. Get sample cases
    cases_res = client.get("/api/v1/cases/sample")
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert len(cases) >= 2

    # 2. Ingest Case 1 (Renal Contraindication)
    case_1 = cases[0]
    ingest_res = client.post("/api/v1/encounters/ingest", json=case_1["payload"])
    assert ingest_res.status_code == 201
    report = ingest_res.json()
    encounter_id = report["encounter_id"]
    assert report["status"] == "FLAGGED_REVIEW"
    assert report["composite_factuality_score"] <= 0.45

    # 3. Physician HITL Override
    override_req = {
        "physician_id": "DR-4019",
        "claim_overrides": [
            {
                "claim_id": "CLM-006",
                "action": "REPLACE",
                "new_statement": "Prescribe Insulin Glargine 10 units subcutaneous daily with Nephrology consult.",
                "physician_note": "Replaced Metformin due to severe renal impairment (eGFR < 30)."
            },
            {
                "claim_id": "CLM-007",
                "action": "REPLACE",
                "new_statement": "Hold Lisinopril pending repeat potassium level.",
                "physician_note": "Withheld ACE-I due to hyperkalemia (K = 5.6)."
            }
        ]
    }
    review_res = client.post(f"/api/v1/encounters/{encounter_id}/review", json=override_req)
    assert review_res.status_code == 200
    updated_report = review_res.json()
    assert updated_report["status"] == "APPROVED"

    # 4. Cryptographic Ledger Anchoring
    anchor_res = client.post(f"/api/v1/encounters/{encounter_id}/anchor")
    assert anchor_res.status_code == 200
    anchor_data = anchor_res.json()
    assert "merkle_root" in anchor_data
    assert "tx_hash" in anchor_data
    assert anchor_data["blockchain_network"].startswith("Polygon")

    # 5. Public Zero-Gas Verification Endpoint (Authentic Record)
    soap_record = updated_report["synthesized_soap"]
    verify_payload = {
        "soap_record": soap_record,
        "merkle_root": anchor_data["merkle_root"],
        "proof": anchor_data["merkle_proof"]
    }
    verify_res = client.post("/api/v1/verify-record", json=verify_payload)
    assert verify_res.status_code == 200
    assert verify_res.json()["is_authentic"] is True
    assert verify_res.json()["tamper_detected"] is False

    # 6. Tamper Detection Test (Malicious Post-Facto Alteration)
    tampered_soap = copy.deepcopy(soap_record)
    tampered_soap["subjective"]["chief_complaint"] = "TAMPERED RECORD: Patient denies all symptoms."
    tamper_verify_payload = {
        "soap_record": tampered_soap,
        "merkle_root": anchor_data["merkle_root"],
        "proof": anchor_data["merkle_proof"]
    }
    tamper_res = client.post("/api/v1/verify-record", json=tamper_verify_payload)
    assert tamper_res.status_code == 200
    assert tamper_res.json()["is_authentic"] is False
    assert tamper_res.json()["tamper_detected"] is True
    assert tamper_res.json()["verification_status"] == "TAMPER_DETECTED_INVALID_HASH"
