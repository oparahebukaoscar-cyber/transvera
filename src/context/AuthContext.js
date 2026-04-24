"use client";

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// AuthContext: Provides a simple, robust wrapper around Supabase auth.
// Responsibilities:
// - Expose `user` and `loading` state
// - Provide `signUp`, `signIn`, `signOut` helpers
// - Subscribe to Supabase `onAuthStateChange` events and keep state in sync

const AuthContext = createContext({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  getSession: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, fetch session and subscribe to auth state changes.
  useEffect(() => {
    let isMounted = true;

    (async function load() {
      try {
        // Supabase v2: getSession returns { data: { session } }
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        setUser(data?.session?.user ?? null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[AuthProvider] getSession error', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    // Subscribe to auth events and update `user` accordingly.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      // event examples: 'SIGNED_IN', 'SIGNED_OUT', 'PASSWORD_RECOVERY', etc.
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      try {
        subscription?.unsubscribe?.();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // signUp: create a new account with email + password
  const signUp = useCallback(async (email, password, options = {}) => {
    setLoading(true);
    try {
      const res = await supabase.auth.signUp({ email, password }, options);
      if (res.error) throw res.error;
      // Supabase sends an email for confirmation depending on your settings.
      return { data: res.data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // signIn: authenticate using email + password
  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // v2 API uses signInWithPassword
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;
      setUser(res.data?.user ?? null);
      return { data: res.data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // signOut
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supabase.auth.signOut();
      if (res.error) throw res.error;
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  }, []);

  // getSession helper for ad-hoc session checks
  const getSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return { session: null, error };
      return { session: data?.session ?? null, error: null };
    } catch (error) {
      return { session: null, error };
    }
  }, []);

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    getSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
