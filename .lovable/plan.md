

# Enhanced Onboarding Journey

## Overview
Transform the current plain 4-step onboarding into a polished, validated, and visually engaging experience with a welcome screen, step-by-step validation, smooth animations, and a celebration completion screen.

## What Changes

### 1. Welcome Screen (New Step 0)
- Greets the user by first name (from pre-populated signup data)
- Brief overview of what the 4 steps cover (icons for each: User, GraduationCap, Languages, Target)
- Single "Let's Get Started" CTA button
- Brand gradient background matching the auth page style

### 2. Per-Step Validation
- **Step 1 (Basic Info)**: `fullName`, `dateOfBirth`, and `nationality` are required. Show red inline errors below empty fields when user clicks "Next". Disable "Next" until all 3 are filled.
- **Step 2 (Academic)**: `curriculum` and `desiredEducationLevel` are required. Same inline error pattern.
- **Step 3 (Language)**: Optional -- show a friendly message: "No worries if you haven't taken any tests yet. You can add them later from your profile."
- **Step 4 (Preferences)**: Optional -- show encouraging message: "These help us find better matches, but you can always update them later."

### 3. Completion Screen (New Final Step)
- Celebratory UI with a checkmark animation (framer-motion scale-in)
- Shows earned rewards: "+50 XP" and "Profile Pioneer" badge
- "Go to Dashboard" CTA button
- Auto-navigates to dashboard after 5 seconds if no click

### 4. Smooth Transitions
- Use `framer-motion` `AnimatePresence` to slide steps left/right when navigating
- Direction-aware: going forward slides left, going back slides right

### 5. Enhanced Step Indicator
- Replace plain progress bar with a step indicator showing icons for each step
- Completed steps get a checkmark, current step is highlighted in primary color, future steps are muted
- Icons: User (basic), GraduationCap (academic), Languages (language), Target (preferences)

### 6. "Skip for now" Option
- Subtle text link below the navigation buttons: "I'll complete this later"
- Only visible on optional steps (Language, Preferences)
- Saves whatever data has been entered so far and goes to dashboard
- The OnboardingGuard will bring them back next time they try to access gated features

### 7. Pre-populated Fields Show as Read-only
- Fields already filled from signup (name, DOB, phone) appear pre-filled with a subtle "From your signup" label
- Users can still edit them if needed, but it reduces friction

### 8. Nationality Searchable Select
- Replace the free-text nationality input with a searchable dropdown of common MENA + international nationalities
- Use the existing `searchable-select.tsx` UI component

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/onboarding/steps/WelcomeStep.tsx` | Welcome screen with user name greeting and step overview |
| `src/pages/onboarding/steps/CompletionStep.tsx` | Celebration screen with XP/badge display and dashboard CTA |

### Files to Modify

| File | Change |
|------|---------|
| `src/pages/onboarding/OnboardingFlow.tsx` | Add WelcomeStep and CompletionStep to the flow; add framer-motion AnimatePresence for transitions; add step validation logic that prevents advancing on required steps; add step icons indicator; add "skip for now" link on optional steps |
| `src/pages/onboarding/steps/BasicInfoStep.tsx` | Add `errors` prop for inline validation messages; replace nationality text input with searchable select; show "From your signup" hint on pre-filled fields |
| `src/pages/onboarding/steps/AcademicInfoStep.tsx` | Add `errors` prop for inline validation messages on curriculum and education level; add info tooltip explaining the blocked bank account question |
| `src/pages/onboarding/steps/LanguageStep.tsx` | Add optional-step messaging; improve empty state with friendlier copy |
| `src/pages/onboarding/steps/PreferencesStep.tsx` | Add optional-step messaging; improve copy |

### Validation Logic (in OnboardingFlow.tsx)

```text
validateStep(stepId, formData):
  if stepId === 'basic':
    errors = {}
    if !formData.fullName -> errors.fullName = "Full name is required"
    if !formData.dateOfBirth -> errors.dateOfBirth = "Date of birth is required"
    if !formData.nationality -> errors.nationality = "Nationality is required"
    return { valid: Object.keys(errors).length === 0, errors }
  
  if stepId === 'academic':
    errors = {}
    if !formData.curriculum -> errors.curriculum = "Please select your curriculum"
    if !formData.desiredEducationLevel -> errors.desiredEducationLevel = "Please select your desired education level"
    return { valid: Object.keys(errors).length === 0, errors }
  
  if stepId === 'language' or 'preferences':
    return { valid: true, errors: {} }  // Always valid (optional)
```

### Step Indicator Component (inline in OnboardingFlow)

```text
Steps displayed as horizontal row of circles with icons:
  [User] --- [GraduationCap] --- [Languages] --- [Target]
  
  Completed: green circle with checkmark
  Current: primary-colored circle with icon
  Future: gray/muted circle with icon
```

### Animation Details
- Use `framer-motion` variants for slide transitions
- `initial`: translateX(direction * 100%), opacity 0
- `animate`: translateX(0), opacity 1
- `exit`: translateX(-direction * 100%), opacity 0
- Duration: 300ms ease-in-out
- `AnimatePresence` with `mode="wait"` wrapping the step component

### No Database Changes Required
All changes are frontend-only. The existing `student_academics` table and onboarding submission logic remain unchanged.

