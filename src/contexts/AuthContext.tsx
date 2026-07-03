import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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
  login: (u: AuthUser) => void;
  logout: () => void;
  signIn: (universityId: string, password: string) => Promise<void>;
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
    universityId: supabaseUser.user_metadata?.university_id
      ?? supabaseUser.email?.split('@')[0]
      ?? '',
    fullName: supabaseUser.user_metadata?.full_name
      ?? supabaseUser.email?.split('@')[0]
      ?? '',
    isAdmin: false,
  };
}

async function fetchProfile(userId: string): Promise<Partial<AuthUser>> {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('university_id, full_name, is_admin')
      .eq('id', userId)
      .single();
    if (!data) return {};
    return {
      universityId: data.university_id ?? '',
      fullName: data.full_name ?? '',
      isAdmin: data.is_admin ?? false,
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

  function login(u: AuthUser) { setUser(u); }
  function logout() { setUser(null); }

  useEffect(() => {
    let mounted = true;

    // Safety #1: Check existing session (page refresh)
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

  async function signIn(universityId: string, password: string) {
    const email = `${universityId}@student.ahu.edu.jo`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user) {
      const u = await buildUser(data.user);
      setUser(u);
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
    <AuthContext.Provider value={{ user, loading, login, logout, signIn, signOut, sendPasswordReset, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
