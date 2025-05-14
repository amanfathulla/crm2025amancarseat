
import { useState } from "react";
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
  
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen w-full bg-black flex items-center justify-center overflow-hidden relative">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black to-gray-900 opacity-80"></div>
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMTEiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djFjMCAyLjItMS44IDQtNCA0aC0yYy0yLjIgMC00LTEuOC00LTR2LTFjMC0yLjIgMS44LTQgNC00aDJjMi4yIDAgNCAxLjggNCA0ek0yIDJ2MWMwIDIuMi0xLjggNC00IDRoLTJjLTIuMiAwLTQtMS44LTQtNHYtMWMwLTIuMiAxLjgtNCA0LTRoMmMyLjIgMCA0IDEuOCA0IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
      
      <div className="flex flex-col justify-center items-center z-10 p-4 w-full max-w-md">
        {/* Logo container with proper aspect ratio */}
        <div className="w-full max-w-[280px] mb-8">
          <AspectRatio ratio={16/9} className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/662e2fd0-d700-4822-b948-3897c436fb05.png" 
              alt="AMAN CAR SEAT Logo" 
              className="w-full h-auto object-contain"
            />
          </AspectRatio>
        </div>
        
        <Card className="w-full shadow-2xl border-none overflow-hidden bg-black/50 backdrop-blur-md border-t border-white/10">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white/90 text-center">Admin Login</h2>
            
            <Button 
              onClick={openAdminLoginDialog} 
              variant="default" 
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-md hover:shadow-lg transition-all rounded-md flex items-center justify-center gap-2"
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
            
            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-white/40">
                &copy; 2024 AMAN CAR SEAT. All rights reserved.
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
