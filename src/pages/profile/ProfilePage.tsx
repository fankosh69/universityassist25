import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import SEOHead from '@/components/SEOHead';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageCertificatesManager } from '@/components/profile/LanguageCertificatesManager';
import type { LanguageCertificate } from '@/types/language-requirements';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [languageCerts, setLanguageCerts] = useState<LanguageCertificate[]>([]);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      curriculum: '',
      prev_major: '',
      gpa_raw: '',
      gpa_scale_max: '',
      gpa_min_pass: '',
      gpa_de: '',
      target_level: '',
      target_intake: '',
      ects_total: '',
    }
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: academics } = await supabase
        .from('student_academics')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (academics) {
        Object.entries(academics).forEach(([key, value]) => {
          if (value !== null) {
            setValue(key as any, value?.toString() || '');
          }
        });
        setLanguageCerts(
          Array.isArray(academics.language_certificates) 
            ? academics.language_certificates as unknown as LanguageCertificate[]
            : []
        );
      }
    }

    loadProfile();
  }, [setValue]);


  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const academicsData = {
        profile_id: user.id,
        ...data,
        language_certificates: languageCerts,
        gpa_raw: data.gpa_raw ? parseFloat(data.gpa_raw) : null,
        gpa_scale_max: data.gpa_scale_max ? parseFloat(data.gpa_scale_max) : null,
        gpa_min_pass: data.gpa_min_pass ? parseFloat(data.gpa_min_pass) : null,
        ects_total: data.ects_total ? parseFloat(data.ects_total) : null,
      };

      const { error } = await supabase
        .from('student_academics')
        .upsert(academicsData);

      if (error) throw error;

      toast({
        title: t('common.save') + 'd!',
        description: 'Your academic profile has been updated.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Academic Profile | University Assist"
        description="Complete your academic profile to get personalized program recommendations and eligibility assessments."
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Academic Profile</h1>
          <p className="text-xl text-muted-foreground">
            Complete your profile to get personalized program recommendations
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Academic Background */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="curriculum">Current Curriculum</Label>
                  <Input 
                    id="curriculum"
                    {...register('curriculum')}
                    placeholder="e.g., Indian CBSE, British A-Levels"
                  />
                </div>
                <div>
                  <Label htmlFor="prev_major">Previous Major/Field</Label>
                  <Input 
                    id="prev_major"
                    {...register('prev_major')}
                    placeholder="e.g., Computer Science, Mathematics"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="target_level">Target Degree Level</Label>
                <Select onValueChange={(value) => setValue('target_level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bachelor">Bachelor's</SelectItem>
                    <SelectItem value="master">Master's</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target_intake">Preferred Intake</Label>
                <Select onValueChange={(value) => setValue('target_intake', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select intake season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="winter">Winter Semester (October)</SelectItem>
                    <SelectItem value="summer">Summer Semester (April)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ects_total">Total Credit Points (if applicable)</Label>
                <Input 
                  id="ects_total"
                  type="number"
                  {...register('ects_total')}
                  placeholder="e.g., 180"
                />
              </div>
            </CardContent>
          </Card>

          {/* GPA Section */}
          <Card>
            <CardHeader>
              <CardTitle>Grade Point Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  This will calculate your German GPA automatically when you fill in the fields above.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="gpa_raw">Your Grade/GPA</Label>
                  <Input 
                    id="gpa_raw"
                    type="number"
                    step="0.01"
                    {...register('gpa_raw')}
                    placeholder="e.g., 8.5"
                  />
                </div>
                <div>
                  <Label htmlFor="gpa_scale_max">Maximum Grade</Label>
                  <Input 
                    id="gpa_scale_max"
                    type="number"
                    step="0.01"
                    {...register('gpa_scale_max')}
                    placeholder="e.g., 10.0"
                  />
                </div>
                <div>
                  <Label htmlFor="gpa_min_pass">Minimum Passing Grade</Label>
                  <Input 
                    id="gpa_min_pass"
                    type="number"
                    step="0.01"
                    {...register('gpa_min_pass')}
                    placeholder="e.g., 5.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Certificates */}
          <LanguageCertificatesManager
            certificates={languageCerts}
            onChange={setLanguageCerts}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}