import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import { CurriculumFields } from "@/pages/onboarding/steps/CurriculumFields";
import { checkEligibility, type EligibilityResult } from "@/lib/curriculum-eligibility";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, AlertTriangle, XCircle, Info, ExternalLink, ArrowRight, RotateCcw, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const SESSION_KEY = "eligibility_checker_data";

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
  const navigate = useNavigate();
  const [curriculum, setCurriculum] = useState('');
  const [data, setData] = useState<Record<string, any>>({});
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [preloaded, setPreloaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Listen to auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // On mount: restore from session if user just signed in
  useEffect(() => {
    if (!authChecked || !user) return;

    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const { curriculum: savedCurriculum, data: savedData } = JSON.parse(saved);
        sessionStorage.removeItem(SESSION_KEY);
        setCurriculum(savedCurriculum);
        setData(savedData);
        // Auto-run check + save
        const eligibility = checkEligibility(savedCurriculum, savedData.curriculumDetails || {});
        setResult(eligibility);
        saveAndSync(user, savedCurriculum, savedData, eligibility);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
      return;
    }

    // Pre-populate from profile if logged in (no session data)
    loadProfile(user.id);
  }, [authChecked, user]);

  async function loadProfile(userId: string) {
    const { data: academics } = await supabase
      .from('student_academics')
      .select('curriculum, extras, target_level')
      .eq('profile_id', userId)
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

  async function saveAndSync(currentUser: User, cur: string, formData: Record<string, any>, eligibility: EligibilityResult) {
    setSaving(true);
    try {
      // 1. Upsert student_academics
      const extras = formData.curriculumDetails || {};
      await supabase.rpc('secure_update_academic_data', {
        target_profile_id: currentUser.id,
        update_data: {
          curriculum: cur,
          extras: JSON.stringify(extras),
        } as any,
      });

      // Also update extras via direct upsert since RPC may not handle JSONB extras
      await supabase
        .from('student_academics')
        .update({ extras })
        .eq('profile_id', currentUser.id);

      // 2. Sync to HubSpot
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profile?.email && profile?.full_name) {
        await supabase.functions.invoke('sync-hubspot-lead', {
          body: {
            sync_type: 'eligibility_check',
            platform_user_id: currentUser.id,
            email: profile.email,
            full_name: profile.full_name,
            curriculum: cur,
            eligibility_status: eligibility.status,
            curriculum_details: JSON.stringify(extras),
          },
        });
      }
    } catch (err) {
      console.error('Error saving eligibility data:', err);
    } finally {
      setSaving(false);
    }
  }

  const handleCheck = () => {
    if (!curriculum) return;

    const eligibility = checkEligibility(curriculum, data.curriculumDetails || {});

    if (!user) {
      // Guest: save to session and redirect to auth
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ curriculum, data }));
      navigate('/auth?returnTo=/eligibility-checker');
      return;
    }

    // Logged in: show result + save
    setResult(eligibility);
    saveAndSync(user, curriculum, data, eligibility);
  };

  const handleReset = () => {
    setCurriculum('');
    setData({});
    setResult(null);
    setPreloaded(false);
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
            {saving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving your results…
              </div>
            )}

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

            {/* CTAs */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" /> Start Over
              </Button>
              <Button onClick={() => navigate('/dashboard')} className="flex-1">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="flex justify-center">
              <Button variant="link" onClick={() => navigate('/search')} className="text-sm">
                Browse Programs
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
