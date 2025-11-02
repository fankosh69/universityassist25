import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { User, GraduationCap, ChevronDown, ChevronRight, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileData {
  full_name?: string;
  email?: string;
  nationality?: string;
  date_of_birth?: string;
  current_institution?: string;
  current_education_level?: string;
  current_field_of_study?: string;
}

interface AcademicData {
  curriculum?: string;
  prev_major?: string;
  gpa_raw?: number;
  gpa_scale_max?: number;
  gpa_min_pass?: number;
  gpa_de?: number;
  ects_total?: number;
  target_level?: string;
  language_certificates?: any;
}

export function ProfileDataDisplay({ userId }: { userId: string | null }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [academic, setAcademic] = useState<AcademicData | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = async () => {
    if (!userId) return;
    
    setIsRefreshing(true);
    try {
      // Load profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, nationality, date_of_birth, current_institution, current_education_level, current_field_of_study')
        .eq('id', userId)
        .single();
      
      if (profileData) setProfile(profileData);

      // Load academic data
      const { data: academicData } = await supabase
        .from('student_academics')
        .select('curriculum, prev_major, gpa_raw, gpa_scale_max, gpa_min_pass, gpa_de, ects_total, target_level, language_certificates')
        .eq('profile_id', userId)
        .single();
      
      if (academicData) setAcademic(academicData);
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  if (!userId) return null;

  const hasData = profile || academic;

  return (
    <Card className="p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between mb-2">
          <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary transition-colors">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <User className="h-4 w-4" />
            <span className="font-semibold text-sm">Your Saved Information</span>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={isRefreshing}
            className="h-7 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <CollapsibleContent className="space-y-3 pt-2">
          {!hasData && (
            <p className="text-xs text-muted-foreground">
              No information saved yet. The AI will help you fill this out.
            </p>
          )}

          {/* Personal Information */}
          {profile && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">Personal Details</span>
              </div>
              <div className="pl-5 space-y-1.5 text-xs">
                <DataItem label="Name" value={profile.full_name} />
                <DataItem label="Email" value={profile.email} />
                <DataItem label="Nationality" value={profile.nationality} />
                <DataItem label="Date of Birth" value={profile.date_of_birth} />
                <DataItem label="Current Institution" value={profile.current_institution} />
                <DataItem label="Education Level" value={profile.current_education_level} />
                <DataItem label="Field of Study" value={profile.current_field_of_study} />
              </div>
            </div>
          )}

          {/* Academic Information */}
          {academic && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">Academic Background</span>
              </div>
              <div className="pl-5 space-y-1.5 text-xs">
                <DataItem label="Curriculum" value={academic.curriculum} />
                <DataItem label="Previous Major" value={academic.prev_major} />
                {academic.gpa_raw && academic.gpa_scale_max && (
                  <DataItem 
                    label="GPA" 
                    value={`${academic.gpa_raw}/${academic.gpa_scale_max}`}
                    badge={academic.gpa_de ? `German: ${academic.gpa_de.toFixed(2)}` : undefined}
                  />
                )}
                <DataItem label="ECTS Credits" value={academic.ects_total?.toString()} />
                <DataItem label="Target Level" value={academic.target_level} />
                {academic.language_certificates && Array.isArray(academic.language_certificates) && academic.language_certificates.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground min-w-[80px]">Languages:</span>
                    <div className="flex flex-wrap gap-1">
                      {academic.language_certificates.map((cert: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] py-0">
                          {cert.language} {cert.level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-[10px] text-muted-foreground pt-2 border-t">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function DataItem({ label, value, badge }: { label: string; value?: string; badge?: string }) {
  if (!value) return null;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground min-w-[80px]">{label}:</span>
      <span className="font-medium">{value}</span>
      {badge && <Badge variant="outline" className="text-[10px] py-0">{badge}</Badge>}
      <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />
    </div>
  );
}
