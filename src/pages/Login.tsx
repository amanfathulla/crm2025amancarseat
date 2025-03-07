
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, User, Mail } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Login() {
  // Login state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMode, setLoginMode] = useState<"username" | "email">("username");
  
  // Admin quick login dialog state
  const [showAdminLoginDialog, setShowAdminLoginDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  
  const { login } = useAuth();
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
          <div className="text-center mb-6">
            {/* Added company logo */}
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/4bc7bb8f-2325-4928-b6e3-901158bd3eee.png" 
                alt="AMAN CAR SEAT Logo" 
                className="h-32 w-auto"
              />
            </div>
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
