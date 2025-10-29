import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CountryCodeSelect } from '@/components/CountryCodeSelect';

const formSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(8, 'Phone number must be at least 8 characters').max(20),
  country_code: z.string().default('+49'),
  nationality: z.string().min(2, 'Please select your nationality'),
  current_education_level: z.string().min(1, 'Please select your education level'),
  current_field_of_study: z.string().min(2, 'Please enter your field of study').max(200),
  current_gpa: z.string().optional(),
  target_intake: z.string().min(1, 'Please select target intake'),
  budget_range: z.string().optional(),
  preferred_cities: z.string().optional(),
  additional_notes: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ConsultationFormProps {
  programId: string;
  programName: string;
  universityName: string;
  onSuccess?: () => void;
}

export function ConsultationForm({ programId, programName, universityName, onSuccess }: ConsultationFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country_code: '+49',
    },
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['full_name', 'email', 'phone', 'country_code', 'nationality'];
    } else if (step === 2) {
      fieldsToValidate = ['current_education_level', 'current_field_of_study'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Create account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: Math.random().toString(36).slice(-12) + 'Aa1!', // Temporary password
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: data.full_name,
              phone: data.phone,
              country_code: data.country_code,
              nationality: data.nationality,
            },
          },
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('Failed to create account');

        // Wait a moment for profile to be created by trigger
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Get current session after signup
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user) throw new Error('No active session');

      // Update profile with consultation data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          country_code: data.country_code,
          nationality: data.nationality,
          current_education_level: data.current_education_level,
          current_field_of_study: data.current_field_of_study,
          current_gpa: data.current_gpa ? parseFloat(data.current_gpa) : null,
        })
        .eq('id', currentSession.user.id);

      if (profileError) throw profileError;

      // Create consultation record
      const { error: consultationError } = await supabase
        .from('consultations')
        .insert({
          profile_id: currentSession.user.id,
          program_id: programId,
          status: 'pending',
          consultation_type: 'program_inquiry',
          notes: [{
            type: 'initial_inquiry',
            target_intake: data.target_intake,
            budget_range: data.budget_range,
            preferred_cities: data.preferred_cities,
            additional_notes: data.additional_notes,
            timestamp: new Date().toISOString(),
          }],
        });

      if (consultationError) throw consultationError;

      // Add program to watchlist
      await supabase.from('saved_programs').insert({
        profile_id: currentSession.user.id,
        program_id: programId,
      });

      toast.success('Consultation request submitted successfully!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/ai-assistant?program_id=${programId}`);
      }
    } catch (error: any) {
      console.error('Consultation submission error:', error);
      toast.error(error.message || 'Failed to submit consultation request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Start Your Application Journey</CardTitle>
        <CardDescription>
          Get personalized guidance for {programName} at {universityName}
        </CardDescription>
        <div className="space-y-2 pt-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                  placeholder="Enter your full name"
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="flex gap-2">
                  <CountryCodeSelect
                    value={watch('country_code')}
                    onValueChange={(value) => setValue('country_code', value)}
                  />
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="123456789"
                    className="flex-1"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nationality">Nationality *</Label>
                <Input
                  id="nationality"
                  {...register('nationality')}
                  placeholder="Your nationality"
                />
                {errors.nationality && (
                  <p className="text-sm text-destructive mt-1">{errors.nationality.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Academic Background */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="current_education_level">Current Education Level *</Label>
                <Select
                  onValueChange={(value) => setValue('current_education_level', value)}
                  defaultValue={watch('current_education_level')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                    <SelectItem value="master">Master's Degree</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.current_education_level && (
                  <p className="text-sm text-destructive mt-1">{errors.current_education_level.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="current_field_of_study">Field of Study *</Label>
                <Input
                  id="current_field_of_study"
                  {...register('current_field_of_study')}
                  placeholder="e.g., Computer Science, Engineering"
                />
                {errors.current_field_of_study && (
                  <p className="text-sm text-destructive mt-1">{errors.current_field_of_study.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="current_gpa">Current GPA (Optional)</Label>
                <Input
                  id="current_gpa"
                  {...register('current_gpa')}
                  placeholder="e.g., 3.5"
                  type="number"
                  step="0.01"
                />
                {errors.current_gpa && (
                  <p className="text-sm text-destructive mt-1">{errors.current_gpa.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="target_intake">Target Intake *</Label>
                <Select
                  onValueChange={(value) => setValue('target_intake', value)}
                  defaultValue={watch('target_intake')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="When do you plan to start?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="winter_2025">Winter 2025</SelectItem>
                    <SelectItem value="summer_2026">Summer 2026</SelectItem>
                    <SelectItem value="winter_2026">Winter 2026</SelectItem>
                    <SelectItem value="later">Later</SelectItem>
                  </SelectContent>
                </Select>
                {errors.target_intake && (
                  <p className="text-sm text-destructive mt-1">{errors.target_intake.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="budget_range">Budget Range (Optional)</Label>
                <Select onValueChange={(value) => setValue('budget_range', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_5000">Under €5,000/year</SelectItem>
                    <SelectItem value="5000_10000">€5,000 - €10,000/year</SelectItem>
                    <SelectItem value="10000_15000">€10,000 - €15,000/year</SelectItem>
                    <SelectItem value="over_15000">Over €15,000/year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="preferred_cities">Preferred Cities (Optional)</Label>
                <Input
                  id="preferred_cities"
                  {...register('preferred_cities')}
                  placeholder="e.g., Berlin, Munich, Hamburg"
                />
              </div>

              <div>
                <Label htmlFor="additional_notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="additional_notes"
                  {...register('additional_notes')}
                  placeholder="Any specific questions or requirements..."
                  rows={4}
                />
                {errors.additional_notes && (
                  <p className="text-sm text-destructive mt-1">{errors.additional_notes.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            
            {step < totalSteps ? (
              <Button type="button" onClick={nextStep} className="ml-auto">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}