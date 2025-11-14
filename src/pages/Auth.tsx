import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Handle magic link callback (tokens in URL hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
      // Session is being established, show loading
      setLoading(true);
      // The onAuthStateChange will handle navigation once session is ready
    }
    
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);


  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Check your email",
          description: "We sent you a magic link to sign in",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtpSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim() || !phone.startsWith('+')) {
      toast({
        title: "Invalid phone number",
        description: "Please enter phone in international format (+1234567890)",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setOtpSent(true);
        toast({
          title: "Code sent",
          description: "Check your phone for the verification code",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: otp,
        type: 'sms',
      });

      if (error) {
        toast({
          title: "Verification failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Phone verified successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your clinical study data extraction tool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'phone')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="email">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="mr-2 h-4 w-4" />
                Phone
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email">
              {emailSent ? (
                <div className="text-center space-y-4">
                  <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Check your email</h3>
                    <p className="text-sm text-muted-foreground">
                      We sent a magic link to <strong>{email}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Click the link in the email to sign in
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                    className="w-full"
                  >
                    Use a different email
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <Mail className="mr-2 h-4 w-4" />
                    {loading ? "Sending..." : "Send magic link"}
                  </Button>
                </form>
              )}
            </TabsContent>
            
            <TabsContent value="phone">
              {otpSent ? (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto flex items-center justify-center">
                      <Phone className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold">Enter verification code</h3>
                    <p className="text-sm text-muted-foreground">
                      We sent a 6-digit code to <strong>{phone}</strong>
                    </p>
                  </div>
                  
                  <form onSubmit={handlePhoneOtpVerify} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-center block">Verification Code</Label>
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                      {loading ? "Verifying..." : "Verify code"}
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp("");
                        }}
                        className="flex-1"
                        disabled={loading}
                      >
                        Use different phone
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePhoneOtpSend}
                        className="flex-1"
                        disabled={loading}
                      >
                        Resend code
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <form onSubmit={handlePhoneOtpSend} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+12025551234"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter phone with country code (e.g., +12025551234)
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <Phone className="mr-2 h-4 w-4" />
                    {loading ? "Sending..." : "Send verification code"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
