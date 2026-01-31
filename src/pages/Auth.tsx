import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Phone, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "@/components/Logo";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import { EmailInput } from "@/components/EmailInput";
import { DateOfBirthInput } from "@/components/DateOfBirthInput";
import { ParentGuardianInfo } from "@/components/ParentGuardianInfo";
import { validateEmailClient } from "@/lib/email-validation";
import { validateDOB, validateParentInfo, type DOBValidationResult, type ParentInfo } from "@/lib/dob-validation";
import { PasswordInput } from "@/components/PasswordInput";
import { validatePassword, type PasswordCheck } from "@/lib/password-validation";
import { RateLimitAlert } from "@/components/auth/RateLimitAlert";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [parentErrors, setParentErrors] = useState<string[]>([]);
  const [dobValidation, setDobValidation] = useState<DOBValidationResult | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<PasswordCheck | null>(null);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [rateLimitAttempts, setRateLimitAttempts] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("signin");
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    country_code: "+20",
  });
  const [parentInfo, setParentInfo] = useState<ParentInfo>({
    fullName: "",
    email: "",
    phone: "",
    countryCode: "+20",
  });
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize active tab from URL params
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Countdown timer for rate limit cooldown
  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

  // Calculate exponential backoff cooldown based on attempt count
  const calculateCooldown = useCallback((attempts: number): number => {
    // 60s for first attempt, 180s (3m) for second, 600s (10m) for third+
    if (attempts <= 1) return 60;
    if (attempts === 2) return 180;
    return 600; // Cap at 10 minutes
  }, []);

  // Helper to detect rate limit errors
  const isRateLimitError = (error: any): boolean => {
    const errorCode = error?.code || error?.error_code || '';
    const errorMessage = (error?.message || '').toLowerCase();
    
    return (
      errorCode === 'over_email_send_rate_limit' ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('email rate limit')
    );
  };

  // Phone validation function
  const validatePhoneNumber = (phone: string, countryCode: string): string => {
    if (!phone.trim()) return "Phone number is required";
    
    // Remove any non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Country-specific validation rules
    const validationRules: { [key: string]: { length: number; name: string } } = {
      "+20": { length: 10, name: "Egypt" }, // Egypt: 10 digits
      "+971": { length: 9, name: "UAE" }, // UAE: 9 digits
      "+966": { length: 9, name: "Saudi Arabia" }, // Saudi Arabia: 9 digits
      "+1": { length: 10, name: "US/Canada" }, // US/Canada: 10 digits
      "+44": { length: 10, name: "UK" }, // UK: 10 digits
      "+49": { length: 11, name: "Germany" }, // Germany: 11 digits
      "+33": { length: 10, name: "France" }, // France: 10 digits
      "+39": { length: 10, name: "Italy" }, // Italy: 10 digits
      "+34": { length: 9, name: "Spain" }, // Spain: 9 digits
      "+91": { length: 10, name: "India" }, // India: 10 digits
      "+86": { length: 11, name: "China" }, // China: 11 digits
      "+81": { length: 11, name: "Japan" }, // Japan: 11 digits
    };

    const rule = validationRules[countryCode];
    if (rule) {
      if (cleanPhone.length !== rule.length) {
        return `Phone number for ${rule.name} must be exactly ${rule.length} digits`;
      }
    } else {
      // For countries without specific rules, allow 7-15 digits
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        return "Phone number must be between 7 and 15 digits";
      }
    }
    
    return "";
  };

  // Handle phone input change with validation
  const handlePhoneChange = (phone: string) => {
    setSignUpData({ ...signUpData, phone });
    const error = validatePhoneNumber(phone, signUpData.country_code);
    setPhoneError(error);
  };

  // Handle country code change and revalidate phone
  const handleCountryCodeChange = (countryCode: string) => {
    setSignUpData({ ...signUpData, country_code: countryCode });
    if (signUpData.phone) {
      const error = validatePhoneNumber(signUpData.phone, countryCode);
      setPhoneError(error);
    }
  };

  // Handle DOB validation change
  const handleDOBValidationChange = (validation: DOBValidationResult) => {
    setDobValidation(validation);
    setParentErrors([]); // Clear parent errors when DOB changes
  };

  // Handle password validation change
  const handlePasswordValidationChange = (validation: PasswordCheck) => {
    setPasswordValidation(validation);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate email using new validation system
    const emailValidation = validateEmailClient(signUpData.email);
    if (!emailValidation.valid) {
      toast({
        title: "Invalid Email",
        description: emailValidation.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validate phone number
    const phoneValidationError = validatePhoneNumber(signUpData.phone, signUpData.country_code);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      toast({
        title: "Invalid Phone Number",
        description: phoneValidationError,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validate date of birth
    const dobValidationResult = validateDOB(signUpData.date_of_birth);
    if (!dobValidationResult.valid) {
      toast({
        title: "Invalid Date of Birth",
        description: dobValidationResult.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // If user is underage, validate parent information
    if (dobValidationResult.isUnderage) {
      const parentValidation = validateParentInfo(
        parentInfo,
        validatePhoneNumber,
        validateEmailClient
      );
      
      if (!parentValidation.valid) {
        setParentErrors(parentValidation.errors);
        toast({
          title: "Parent Information Required",
          description: "Since you're under 18, please provide your parent's complete contact information.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    // Validate password
    const finalPasswordValidation = validatePassword(signUpData.password, {
      name: signUpData.full_name,
      email: signUpData.email,
      dob: signUpData.date_of_birth
    }, signUpData.confirmPassword);
    
    if (!finalPasswordValidation.valid) {
      toast({
        title: "Invalid Password",
        description: finalPasswordValidation.errors[0],
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!signUpData.gender) {
      toast({
        title: "Missing Information",
        description: "Please select your gender.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const signUpOptions: any = {
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signUpData.full_name,
            gender: signUpData.gender,
            date_of_birth: signUpData.date_of_birth,
            phone: signUpData.phone,
            country_code: signUpData.country_code,
          },
        },
      };

      // Add parent information if user is underage
      if (dobValidationResult.isUnderage) {
        signUpOptions.options.data.parent_full_name = parentInfo.fullName;
        signUpOptions.options.data.parent_email = parentInfo.email;
        signUpOptions.options.data.parent_phone = parentInfo.phone;
        signUpOptions.options.data.parent_country_code = parentInfo.countryCode;
        signUpOptions.options.data.is_underage = true;
        signUpOptions.options.data.age_at_signup = dobValidationResult.age;
      }

      const { error } = await supabase.auth.signUp(signUpOptions);

      if (error) throw error;

      // Sync new user to HubSpot via Zapier (non-blocking)
      supabase.functions.invoke('sync-hubspot-lead', {
        body: {
          email: signUpData.email,
          full_name: signUpData.full_name,
          phone: signUpData.phone,
          gender: signUpData.gender,
          date_of_birth: signUpData.date_of_birth,
          country_code: signUpData.country_code,
          is_underage: dobValidationResult.isUnderage,
          parent_email: dobValidationResult.isUnderage ? parentInfo.email : undefined,
        }
      }).then((result) => {
        if (result.error) {
          console.error('HubSpot sync failed:', result.error);
        } else {
          console.log('HubSpot sync completed:', result.data);
        }
      }).catch((err) => {
        console.error('HubSpot sync error:', err);
      });

      toast({
        title: "Success!",
        description: dobValidationResult.isUnderage 
          ? "Account created! We've also sent a confirmation to your parent's email."
          : "Please check your email to confirm your account.",
      });
    } catch (error: any) {
      if (isRateLimitError(error)) {
        const newAttemptCount = rateLimitAttempts + 1;
        setRateLimitAttempts(newAttemptCount);
        const cooldownTime = calculateCooldown(newAttemptCount);
        setRateLimitCooldown(cooldownTime);
        toast({
          title: "Email limit reached",
          description: `Please wait ${cooldownTime >= 60 ? Math.floor(cooldownTime / 60) + ' minute(s)' : cooldownTime + ' seconds'} before trying again. Your form data is saved.`,
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Logo variant="white" showText={false} />
          </div>
          <p className="text-white/80">
            Your way to Germany
          </p>
        </div>

        <Card className="shadow-strong backdrop-blur-sm bg-white/95">
          <CardHeader className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="absolute left-4 top-4 h-10 w-10 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200 transition-all duration-200"
              aria-label="Go back to home page"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <CardTitle className="text-center text-2xl">
              Get Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <EmailInput
                    id="signin-email"
                    value={signInData.email}
                    onChange={(email) => setSignInData({ ...signInData, email })}
                    placeholder="Enter your email"
                    required
                  />
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={signInData.password}
                        onChange={(e) =>
                          setSignInData({ ...signInData, password: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                {rateLimitCooldown > 0 && (
                  <RateLimitAlert 
                    cooldownSeconds={rateLimitCooldown}
                    attemptCount={rateLimitAttempts}
                    onSignInClick={() => setActiveTab("signin")}
                  />
                )}
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-10"
                        value={signUpData.full_name}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, full_name: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-gender">Gender</Label>
                    <Select 
                      value={signUpData.gender} 
                      onValueChange={(value) => setSignUpData({ ...signUpData, gender: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DateOfBirthInput
                    id="signup-dob"
                    value={signUpData.date_of_birth}
                    onChange={(date) => setSignUpData({ ...signUpData, date_of_birth: date })}
                    onValidationChange={handleDOBValidationChange}
                    required
                  />

                  {/* Parent/Guardian Information - Show only if underage */}
                  {dobValidation?.isUnderage && (
                    <ParentGuardianInfo
                      parentInfo={parentInfo}
                      onChange={setParentInfo}
                      errors={parentErrors}
                    />
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <div className="flex space-x-2">
                      <CountryCodeSelect
                        value={signUpData.country_code}
                        onValueChange={handleCountryCodeChange}
                        className="w-36"
                      />
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="Enter phone number"
                          className={`pl-10 ${phoneError ? "border-destructive" : ""}`}
                          value={signUpData.phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    {phoneError && (
                      <p className="text-sm text-destructive mt-1">{phoneError}</p>
                    )}
                  </div>
                  
                  <EmailInput
                    id="signup-email"
                    value={signUpData.email}
                    onChange={(email) => setSignUpData({ ...signUpData, email })}
                    placeholder="Enter your email"
                    required
                  />
                  
                  <PasswordInput
                    id="signup-password"
                    label="Password"
                    placeholder="Create a secure password"
                    value={signUpData.password}
                    onChange={(password) => setSignUpData({ ...signUpData, password })}
                    personalInfo={{
                      name: signUpData.full_name,
                      email: signUpData.email,
                      dob: signUpData.date_of_birth
                    }}
                    onValidationChange={handlePasswordValidationChange}
                    showConfirmation={true}
                    confirmValue={signUpData.confirmPassword}
                    onConfirmChange={(confirmPassword) => setSignUpData({ ...signUpData, confirmPassword })}
                    required
                  />
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={loading || rateLimitCooldown > 0}
                  >
                    {loading 
                      ? "Creating Account..." 
                      : rateLimitCooldown > 0 
                        ? `Try again in ${rateLimitCooldown}s` 
                        : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;