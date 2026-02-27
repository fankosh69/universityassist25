import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, User, GraduationCap, Languages, Target, Check } from "lucide-react";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { AcademicInfoStep } from "./steps/AcademicInfoStep";
import { LanguageStep } from "./steps/LanguageStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import { CompletionStep } from "./steps/CompletionStep";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GamificationService } from "@/services/gamification";
import LoadingSpinner from "@/components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: 'basic', title: 'Basic Information', icon: User },
  { id: 'academic', title: 'Academic Background', icon: GraduationCap },
  { id: 'language', title: 'Language Proficiency', icon: Languages },
  { id: 'preferences', title: 'Study Preferences', icon: Target },
];

type ValidationErrors = Record<string, string>;

function validateStep(stepId: string, formData: Record<string, any>): { valid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  if (stepId === 'basic') {
    if (!formData.fullName?.trim()) errors.fullName = "Full name is required";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.nationality) errors.nationality = "Nationality is required";
  } else if (stepId === 'academic') {
    if (!formData.curriculum) errors.curriculum = "Please select your curriculum";
    if (!formData.desiredEducationLevel) errors.desiredEducationLevel = "Please select your desired education level";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export default function OnboardingFlow() {
  const navigate = useNavigate();
  // -1 = welcome, 0-3 = steps, 4 = completion
  const [currentStep, setCurrentStep] = useState(-1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }

      const { data: academics } = await supabase
        .from('student_academics')
        .select('curriculum, target_level')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (academics?.curriculum && academics?.target_level) {
        navigate('/dashboard', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, date_of_birth, phone, country_code, nationality, gender')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          fullName: profile.full_name || '',
          dateOfBirth: profile.date_of_birth || '',
          phone: profile.phone || '',
          countryCode: profile.country_code || '+20',
          nationality: profile.nationality || '',
          gender: profile.gender || '',
        }));
      }

      setChecking(false);
    }
    init();
  }, [navigate]);

  const handleNext = useCallback(async () => {
    if (currentStep >= 0 && currentStep < STEPS.length) {
      const { valid, errors: stepErrors } = validateStep(STEPS[currentStep].id, formData);
      if (!valid) { setErrors(stepErrors); return; }
    }
    setErrors({});
    setDirection(1);

    if (currentStep === STEPS.length - 1) {
      await handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, formData]);

  const handleBack = useCallback(() => {
    setErrors({});
    setDirection(-1);
    setCurrentStep(prev => Math.max(-1, prev - 1));
  }, []);

  const handleStepData = useCallback((data: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...data }));
    // Clear errors for fields being updated
    if (Object.keys(errors).length > 0) {
      setErrors(prev => {
        const next = { ...prev };
        Object.keys(data).forEach(k => delete next[k]);
        return next;
      });
    }
  }, [errors]);

  const handleSkip = useCallback(async () => {
    // Save whatever data exists and go to dashboard
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from('profiles').update({
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        nationality: formData.nationality,
        phone: formData.phone,
        country_code: formData.countryCode,
      }).eq('id', user.id);

      if (formData.curriculum) {
        await supabase.from('student_academics').upsert({
          profile_id: user.id,
          curriculum: formData.curriculum,
          target_level: formData.desiredEducationLevel,
          previous_major: formData.previousMajor,
          gpa_raw: formData.gpaRaw,
          gpa_scale: formData.gpaScale,
          gpa_min_pass: formData.gpaMinPass,
          total_ects: formData.totalECTS,
          extras: {
            ...(formData.curriculumDetails || {}),
            desired_major: formData.desiredMajor,
            school_name: formData.schoolName,
            still_enrolled: formData.stillEnrolled,
          },
        });
      }

      toast.info("You can complete your profile later from your dashboard.");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [formData, navigate]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: profileError } = await supabase.from('profiles').update({
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        nationality: formData.nationality,
        phone: formData.phone,
        country_code: formData.countryCode,
      }).eq('id', user.id);
      if (profileError) throw profileError;

      const { error: academicError } = await supabase.from('student_academics').upsert({
        profile_id: user.id,
        curriculum: formData.curriculum,
      previous_major: formData.previousMajor,
      target_level: formData.desiredEducationLevel,
      gpa_raw: formData.gpaRaw,
      gpa_scale: formData.gpaScale,
      gpa_min_pass: formData.gpaMinPass,
      total_ects: formData.totalECTS,
      extras: {
        ...(formData.curriculumDetails || {}),
        desired_major: formData.desiredMajor,
        school_name: formData.schoolName,
        blocked_bank_account_aware: formData.blockedBankAccountAware,
        still_enrolled: formData.stillEnrolled,
        expected_graduation: formData.expectedGraduation,
        credits_completed_so_far: formData.creditsCompletedSoFar,
        total_credits_required: formData.totalCreditsRequired,
      },
    });
    if (academicError) throw academicError;

      if (formData.languages && formData.languages.length > 0) {
        const { error: langError } = await supabase.from('language_proficiency').insert(
          formData.languages.map((lang: any) => ({
            profile_id: user.id,
            language: lang.language,
            cefr_level: lang.cefrLevel,
            test_type: lang.testType,
            test_score: lang.testScore,
          }))
        );
        if (langError) throw langError;
      }

      const { error: prefError } = await supabase.from('academic_preferences').upsert({
        id: user.id,
        preferred_fields: formData.preferredFields,
        preferred_degree_type: formData.preferredDegreeType,
        preferred_cities: formData.preferredCities,
        career_goals: formData.careerGoals,
      });
      if (prefError) throw prefError;

      await GamificationService.awardXP(user.id, { eventType: 'PROFILE_COMPLETE', description: 'Completed onboarding' });
      await GamificationService.awardBadge(user.id, 'profile_pioneer');

      // Non-blocking HubSpot sync (direct API via Private App)
      supabase.functions.invoke('sync-hubspot-lead', {
        body: {
          sync_type: 'onboarding_complete',
          platform_user_id: user.id,
          email: user.email,
          full_name: formData.fullName,
          nationality: formData.nationality,
          country_of_residence: formData.countryOfResidence,
          curriculum: formData.curriculum,
          desired_education_level: formData.desiredEducationLevel,
          desired_major: formData.desiredMajor,
          school_name: formData.schoolName,
          blocked_bank_account_aware: formData.blockedBankAccountAware,
          gpa_raw: formData.gpaRaw,
          gpa_scale: formData.gpaScale,
          gpa_min_pass: formData.gpaMinPass,
          german_gpa: formData.germanGpa,
          total_ects: formData.totalECTS,
          still_enrolled: formData.stillEnrolled,
          curriculum_details: formData.curriculumDetails || {},
          languages: formData.languages?.map((lang: any) => ({
            language: lang.language, cefr_level: lang.cefrLevel,
            test_type: lang.testType, test_score: lang.testScore,
          })) || [],
          preferred_fields: formData.preferredFields,
          preferred_cities: formData.preferredCities,
          career_goals: formData.careerGoals,
          xp_points: 50,
          profile_completion_pct: 100,
        }
      }).catch(err => console.error('HubSpot sync error:', err));

      toast.success("Profile completed successfully!");
      setCurrentStep(STEPS.length); // go to completion screen
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <LoadingSpinner />;

  // Welcome screen
  if (currentStep === -1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center py-8">
        <div className="container max-w-2xl">
          <Card className="p-8">
            <WelcomeStep data={formData} onStart={() => { setDirection(1); setCurrentStep(0); }} />
          </Card>
        </div>
      </div>
    );
  }

  // Completion screen
  if (currentStep === STEPS.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center py-8">
        <div className="container max-w-2xl">
          <Card className="p-8">
            <CompletionStep />
          </Card>
        </div>
      </div>
    );
  }

  const StepComponent = [BasicInfoStep, AcademicInfoStep, LanguageStep, PreferencesStep][currentStep];
  const isOptionalStep = currentStep >= 2;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="container max-w-3xl">
        <Card className="p-8">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isCompleted = i < currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors ${
                      isCompleted ? 'bg-accent border-accent text-accent-foreground' :
                      isCurrent ? 'bg-primary border-primary text-primary-foreground' :
                      'bg-muted border-border text-muted-foreground'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-8 sm:w-12 h-0.5 mx-1 transition-colors ${
                        i < currentStep ? 'bg-accent' : 'bg-border'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8 min-h-[320px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <h2 className="text-xl font-semibold mb-1">{STEPS[currentStep].title}</h2>
                {isOptionalStep && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {currentStep === 2
                      ? "No worries if you haven't taken any tests yet — you can add them later."
                      : "These help us find better matches, but you can always update them later."}
                  </p>
                )}
                <div className="mt-4">
                  <StepComponent data={formData} onUpdate={handleStepData} errors={errors} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              {isOptionalStep && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                >
                  I'll complete this later
                </button>
              )}
              <Button onClick={handleNext} disabled={loading}>
                {currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
                {currentStep < STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
