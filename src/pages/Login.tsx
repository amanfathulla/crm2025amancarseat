
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function Login() {
  // Admin quick login dialog state
  const [showAdminLoginDialog, setShowAdminLoginDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Get the last login time from localStorage if available
    const storedLastLogin = localStorage.getItem("lastLoginTime");
    setLastLogin(storedLastLogin);
  }, []);

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
    
    try {
      const success = await login("admin", "Muhsin@920926");
      if (success) {
        // Store current login time
        const currentTime = new Date().toLocaleString();
        localStorage.setItem("lastLoginTime", currentTime);
        
        setShowAdminLoginDialog(false);
        navigate("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current year for copyright text
  const currentYear = new Date().getFullYear();

  return (
    <div className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMTEiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djFjMCAyLjItMS44IDQtNCA0aC0yYy0yLjIgMC00LTEuOC00LTR2LTFjMC0yLjIgMS44LTQgNC00aDJjMi4yIDAgNCAxLjggNCA0ek0yIDJ2MWMwIDIuMi0xLjggNC00IDRoLTJjLTIuMiAwLTQtMS44LTQtNHYtMWMwLTIuMiAxLjgtNCA0LTRoMmMyLjIgMCA0IDEuOCA0IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>

      {/* Logo container - responsive untuk tablet landscape */}
      <div className="w-full px-4 sm:px-6 flex-1 flex items-center justify-center 
                      portrait:max-h-[60vh] landscape:max-h-[55vh] 
                      landscape:md:max-h-[65vh] landscape:lg:max-h-[70vh]">
        <div className="w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[600px]
                       landscape:max-w-[350px] landscape:md:max-w-[450px] landscape:lg:max-w-[550px] relative">
          <AspectRatio ratio={1/1} className="w-full">
            <img 
              src="/lovable-uploads/c601d9f9-1e06-4854-83de-2fcd1b040c9c.png" 
              alt="AMANCARSEAT Logo" 
              className="w-full h-full object-contain"
            />
          </AspectRatio>
        </div>
      </div>
      
      <div className="w-full px-4 flex flex-col items-center justify-end 
                      pb-6 sm:pb-8 landscape:pb-4 landscape:md:pb-6">
        <Card className="w-full max-w-[400px] shadow-2xl border-none overflow-hidden bg-black/50 backdrop-blur-md border-t border-white/10">
          <CardContent className="p-6">
            <Button 
              onClick={openAdminLoginDialog} 
              variant="default" 
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 shadow-md hover:shadow-lg transition-all rounded-md flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Login as Admin</span>
                </>
              )}
            </Button>
            
            <div className="mt-4 pt-4 border-t border-white/5 text-center space-y-2">
              {lastLogin && (
                <p className="text-xs text-white/60">
                  Last login: {lastLogin}
                </p>
              )}
              <p className="text-xs text-white/40">
                &copy; {currentYear} AMAN CAR SEAT. All rights reserved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Login Dialog */}
      <Dialog open={showAdminLoginDialog} onOpenChange={setShowAdminLoginDialog}>
        <DialogContent className="sm:max-w-md bg-black/90 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white/90">Admin Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-white/70">Admin Password</Label>
              <Input 
                id="admin-password" 
                type="password" 
                placeholder="Enter admin password" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminLogin();
                  }
                }}
                className="bg-white/5 border-white/10 text-white"
              />
              {adminPasswordError && (
                <p className="text-sm text-red-400">{adminPasswordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdminLoginDialog(false)}
              className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleAdminLogin}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
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
    </div>
  );
}
