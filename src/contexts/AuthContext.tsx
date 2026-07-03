import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  // Legacy fields kept for dashboard compatibility
  universityId: string;
  fullName: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

function mapUser(supabaseUser: User): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    emailVerified: !!supabaseUser.email_confirmed_at,
    createdAt: supabaseUser.created_at,
    // Legacy compatibility
    universityId: supabaseUser.user_metadata?.university_id ?? supabaseUser.email?.split('@')[0] ?? '',
    fullName: supabaseUser.user_metadata?.full_name ?? supabaseUser.email?.split('@')[0] ?? '',
    isAdmin: false,
  };
}

async function fetchProfile(userId: string): Promise<Partial<AuthUser>> {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('university_id, full_name, is_admin, email_verified')
      .eq('id', userId)
      .single();
    if (!data) return {};
    return {
      universityId: data.university_id ?? '',
      fullName: data.full_name ?? '',
      isAdmin: data.is_admin ?? false,
      emailVerified: data.email_verified ?? false,
    };
  } catch {
    return {};
  }
}

async function buildUser(supabaseUser: User): Promise<AuthUser> {
  const base = mapUser(supabaseUser);
  const profile = await fetchProfile(supabaseUser.id);
  return { ...base, ...profile };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [_session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    // Safety #1: Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        const u = await buildUser(session.user);
        if (mounted) setUser(u);
      }
      if (mounted) setLoading(false);
    });

    // Safety #2: Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        const u = await buildUser(session.user);
        if (mounted) setUser(u);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const u = await buildUser(session.user);
        if (mounted) setUser(u);
      } else if (event === 'USER_UPDATED' && session?.user) {
        const u = await buildUser(session.user);
        if (mounted) setUser(u);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/signin`,
      },
    });
    if (error) throw error;

    // Upsert profile row
    if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        email,
        username: email.split('@')[0],
        full_name: email.split('@')[0],
        university_id: '',
        is_admin: false,
        email_verified: false,
      }, { onConflict: 'id' });
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Surface a clear message when email is not verified
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد.');
      }
      throw error;
    }

    // Check email_confirmed_at from the returned user
    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      throw new Error('يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد.');
    }

    // Sync email_verified in profile
    if (data.user?.email_confirmed_at) {
      await supabase
        .from('user_profiles')
        .update({ email_verified: true })
        .eq('id', data.user.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, sendPasswordReset, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
