import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/SEOHead";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

type EligibilityStatus = "eligible" | "foundation_required" | "not_eligible" | "checking";

export default function AdmissionsNavigator() {
  const { t } = useTranslation();
  const [eligibilityStatus, setEligibilityStatus] = useState<EligibilityStatus>("checking");
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: academicData } = useQuery({
    queryKey: ["academic-data"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("student_academics")
        .select("*")
        .eq("profile_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Calculate eligibility based on profile and academic data
  const checkEligibility = () => {
    if (!profile || !academicData) {
      setEligibilityStatus("checking");
      return;
    }

    const missing: string[] = [];

    // Check GPA
    if (!academicData.gpa_de || academicData.gpa_de < 2.5) {
      missing.push("Minimum GPA requirement (2.5 on German scale)");
    }

    // Check language certificates
    const hasLanguageCert = academicData.language_certificates && 
      Array.isArray(academicData.language_certificates) && 
      academicData.language_certificates.length > 0;
    
    if (!hasLanguageCert) {
      missing.push("German language certificate (TestDaF, DSH, or Goethe-Zertifikat C1)");
    }

    // Check ECTS
    if (!academicData.ects_total || academicData.ects_total < 180) {
      missing.push("Minimum 180 ECTS credits for Master's programs");
    }

    setMissingRequirements(missing);

    if (missing.length === 0) {
      setEligibilityStatus("eligible");
    } else if (missing.length <= 2) {
      setEligibilityStatus("foundation_required");
    } else {
      setEligibilityStatus("not_eligible");
    }
  };

  return (
    <>
      <SEOHead
        title="Admissions Navigator - Check Your Eligibility | University Assist"
        description="Check your eligibility for German university programs. Get personalized guidance on admission requirements and next steps."
        keywords="admissions navigator, eligibility checker, German university requirements, study abroad eligibility"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Admissions Requirements Navigator
              </h1>
              <p className="text-lg text-muted-foreground">
                Check your eligibility for German university programs and get personalized guidance
              </p>
            </div>

            {/* Eligibility Checker Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Eligibility Status</CardTitle>
                <CardDescription>
                  Based on your profile and academic background
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!profile || !academicData ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Complete Your Profile</AlertTitle>
                    <AlertDescription>
                      Please complete your profile and academic information to check your eligibility.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Button onClick={checkEligibility} className="w-full">
                      Check My Eligibility
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    {eligibilityStatus !== "checking" && (
                      <div className="space-y-4">
                        {/* Status Badge */}
                        <div className="flex items-center justify-center gap-3">
                          {eligibilityStatus === "eligible" && (
                            <>
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                              <Badge className="text-lg py-2 px-4 bg-green-500">
                                Eligible for Direct Admission
                              </Badge>
                            </>
                          )}
                          {eligibilityStatus === "foundation_required" && (
                            <>
                              <AlertCircle className="h-8 w-8 text-yellow-500" />
                              <Badge className="text-lg py-2 px-4 bg-yellow-500">
                                Foundation Course Required
                              </Badge>
                            </>
                          )}
                          {eligibilityStatus === "not_eligible" && (
                            <>
                              <XCircle className="h-8 w-8 text-red-500" />
                              <Badge className="text-lg py-2 px-4 bg-red-500">
                                Additional Requirements Needed
                              </Badge>
                            </>
                          )}
                        </div>

                        {/* Progress Indicator */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Profile Completion</span>
                            <span>{Math.round((1 - missingRequirements.length / 5) * 100)}%</span>
                          </div>
                          <Progress value={(1 - missingRequirements.length / 5) * 100} />
                        </div>

                        {/* Missing Requirements */}
                        {missingRequirements.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                              Missing Requirements:
                            </h3>
                            <ul className="space-y-2">
                              {missingRequirements.map((req, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <XCircle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                                  <span className="text-sm">{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Next Steps */}
                        <div className="bg-primary/5 rounded-lg p-6">
                          <h3 className="font-semibold mb-4">Recommended Next Steps:</h3>
                          <ol className="space-y-3 list-decimal list-inside">
                            {eligibilityStatus === "eligible" && (
                              <>
                                <li>Review and save programs that match your profile</li>
                                <li>Prepare required documents for application</li>
                                <li>Consider upgrading to Applicant access for guided application support</li>
                              </>
                            )}
                            {eligibilityStatus === "foundation_required" && (
                              <>
                                <li>Explore Studienkolleg (foundation) programs</li>
                                <li>Work on completing missing requirements</li>
                                <li>Prepare language certificates if needed</li>
                              </>
                            )}
                            {eligibilityStatus === "not_eligible" && (
                              <>
                                <li>Complete your academic qualifications</li>
                                <li>Obtain required language certificates</li>
                                <li>Consider preparatory courses or alternative pathways</li>
                              </>
                            )}
                          </ol>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Information Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Direct Admission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    If you meet all requirements, you can apply directly to degree programs. 
                    This typically requires recognized academic credentials, sufficient language 
                    proficiency, and meeting program-specific requirements.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Foundation Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Studienkolleg programs prepare international students for German university 
                    studies. They typically last 1 year and focus on language skills and 
                    subject-specific preparation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
