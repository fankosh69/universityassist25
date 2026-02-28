

## Plan: Redesign Language Proficiency Step as Conditional Flow

Replace the current generic "add language" list with a guided, branching questionnaire that accurately captures the student's language situation for matching against German university requirements.

### Architecture

The new `LanguageStep.tsx` will use an internal sub-step state machine. Each question conditionally reveals the next based on the answer. All data is stored flat in the parent `formData` via `onUpdate`.

The component reads `data.desiredEducationLevel` and `data.curriculum` from the Academic step to drive contextual disclaimers (e.g., Studienkolleg B1/B2 requirement, German Abitur exemption).

### Flow Diagram

```text
Q1: Intended language of study?
├─ ENGLISH ──────────────────────────────────────────────────
│  Q2: Current English level? (Beginner/Intermediate/Advanced/Fluent)
│  Q3: Have you taken a valid English test? (Yes / No / Planning to)
│  ├─ YES
│  │  Q4: Which test? (IELTS Academic, TOEFL iBT (old 0-120), TOEFL iBT (new 1-6), PTE Academic, Cambridge)
│  │  Q5: Score? (test-specific dropdown with real score increments)
│  │  Q6: Upload prompt (note: actual upload deferred to Documents page)
│  ├─ NO
│  │  Q7: Studied fully in English during [HS/Uni]? (Yes/No)
│  │  ├─ YES (MOI path)
│  │  │  ⚠ Disclaimer: MOI limited acceptance in Germany
│  │  │  Q8: Upload MOI prompt
│  │  │  Q9: Intend to take a test to increase chances? (Yes/No)
│  │  │  └─ YES → Q10: Which test? + Q11: When? (month picker)
│  │  └─ NO
│  │     ⚠ Disclaimer: Must have MOI or valid test
│  │     Q9b: Intend to take a test? (Yes/No)
│  │     └─ YES → Q10: Which test? + Q11: When? (month picker)
│  └─ PLANNING TO
│     Q11: When do you intend to take it? (month picker)
│
│  ── German knowledge sub-section (for English-track students) ──
│  Q12: Any knowledge of German? (None / Beginner A1-A2 / Intermediate B1-B2 / Advanced C1-C2)
│  ├─ NONE → skip
│  └─ Has level
│     Q13: Do you have a valid certificate? (Yes/No)
│     ├─ YES → Q14: Which cert? (Goethe/TestDaF/DSH/telc/ÖSD) + Level + Upload prompt
│     └─ NO → Q15: Intend to take an official test? → When?
│
├─ GERMAN ───────────────────────────────────────────────────
│  ⚠ Context-aware disclaimers:
│    - If curriculum requires Studienkolleg: "Minimum B1/B2 for public Studienkolleg"
│    - If bachelor's/master's direct: "Most programs require C1/C2, B2 is conditional minimum"
│    - "German universities never accept proof of studies in German (MOI) unless you have a German Abitur or bilingual IB/IB German HL"
│  
│  Q2g: Current German level? (A1/A2/B1/B2/C1/C2/None)
│  Q3g: Do you have a valid German certificate? (Yes/No/Planning)
│  ├─ YES
│  │  Q4g: Which cert? (Goethe/TestDaF/DSH/telc/ÖSD)
│  │  Q5g: Level/Score (cert-specific)
│  │  Q6g: Upload prompt
│  ├─ NO
│  │  Q7g: Intend to take an official test? → Which? → When?
│  └─ PLANNING
│     Q8g: When? (month picker)
```

### Files to create/modify

#### 1. NEW: `src/pages/onboarding/steps/LanguageStep.tsx` (full rewrite)
- Replace the entire file with the conditional flow component (~500-600 lines)
- Internal state drives which questions are visible (progressive disclosure, not sub-steps)
- All answers stored as flat keys: `intendedStudyLanguage`, `englishLevel`, `hasEnglishTest`, `englishTestType`, `englishTestScore`, `englishTestScoreDetails` (for IELTS bands), `studiedFullyInEnglish`, `intendToTakeEnglishTest`, `plannedEnglishTestType`, `plannedEnglishTestMonth`, `germanKnowledge`, `hasGermanCert`, `germanCertType`, `germanCertLevel`, `intendToTakeGermanTest`, `plannedGermanTestType`, `plannedGermanTestMonth`
- TOEFL score options support both old (0-120) and new (1-6) scales per the ETS update
- IELTS scores: 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0
- PTE scores: 30-90 range in increments
- Month picker generates months from current month through 12 months + "Next year" option
- Disclaimers rendered as `Alert` components with amber/warning styling
- Document upload prompts are informational (tells user to upload in Documents section after onboarding)

#### 2. `src/pages/onboarding/OnboardingFlow.tsx`
- Update `handleSubmit` to save the new language data structure to `language_proficiency` table
- Map the new flat fields to the existing DB schema (language, cefr_level, test_type, test_score)
- Save planning/intent data in `student_academics.extras` (planned test type, planned month)
- Update HubSpot sync body to include new language fields

#### 3. `supabase/functions/sync-hubspot-lead/index.ts`
- Map the new language fields to HubSpot properties (already have `english_cefr_level`, `german_cefr_level`, test type/score properties)
- Add new fields: `intended_study_language`, `planned_english_test_month`, `planned_german_test_month`

### Score data constants

**IELTS Academic**: 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0

**TOEFL iBT (legacy 0-120)**: Common thresholds: 60, 65, 70, 72, 75, 79, 80, 85, 86, 90, 95, 100, 105, 107, 110, 114, 120

**TOEFL iBT (new 1-6)**: 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0

**PTE Academic**: 30, 36, 42, 50, 58, 65, 73, 79, 83, 90

**Cambridge**: C2 Proficiency (CPE), C1 Advanced (CAE), B2 First (FCE) — score 140-230

**German certs**: Goethe (A1-C2), TestDaF (TDN 3/4/5), DSH (DSH-1/2/3), telc (A1-C2), ÖSD (A1-C2)

### Disclaimers content

1. **MOI limited acceptance**: "Applying only with proof of studies in English (MOI) may significantly decrease your chances, as many German programs do not accept this unless you studied in a native English-speaking country. We recommend taking an official English test to maximize your options."

2. **No English proof**: "To apply for English-taught programs in Germany, you need either proof of full English-medium education or a valid English test score (IELTS, TOEFL, PTE, Cambridge)."

3. **Studienkolleg German**: "Public Studienkolleg programs typically require a minimum German level of B1 or B2. Make sure you have or plan to obtain this level before applying."

4. **German direct admission**: "Most German-taught degree programs require C1 or C2 German. A B2 certificate is the minimum that some programs accept for conditional admission."

5. **No German MOI accepted**: "German universities do not accept proof of studies conducted in German (MOI) as a substitute for a language certificate, unless you hold a German Abitur, a bilingual IB diploma, or completed German as a Higher Level (HL) subject in IB."

### Data saved to DB

The component produces two language_proficiency records (English + German if applicable), plus planning metadata in `student_academics.extras`:
```json
{
  "intended_study_language": "english",
  "english_moi_only": false,
  "planned_english_test": { "type": "IELTS", "month": "2027-06" },
  "planned_german_test": { "type": "Goethe", "month": "2027-09" },
  "german_knowledge_level": "beginner"
}
```

