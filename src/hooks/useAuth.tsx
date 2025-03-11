import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Check for existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    
    checkUser();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // This login function now accepts either a username or email
  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if input is an email (contains @) or a username
      const isEmail = usernameOrEmail.includes('@');
      
      // If it's a simple username demo flow for admin, handle it with a simplified approach
      if (!isEmail && usernameOrEmail === 'admin' && password === 'Muhsin@920926') {
        // Create a demo user session
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'admin@example.com',
          password: 'Muhsin@920926'
        });
        
        if (error) {
          console.log("Fallback to demo mode");
          // If the demo user doesn't exist in Supabase, create a fake session
          setUser({
            id: '1',
            email: 'admin@example.com',
            user_metadata: { username: 'admin' },
            app_metadata: {},
            aud: '',
            created_at: '',
          } as User);
          
          toast({
            title: "Login successful",
            description: "Welcome back, admin!",
          });
          
          return true;
        }
        
        toast({
          title: "Login successful",
          description: `Welcome back, admin!`,
        });
        
        return true;
      }
      
      // Standard email-based authentication
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: isEmail ? usernameOrEmail : `${usernameOrEmail}@example.com`, 
        password 
      });
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Login successful",
        description: `Welcome back!`,
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
      await supabase.auth.signOut();
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
