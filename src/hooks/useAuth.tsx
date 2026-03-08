import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, getAuthenticatedClient } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const SESSION_TOKEN_KEY = 'adminSessionToken';
const LAST_ACTIVITY_KEY = 'lastActivityTime';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  /** Supabase client pre-configured with the admin session header for RLS */
  authClient: SupabaseClient<Database>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, username?: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const { toast } = useToast();
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Derived authenticated client — updated whenever the session token changes
  const authClient = sessionToken
    ? getAuthenticatedClient(sessionToken)
    : supabase;

  const performLogout = useCallback(async (token?: string | null) => {
    const t = token ?? sessionToken;
    if (t) {
      try {
        await supabase.rpc('invalidate_admin_session', { p_token: t });
      } catch (_) {
        // best-effort
      }
    }
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setSessionToken(null);
    setUser(null);
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, [sessionToken]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    inactivityTimer.current = setTimeout(() => {
      performLogout();
      toast({
        title: "Sesi tamat",
        description: "Anda telah dilog keluar kerana tidak aktif selama 10 minit.",
        variant: "destructive",
      });
    }, INACTIVITY_TIMEOUT);
  }, [performLogout, toast]);

  // Activity listeners
  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const handleActivity = () => resetInactivityTimer();
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

  // On mount: validate stored session server-side
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Check inactivity
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastActivity && Date.now() - parseInt(lastActivity) > INACTIVITY_TIMEOUT) {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        setIsLoading(false);
        return;
      }

      try {
        // Server-side session validation — not trusting localStorage blindly
        const { data: adminId, error } = await supabase.rpc('validate_admin_session', {
          p_token: storedToken,
        });

        if (error || !adminId) {
          localStorage.removeItem(SESSION_TOKEN_KEY);
          setIsLoading(false);
          return;
        }

        // Fetch admin email to reconstruct user object
        const { data: adminData } = await getAuthenticatedClient(storedToken)
          .from('admins')
          .select('email')
          .eq('id', adminId)
          .single();

        setSessionToken(storedToken);
        setUser({
          id: adminId,
          email: adminData?.email ?? '',
          user_metadata: { role: 'admin' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User);
      } catch (_) {
        localStorage.removeItem(SESSION_TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // 1. Verify credentials (now with rate limiting built into DB function)
      const { data: adminId, error } = await supabase.rpc('check_admin_password', {
        email,
        password,
        p_user_agent: navigator.userAgent,
      });

      if (error || !adminId) {
        toast({
          title: "Login gagal",
          description: "E-mel atau kata laluan tidak sah",
          variant: "destructive",
        });
        return false;
      }

      // 2. Create a secure server-side session token
      const { data: token, error: sessionError } = await supabase.rpc('create_admin_session', {
        p_admin_id: adminId,
        p_user_agent: navigator.userAgent,
      });

      if (sessionError || !token) {
        toast({
          title: "Login gagal",
          description: "Tidak dapat mencipta sesi. Cuba lagi.",
          variant: "destructive",
        });
        return false;
      }

      // 3. Store only the opaque token — never store admin ID/email in localStorage
      localStorage.setItem(SESSION_TOKEN_KEY, token);
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

      setSessionToken(token);
      setUser({
        id: adminId,
        email,
        user_metadata: { role: 'admin' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User);

      toast({ title: "Berjaya log masuk", description: "Selamat kembali, admin!" });
      return true;
    } catch (err) {
      console.error("Unexpected login error:", err);
      toast({ title: "Login gagal", description: "Ralat tidak dijangka berlaku", variant: "destructive" });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, username = ""): Promise<boolean> => {
    try {
      setIsLoading(true);
      if (username && !email) email = `${username}@example.com`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username || undefined } },
      });

      if (error) {
        toast({ title: "Pendaftaran gagal", description: error.message, variant: "destructive" });
        return false;
      }

      toast({
        title: "Pendaftaran berjaya",
        description: data.user
          ? "Akaun telah dicipta. Sila semak e-mel untuk pengesahan."
          : "Akaun telah dicipta.",
      });
      return true;
    } catch (err) {
      console.error("Unexpected signup error:", err);
      toast({ title: "Pendaftaran gagal", description: "Ralat tidak dijangka berlaku", variant: "destructive" });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      await performLogout(token);
      toast({ title: "Log keluar berjaya", description: "Anda telah berjaya log keluar" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, authClient, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
