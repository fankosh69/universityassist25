import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import { CurriculumFields } from "@/pages/onboarding/steps/CurriculumFields";
import { checkEligibility, type EligibilityResult } from "@/lib/curriculum-eligibility";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, AlertTriangle, XCircle, Info, ExternalLink, ArrowRight, RotateCcw } from "lucide-react";

const CURRICULUM_OPTIONS = [
  { value: 'American Diploma', label: 'American Diploma' },
  { value: 'German Abitur', label: 'German Abitur' },
  { value: 'IGCSE', label: 'IGCSE / GCE A-Levels' },
  { value: 'IB', label: 'International Baccalaureate (IB)' },
  { value: 'NATIONAL DIPLOMA', label: 'National Diploma (Thānawiyya ʻĀmma)' },
  { value: 'French BAC', label: 'French BAC' },
  { value: 'Canadian Diploma', label: 'Canadian Diploma' },
];

function StatusBadge({ status }: { status: EligibilityResult['status'] }) {
  const config = {
    direct_admission: { label: 'Direct Admission', className: 'bg-accent/20 text-accent-foreground border-accent', icon: CheckCircle },
    studienkolleg_required: { label: 'Studienkolleg Required', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-300', icon: AlertTriangle },
    conditional: { label: 'Conditional', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-300', icon: Info },
    private_university_only: { label: 'Private University Only', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 border-orange-300', icon: AlertTriangle },
    not_eligible: { label: 'Not Eligible for Public Universities', className: 'bg-destructive/10 text-destructive border-destructive/30', icon: XCircle },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={`${c.className} text-sm py-1 px-3 gap-1.5`}>
      <Icon className="w-4 h-4" /> {c.label}
    </Badge>
  );
}

export default function EligibilityChecker() {
  const [curriculum, setCurriculum] = useState('');
  const [data, setData] = useState<Record<string, any>>({});
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [preloaded, setPreloaded] = useState(false);

  // Pre-populate from profile if logged in
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: academics } = await supabase
        .from('student_academics')
        .select('curriculum, extras, target_level')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (academics?.curriculum) {
        setCurriculum(academics.curriculum);
        const extras = (academics.extras && typeof academics.extras === 'object' && !Array.isArray(academics.extras))
          ? academics.extras as Record<string, any>
          : {};
        setData({ curriculumDetails: extras });
        setPreloaded(true);
      }
    }
    loadProfile();
  }, []);

  const handleCheck = () => {
    if (!curriculum) return;
    const eligibility = checkEligibility(curriculum, data.curriculumDetails || {});
    setResult(eligibility);
  };

  const handleReset = () => {
    setCurriculum('');
    setData({});
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-3xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Eligibility Checker</h1>
          <p className="text-muted-foreground mt-2">
            Find out if you qualify for direct admission, Studienkolleg, or other pathways to study in Germany.
          </p>
        </div>

        {!result ? (
          <Card className="p-6 space-y-6">
            <div>
              <Label className="text-base font-semibold">What is your high school curriculum?</Label>
              <Select value={curriculum} onValueChange={v => { setCurriculum(v); setResult(null); }}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select your curriculum" />
                </SelectTrigger>
                <SelectContent>
                  {CURRICULUM_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {curriculum && (
              <>
                {preloaded && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-primary">
                    ✓ We've pre-filled your details from your profile. Review and update if needed.
                  </div>
                )}

                <CurriculumFields
                  curriculum={curriculum}
                  data={data}
                  onUpdate={d => setData(prev => ({ ...prev, ...d }))}
                />

                <Button onClick={handleCheck} size="lg" className="w-full">
                  Check My Eligibility <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Eligibility Result</h2>
                <StatusBadge status={result.status} />
              </div>

              {result.notes.length > 0 && (
                <div className="space-y-2 mb-4">
                  {result.notes.map((note, i) => (
                    <p key={i} className="text-sm text-foreground">{note}</p>
                  ))}
                </div>
              )}

              {result.missingRequirements.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-destructive mb-2">Missing Requirements</h3>
                  <ul className="space-y-1">
                    {result.missingRequirements.map((req, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendedActions.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-primary mb-2">Recommended Actions</h3>
                  <ul className="space-y-1">
                    {result.recommendedActions.map((action, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.sourceUrl && (
                <a
                  href={result.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View official requirements <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" /> Start Over
              </Button>
              <Button onClick={() => setResult(null)} className="flex-1">
                Edit Details
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This assessment is based on publicly available DAAD and uni-assist guidelines.
              For official confirmation, please contact the respective university or uni-assist directly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
