from typing import List
from app.models.schemas import (
    ClaimVerification,
    SOAPRecord,
    VerificationReport,
    SeverityEnum
)

class ConsensusEngine:
    """
    Computes composite Factuality & Safety Score (0.0 to 1.0).
    Enforces Human-in-the-Loop gates when scores drop below 0.95
    or any RED contraindication severity is present.
    """
    @staticmethod
    def evaluate(encounter_id: str, soap: SOAPRecord, verifications: List[ClaimVerification]) -> VerificationReport:
        if not verifications:
            return VerificationReport(
                encounter_id=encounter_id,
                status="EMPTY",
                composite_factuality_score=1.0,
                total_claims_evaluated=0,
                grounded_claims_count=0,
                flagged_claims_count=0,
                synthesized_soap=soap,
                claim_verifications=[]
            )

        total_claims = len(verifications)
        scores = [v.factuality_score for v in verifications]
        has_red_flag = any(v.severity == SeverityEnum.RED for v in verifications)
        has_amber_flag = any(v.severity == SeverityEnum.AMBER for v in verifications)

        grounded_count = sum(1 for v in verifications if v.severity == SeverityEnum.GREEN)
        flagged_count = sum(1 for v in verifications if v.severity in (SeverityEnum.RED, SeverityEnum.AMBER))

        # Composite score arithmetic mean with penalty for red flags
        base_score = sum(scores) / total_claims
        if has_red_flag:
            composite_score = min(base_score, 0.45) # Hard cap below threshold
            status = "FLAGGED_REVIEW"
        elif has_amber_flag or base_score < 0.95:
            composite_score = round(base_score, 2)
            status = "FLAGGED_REVIEW"
        else:
            composite_score = round(base_score, 2)
            status = "VERIFIED"

        return VerificationReport(
            encounter_id=encounter_id,
            status=status,
            composite_factuality_score=composite_score,
            total_claims_evaluated=total_claims,
            grounded_claims_count=grounded_count,
            flagged_claims_count=flagged_count,
            synthesized_soap=soap,
            claim_verifications=verifications
        )
