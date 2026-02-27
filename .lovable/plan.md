## Plan: Curriculum-Specific Eligibility System

### Summary

Replace the one-size-fits-all GPA input in onboarding with a dynamic, curriculum-aware academic step. When a student selects **Bachelor's/Foundation**, the form adapts based on their curriculum (IGCSE, American Diploma, IB, etc.) to collect the specific data needed for German university eligibility. For **Master's** students, keep the GPA/ECTS approach with minor enhancements. Additionally, build a detailed eligibility checker page for deeper analysis.

### Technical Details

**Key insight**: The `student_academics.extras` JSONB column already exists and can store all curriculum-specific data without database migrations.

#### Data structures stored in `extras` (by curriculum)

```text
IGCSE / GCE:

  - graduated: boolean
  - current_grade: "10" | "11" | "12"
- Have you taken AS/AL subjects? Yes or No
- If no, are you planning to take any AS/AL subject? 
- If yes, go to the next
  - as_subjects_count: number (Advanced Subsidiary)
  - as_subjects: [{ name, grade?, upgrading_to_al? }]
  - al_subjects_count: number (Advanced Level)
  - al_subjects: [{ name, grade?, planned? }]

- If student graduted or graduation is equal to "true" - Have you started your studies at a university? If yes, what is the name of your university? What major are you currently studying? How many semesters have you finished at University of "name mentioned"? What is your current cGPA?
 
- If a student didn't take at least 3 subjects as AL, they cannot study in public university in Germany neither can take a foundation year, however, they can still study at a private univerisity depending on how many subjects they have taken, they might need a foundation year in the private university.

American Diploma:

  - graduated: boolean
  - current_grade: "9" | "10" | "11" | "12"
  - gpa_unweighted: number (CGPA grade 9-12)
  - gpa_scale: number
  - ap_exams_taken: boolean (Yes or No) Must provide an explination here for what is the APs exactly, as some students or parents are unaware of this
  - ap_subjects: [{ name, score? }]
  - ap_subjects_planned: [{ name }]
  - has_sat: boolean
  - sat_score: number
- has ACT?: boolean
- ACT score: number
- If student graduted or graduation is equal to "true" - Have you started your studies at a university? If yes, what is the name of your university? What major are you currently studying? How many semesters have you finished at University of "name mentioned"? What is your current cGPA?
- If the student haven't taken any  AP subjects, or if his APs doesn't corresponde to following requirments:

Mathematical subjects, Technology, Natural Sciences, Medicine or Pharmacy.

Condition:
The following subject areas must be covered by your AP tests with at least grade 3:
- Mathematics (Calculus AB or BC)
- 1 natural science subject (Biology, Chemistry, or AP Physics C: Mechanics and AP Physics C: Electricity and Magnetism)
- 1 language (French, Spanish, Latin, German, English Literature or English Language and Composition)
- 1 further subject (e.g. European History, American History, Computer Science A or two half AP tests respectively in Macroeconomics and Microeconomics)

Humanities, Social Sciences, Jurisprudence or Economics.

Condition:
The following subject areas must be covered by your AP tests with at least grade 3:
- English (English Literature or English Language and Composition)
- 1 further foreign language (French, Spanish, Latin, German)
- 1 mathematical/natural science subject (Calculus AB or BC, Biology, Chemistry, or AP Physics C: Mechanics and AP Physics C: Electricity and Magnetism)
- 1 further subject (e.g. European History, American History, Computer Science A or two half AP tests respectively in Macroeconomics and Microeconomics)

Then he cannot study directly in a public university in Germany neither a foundation year in Germany except one. If he studied at least 2 semesters at a university, then he can take any foundation year in Germany, if he studied at least 4 semesters in a university, he can study at any public university in Germany. However, they can still study at private universites in Germany.

IB:

  - graduated: boolean
- current_grade: "11" | "12"
  - predicted_total: number (out of 45)
  - hl_subjects: [{ name, grade? }]  Drop down menue here, then ask for grade of each subject
  - sl_subjects: [{ name, grade? }]  Drop down menue here, then ask for grade of each subject
  - math_level: "AA_HL" | "AA_SL" | "AI_HL" | "AI_SL"
- If student graduted or graduation is equal to "true" - Have you started your studies at a university? If yes, what is the name of your university? What major are you currently studying? How many semesters have you finished at University of "name mentioned"? What is your current cGPA?

- If a student took Mathematics: Analysis and Approaches or
Mathematics: Applications and Interpretation) as an HL, then they are eligible to study any major at any public university in Germany, if they took as an SL, but they took a science subject (Biology, Chemistry, Physics) or a langauge subject as an HL, they're eligible to study only academic studies in subjects that are not assigned to the subject areas: mathematics, natural sciences, technology.
- If a student didn't take neither of those two options, and they haven't taken at least 2 semesters at a university, they can only study a foundation year in Germany or at a private university directly.
- The student total points should not be less than 24 and each subject should not be less than 4, if a non-passing grade of 3 has been attained, the student can compensate for this by achieving a passing grade of 5 in a different subject at the same level or a higher level as the subject in which a grade of 3 was attained and by earning a total of at least 24 points. 


National Diploma:

- graduated: boolean
- current_grade: "11" | "12"
- What is your subject focus in the diploma: Drop down menue:ash-shuʼba al-ʼilmiyya ('ulum) / Scientific Section (Science) - ash-shu'ba al-'ilmiyya (riyadiyyat) / Scientific Section (Mathematics) - ash-shu'ba al-adabiyya / Literary Section
- What percentage did you aquire in grade 10 and 11? Grade 10: Number - Grade 11: Number
- If student graduted or graduation is equal to "true" - Have you started your studies at a university? If yes, what is the name of your university? What major are you currently studying? How many semesters have you finished at University of "name mentioned"? What is your current cGPA?

- If the student didn't study at least 2 semesters or will finish them during the same academic year, then the student is only eligible to study a foundation in Germany.

Canadian Diploma:

- graduated: boolean
- Which territory is your diploma affliated to? (Ontario/British Columbia)
- If Ontario:
Have you taken at least 12 general education courses during grade 11 and 12? If yes, have you taken at least 6 University Preparation Courses (UPCs) during grade 12? If yes, does the 6 UPCs include the following subjects:

- 2 languages (English or French on a native speaker level + one foreign language)
- mathematics ("advanced functions" and "calculus and vectors")
- a natural science subject (Chemistry, Biology, Physics)

If yes, is your average total grade in the 6 UPCs at least 65%? If yes, then the student is eligible to study.

If student answers no to the question "Have you taken at least 12 etc.." and he still haven't graduated, then the result should be that he or she are only eligible for a foundation year in Germany. OR they can study at a private university in Germany.

- If British Columbia:
- Students of this diploma cannot study at a public university directly in Germany without taking at least one academic year in a university, however, they can study a foundation year or in a private university given the following:

You are required to have successfully passed 13 courses in grade XI and grade XII, thereof at least 5 in grade XII.

The Senior Secondary School Statement has to include:
- 2 languages, 1 thereof with course number 12
- mathematics and 1 natural science subject, 1 thereof with course number 12

Your average total grade has to be at least C+.


Master's (minor tweaks):

  - still_enrolled: boolean
  - expected_graduation: date
  - credits_completed_so_far: number
  - total_credits_required: number
```

Take in consideration that in case of the bachelor's or foundation seeking students, these are a lot of inputs needed, and migrating them into hubspot properties would be a hustle, so we need to think of a way of having them visible on hubspot without having a ton of information shown in the contact information section, we can however, have them submitted as a form on hubspot.

### Changes

#### 1. New component: `src/pages/onboarding/steps/CurriculumFields.tsx`

A dynamic sub-component that renders curriculum-specific fields based on `data.curriculum` and `data.desiredEducationLevel`. Contains sub-renderers for each curriculum type (IGCSE, American Diploma, IB, German Abitur, etc.).

#### 2. Update: `src/pages/onboarding/steps/AcademicInfoStep.tsx`

- When `desiredEducationLevel` is `bachelors` or `foundation_year`: hide GPA/ECTS fields, show `<CurriculumFields />` instead
- When `desiredEducationLevel` is `masters`: show GPA/ECTS fields plus new "Are you still enrolled?" toggle and "Credits completed so far" field
- Add "Have you graduated high school?" question for bachelor's/foundation paths
- Store all curriculum-specific data under `formData.curriculumDetails` (maps to `extras` JSONB)

#### 3. Update: `src/pages/onboarding/OnboardingFlow.tsx`

- In `handleSubmit` and `handleSkip`: persist `formData.curriculumDetails` → `student_academics.extras`
- In `handleSubmit` HubSpot sync: add relevant curriculum fields to the sync payload
- Update validation in `validateStep('academic', ...)` to check curriculum-specific required fields

#### 4. New page: `src/pages/EligibilityChecker.tsx`

A dedicated, detailed eligibility checker (separate from the existing `AdmissionsNavigator`) that:

- Pulls data from the student's profile if logged in (pre-populates from `student_academics`)
- For IGCSE: checks 3 AL subjects with min grade C, subject-specific requirements per study field, ≥12 years schooling
- For American Diploma: checks if AP exams qualify for direct admission vs Studienkolleg path, CGPA assessment
- For IB: checks 6 subjects, HL/SL distribution, math requirement, min 24 points, subject-specific access
- Outputs: `direct_admission` | `studienkolleg_required` | `conditional` | `not_eligible` with specific gap analysis
- Links to official DAAD/uni-assist source pages

#### 5. New eligibility rules engine: `src/lib/curriculum-eligibility.ts`

Pure functions encoding the rules from DAAD and uni-assist:

- `checkIGCSEEligibility(data)` — 3 AL subjects grade C+, subject-specific mapping table
- `checkAmericanDiplomaEligibility(data)` — AP exam requirements, Studienkolleg path
- `checkIBEligibility(data)` — 6 subjects, HL/SL split, math requirement, min 24 points, grade conversion formula
- `checkGermanAbiturEligibility(data)` — direct admission
- Returns `{ status, missingRequirements[], recommendedActions[], accessType }`

#### 6. Route addition in `src/App.tsx`

Add `/eligibility-checker` route pointing to new page.

### No database migrations needed

All curriculum-specific data fits in the existing `student_academics.extras` JSONB column.

### Scope

- 2 new files (CurriculumFields component, curriculum-eligibility rules engine)
- 1 new page (EligibilityChecker)
- 2 updated files (AcademicInfoStep, OnboardingFlow)
- 1 minor update (App.tsx route)
- No DB migrations