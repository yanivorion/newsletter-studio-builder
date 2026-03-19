import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase-client';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // true until initial session is checked
  const [error, setError] = useState(null);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId) => {
    if (!isSupabaseConfigured()) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  // Initialize auth state and listen for changes
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      console.log('Supabase not configured');
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setProfile(null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Sign up with email — uses server-side API to bypass trigger issues
  const signUp = useCallback(async (email, password, fullName) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    setError(null);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });

    const result = await res.json();

    if (!res.ok) {
      const msg = result.error || 'Signup failed';
      setError(msg);
      throw new Error(msg);
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }

    return data;
  }, []);

  // Sign in with email
  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured()) {
      console.error('Supabase not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      throw new Error('Supabase is not configured. Please contact support.');
    }

    setError(null);
    console.log('Attempting sign in for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      setError(error.message);
      throw error;
    }

    console.log('Sign in successful');
    return data;
  }, []);

  // Sign in with OAuth (Google, GitHub, etc.)
  const signInWithOAuth = useCallback(async (provider) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    setError(null);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      setError(error.message);
      throw error;
    }

    return data;
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    setError(null);
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setError(error.message);
      throw error;
    }

    setUser(null);
    setProfile(null);
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    setError(null);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      setError(error.message);
      throw error;
    }

    return data;
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    setError(null);
    
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setError(error.message);
      throw error;
    }

    return data;
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    if (!isSupabaseConfigured() || !user) {
      throw new Error('Not authenticated');
    }

    setError(null);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      throw error;
    }

    setProfile(data);
    return data;
  }, [user]);

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    isConfigured: isSupabaseConfigured(),
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id).then(setProfile)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;


