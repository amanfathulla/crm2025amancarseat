
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

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
    <MainLayout requireAuth={false}>
      <div className="flex items-center justify-center w-full h-screen">
        <div className="w-full max-w-md mx-auto px-4">
          <Card className="shadow-xl border-none overflow-hidden bg-white">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="w-full flex justify-center mb-8">
                <img 
                  src="/lovable-uploads/662e2fd0-d700-4822-b948-3897c436fb05.png" 
                  alt="AMAN CAR SEAT Logo" 
                  className="w-56 h-auto"
                />
              </div>
              
              <h2 className="text-2xl font-semibold mb-2 text-center">Welcome</h2>
              <p className="text-muted-foreground text-center mb-8">Login to access the dashboard</p>
              
              <Button 
                onClick={openAdminLoginDialog} 
                variant="default" 
                className="w-full h-12 text-base font-medium bg-[#1f2d50] hover:bg-[#1a254a] shadow-md hover:shadow-lg transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login as Admin"
                )}
              </Button>
            </CardContent>
          </Card>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminLogin();
                  }
                }}
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
