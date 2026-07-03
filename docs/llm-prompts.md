# LLM Prompts — Healthcare Appointment Manager

This document records the exact prompts sent to the OpenAI API (`gpt-4o-mini` by default, controlled by `LLM_MODEL` in `.env`).

---

## 1. Pre-Visit Symptom Summary

**Trigger:** `POST /appointments/book` — when the patient supplies a `symptoms` string.  
**Function:** `generatePreVisitSummary(symptoms)` in `backend/src/config/llm.ts`  
**Purpose:** Helps the doctor see a structured triage summary before the appointment.

### Exact prompt sent to the model

```
Analyse these patient symptoms and provide:
1. Urgency level (Low/Medium/High)
2. Chief complaint (brief summary)
3. Three suggested questions for the doctor

Symptoms: <patient_symptoms_text>

Respond in JSON format: { "urgencyLevel": "...", "chiefComplaint": "...", "suggestedQuestions": [...] }
```

### Expected JSON response

```json
{
  "urgencyLevel": "High",
  "chiefComplaint": "Respiratory distress with persistent cough",
  "suggestedQuestions": [
    "How long have you had these symptoms?",
    "Have you been exposed to anyone who is ill recently?",
    "Do you have any known allergies or pre-existing conditions?"
  ]
}
```

### Graceful degradation (no API key)

When `OPENAI_API_KEY` is not set the function returns immediately with:
```json
{
  "urgencyLevel": "Medium",
  "chiefComplaint": "<raw symptom text>",
  "suggestedQuestions": []
}
```
The appointment is still created — the LLM result is optional enrichment.

---

## 2. Post-Visit Patient-Friendly Summary

**Trigger:** `POST /appointments/post-visit` — after a doctor submits clinical notes.  
**Function:** `generatePostVisitSummary(clinicalNotes, prescription)` in `backend/src/config/llm.ts`  
**Purpose:** Converts doctor jargon into plain language the patient can understand.

### Exact prompt sent to the model

```
Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps:

Clinical Notes: <clinical_notes_text>
Prescription: <prescription_text>

Provide a clear, easy-to-understand summary that a patient can follow.
```

### Expected response (plain text)

```
You have been diagnosed with bronchitis. Please take the prescribed course of antibiotics — one tablet twice a day with food — for the full 7 days even if you start feeling better sooner.

Rest as much as possible and stay well hydrated. Avoid strenuous activity until your follow-up appointment next week.

If you develop a high fever (above 39 °C), difficulty breathing, or your symptoms worsen, visit an emergency department immediately.
```

### Graceful degradation (no API key)

When `OPENAI_API_KEY` is not set the function returns:
```json
{
  "summary": "<raw clinical_notes text>"
}
```
The `PostVisitNote` record is saved with the raw notes as the `patient_friendly_summary`. The appointment workflow is unaffected.

---

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | Your OpenAI secret key | *(empty — LLM disabled)* |
| `LLM_MODEL` | Model to use | `gpt-4o-mini` |

Both variables live in `backend/.env`. The system works fully without them — LLM features degrade gracefully.
