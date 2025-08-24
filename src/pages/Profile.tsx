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

interface ProfileData {
  full_name: string;
  email: string;
  phone?: string;
  nationality?: string;
  current_education_level: string;
  current_institution?: string;
  current_gpa?: number;
  current_field_of_study?: string;
  credits_taken?: number;
  thesis_topic?: string;
  language_certificates: string[];
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
  const [newLanguageCert, setNewLanguageCert] = useState("");
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

      // Use secure profile API
      const profile = await getCurrentUserProfile();
      if (profile) {
        setProfileData({
          full_name: profile.full_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          nationality: profile.nationality || "",
          current_education_level: profile.current_education_level || "",
          current_institution: profile.current_institution || "",
          current_gpa: profile.current_gpa || 0,
          current_field_of_study: profile.current_field_of_study || "",
          credits_taken: profile.credits_taken || 0,
          thesis_topic: profile.thesis_topic || "",
          language_certificates: profile.language_certificates || [],
          preferred_fields: profile.preferred_fields || [],
          preferred_degree_type: profile.preferred_degree_type || "",
          preferred_cities: profile.preferred_cities || [],
          career_goals: profile.career_goals || "",
        });
      } else {
        // Initialize with user email
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

      // Use secure profile update API
      const result = await secureUpdateProfile(user.id, profileData);
      
      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to update profile');
      }

      toast({
        title: "Success",
        description: result.message,
      });

      // Generate matches after profile update
      try {
        const { matchingService } = await import("@/lib/matching-service");
        await matchingService.generateMatches(user.id);
      } catch (matchError) {
        console.error('Error generating matches:', matchError);
        // Don't fail the profile save if matching fails
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

  const addLanguageCertificate = () => {
    if (newLanguageCert && !profileData.language_certificates.includes(newLanguageCert)) {
      setProfileData(prev => ({
        ...prev,
        language_certificates: [...prev.language_certificates, newLanguageCert]
      }));
      setNewLanguageCert("");
    }
  };

  const removeLanguageCertificate = (cert: string) => {
    setProfileData(prev => ({
      ...prev,
      language_certificates: prev.language_certificates.filter(c => c !== cert)
    }));
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
      'current_institution', 'current_gpa', 'preferred_degree_type'
    ];
    const filledFields = requiredFields.filter(field => 
      profileData[field as keyof ProfileData] && 
      String(profileData[field as keyof ProfileData]).trim() !== ""
    ).length;
    
    const arrayFields = ['language_certificates', 'preferred_fields', 'preferred_cities'];
    const filledArrays = arrayFields.filter(field => 
      profileData[field as keyof ProfileData] && 
      (profileData[field as keyof ProfileData] as string[]).length > 0
    ).length;

    return ((filledFields + filledArrays) / (requiredFields.length + arrayFields.length)) * 100;
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
                <Label htmlFor="gpa">GPA *</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.1"
                  min="0"
                  max="4"
                  value={profileData.current_gpa || ""}
                  onChange={(e) => setProfileData(prev => ({ ...prev, current_gpa: parseFloat(e.target.value) }))}
                  placeholder="e.g., 3.5"
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

            {/* Language Certificates */}
            <div className="space-y-2">
              <Label>Language Certificates</Label>
              <div className="flex gap-2">
                <Input
                  value={newLanguageCert}
                  onChange={(e) => setNewLanguageCert(e.target.value)}
                  placeholder="e.g., IELTS 7.0, TOEFL 100, TestDaF TDN4"
                />
                <Button type="button" onClick={addLanguageCertificate} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profileData.language_certificates.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {cert}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeLanguageCertificate(cert)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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