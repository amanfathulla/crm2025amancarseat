
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate("/dashboard");
      }
    } finally {
      setIsLoggingIn(false);
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
            <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">Sign in to your admin account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="amanmuhsin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                placeholder="muhsin@920926"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Demo credentials: amanmuhsin / muhsin@920926</p>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
