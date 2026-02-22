

# Mandatory Onboarding Gate: Complete Profile Before Full Access

## What This Does

When a user signs up and confirms their email, OR signs in at any time, the website checks if they have completed the onboarding questions. If not, they are redirected to complete them. Until completed, the user gets a **limited experience** -- they can browse basic info but cannot access full program details, eligibility checks, applications, or other deep features.

## How It Works

### 1. Onboarding Completion Check (New Hook)

A new `useOnboardingStatus` hook will check whether the user has a `student_academics` record with the minimum required fields filled (curriculum, desired education level). This is a lightweight check that runs once per session.

- **Completed**: user has a `student_academics` record with `curriculum` and `target_level` filled
- **Not completed**: user is missing this data and must complete onboarding

### 2. Redirect Logic

**After email confirmation**: Change the signup `emailRedirectTo` from `window.location.origin/` to `window.location.origin/onboarding` so clicking "Confirm your email" lands the user on onboarding.

**After sign-in**: Already redirects to `/onboarding` (this is working). Add a check in the onboarding flow so that if the user HAS already completed it, they skip straight to `/dashboard`.

**App-level guard**: In `App.tsx`, create a wrapper component (`OnboardingGuard`) that wraps all authenticated routes. It checks onboarding status and redirects to `/onboarding` if incomplete.

### 3. Limited vs Full Experience (Content Gating)

For pages accessible without login (public pages like program details, university pages), we add a **soft gate** using a shared `useOnboardingGate` hook:

| Feature | Without Onboarding | With Onboarding |
|---------|-------------------|-----------------|
| Browse programs list | Yes (basic cards) | Yes (full details) |
| View full program description | Truncated + "Complete profile to see more" banner | Full access |
| Check eligibility | Locked with CTA | Full access |
| Apply / Start application | Locked with CTA | Full access |
| Watchlist / Save programs | Locked with CTA | Full access |
| View universities list | Yes | Yes |
| View city pages | Yes | Yes |
| Dashboard | Redirected to onboarding | Full access |
| AI Assistant | Locked with CTA | Full access |

### 4. Onboarding Flow Improvements

- **Pre-populate data**: Fetch existing profile data (name, DOB, phone from signup) and pre-fill Step 1
- **Skip if completed**: On mount, check if `student_academics` exists with required fields -- if yes, redirect to `/dashboard`
- **Validation**: Steps 1 and 2 are mandatory (Basic Info + Academic). Steps 3 and 4 are optional but encouraged

## Technical Plan

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useOnboardingStatus.ts` | Checks if the current user has completed onboarding (returns `{ isComplete, isLoading }`) |
| `src/components/OnboardingGuard.tsx` | Wrapper component that redirects authenticated users to `/onboarding` if incomplete |
| `src/components/OnboardingGate.tsx` | UI component that shows a "Complete your profile" banner/overlay when a feature requires onboarding |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Wrap authenticated routes (`/dashboard`, `/documents`, `/saved`, `/profile`, `/sales-dashboard`, `/ai-assistant`) with `OnboardingGuard`. Keep `/onboarding` route outside the guard. |
| `src/pages/Auth.tsx` | Change `emailRedirectTo` from `window.location.origin/` to `window.location.origin/onboarding`. |
| `src/pages/onboarding/OnboardingFlow.tsx` | Add skip-if-completed check on mount. Pre-populate form data from existing profile. Add per-step validation for required fields. |
| `src/pages/onboarding/steps/BasicInfoStep.tsx` | Mark required fields, add validation feedback. |
| `src/pages/onboarding/steps/AcademicInfoStep.tsx` | Mark required fields (curriculum, education level), add validation feedback. |
| `src/pages/programs/ProgramPage.tsx` | Add `OnboardingGate` around eligibility panel and full description sections. |
| `src/pages/universities/UniversityPage.tsx` | Add `OnboardingGate` around detailed program views. |
| `src/components/EligibilityPanel.tsx` | Wrap with onboarding check -- show "Complete profile" CTA if not done. |
| `src/components/WatchlistButton.tsx` | Disable and show tooltip if onboarding not complete. |

### How `useOnboardingStatus` Works

```text
1. Check if user is logged in
2. If not logged in --> return { isComplete: false, isLoading: false }
3. Query student_academics WHERE profile_id = user.id
4. If record exists AND curriculum is not null AND target_level is not null
   --> isComplete = true
5. Otherwise --> isComplete = false
```

### How `OnboardingGuard` Works

```text
User navigates to /dashboard
  --> OnboardingGuard checks useOnboardingStatus
  --> If isComplete: render children (dashboard)
  --> If NOT isComplete: redirect to /onboarding
  --> If isLoading: show spinner
```

### How `OnboardingGate` Works (for public pages)

```text
<OnboardingGate feature="eligibility">
  <EligibilityPanel ... />
</OnboardingGate>

If user not logged in OR onboarding incomplete:
  Show a card saying "Complete your profile to unlock this feature"
  with a CTA button linking to /auth or /onboarding

If onboarding complete:
  Render children normally
```

## No Database Changes Required

The `student_academics` table already exists with the needed columns (`curriculum`, `target_level`). We just read from it to determine completion status.

