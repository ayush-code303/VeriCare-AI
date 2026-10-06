from typing import List
from app.models.schemas import SOAPRecord, AtomicClaim

class ClaimDecomposer:
    """
    Decomposes structured SOAP records into atomic clinical assertions
    to enable fine-grained, independent adversarial verification.
    """
    @staticmethod
    def decompose(soap: SOAPRecord) -> List[AtomicClaim]:
        claims = []
        counter = 1

        # 1. Subjective Claims
        if soap.subjective.chief_complaint:
            claims.append(AtomicClaim(
                claim_id=f"CLM-{counter:03d}",
                section="subjective",
                assertion_text=f"Chief complaint: {soap.subjective.chief_complaint}",
                claim_type="SYMPTOM"
            ))
            counter += 1

        # 2. Objective Lab Claims
        for lab in soap.objective.laboratory_findings:
            claims.append(AtomicClaim(
                claim_id=f"CLM-{counter:03d}",
                section="objective",
                assertion_text=f"Reported {lab.biomarker}: {lab.value} {lab.unit}",
                claim_type="LAB_RESULT"
            ))
            counter += 1

        # 3. Assessment Diagnostic Claims
        for diag in soap.assessment:
            claims.append(AtomicClaim(
                claim_id=f"CLM-{counter:03d}",
                section="assessment",
                assertion_text=f"Diagnosed with {diag.diagnosis_name}. Rationale: {diag.clinical_rationale}",
                claim_type="DIAGNOSIS"
            ))
            counter += 1

        # 4. Plan Action & Medication Claims
        for plan_item in soap.plan:
            text = plan_item.description
            if plan_item.drug_name and plan_item.dosage:
                text = f"Prescribe {plan_item.drug_name} {plan_item.dosage}. {plan_item.description}"
            claims.append(AtomicClaim(
                claim_id=f"CLM-{counter:03d}",
                section="plan",
                assertion_text=text,
                claim_type="DRUG_PRESCRIPTION" if plan_item.action_type == "MEDICATION" else "PROCEDURE"
            ))
            counter += 1

        return claims
