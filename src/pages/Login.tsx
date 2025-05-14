
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
import { AspectRatio } from "@/components/ui/aspect-ratio";
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
        {/* Two-column layout container - properly centered */}
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <Card className="overflow-hidden border-none shadow-xl bg-transparent w-full">
            <div className="flex flex-col lg:flex-row">
              {/* Left column: Branding and welcome message - changed from blue to black background */}
              <div className="lg:w-1/2 bg-black p-6 lg:p-12 flex flex-col justify-center items-center text-white">
                <div className="max-w-md mx-auto text-center">
                  <div className="mb-8 flex justify-center">
                    <AspectRatio ratio={1} className="w-48 h-48 lg:w-60 lg:h-60">
                      <img 
                        src="/lovable-uploads/b9c7e803-961e-418c-a48b-e3f641eb576e.png" 
                        alt="AMAN CAR SEAT Logo" 
                        className="object-contain"
                      />
                    </AspectRatio>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                    ACS Legacy
                  </h1>
                  <p className="text-lg lg:text-xl mb-6 opacity-90">
                    Selamat datang ke sistem pengurusan ACS Legacy
                  </p>
                  <p className="text-sm lg:text-base opacity-75 hidden lg:block">
                    Sistem pengurusan inventori dan pelanggan yang komprehensif untuk ACS Legacy Enterprise
                  </p>
                </div>
              </div>
              
              {/* Right column: Login form */}
              <div className="lg:w-1/2 bg-white dark:bg-gray-900 p-6 lg:p-12 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                  <div className="text-center mb-10">
                    <h2 className="text-2xl font-semibold tracking-tight text-primary">Login ke Dashboard</h2>
                    <p className="text-muted-foreground mt-2">Masukkan kredensial untuk akses sistem</p>
                  </div>
                  
                  <div className="space-y-6">
                    <Button 
                      onClick={openAdminLoginDialog} 
                      variant="default" 
                      className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
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
                    
                    <div className="relative flex items-center gap-4 py-3">
                      <div className="flex-grow h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                      <span className="text-sm text-muted-foreground">Sistem ACS Legacy</span>
                      <div className="flex-grow h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      <p>2023-2024 © ACS Legacy Enterprise</p>
                      <p className="mt-1">Semua hak cipta terpelihara</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
