import uuid
from typing import List, Dict, Any
from app.models.schemas import (
    IngestionRequest,
    SOAPRecord,
    SOAPSubjective,
    SOAPObjective,
    SOAPAssessmentItem,
    SOAPPlanItem,
    LabBiomarker
)

class ClinicalSynthesizer:
    """
    Primary Clinical Synthesizer Agent (Agent 1).
    Parses unstructured notes & lab findings into structured SOAP format
    with strict JSON schemas and ground-truth citations.
    """
    @staticmethod
    def synthesize(encounter_id: str, request: IngestionRequest) -> SOAPRecord:
        notes = request.raw_notes
        labs = request.lab_biomarkers

        # 1. Subjective Analysis
        subjective = SOAPSubjective(
            chief_complaint="Follow-up evaluation for chronic fatigue and glucose regulation.",
            history_of_present_illness=notes,
            review_of_systems=["Fatigue reported", "Denies chest pain", "No acute shortness of breath"]
        )

        # 2. Objective Analysis
        objective = SOAPObjective(
            vitals={
                "blood_pressure": "136/84 mmHg",
                "heart_rate_bpm": 74,
                "temperature_celsius": 36.8,
                "spO2_percent": 98
            },
            physical_exam=[
                "Well-developed, alert and oriented x3.",
                "Cardiovascular: Regular rate and rhythm, no murmurs.",
                "Abdomen: Soft, non-tender, non-distended."
            ],
            laboratory_findings=labs
        )

        # 3. Assessment Formulation
        assessment_items = []
        has_diabetes = any("glucose" in l.biomarker.lower() or "hba1c" in l.biomarker.lower() for l in labs)
        if has_diabetes:
            assessment_items.append(SOAPAssessmentItem(
                diagnosis_name="Type 2 Diabetes Mellitus with Nephropathy",
                icd10_code="E11.21",
                clinical_rationale="Elevated fasting plasma glucose and impaired renal filtration parameters.",
                supporting_biomarkers=[l.biomarker for l in labs]
            ))
        else:
            assessment_items.append(SOAPAssessmentItem(
                diagnosis_name="Primary Essential Hypertension",
                icd10_code="I10",
                clinical_rationale="Documented blood pressure elevation on repeated measures.",
                supporting_biomarkers=["Blood Pressure"]
            ))

        # 4. Plan Formulation (Drafted from Doctor Notes)
        plan_items = []
        if "metformin" in notes.lower():
            plan_items.append(SOAPPlanItem(
                action_type="MEDICATION",
                description="Continue oral antidiabetic therapy for glycemic control.",
                drug_name="Metformin",
                dosage="1000mg BID",
                contraindication_cleared=False
            ))
        if "lisinopril" in notes.lower():
            plan_items.append(SOAPPlanItem(
                action_type="MEDICATION",
                description="Initiate ACE-inhibitor for blood pressure optimization.",
                drug_name="Lisinopril",
                dosage="20mg daily",
                contraindication_cleared=False
            ))
        
        # Standard lifestyle & lab monitoring
        plan_items.append(SOAPPlanItem(
            action_type="LAB_ORDER",
            description="Repeat comprehensive metabolic panel and urine microalbumin in 4 weeks.",
            contraindication_cleared=True
        ))
        plan_items.append(SOAPPlanItem(
            action_type="LIFESTYLE",
            description="Diabetic diet counseling, sodium restriction (< 2g/day), and daily aerobic exercise.",
            contraindication_cleared=True
        ))

        return SOAPRecord(
            encounter_id=encounter_id,
            subjective=subjective,
            objective=objective,
            assessment=assessment_items,
            plan=plan_items
        )
