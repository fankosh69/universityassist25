

# HubSpot Property Audit: Full Analysis

## Overview

I analyzed all 3 exported CSVs against the platform's data model (Supabase schema, onboarding flow, profiles, programs, universities). Below are the findings organized by object.

Note: HubSpot read-only/system properties (analytics, lifecycle stage timings, etc.) are excluded from this audit -- those are managed automatically by HubSpot.

---

## 1. CONTACTS (Students/Users)

### 1A. Duplicated Properties -- CONSOLIDATE

These groups contain multiple properties capturing the same data from different forms/lead ads over time. Pick one canonical property and map all future syncs to it.

| Canonical Property | Duplicates to Merge Into It |
|---|---|
| `date_of_birth` (HubSpot FB) | `birth_date` (UA custom, 0.69% fill) |
| `student_high_school_curriculum` | `high_school_curriculum` (lead_ads, 11.54%) |
| `current_field_of_study_major` | `current_field_of_studymajor` (lead_ads, 7.37%), `field_of_study` (FB, 0.31%) |
| `desired_education_level` | `current_education_level_` (0.44%), `whats_your_highest_level_of_education` (37%), `education_level_you_are_going_for_in_germany` (0.25%), `which_study_level_are_you_interested_in_` (0.27%) |
| `gpa___grades_` (9.7%) | `gpa__grades` (30.4%), `current_or_graduation__gpa__grades_` (54.69%), `graduation_gpa__grades` (3.26%) -- **Consolidate all into one `gpa_raw` property** |
| `desired_major` (deal_info, 11.31%) | `desired_major_s` (0.65%), `desired_major_what_are_you_looking_to_study_...` (83.61%), `desired_major_what_are_you_looking_to_study_ex1_bachelors...` (0.33%), `major_you_will_study` (0.25%), `what_would_you_like_to_study__example...` (8.58%) |
| `high_school_name` (0.38%) | `your_current_or_pervious__schooluniversity__name` (61.05%), `your_current_schooluniversity_name` (26.78%), `your_currentpervious_university_name` (3.26%), `school` (FB, 0%) |
| `are_you_aware_of_the_mandatory_blocked_bank_account...` (12.6%) | 4 more variants with different amounts (11,208 / 11,904 / 11,992) -- **Consolidate into one `blocked_bank_account_aware` (Yes/No/Not Sure)** |

### 1B. Properties to UPDATE (rename/retype to match platform)

| Current Internal Name | Issue | Update To |
|---|---|---|
| `are_you_aware_of_the_mandatory_blocked_bank_account_to_study_in_germany_` | Misleading label ("Do you want to Study MBA...") | Rename to `blocked_bank_account_aware`, type: enumeration `Yes; No; Not Sure` |
| `desired_qualification` | Options outdated (Foundation/Undergraduate/Postgraduate) | Rename to `desired_education_level`, update options to match platform: `Foundation Course; Bachelor Degree; Master's Degree; PhD; Other` |
| `english_language_proficiency` | Uses IELTS bands only | Rename to `english_cefr_level`, options: `A1; A2; B1; B2; C1; C2` (platform uses CEFR) |
| `german_language_proficiency` | Ranges like "A1-A2" | Rename to `german_cefr_level`, options: `No Knowledge; A1; A2; B1; B2; C1; C2` |
| `student_high_school_curriculum` | Missing curricula | Add options: `Abitur; Thanawiya Amma; SAT-based; Other National` to match platform's curriculum list |
| `nationality` | Type: string | Keep string (flexible), but ensure synced from platform's `profiles.nationality` |
| `gpa___grades_` | String, vague | Create new `gpa_raw` (number), `gpa_scale` (number), `gpa_min_pass` (number) -- see "Add" section |

### 1C. Properties to DELETE (0% fill, campaign-specific, or obsolete)

| Internal Name | Reason |
|---|---|
| `are_you_interested_to_take_german_classes_during_the_summer_camp_` | Campaign-specific, 0% fill |
| `can_you_afford_the_tuition_fees_of_12_700_euro_year_...` | Campaign-specific |
| `city_of_residence` | 0% fill, redundant with `country` + IP city |
| `counselor_email` | 0% fill |
| `counselor_mobile_number` | 0% fill |
| `course_description` | On contact? 0.05% fill, belongs on Course object |
| `course_you_are_interested_in_` | Campaign-specific to one uni |
| `contracting_date` | 0.02% fill, should be on Deal |
| `meta_client_ip`, `meta_fbc`, `meta_lead_created`, `meta_lead_id`, `meta_user_agent` | All 0% fill, FB metadata |
| `preferred_time_for_your_1_to_1_meeting_with_the_mudt_representative` | One-time event |
| `mudt_will_conduct_11_meeting...` | One-time event |
| `program_you_want_to_study_at_ue` | Campaign-specific |
| `state_your_educational_details_ex_if_igcse_8_ol__2_al_etc` | Low fill (1.2%), free text |
| All tuition affordability questions (5+ variants) | Campaign-specific, move to form-level tracking |
| All "we take care of your entire application..." variants | Campaign-specific consent |
| `the_foundation_year_is_for_20500_euro...` | Campaign-specific |
| `the_cost_of_the_foundation_year...` (lead_ads) | Duplicate of contact version |
| `universities_you_got_offers_from_in_germany` | 0.25% fill |
| `academic_focus_track` | 0% fill, campaign-specific |
| `place_of_birth` | 0.07% fill, not used in platform |
| `personal_picture` | 0.03% fill, platform uses avatar_url |

### 1D. Properties to ADD (to match platform data model)

| Internal Name | Type | Description |
|---|---|---|
| `gpa_raw` | number | Raw GPA value from student profile |
| `gpa_scale` | number | GPA scale maximum (e.g., 4.0, 100) |
| `gpa_min_pass` | number | Minimum passing grade |
| `german_gpa` | number | Converted German GPA (Bavarian formula) |
| `total_ects` | number | Total ECTS credits |
| `country_of_residence` | string | From onboarding (currently only `country` exists, used as mailing country) |
| `curriculum` | enumeration | Options: `IGCSE; IB; American Diploma; National; French BAC; Abitur; Canadian; SAT; Other` |
| `preferred_fields` | string | Comma-separated preferred fields of study |
| `preferred_cities` | string | Comma-separated preferred German cities |
| `career_goals` | string | Free text career goals |
| `onboarding_completed_date` | date | When student completed onboarding on platform |
| `signup_source` | string | Always "university_assist_platform" |
| `platform_user_id` | string | Supabase user UUID for cross-referencing |
| `is_minor` | bool | Under 18 flag |
| `parent_consent_given` | bool | Parental consent status |
| `xp_points` | number | Gamification XP |
| `profile_completion_pct` | number | Profile completion percentage |
| `language_test_english_type` | string | IELTS/TOEFL/PTE/Duolingo |
| `language_test_english_score` | string | Test score |
| `language_test_german_type` | string | Goethe/TestDaF/telc/DSH |
| `language_test_german_score` | string | Test score |

---

## 2. DEALS (Applications)

### 2A. Properties Working Well -- KEEP

These are actively used and map well to the admissions workflow:
- `application_method` (53.59% fill) -- Uni-Assist VPD/Direct/Portal
- `application_deadline`, `application_open_date`
- `application_submission_date`, `proof_of_application_submission`
- `admission_noitce`, `offer_letter_study_contract`, `offer_date`
- `rejection_notice_letter`
- `admissions_manager`, `admissions_counselor`
- `notes_on_application`
- Pipeline stages (Public + Private university pipelines) -- well structured

### 2B. Properties to UPDATE

| Current | Issue | Update |
|---|---|---|
| `admissions_counselor` | External options, 0% fill on deals | Populate from platform's counselor assignment |
| `password` / `username` | Storing credentials in CRM (security risk) | Rename to `portal_username` / mark `password` for deletion |
| `student_id` | Only 0.44% fill | Sync automatically from platform |

### 2C. Properties to DELETE from Deals

| Internal Name | Reason |
|---|---|
| `password` | Security risk -- never store passwords in CRM |
| `europass_cv` | Duplicate of contact-level property |
| `facebook_review` / `google_review` | Post-enrollment, should be on contact |
| `revenue` | 0% fill, duplicate of `amount` |
| `video_picture_testimonial` | Post-enrollment, belongs on ambassador record |

### 2D. Properties to ADD to Deals

| Internal Name | Type | Description |
|---|---|---|
| `program_name` | string | Name of the program being applied to |
| `university_name` | string | University name |
| `program_id` | string | Platform program UUID |
| `university_id` | string | Platform university UUID |
| `intake_season` | enumeration | `Winter; Summer` |
| `intake_year` | number | Application intake year |
| `uni_assist_required` | bool | Whether Uni-Assist is required |
| `tuition_per_semester` | number | Program tuition cost |
| `degree_level` | enumeration | `Bachelor; Master; Foundation; PhD` |
| `language_of_instruction` | enumeration | `German; English; Bilingual` |
| `eligibility_status` | enumeration | `Eligible; Borderline; Missing Requirements` |
| `match_score` | number | Platform matching score (0-100) |
| `assigned_counselor_email` | string | From platform counselor assignment |

---

## 3. COMPANIES (Universities/Organizations)

### 3A. Properties Working Well

- `type` enumeration already has University/High School/Aggregator -- good
- `name`, `domain`, `website`, `city`, `country`, `description` -- standard
- `your_current_school_university_name` (38.89%) -- used for school matching

### 3B. Properties to DELETE

| Internal Name | Reason |
|---|---|
| `cv` | File upload on company? Wrong object (1.74%) |
| `do_you_have_a_laptop_` | Campaign-specific, wrong object |

### 3C. Properties to ADD (for university records)

| Internal Name | Type | Description |
|---|---|---|
| `institution_type` | enumeration | `University; University of Applied Sciences; Art/Music Academy; Technical University` |
| `control_type` | enumeration | `Public; Private; Church-affiliated` |
| `uni_assist_member` | bool | Whether university uses Uni-Assist |
| `platform_university_id` | string | Supabase UUID cross-reference |
| `total_programs` | number | Number of programs offered |
| `total_international_students` | number | International student count |
| `slug` | string | URL slug on platform |
| `city_name` | string | City name for filtering |
| `state_name` | string | German state (Bundesland) |

---

## 4. COURSES (Programs) -- Missing Export

You mentioned Courses as an object but didn't upload the CSV. Based on the platform's `programs` table, here are the properties that **should exist** on the Courses object:

| Internal Name | Type | Description |
|---|---|---|
| `program_name` | string | Full program name |
| `degree_level` | enumeration | `Bachelor; Master; Foundation; PhD; Diploma` |
| `language_of_instruction` | enumeration | `German; English; Bilingual` |
| `tuition_per_semester` | number | Tuition in EUR |
| `duration_semesters` | number | Program duration |
| `ects_required` | number | Total ECTS |
| `intake_seasons` | string | `Winter; Summer; Both` |
| `uni_assist_required` | bool | Flag |
| `application_deadline_winter` | date | Winter deadline |
| `application_deadline_summer` | date | Summer deadline |
| `min_german_level` | string | CEFR level |
| `min_english_level` | string | CEFR level |
| `field_of_study` | string | Field category |
| `platform_program_id` | string | Supabase UUID |
| `slug` | string | URL slug on platform |
| `program_url` | string | Full URL on platform |
| `is_active` | bool | Currently accepting applications |

Please upload the Courses CSV so I can cross-check against existing properties.

---

## 5. Summary of Actions

```text
CONTACTS:   7 consolidation groups | 7 updates | ~25 deletes | 20 adds
DEALS:      0 consolidations       | 3 updates | 5 deletes   | 13 adds
COMPANIES:  0 consolidations       | 0 updates | 2 deletes   | 9 adds
COURSES:    Need CSV to audit      |           |             | ~16 adds (if empty)
```

## 6. Implementation Sequence

Once you approve these changes in HubSpot:
1. Create new properties in HubSpot Settings (Adds)
2. Migrate data from duplicate fields to canonical ones
3. Delete obsolete properties
4. Update the `sync-hubspot-lead` Edge Function to map to the new canonical property names
5. Build Deal (application) sync when admission counselor role is activated
6. Build Company (university) sync from the admin university catalog

