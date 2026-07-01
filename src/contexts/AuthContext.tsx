import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  universityId: string;
  fullName: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (universityId: string, fullName: string, password: string) => Promise<void>;
  signIn: (universityId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, email, university_id, full_name, is_admin')
      .eq('id', userId)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      email: data.email ?? '',
      universityId: data.university_id ?? '',
      fullName: data.full_name ?? data.email?.split('@')[0] ?? '',
      isAdmin: data.is_admin ?? false,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [_session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (mounted) setUser(profile);
        }
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(universityId: string, fullName: string, password: string) {
    const { data, error } = await supabase.functions.invoke('register-student', {
      body: { universityId, fullName, password }
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const statusCode = error.context?.status ?? 500;
          const textContent = await error.context?.text();
          const parsed = JSON.parse(textContent || '{}');
          errorMessage = parsed.error || `[${statusCode}] ${error.message}`;
        } catch {
          errorMessage = error.message;
        }
      }
      throw new Error(errorMessage);
    }

    if (data?.session) {
      await supabase.auth.setSession(data.session);
    } else if (data?.needsConfirmation) {
      // Email confirmation required - sign in directly
      const email = `${universityId}@student.ahu.edu.jo`;
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        throw new Error('تم إنشاء الحساب. يرجى تسجيل الدخول مباشرة.');
      }
    }
  }

  async function signIn(universityId: string, password: string) {
    const email = `${universityId}@student.ahu.edu.jo`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
