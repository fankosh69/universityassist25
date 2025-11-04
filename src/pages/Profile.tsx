import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, GraduationCap, Target, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserProfile, secureUpdateProfile } from "@/lib/secure-profile-api";
import { GermanGPAConverter } from "@/components/GermanGPAConverter";
import { LanguageCertificatesManager } from "@/components/profile/LanguageCertificatesManager";
import type { LanguageCertificate } from "@/types/language-requirements";

interface ProfileData {
  full_name: string;
  email: string;
  phone?: string;
  nationality?: string;
  current_education_level: string;
  current_institution?: string;
  gpa_raw?: number;
  gpa_scale_max?: number;
  gpa_min_pass?: number;
  current_field_of_study?: string;
  credits_taken?: number;
  thesis_topic?: string;
  language_certificates: LanguageCertificate[];
  preferred_fields: string[];
  preferred_degree_type: string;
  preferred_cities: string[];
  career_goals?: string;
}

import Navigation from "@/components/Navigation";

const Profile = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    email: "",
    current_education_level: "",
    language_certificates: [],
    preferred_fields: [],
    preferred_degree_type: "",
    preferred_cities: [],
  });
  const [loading, setLoading] = useState(false);
  const [newPreferredField, setNewPreferredField] = useState("");
  const [newPreferredCity, setNewPreferredCity] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile data
      const profile = await getCurrentUserProfile();
      
      // Fetch academic data from student_academics table
      const { data: academicData } = await supabase
        .from('student_academics')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (profile) {
        setProfileData({
          full_name: profile.full_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          nationality: profile.nationality || "",
          current_education_level: profile.current_education_level || "",
          current_institution: profile.current_institution || "",
          gpa_raw: academicData?.gpa_raw || undefined,
          gpa_scale_max: academicData?.gpa_scale_max || undefined,
          gpa_min_pass: academicData?.gpa_min_pass || undefined,
          current_field_of_study: profile.current_field_of_study || "",
          credits_taken: profile.credits_taken || 0,
          thesis_topic: profile.thesis_topic || "",
          language_certificates: [],
          preferred_fields: profile.preferred_fields || [],
          preferred_degree_type: profile.preferred_degree_type || "",
          preferred_cities: profile.preferred_cities || [],
          career_goals: profile.career_goals || "",
        });
      } else {
        setProfileData(prev => ({ ...prev, email: user.email || "" }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Separate profile data and academic data
      const { gpa_raw, gpa_scale_max, gpa_min_pass, ...profileOnlyData } = profileData;

      // Update profile data
      const result = await secureUpdateProfile(user.id, profileOnlyData);
      
      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update profile');
      }

      // Update academic data using RPC
      if (gpa_raw || gpa_scale_max || gpa_min_pass) {
        const { error: academicError } = await supabase.rpc('secure_update_academic_data', {
          target_profile_id: user.id,
          update_data: {
            gpa_raw,
            gpa_scale_max,
            gpa_min_pass,
          }
        });

        if (academicError) {
          console.error('Error updating academic data:', academicError);
          toast({
            title: "Warning",
            description: "Profile saved but GPA data may not have been updated.",
            variant: "destructive",
          });
        }
      }

      // Generate matches after profile update
      try {
        const { matchingService } = await import("@/lib/matching-service");
        await matchingService.generateMatches(user.id);
      } catch (matchError) {
        console.error('Error generating matches:', matchError);
      }

      toast({
        title: "Success!",
        description: "Your profile has been saved and program matches updated!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const addPreferredField = () => {
    if (newPreferredField && !profileData.preferred_fields.includes(newPreferredField)) {
      setProfileData(prev => ({
        ...prev,
        preferred_fields: [...prev.preferred_fields, newPreferredField]
      }));
      setNewPreferredField("");
    }
  };

  const removePreferredField = (field: string) => {
    setProfileData(prev => ({
      ...prev,
      preferred_fields: prev.preferred_fields.filter(f => f !== field)
    }));
  };

  const addPreferredCity = () => {
    if (newPreferredCity && !profileData.preferred_cities.includes(newPreferredCity)) {
      setProfileData(prev => ({
        ...prev,
        preferred_cities: [...prev.preferred_cities, newPreferredCity]
      }));
      setNewPreferredCity("");
    }
  };

  const removePreferredCity = (city: string) => {
    setProfileData(prev => ({
      ...prev,
      preferred_cities: prev.preferred_cities.filter(c => c !== city)
    }));
  };

  const calculateProgress = () => {
    const requiredFields = [
      'full_name', 'email', 'nationality', 'current_education_level', 
      'current_institution', 'preferred_degree_type'
    ];
    const filledFields = requiredFields.filter(field => 
      profileData[field as keyof ProfileData] && 
      String(profileData[field as keyof ProfileData]).trim() !== ""
    ).length;
    
    // Check if GPA data is filled
    const gpaFilled = profileData.gpa_raw && profileData.gpa_scale_max && profileData.gpa_min_pass ? 1 : 0;
    
    const arrayFields = ['language_certificates', 'preferred_fields', 'preferred_cities'];
    const filledArrays = arrayFields.filter(field => 
      profileData[field as keyof ProfileData] && 
      (profileData[field as keyof ProfileData] as string[]).length > 0
    ).length;

    return ((filledFields + gpaFilled + filledArrays) / (requiredFields.length + 1 + arrayFields.length)) * 100;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Build your comprehensive academic profile to get the best program matches
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm text-muted-foreground">{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </div>

      <div className="space-y-8">
        {/* Personal Information */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality *</Label>
                <Input
                  id="nationality"
                  value={profileData.nationality || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, nationality: e.target.value }))}
                  placeholder="Enter your nationality"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Background */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="education_level">Current Education Level *</Label>
                <Select
                  value={profileData.current_education_level}
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, current_education_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                    <SelectItem value="master">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution">Current Institution *</Label>
                <Input
                  id="institution"
                  value={profileData.current_institution || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, current_institution: e.target.value }))}
                  placeholder="Name of your school/university"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa_raw">Your Grade/GPA *</Label>
                <Input
                  id="gpa_raw"
                  type="number"
                  step="0.01"
                  value={profileData.gpa_raw || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, gpa_raw: parseFloat(e.target.value) || undefined }))}
                  placeholder="e.g., 3.5 or 85"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa_scale_max">Maximum Grade *</Label>
                <Input
                  id="gpa_scale_max"
                  type="number"
                  step="0.01"
                  value={profileData.gpa_scale_max || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, gpa_scale_max: parseFloat(e.target.value) || undefined }))}
                  placeholder="e.g., 4.0 or 100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa_min_pass">Minimum Passing Grade *</Label>
                <Input
                  id="gpa_min_pass"
                  type="number"
                  step="0.01"
                  value={profileData.gpa_min_pass || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, gpa_min_pass: parseFloat(e.target.value) || undefined }))}
                  placeholder="e.g., 2.0 or 50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field_of_study">Field of Study</Label>
                <Input
                  id="field_of_study"
                  value={profileData.current_field_of_study || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, current_field_of_study: e.target.value }))}
                  placeholder="Your current field of study"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Credits Taken</Label>
                <Input
                  id="credits"
                  type="number"
                  value={profileData.credits_taken || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, credits_taken: parseInt(e.target.value) }))}
                  placeholder="Number of credits"
                />
              </div>
              {profileData.current_education_level === "master" && (
                <div className="space-y-2">
                  <Label htmlFor="thesis">Thesis Topic</Label>
                  <Input
                    id="thesis"
                    value={profileData.thesis_topic || ""}
                    onChange={(e) => setProfileData(prev => ({ ...prev, thesis_topic: e.target.value }))}
                    placeholder="Your thesis topic"
                  />
                </div>
              )}
            </div>

            {/* German GPA Calculator */}
            {profileData.gpa_raw && profileData.gpa_scale_max && profileData.gpa_min_pass && (
              <div className="mt-6">
                <GermanGPAConverter
                  defaultValues={{
                    gradeAchieved: profileData.gpa_raw,
                    maxGrade: profileData.gpa_scale_max,
                    minPassGrade: profileData.gpa_min_pass
                  }}
                />
              </div>
            )}

          </CardContent>
        </Card>

        {/* Language Certificates */}
        <LanguageCertificatesManager
          certificates={profileData.language_certificates || []}
          onChange={(certs) => setProfileData(prev => ({ ...prev, language_certificates: certs }))}
        />

        {/* Study Preferences */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Study Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="degree_type">Preferred Degree Type *</Label>
              <Select
                value={profileData.preferred_degree_type}
                onValueChange={(value) => setProfileData(prev => ({ ...prev, preferred_degree_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select degree type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bachelor">Bachelor's</SelectItem>
                  <SelectItem value="master">Master's</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Fields */}
            <div className="space-y-2">
              <Label>Fields of Interest</Label>
              <div className="flex gap-2">
                <Select value={newPreferredField} onValueChange={setNewPreferredField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field of study" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Medicine">Medicine</SelectItem>
                    <SelectItem value="Law">Law</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Economics">Economics</SelectItem>
                    <SelectItem value="Psychology">Psychology</SelectItem>
                    <SelectItem value="Architecture">Architecture</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addPreferredField} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profileData.preferred_fields.map((field, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {field}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removePreferredField(field)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Preferred Cities */}
            <div className="space-y-2">
              <Label>Preferred Cities</Label>
              <div className="flex gap-2">
                <Select value={newPreferredCity} onValueChange={setNewPreferredCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Berlin">Berlin</SelectItem>
                    <SelectItem value="Munich">Munich</SelectItem>
                    <SelectItem value="Hamburg">Hamburg</SelectItem>
                    <SelectItem value="Frankfurt">Frankfurt</SelectItem>
                    <SelectItem value="Stuttgart">Stuttgart</SelectItem>
                    <SelectItem value="Aachen">Aachen</SelectItem>
                    <SelectItem value="Dresden">Dresden</SelectItem>
                    <SelectItem value="Heidelberg">Heidelberg</SelectItem>
                    <SelectItem value="Cologne">Cologne</SelectItem>
                    <SelectItem value="Leipzig">Leipzig</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addPreferredCity} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profileData.preferred_cities.map((city, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {city}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removePreferredCity(city)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="career_goals">Career Goals</Label>
              <Textarea
                id="career_goals"
                value={profileData.career_goals || ""}
                onChange={(e) => setProfileData(prev => ({ ...prev, career_goals: e.target.value }))}
                placeholder="Describe your career goals and aspirations..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button variant="hero" onClick={handleSaveProfile} disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;