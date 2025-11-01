import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { AcademicInfoStep } from "./steps/AcademicInfoStep";
import { LanguageStep } from "./steps/LanguageStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GamificationService } from "@/services/gamification";

const STEPS = [
  { id: 'basic', title: 'Basic Information', component: BasicInfoStep },
  { id: 'academic', title: 'Academic Background', component: AcademicInfoStep },
  { id: 'language', title: 'Language Proficiency', component: LanguageStep },
  { id: 'preferences', title: 'Study Preferences', component: PreferencesStep },
];

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const StepComponent = STEPS[currentStep].component;

  const handleNext = async () => {
    if (currentStep === STEPS.length - 1) {
      // Final step - save all data
      await handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleStepData = (data: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth,
          nationality: formData.nationality,
          phone: formData.phone,
          country_code: formData.countryCode,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Save academic data
      const { error: academicError } = await supabase
        .from('student_academics')
        .upsert({
          profile_id: user.id,
          curriculum: formData.curriculum,
          previous_major: formData.previousMajor,
          gpa_raw: formData.gpaRaw,
          gpa_scale: formData.gpaScale,
          gpa_min_pass: formData.gpaMinPass,
          total_ects: formData.totalECTS,
        });

      if (academicError) throw academicError;

      // Save language proficiency
      if (formData.languages && formData.languages.length > 0) {
        const { error: langError } = await supabase
          .from('language_proficiency')
          .insert(
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

      // Save preferences
      const { error: prefError } = await supabase
        .from('academic_preferences')
        .upsert({
          id: user.id,
          preferred_fields: formData.preferredFields,
          preferred_degree_type: formData.preferredDegreeType,
          preferred_cities: formData.preferredCities,
          career_goals: formData.careerGoals,
        });

      if (prefError) throw prefError;

      // Award XP for completing profile
      await GamificationService.awardXP(user.id, {
        eventType: 'PROFILE_COMPLETE',
        description: 'Completed onboarding'
      });

      // Award badge
      await GamificationService.awardBadge(user.id, 'profile_pioneer');

      toast.success("Profile completed successfully!");
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="container max-w-3xl">
        <Card className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-2">
              Welcome to University Assist
            </h1>
            <p className="text-center text-muted-foreground mb-6">
              Let's set up your profile to find the best programs for you
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {currentStep + 1} of {STEPS.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {STEPS[currentStep].title}
            </h2>
            <StepComponent
              data={formData}
              onUpdate={handleStepData}
            />
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
            >
              {currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
              {currentStep < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
