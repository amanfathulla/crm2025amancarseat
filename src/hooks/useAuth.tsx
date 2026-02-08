import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in ms

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  const performLogout = useCallback(() => {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('lastLoginTime');
    setUser(null);
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, []);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    // Store last activity time
    localStorage.setItem('lastActivityTime', String(Date.now()));
    
    inactivityTimer.current = setTimeout(() => {
      performLogout();
      toast({
        title: "Sesi tamat",
        description: "Anda telah dilog keluar kerana tidak aktif selama 10 minit.",
        variant: "destructive",
      });
    }, INACTIVITY_TIMEOUT);
  }, [performLogout, toast]);

  // Listen for user activity events
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetInactivityTimer();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [user, resetInactivityTimer]);

  useEffect(() => {
    const checkSession = () => {
      const storedSession = localStorage.getItem('adminSession');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          const authenticatedAt = new Date(sessionData.authenticated_at);
          const now = new Date();
          const hoursDiff = (now.getTime() - authenticatedAt.getTime()) / (1000 * 60 * 60);
          
          // Check inactivity
          const lastActivity = localStorage.getItem('lastActivityTime');
          if (lastActivity) {
            const inactiveMs = Date.now() - parseInt(lastActivity);
            if (inactiveMs > INACTIVITY_TIMEOUT) {
              localStorage.removeItem('adminSession');
              setIsLoading(false);
              return;
            }
          }
          
          if (hoursDiff < 24) {
            setUser({
              id: sessionData.id,
              email: sessionData.email,
              user_metadata: { role: 'admin' },
              app_metadata: {},
              aud: 'authenticated',
              created_at: sessionData.authenticated_at,
            } as User);
          } else {
            localStorage.removeItem('adminSession');
          }
        } catch (e) {
          localStorage.removeItem('adminSession');
        }
      }
      setIsLoading(false);
    };
    
    checkSession();
  }, []);

  // Server-side authentication using database function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Use database function for secure server-side password verification
      const { data: adminId, error } = await supabase.rpc('check_admin_password', {
        email: email,
        password: password
      });
      
      if (error || !adminId) {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        return false;
      }
      
      // Create authenticated session with admin info
      setUser({
        id: adminId,
        email: email,
        user_metadata: { role: 'admin' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User);
      
      // Store session in localStorage for persistence
      localStorage.setItem('adminSession', JSON.stringify({
        id: adminId,
        email: email,
        authenticated_at: new Date().toISOString()
      }));
      
      toast({
        title: "Login successful",
        description: "Welcome back, admin!",
      });
      
      return true;
    } catch (error) {
      console.error("Unexpected error during login:", error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, username: string = ""): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // If username is provided but no email, create a standard email
      if (username && !email) {
        email = `${username}@example.com`;
      }
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username: username || undefined
          }
        }
      });
      
      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Signup successful",
        description: data.user ? 
          "Your account has been created. Please check your email to confirm your account." :
          "Your account has been created.",
      });
      
      return true;
    } catch (error) {
      console.error("Unexpected error during signup:", error);
      toast({
        title: "Signup failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // Clear admin session from localStorage
      localStorage.removeItem('adminSession');
      localStorage.removeItem('lastLoginTime');
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
