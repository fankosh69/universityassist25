import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, ArrowLeft, FileText, Globe, GraduationCap, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/SEOHead";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

type Step = 1 | 2 | 3 | 4;
type EligibilityStatus = "direct_admission" | "studienkolleg_required" | "not_eligible" | "conditional";

interface EligibilityFormData {
  countryCode: string;
  countryName: string;
  targetDegreeLevel: "bachelor" | "master";
  educationSystem: string;
  highestEducation: string;
  gradesData: {
    gpa?: number;
    percentage?: number;
    grade?: string;
  };
  languageCertificates: {
    german?: string;
    english?: string;
  };
  hasAPSCertificate: boolean;
  universityYearsCompleted?: number;
}

export default function AdmissionsNavigator() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<EligibilityFormData>({
    countryCode: "",
    countryName: "",
    targetDegreeLevel: "bachelor",
    educationSystem: "other",
    highestEducation: "",
    gradesData: {},
    languageCertificates: {},
    hasAPSCertificate: false,
  });
  const [eligibilityResult, setEligibilityResult] = useState<{
    status: EligibilityStatus;
    missingRequirements: string[];
    recommendedActions: string[];
    requiredDocuments: string[];
  } | null>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: countries } = useQuery({
    queryKey: ["countries-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admission_requirements_by_country")
        .select("country_code, country_name")
        .order("country_name");
      
      if (error) throw error;
      
      // Get unique countries
      const uniqueCountries = Array.from(
        new Map(data.map(item => [item.country_code, item])).values()
      );
      
      return uniqueCountries;
    },
  });

  const { data: requirements } = useQuery({
    queryKey: ["requirements", formData.countryCode, formData.targetDegreeLevel],
    queryFn: async () => {
      if (!formData.countryCode || !formData.targetDegreeLevel) return null;
      
      const { data, error } = await supabase
        .from("admission_requirements_by_country")
        .select("*")
        .eq("country_code", formData.countryCode)
        .eq("degree_level", formData.targetDegreeLevel)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.countryCode && !!formData.targetDegreeLevel,
  });

  const saveEligibilityCheck = useMutation({
    mutationFn: async (checkData: any) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("eligibility_checks")
        .insert({
          profile_id: user.id,
          ...checkData,
        });
      
      if (error) throw error;
    },
  });

  const calculateEligibility = () => {
    if (!requirements) {
      toast({
        title: "Requirements not found",
        description: "We don't have specific requirements for your country yet. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    const missing: string[] = [];
    const actions: string[] = [];
    let status: EligibilityStatus = "not_eligible";

    // Check language requirements
    const hasGermanCert = formData.languageCertificates.german;
    const hasEnglishCert = formData.languageCertificates.english;
    
    if (!hasGermanCert && !hasEnglishCert) {
      missing.push(`German language certificate (minimum ${requirements.min_german_level || 'B2'})`);
      actions.push("Obtain German language certificate (TestDaF, DSH, or Goethe-Zertifikat)");
    }

    // Check APS certificate for specific countries
    if (requirements.aps_certificate_required && !formData.hasAPSCertificate) {
      missing.push("APS Certificate (Academic Evaluation Centre)");
      actions.push("Apply for APS certificate from the Academic Evaluation Centre");
    }

    // Check direct admission criteria
    const directCriteria = requirements.direct_admission_criteria as any;
    const studienkollegCriteria = requirements.studienkolleg_criteria as any;

    // Country-specific checks
    if (formData.countryCode === "EG") {
      const score = formData.gradesData.percentage || 0;
      if (score >= (directCriteria.min_thanawiya_score || 75)) {
        status = missing.length === 0 ? "direct_admission" : "conditional";
      } else if (score >= (studienkollegCriteria.min_thanawiya_score || 65)) {
        status = "studienkolleg_required";
        actions.push("Complete Studienkolleg (preparatory course) before applying to degree programs");
      }
    } else if (formData.countryCode === "IN") {
      const percentage = formData.gradesData.percentage || 0;
      const yearsCompleted = formData.universityYearsCompleted || 0;
      
      if (percentage >= (directCriteria.min_percentage || 75) && yearsCompleted >= 1) {
        status = missing.length === 0 ? "direct_admission" : "conditional";
      } else if (percentage >= (studienkollegCriteria.min_percentage || 65)) {
        status = "studienkolleg_required";
        actions.push("Complete Studienkolleg or 1 year of university study in India");
      }
    } else if (formData.countryCode === "US") {
      const gpa = formData.gradesData.gpa || 0;
      if (gpa >= (directCriteria.min_gpa || 3.0)) {
        status = missing.length === 0 ? "direct_admission" : "conditional";
      } else if (gpa >= (studienkollegCriteria.min_gpa || 2.5)) {
        status = "studienkolleg_required";
      }
    } else if (formData.countryCode === "GB") {
      status = missing.length === 0 ? "direct_admission" : "conditional";
    } else if (formData.countryCode === "CN") {
      const percentage = formData.gradesData.percentage || 0;
      if (percentage >= (directCriteria.min_gaokao_percentage || 70)) {
        status = missing.length === 0 ? "direct_admission" : "conditional";
      } else if (percentage >= (studienkollegCriteria.min_gaokao_percentage || 60)) {
        status = "studienkolleg_required";
      }
    }

    // Add general actions based on status
    if (status === "direct_admission" || status === "conditional") {
      actions.unshift("Start searching for suitable Bachelor's programs");
      actions.push("Prepare all required documents and certified translations");
      actions.push("Check specific program requirements on university websites");
    }

    setEligibilityResult({
      status,
      missingRequirements: missing,
      recommendedActions: actions,
      requiredDocuments: requirements.required_documents || [],
    });

    // Save the check if user is logged in
    if (user) {
      saveEligibilityCheck.mutate({
        country_of_origin: formData.countryCode,
        education_system: formData.educationSystem,
        highest_education_level: formData.highestEducation,
        target_degree_level: formData.targetDegreeLevel,
        grades_data: formData.gradesData,
        language_certificates: formData.languageCertificates,
        has_aps_certificate: formData.hasAPSCertificate,
        eligibility_status: status,
        missing_requirements: missing,
        recommended_actions: actions,
      });
    }

    setCurrentStep(4);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const getStepProgress = () => {
    return (currentStep / 4) * 100;
  };

  return (
    <>
      <SEOHead
        title="Admissions Navigator - Check Your Eligibility | University Assist"
        description="Check your eligibility for German university programs based on DAAD and Uni-Assist requirements. Get personalized guidance on admission requirements and next steps."
        keywords="admissions navigator, eligibility checker, German university requirements, study abroad eligibility, DAAD, uni-assist"
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
                Check your eligibility based on official DAAD and Uni-Assist requirements
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  150+ Countries
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Official Requirements
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Step {currentStep} of 4</span>
                <span className="text-sm text-muted-foreground">{Math.round(getStepProgress())}% Complete</span>
              </div>
              <Progress value={getStepProgress()} />
            </div>

            {/* Main Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>
                  {currentStep === 1 && "Your Educational Background"}
                  {currentStep === 2 && "Academic Performance"}
                  {currentStep === 3 && "Language & Additional Requirements"}
                  {currentStep === 4 && "Your Eligibility Results"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && "Tell us about your country and education system"}
                  {currentStep === 2 && "Share your grades and academic achievements"}
                  {currentStep === 3 && "Language certificates and other requirements"}
                  {currentStep === 4 && "Here's your personalized eligibility assessment"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Country & Education System */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country of Origin *</Label>
                      <Select 
                        value={formData.countryCode}
                        onValueChange={(value) => {
                          const country = countries?.find(c => c.country_code === value);
                          setFormData({
                            ...formData,
                            countryCode: value,
                            countryName: country?.country_name || "",
                          });
                        }}
                      >
                        <SelectTrigger id="country">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries?.map((country) => (
                            <SelectItem key={country.country_code} value={country.country_code}>
                              {country.country_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="degreeLevel">Target Degree Level *</Label>
                      <Select
                        value={formData.targetDegreeLevel}
                        onValueChange={(value: "bachelor" | "master") =>
                          setFormData({ ...formData, targetDegreeLevel: value })
                        }
                      >
                        <SelectTrigger id="degreeLevel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                          <SelectItem value="master">Master's Degree</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="education">Highest Education Level *</Label>
                      <Input
                        id="education"
                        value={formData.highestEducation}
                        onChange={(e) =>
                          setFormData({ ...formData, highestEducation: e.target.value })
                        }
                        placeholder="e.g., High School Diploma, Bachelor's Degree"
                      />
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>About this Assessment</AlertTitle>
                      <AlertDescription>
                        This eligibility check is based on official DAAD and Uni-Assist requirements. 
                        Results are advisory - final admission decisions are made by individual universities.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Step 2: Academic Performance */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    {requirements?.additional_notes && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Country-Specific Information</AlertTitle>
                        <AlertDescription>{requirements.additional_notes}</AlertDescription>
                      </Alert>
                    )}

                    {formData.countryCode === "US" && (
                      <div className="space-y-2">
                        <Label htmlFor="gpa">GPA (4.0 scale) *</Label>
                        <Input
                          id="gpa"
                          type="number"
                          step="0.01"
                          max="4.0"
                          value={formData.gradesData.gpa || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gradesData: { ...formData.gradesData, gpa: parseFloat(e.target.value) },
                            })
                          }
                          placeholder="e.g., 3.5"
                        />
                      </div>
                    )}

                    {(formData.countryCode === "IN" || formData.countryCode === "EG" || formData.countryCode === "CN") && (
                      <div className="space-y-2">
                        <Label htmlFor="percentage">Overall Percentage/Score *</Label>
                        <Input
                          id="percentage"
                          type="number"
                          max="100"
                          value={formData.gradesData.percentage || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gradesData: { ...formData.gradesData, percentage: parseFloat(e.target.value) },
                            })
                          }
                          placeholder="e.g., 85"
                        />
                      </div>
                    )}

                    {formData.countryCode === "GB" && (
                      <div className="space-y-2">
                        <Label htmlFor="grade">A-Level Grades *</Label>
                        <Input
                          id="grade"
                          value={formData.gradesData.grade || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gradesData: { ...formData.gradesData, grade: e.target.value },
                            })
                          }
                          placeholder="e.g., AAB, ABC"
                        />
                      </div>
                    )}

                    {formData.countryCode === "IN" && formData.targetDegreeLevel === "bachelor" && (
                      <div className="space-y-2">
                        <Label htmlFor="universityYears">University Years Completed</Label>
                        <Input
                          id="universityYears"
                          type="number"
                          min="0"
                          max="4"
                          value={formData.universityYearsCompleted || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              universityYearsCompleted: parseInt(e.target.value),
                            })
                          }
                          placeholder="Number of years"
                        />
                        <p className="text-xs text-muted-foreground">
                          Indian students typically need 1 year of university for direct admission
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Language & Additional Requirements */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Languages className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Language Certificates</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="german">German Language Certificate</Label>
                        <Select
                          value={formData.languageCertificates.german}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              languageCertificates: { ...formData.languageCertificates, german: value },
                            })
                          }
                        >
                          <SelectTrigger id="german">
                            <SelectValue placeholder="Select certificate level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="A1">A1</SelectItem>
                            <SelectItem value="A2">A2</SelectItem>
                            <SelectItem value="B1">B1</SelectItem>
                            <SelectItem value="B2">B2</SelectItem>
                            <SelectItem value="C1">C1 (Goethe-Zertifikat/TestDaF/DSH)</SelectItem>
                            <SelectItem value="C2">C2</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Minimum required: {requirements?.min_german_level || "B2"}
                        </p>
                      </div>

                      {requirements?.accepts_english && (
                        <div className="space-y-2">
                          <Label htmlFor="english">English Language Certificate (Alternative)</Label>
                          <Select
                            value={formData.languageCertificates.english}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                languageCertificates: { ...formData.languageCertificates, english: value },
                              })
                            }
                          >
                            <SelectTrigger id="english">
                              <SelectValue placeholder="Select certificate" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="IELTS 6.0">IELTS 6.0</SelectItem>
                              <SelectItem value="IELTS 6.5">IELTS 6.5</SelectItem>
                              <SelectItem value="IELTS 7.0">IELTS 7.0+</SelectItem>
                              <SelectItem value="TOEFL 80">TOEFL 80</SelectItem>
                              <SelectItem value="TOEFL 90">TOEFL 90+</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            For English-taught programs
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {requirements?.aps_certificate_required && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="aps"
                          checked={formData.hasAPSCertificate}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, hasAPSCertificate: checked as boolean })
                          }
                        />
                        <Label htmlFor="aps" className="text-sm font-normal">
                          I have an APS Certificate (Academic Evaluation Centre)
                        </Label>
                      </div>
                    )}

                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertTitle>Required Documents</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {requirements?.required_documents?.map((doc, index) => (
                            <li key={index} className="text-sm">{doc}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Step 4: Results */}
                {currentStep === 4 && eligibilityResult && (
                  <div className="space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center justify-center gap-3 p-6 bg-muted/50 rounded-lg">
                      {eligibilityResult.status === "direct_admission" && (
                        <>
                          <CheckCircle2 className="h-12 w-12 text-green-500" />
                          <div>
                            <Badge className="text-lg py-2 px-4 bg-green-500 mb-2">
                              Eligible for Direct Admission
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              You meet the requirements for direct application to German universities!
                            </p>
                          </div>
                        </>
                      )}
                      {eligibilityResult.status === "conditional" && (
                        <>
                          <AlertCircle className="h-12 w-12 text-blue-500" />
                          <div>
                            <Badge className="text-lg py-2 px-4 bg-blue-500 mb-2">
                              Conditionally Eligible
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              You're almost there! Complete the missing requirements below.
                            </p>
                          </div>
                        </>
                      )}
                      {eligibilityResult.status === "studienkolleg_required" && (
                        <>
                          <AlertCircle className="h-12 w-12 text-yellow-500" />
                          <div>
                            <Badge className="text-lg py-2 px-4 bg-yellow-500 mb-2">
                              Studienkolleg Required
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              You need to complete a preparatory course (Studienkolleg) first.
                            </p>
                          </div>
                        </>
                      )}
                      {eligibilityResult.status === "not_eligible" && (
                        <>
                          <XCircle className="h-12 w-12 text-red-500" />
                          <div>
                            <Badge className="text-lg py-2 px-4 bg-red-500 mb-2">
                              Additional Requirements Needed
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              You need to fulfill additional requirements before applying.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Missing Requirements */}
                    {eligibilityResult.missingRequirements.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                          Missing Requirements
                        </h3>
                        <ul className="space-y-2">
                          {eligibilityResult.missingRequirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                              <span className="text-sm">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    <div className="bg-primary/5 rounded-lg p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Recommended Next Steps
                      </h3>
                      <ol className="space-y-3 list-decimal list-inside">
                        {eligibilityResult.recommendedActions.map((action, index) => (
                          <li key={index} className="text-sm">{action}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Required Documents */}
                    <div className="border rounded-lg p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Required Documents for Application
                      </h3>
                      <ul className="space-y-2">
                        {eligibilityResult.requiredDocuments.map((doc, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                            <span className="text-sm">{doc}</span>
                          </li>
                        ))}
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <span className="text-sm">Certified translations (if not in German/English)</span>
                        </li>
                      </ul>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-4">
                      <Button className="flex-1" asChild>
                        <a href="/search">Search Programs</a>
                      </Button>
                      {!user && (
                        <Button variant="outline" className="flex-1" asChild>
                          <a href="/auth?tab=signup">Create Account</a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                {currentStep < 4 && (
                  <div className="flex gap-4 pt-4">
                    {currentStep > 1 && (
                      <Button variant="outline" onClick={prevStep}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                    )}
                    {currentStep < 3 && (
                      <Button 
                        onClick={nextStep} 
                        className="ml-auto"
                        disabled={
                          (currentStep === 1 && (!formData.countryCode || !formData.highestEducation)) ||
                          (currentStep === 2 && Object.keys(formData.gradesData).length === 0)
                        }
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    {currentStep === 3 && (
                      <Button onClick={calculateEligibility} className="ml-auto">
                        Check Eligibility
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Information Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About DAAD</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The German Academic Exchange Service (DAAD) is the world's largest funding organization 
                    supporting international academic exchange. Our requirements are based on their official guidelines.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About Uni-Assist</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Uni-assist e.V. is the central point of contact for applicants with international 
                    educational certificates. They pre-check applications for over 180 German universities.
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
