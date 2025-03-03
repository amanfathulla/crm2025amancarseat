
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, User, Mail } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Login() {
  // Login state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMode, setLoginMode] = useState<"username" | "email">("username");
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Admin quick login dialog state
  const [showAdminLoginDialog, setShowAdminLoginDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const success = await login(identifier, password);
      if (success) {
        navigate("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (signupPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    // Reset error
    setPasswordError("");
    setIsSubmitting(true);
    
    try {
      const success = await signup(signupEmail, signupPassword, signupUsername);
      if (success) {
        // Redirect to login tab or dashboard depending on your flow
        // For now, we'll stay on the page as they might need to verify email
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdminLoginDialog = () => {
    setAdminPassword("");
    setAdminPasswordError("");
    setShowAdminLoginDialog(true);
  };

  const handleAdminLogin = async () => {
    // Check if password is correct
    if (adminPassword !== "Muhsin@920926") {
      setAdminPasswordError("Password is incorrect");
      return;
    }

    setIsSubmitting(true);
    setShowAdminLoginDialog(false);
    
    try {
      const success = await login("admin", "Muhsin@920926");
      if (success) {
        navigate("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout requireAuth={false}>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className={cn(
          "w-full max-w-md p-8 rounded-xl animate-scale-in",
          "bg-white/80 backdrop-blur-sm shadow-glass border border-black/5"
        )}>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
                <p className="text-muted-foreground mt-2">Sign in to your account</p>
              </div>
              
              <div className="flex justify-center mb-4">
                <Button 
                  onClick={openAdminLoginDialog} 
                  variant="outline" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Quick Login as Admin
                </Button>
              </div>
              
              <div className="text-center mb-4">
                <span className="text-sm text-muted-foreground">or sign in with your details</span>
              </div>
              
              <div className="flex justify-center mb-4">
                <div className="flex">
                  <Button 
                    type="button" 
                    variant={loginMode === "username" ? "default" : "outline"} 
                    onClick={() => setLoginMode("username")}
                    className="rounded-r-none"
                    size="sm"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Username
                  </Button>
                  <Button 
                    type="button" 
                    variant={loginMode === "email" ? "default" : "outline"} 
                    onClick={() => setLoginMode("email")}
                    className="rounded-l-none"
                    size="sm"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                </div>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="identifier">{loginMode === "email" ? "Email" : "Username"}</Label>
                  <Input
                    id="identifier"
                    type={loginMode === "email" ? "email" : "text"}
                    placeholder={loginMode === "email" ? "your@email.com" : "username"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button type="button" variant="link" className="p-0 h-auto text-xs">
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Create Account</h1>
                <p className="text-muted-foreground mt-2">Sign up for a new account</p>
              </div>
              
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email (Optional)</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="h-12"
                    required
                    // Minimum 6 characters for Supabase password requirement
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12"
                    required
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Admin Login Dialog */}
      <Dialog open={showAdminLoginDialog} onOpenChange={setShowAdminLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input 
                id="admin-password" 
                type="password" 
                placeholder="Enter admin password" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              {adminPasswordError && (
                <p className="text-sm text-destructive">{adminPasswordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdminLoginDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleAdminLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
