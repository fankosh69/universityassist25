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

const Auth = () => {
  const [loading, setLoading] = useState(false);
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
                      <Select 
                        value={signUpData.country_code} 
                        onValueChange={(value) => setSignUpData({ ...signUpData, country_code: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Priority countries */}
                          <SelectItem value="+20">🇪🇬 +20</SelectItem>
                          <SelectItem value="+971">🇦🇪 +971</SelectItem>
                          <SelectItem value="+966">🇸🇦 +966</SelectItem>
                          {/* Other countries */}
                          <SelectItem value="+93">🇦🇫 +93</SelectItem>
                          <SelectItem value="+355">🇦🇱 +355</SelectItem>
                          <SelectItem value="+213">🇩🇿 +213</SelectItem>
                          <SelectItem value="+1684">🇦🇸 +1684</SelectItem>
                          <SelectItem value="+376">🇦🇩 +376</SelectItem>
                          <SelectItem value="+244">🇦🇴 +244</SelectItem>
                          <SelectItem value="+1264">🇦🇮 +1264</SelectItem>
                          <SelectItem value="+672">🇦🇶 +672</SelectItem>
                          <SelectItem value="+1268">🇦🇬 +1268</SelectItem>
                          <SelectItem value="+54">🇦🇷 +54</SelectItem>
                          <SelectItem value="+374">🇦🇲 +374</SelectItem>
                          <SelectItem value="+297">🇦🇼 +297</SelectItem>
                          <SelectItem value="+61">🇦🇺 +61</SelectItem>
                          <SelectItem value="+43">🇦🇹 +43</SelectItem>
                          <SelectItem value="+994">🇦🇿 +994</SelectItem>
                          <SelectItem value="+1242">🇧🇸 +1242</SelectItem>
                          <SelectItem value="+973">🇧🇭 +973</SelectItem>
                          <SelectItem value="+880">🇧🇩 +880</SelectItem>
                          <SelectItem value="+1246">🇧🇧 +1246</SelectItem>
                          <SelectItem value="+375">🇧🇾 +375</SelectItem>
                          <SelectItem value="+32">🇧🇪 +32</SelectItem>
                          <SelectItem value="+501">🇧🇿 +501</SelectItem>
                          <SelectItem value="+229">🇧🇯 +229</SelectItem>
                          <SelectItem value="+1441">🇧🇲 +1441</SelectItem>
                          <SelectItem value="+975">🇧🇹 +975</SelectItem>
                          <SelectItem value="+591">🇧🇴 +591</SelectItem>
                          <SelectItem value="+387">🇧🇦 +387</SelectItem>
                          <SelectItem value="+267">🇧🇼 +267</SelectItem>
                          <SelectItem value="+55">🇧🇷 +55</SelectItem>
                          <SelectItem value="+246">🇮🇴 +246</SelectItem>
                          <SelectItem value="+673">🇧🇳 +673</SelectItem>
                          <SelectItem value="+359">🇧🇬 +359</SelectItem>
                          <SelectItem value="+226">🇧🇫 +226</SelectItem>
                          <SelectItem value="+257">🇧🇮 +257</SelectItem>
                          <SelectItem value="+855">🇰🇭 +855</SelectItem>
                          <SelectItem value="+237">🇨🇲 +237</SelectItem>
                          <SelectItem value="+1">🇨🇦 +1</SelectItem>
                          <SelectItem value="+238">🇨🇻 +238</SelectItem>
                          <SelectItem value="+1345">🇰🇾 +1345</SelectItem>
                          <SelectItem value="+236">🇨🇫 +236</SelectItem>
                          <SelectItem value="+235">🇹🇩 +235</SelectItem>
                          <SelectItem value="+56">🇨🇱 +56</SelectItem>
                          <SelectItem value="+86">🇨🇳 +86</SelectItem>
                          <SelectItem value="+61">🇨🇽 +61</SelectItem>
                          <SelectItem value="+61">🇨🇨 +61</SelectItem>
                          <SelectItem value="+57">🇨🇴 +57</SelectItem>
                          <SelectItem value="+269">🇰🇲 +269</SelectItem>
                          <SelectItem value="+243">🇨🇩 +243</SelectItem>
                          <SelectItem value="+242">🇨🇬 +242</SelectItem>
                          <SelectItem value="+682">🇨🇰 +682</SelectItem>
                          <SelectItem value="+506">🇨🇷 +506</SelectItem>
                          <SelectItem value="+225">🇨🇮 +225</SelectItem>
                          <SelectItem value="+385">🇭🇷 +385</SelectItem>
                          <SelectItem value="+53">🇨🇺 +53</SelectItem>
                          <SelectItem value="+357">🇨🇾 +357</SelectItem>
                          <SelectItem value="+420">🇨🇿 +420</SelectItem>
                          <SelectItem value="+45">🇩🇰 +45</SelectItem>
                          <SelectItem value="+253">🇩🇯 +253</SelectItem>
                          <SelectItem value="+1767">🇩🇲 +1767</SelectItem>
                          <SelectItem value="+1809">🇩🇴 +1809</SelectItem>
                          <SelectItem value="+593">🇪🇨 +593</SelectItem>
                          <SelectItem value="+503">🇸🇻 +503</SelectItem>
                          <SelectItem value="+240">🇬🇶 +240</SelectItem>
                          <SelectItem value="+291">🇪🇷 +291</SelectItem>
                          <SelectItem value="+372">🇪🇪 +372</SelectItem>
                          <SelectItem value="+251">🇪🇹 +251</SelectItem>
                          <SelectItem value="+500">🇫🇰 +500</SelectItem>
                          <SelectItem value="+298">🇫🇴 +298</SelectItem>
                          <SelectItem value="+679">🇫🇯 +679</SelectItem>
                          <SelectItem value="+358">🇫🇮 +358</SelectItem>
                          <SelectItem value="+33">🇫🇷 +33</SelectItem>
                          <SelectItem value="+594">🇬🇫 +594</SelectItem>
                          <SelectItem value="+689">🇵🇫 +689</SelectItem>
                          <SelectItem value="+241">🇬🇦 +241</SelectItem>
                          <SelectItem value="+220">🇬🇲 +220</SelectItem>
                          <SelectItem value="+995">🇬🇪 +995</SelectItem>
                          <SelectItem value="+49">🇩🇪 +49</SelectItem>
                          <SelectItem value="+233">🇬🇭 +233</SelectItem>
                          <SelectItem value="+350">🇬🇮 +350</SelectItem>
                          <SelectItem value="+30">🇬🇷 +30</SelectItem>
                          <SelectItem value="+299">🇬🇱 +299</SelectItem>
                          <SelectItem value="+1473">🇬🇩 +1473</SelectItem>
                          <SelectItem value="+590">🇬🇵 +590</SelectItem>
                          <SelectItem value="+1671">🇬🇺 +1671</SelectItem>
                          <SelectItem value="+502">🇬🇹 +502</SelectItem>
                          <SelectItem value="+44">🇬🇬 +44</SelectItem>
                          <SelectItem value="+224">🇬🇳 +224</SelectItem>
                          <SelectItem value="+245">🇬🇼 +245</SelectItem>
                          <SelectItem value="+592">🇬🇾 +592</SelectItem>
                          <SelectItem value="+509">🇭🇹 +509</SelectItem>
                          <SelectItem value="+504">🇭🇳 +504</SelectItem>
                          <SelectItem value="+852">🇭🇰 +852</SelectItem>
                          <SelectItem value="+36">🇭🇺 +36</SelectItem>
                          <SelectItem value="+354">🇮🇸 +354</SelectItem>
                          <SelectItem value="+91">🇮🇳 +91</SelectItem>
                          <SelectItem value="+62">🇮🇩 +62</SelectItem>
                          <SelectItem value="+98">🇮🇷 +98</SelectItem>
                          <SelectItem value="+964">🇮🇶 +964</SelectItem>
                          <SelectItem value="+353">🇮🇪 +353</SelectItem>
                          <SelectItem value="+44">🇮🇲 +44</SelectItem>
                          <SelectItem value="+972">🇮🇱 +972</SelectItem>
                          <SelectItem value="+39">🇮🇹 +39</SelectItem>
                          <SelectItem value="+1876">🇯🇲 +1876</SelectItem>
                          <SelectItem value="+81">🇯🇵 +81</SelectItem>
                          <SelectItem value="+44">🇯🇪 +44</SelectItem>
                          <SelectItem value="+962">🇯🇴 +962</SelectItem>
                          <SelectItem value="+7">🇰🇿 +7</SelectItem>
                          <SelectItem value="+254">🇰🇪 +254</SelectItem>
                          <SelectItem value="+686">🇰🇮 +686</SelectItem>
                          <SelectItem value="+850">🇰🇵 +850</SelectItem>
                          <SelectItem value="+82">🇰🇷 +82</SelectItem>
                          <SelectItem value="+965">🇰🇼 +965</SelectItem>
                          <SelectItem value="+996">🇰🇬 +996</SelectItem>
                          <SelectItem value="+856">🇱🇦 +856</SelectItem>
                          <SelectItem value="+371">🇱🇻 +371</SelectItem>
                          <SelectItem value="+961">🇱🇧 +961</SelectItem>
                          <SelectItem value="+266">🇱🇸 +266</SelectItem>
                          <SelectItem value="+231">🇱🇷 +231</SelectItem>
                          <SelectItem value="+218">🇱🇾 +218</SelectItem>
                          <SelectItem value="+423">🇱🇮 +423</SelectItem>
                          <SelectItem value="+370">🇱🇹 +370</SelectItem>
                          <SelectItem value="+352">🇱🇺 +352</SelectItem>
                          <SelectItem value="+853">🇲🇴 +853</SelectItem>
                          <SelectItem value="+389">🇲🇰 +389</SelectItem>
                          <SelectItem value="+261">🇲🇬 +261</SelectItem>
                          <SelectItem value="+265">🇲🇼 +265</SelectItem>
                          <SelectItem value="+60">🇲🇾 +60</SelectItem>
                          <SelectItem value="+960">🇲🇻 +960</SelectItem>
                          <SelectItem value="+223">🇲🇱 +223</SelectItem>
                          <SelectItem value="+356">🇲🇹 +356</SelectItem>
                          <SelectItem value="+692">🇲🇭 +692</SelectItem>
                          <SelectItem value="+596">🇲🇶 +596</SelectItem>
                          <SelectItem value="+222">🇲🇷 +222</SelectItem>
                          <SelectItem value="+230">🇲🇺 +230</SelectItem>
                          <SelectItem value="+262">🇾🇹 +262</SelectItem>
                          <SelectItem value="+52">🇲🇽 +52</SelectItem>
                          <SelectItem value="+691">🇫🇲 +691</SelectItem>
                          <SelectItem value="+373">🇲🇩 +373</SelectItem>
                          <SelectItem value="+377">🇲🇨 +377</SelectItem>
                          <SelectItem value="+976">🇲🇳 +976</SelectItem>
                          <SelectItem value="+382">🇲🇪 +382</SelectItem>
                          <SelectItem value="+1664">🇲🇸 +1664</SelectItem>
                          <SelectItem value="+212">🇲🇦 +212</SelectItem>
                          <SelectItem value="+258">🇲🇿 +258</SelectItem>
                          <SelectItem value="+95">🇲🇲 +95</SelectItem>
                          <SelectItem value="+264">🇳🇦 +264</SelectItem>
                          <SelectItem value="+674">🇳🇷 +674</SelectItem>
                          <SelectItem value="+977">🇳🇵 +977</SelectItem>
                          <SelectItem value="+31">🇳🇱 +31</SelectItem>
                          <SelectItem value="+687">🇳🇨 +687</SelectItem>
                          <SelectItem value="+64">🇳🇿 +64</SelectItem>
                          <SelectItem value="+505">🇳🇮 +505</SelectItem>
                          <SelectItem value="+227">🇳🇪 +227</SelectItem>
                          <SelectItem value="+234">🇳🇬 +234</SelectItem>
                          <SelectItem value="+683">🇳🇺 +683</SelectItem>
                          <SelectItem value="+672">🇳🇫 +672</SelectItem>
                          <SelectItem value="+1670">🇲🇵 +1670</SelectItem>
                          <SelectItem value="+47">🇳🇴 +47</SelectItem>
                          <SelectItem value="+968">🇴🇲 +968</SelectItem>
                          <SelectItem value="+92">🇵🇰 +92</SelectItem>
                          <SelectItem value="+680">🇵🇼 +680</SelectItem>
                          <SelectItem value="+970">🇵🇸 +970</SelectItem>
                          <SelectItem value="+507">🇵🇦 +507</SelectItem>
                          <SelectItem value="+675">🇵🇬 +675</SelectItem>
                          <SelectItem value="+595">🇵🇾 +595</SelectItem>
                          <SelectItem value="+51">🇵🇪 +51</SelectItem>
                          <SelectItem value="+63">🇵🇭 +63</SelectItem>
                          <SelectItem value="+64">🇵🇳 +64</SelectItem>
                          <SelectItem value="+48">🇵🇱 +48</SelectItem>
                          <SelectItem value="+351">🇵🇹 +351</SelectItem>
                          <SelectItem value="+1787">🇵🇷 +1787</SelectItem>
                          <SelectItem value="+974">🇶🇦 +974</SelectItem>
                          <SelectItem value="+262">🇷🇪 +262</SelectItem>
                          <SelectItem value="+40">🇷🇴 +40</SelectItem>
                          <SelectItem value="+7">🇷🇺 +7</SelectItem>
                          <SelectItem value="+250">🇷🇼 +250</SelectItem>
                          <SelectItem value="+290">🇸🇭 +290</SelectItem>
                          <SelectItem value="+1869">🇰🇳 +1869</SelectItem>
                          <SelectItem value="+1758">🇱🇨 +1758</SelectItem>
                          <SelectItem value="+508">🇵🇲 +508</SelectItem>
                          <SelectItem value="+1784">🇻🇨 +1784</SelectItem>
                          <SelectItem value="+685">🇼🇸 +685</SelectItem>
                          <SelectItem value="+378">🇸🇲 +378</SelectItem>
                          <SelectItem value="+239">🇸🇹 +239</SelectItem>
                          <SelectItem value="+221">🇸🇳 +221</SelectItem>
                          <SelectItem value="+381">🇷🇸 +381</SelectItem>
                          <SelectItem value="+248">🇸🇨 +248</SelectItem>
                          <SelectItem value="+232">🇸🇱 +232</SelectItem>
                          <SelectItem value="+65">🇸🇬 +65</SelectItem>
                          <SelectItem value="+421">🇸🇰 +421</SelectItem>
                          <SelectItem value="+386">🇸🇮 +386</SelectItem>
                          <SelectItem value="+677">🇸🇧 +677</SelectItem>
                          <SelectItem value="+252">🇸🇴 +252</SelectItem>
                          <SelectItem value="+27">🇿🇦 +27</SelectItem>
                          <SelectItem value="+500">🇬🇸 +500</SelectItem>
                          <SelectItem value="+34">🇪🇸 +34</SelectItem>
                          <SelectItem value="+94">🇱🇰 +94</SelectItem>
                          <SelectItem value="+249">🇸🇩 +249</SelectItem>
                          <SelectItem value="+597">🇸🇷 +597</SelectItem>
                          <SelectItem value="+47">🇸🇯 +47</SelectItem>
                          <SelectItem value="+268">🇸🇿 +268</SelectItem>
                          <SelectItem value="+46">🇸🇪 +46</SelectItem>
                          <SelectItem value="+41">🇨🇭 +41</SelectItem>
                          <SelectItem value="+963">🇸🇾 +963</SelectItem>
                          <SelectItem value="+886">🇹🇼 +886</SelectItem>
                          <SelectItem value="+992">🇹🇯 +992</SelectItem>
                          <SelectItem value="+255">🇹🇿 +255</SelectItem>
                          <SelectItem value="+66">🇹🇭 +66</SelectItem>
                          <SelectItem value="+670">🇹🇱 +670</SelectItem>
                          <SelectItem value="+228">🇹🇬 +228</SelectItem>
                          <SelectItem value="+690">🇹🇰 +690</SelectItem>
                          <SelectItem value="+676">🇹🇴 +676</SelectItem>
                          <SelectItem value="+1868">🇹🇹 +1868</SelectItem>
                          <SelectItem value="+216">🇹🇳 +216</SelectItem>
                          <SelectItem value="+90">🇹🇷 +90</SelectItem>
                          <SelectItem value="+993">🇹🇲 +993</SelectItem>
                          <SelectItem value="+1649">🇹🇨 +1649</SelectItem>
                          <SelectItem value="+688">🇹🇻 +688</SelectItem>
                          <SelectItem value="+256">🇺🇬 +256</SelectItem>
                          <SelectItem value="+380">🇺🇦 +380</SelectItem>
                          <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+598">🇺🇾 +598</SelectItem>
                          <SelectItem value="+998">🇺🇿 +998</SelectItem>
                          <SelectItem value="+678">🇻🇺 +678</SelectItem>
                          <SelectItem value="+58">🇻🇪 +58</SelectItem>
                          <SelectItem value="+84">🇻🇳 +84</SelectItem>
                          <SelectItem value="+1284">🇻🇬 +1284</SelectItem>
                          <SelectItem value="+1340">🇻🇮 +1340</SelectItem>
                          <SelectItem value="+681">🇼🇫 +681</SelectItem>
                          <SelectItem value="+967">🇾🇪 +967</SelectItem>
                          <SelectItem value="+260">🇿🇲 +260</SelectItem>
                          <SelectItem value="+263">🇿🇼 +263</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="Enter phone number"
                          className="pl-10"
                          value={signUpData.phone}
                          onChange={(e) =>
                            setSignUpData({ ...signUpData, phone: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={signUpData.email}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, email: e.target.value })
                        }
                        required
                      />
                    </div>
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