import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, Phone, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setTrustedDevice, isTrustedDevice } from "@/lib/trustedDevice";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'password'>('password');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const trusted = await isTrustedDevice();
      if (trusted) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          toast({
            title: "Welcome back!",
            description: "Signed in from trusted device",
          });
          navigate('/');
          return;
        }
      }

      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'magiclink') {
        setLoading(true);
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken!,
          });

          if (error) throw error;

          if (data.session) {
            if (rememberDevice) {
              setTrustedDevice(data.session.user.id);
            }
            
            window.location.hash = '';
            toast({
              title: "Success",
              description: "You've been logged in successfully!",
            });
            navigate('/');
            return;
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to authenticate with magic link",
            variant: "destructive",
          });
          setLoading(false);
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/");
        } else {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && rememberDevice) {
        setTrustedDevice(session.user.id);
      }
      if (event === 'SIGNED_IN' && session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast, rememberDevice]);

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "You've been signed in successfully",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "Signed in successfully",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Missing email",
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
          shouldCreateUser: true,
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
          description: "Click the link in your email to sign in - you'll be logged in automatically!",
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
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'password' | 'email' | 'phone')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="password" className="gap-2">
                <Lock className="h-4 w-4" />
                Password
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                Magic Link
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password-email">Email</Label>
                  <Input
                    id="password-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-password"
                    checked={rememberDevice}
                    onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                  />
                  <label
                    htmlFor="remember-password"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Remember this device
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Processing..." : authMode === 'signup' ? 'Sign Up' : 'Sign In'}
                </Button>
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    className="text-primary hover:underline"
                    disabled={loading}
                  >
                    {authMode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="email">
              {!emailSent ? (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-magic"
                      checked={rememberDevice}
                      onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                    />
                    <label
                      htmlFor="remember-magic"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember this device
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Magic Link"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    We'll email you a link to sign in instantly
                  </p>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <Mail className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Check your email</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click the link we sent to {email}
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
                    Use different email
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="phone">
              {!otpSent ? (
                <form onSubmit={handlePhoneOtpSend} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +1 for US, +55 for Brazil)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-phone"
                      checked={rememberDevice}
                      onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                    />
                    <label
                      htmlFor="remember-phone"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember this device
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Verification Code"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePhoneOtpVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        disabled={loading}
                      >
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
                    <p className="text-xs text-center text-muted-foreground">
                      Enter the 6-digit code sent to {phone}
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify Code"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setPhone("");
                    }}
                    className="w-full"
                  >
                    Use different number
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
