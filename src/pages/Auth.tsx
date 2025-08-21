import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Phone, Calendar } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "@/components/Logo";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    full_name: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    country_code: "+20",
  });
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

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

  // Email validation function
  const validateEmailDomain = (email: string): string => {
    if (!email.trim()) return "";
    
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return "";
    
    // Common domain typos and their corrections
    const domainCorrections: { [key: string]: string } = {
      // Gmail typos
      "gamil.com": "gmail.com",
      "gmai.com": "gmail.com",
      "gmial.com": "gmail.com",
      "gmaill.com": "gmail.com",
      "gmail.co": "gmail.com",
      "gmai.co": "gmail.com",
      
      // Yahoo typos
      "yaho.com": "yahoo.com",
      "yahooo.com": "yahoo.com",
      "yahoo.co": "yahoo.com",
      "ymail.co": "ymail.com",
      
      // Hotmail/Outlook typos
      "hotmial.com": "hotmail.com",
      "hotmai.com": "hotmail.com",
      "hotmil.com": "hotmail.com",
      "hotmail.co": "hotmail.com",
      "outlok.com": "outlook.com",
      "outlook.co": "outlook.com",
      
      // Other common domains
      "aol.co": "aol.com",
      "msn.co": "msn.com",
      "live.co": "live.com",
      "icloud.co": "icloud.com",
      
      // Common TLD typos
      "gmail.cm": "gmail.com",
      "gmail.om": "gmail.com",
      "yahoo.cm": "yahoo.com",
      "yahoo.om": "yahoo.com",
      "hotmail.cm": "hotmail.com",
      "hotmail.om": "hotmail.com",
    };
    
    const correction = domainCorrections[domain];
    if (correction) {
      return `Did you mean ${email.split('@')[0]}@${correction}?`;
    }
    
    // Check for domains without proper TLD
    if (!domain.includes('.') || domain.endsWith('.')) {
      return "Please enter a valid email domain (e.g., example.com)";
    }
    
    // Check for domains with only one character after the dot
    const parts = domain.split('.');
    const tld = parts[parts.length - 1];
    if (tld.length < 2) {
      return "Please enter a valid email domain";
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

  // Handle email input change with validation
  const handleEmailChange = (email: string) => {
    setSignUpData({ ...signUpData, email });
    const error = validateEmailDomain(email);
    setEmailError(error);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate email domain
    const emailValidationError = validateEmailDomain(signUpData.email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      toast({
        title: "Invalid Email",
        description: emailValidationError,
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

    // Validate date of birth is in the past
    const selectedDate = new Date(signUpData.date_of_birth);
    const today = new Date();
    
    if (selectedDate >= today) {
      toast({
        title: "Invalid Date",
        description: "Date of birth must be in the past.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
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
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Please check your email to confirm your account.",
      });
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
          <h1 className="text-3xl font-bold text-white mb-2">
            University Assist
          </h1>
          <p className="text-white/80">
            Your way to Germany
          </p>
        </div>

        <Card className="shadow-strong backdrop-blur-sm bg-white/95">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Get Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={signInData.email}
                        onChange={(e) =>
                          setSignInData({ ...signInData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-dob">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-dob"
                        type="date"
                        className="pl-10"
                        value={signUpData.date_of_birth}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, date_of_birth: e.target.value })
                        }
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                  
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-10 ${emailError ? "border-destructive" : ""}`}
                        value={signUpData.email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        required
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive mt-1">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        className="pl-10"
                        value={signUpData.password}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, password: e.target.value })
                        }
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
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