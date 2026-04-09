

## Plan: Remove Automatic Onboarding, Trigger Only from Program CTAs

### What changes

**Current behavior**: After signup, any visit to `/dashboard`, `/saved`, `/documents`, `/profile`, `/ai-assistant`, or `/sales-dashboard` auto-redirects to `/onboarding` if the profile is incomplete. Program page sections (description, admission requirements, eligibility) are gated behind `OnboardingGate`.

**New behavior**: All pages load normally without onboarding checks. The onboarding flow is only triggered when a user clicks "Start Your Journey", "Get Application Support", or "Speak with Our Advisors" on a program page. If the user hasn't completed onboarding, those buttons redirect to `/onboarding?program_id=XXX` (preserving context so they can return after).

### Files to modify

#### 1. `src/App.tsx`
- Remove the `OnboardingGuard` import
- Unwrap all 6 routes that use `<OnboardingGuard>`: dashboard, documents, saved, sales-dashboard, ai-assistant, profile — just render the page component directly (still auth-gated with the `user ?` check)

#### 2. `src/components/program/ProgramContact.tsx`
- Import `useNavigate` and `useOnboardingStatus`
- For the 3 consultation buttons ("Start Your Journey", "Get Application Support", "Speak with Our Advisors"), check `isComplete` before calling `onConsultationClick()`:
  - If not logged in → navigate to `/auth`
  - If logged in but onboarding incomplete → navigate to `/onboarding?redirect=/universities/{uni}/programs/{program}`
  - If complete → call `onConsultationClick()` as before
- Pass `programId` to the redirect URL so after onboarding, user returns to the program

#### 3. `src/components/program/ProgramSidebar.tsx`
- Same logic for the consultation button in the sidebar — gate behind onboarding check

#### 4. `src/pages/programs/ProgramPage.tsx`
- Remove `OnboardingGate` wrapper from program description, admission requirements, and eligibility panel — show content to all users freely

#### 5. `src/components/EligibilityPanel.tsx`
- Remove the `OnboardingGate` wrapper — show eligibility panel to all users

#### 6. `src/pages/onboarding/OnboardingFlow.tsx`
- Read `redirect` query param from URL
- After successful completion, navigate to the `redirect` URL if present (instead of always going to `/dashboard`)

#### 7. `src/components/OnboardingGuard.tsx`
- Keep the file but it will no longer be used in routes (can be deleted or kept for future use)

#### 8. `src/components/OnboardingGate.tsx`
- Keep the file but remove its usage from program pages

### Summary of behavior after changes
- Users sign up → land on dashboard immediately, no forced onboarding
- Users browse programs freely with full content visible
- Clicking "Apply" / "Get Support" on a program checks onboarding status and redirects to `/onboarding` if needed, then returns to the program after completion

