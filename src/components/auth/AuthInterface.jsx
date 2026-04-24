"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '@/hooks/useAuth';
import { Mail, Lock, User } from 'lucide-react';

// High-fidelity, luxury-styled Auth UI matching the "Globe Grip" aesthetic:
// - white background
// - blue accents
// - minimalist typography
// Uses Framer Motion to animate mode switches and form transitions.

export default function AuthInterface({ initialMode = 'login' }) {
  const { signIn, signUp, user, loading } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const toggleMode = () => {
    setError(null);
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        const { data, error } = await signIn(email.trim(), password);
        if (error) throw error;
        // success: Supabase will emit onAuthStateChange; optional post-login UX here.
      } else {
        const { data, error } = await signUp(email.trim(), password, { data: { source: 'auth-interface' } });
        if (error) throw error;
        // sign-up may require email confirm depending on supabase settings.
      }
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create account'}</h3>
            <p className="text-sm text-slate-500">{mode === 'login' ? 'Sign in to continue' : 'Create your account to access the terminal'}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15 15 0 0 0 0 20"></path></svg>
          </div>
        </div>

        <AnimatePresence initial={false} mode="wait">
          <motion.form key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} onSubmit={submit}>
            <div className="space-y-4">
              <label className="block">
                <div className="text-xs font-bold uppercase text-slate-400 mb-2">Email</div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg border border-slate-100 px-3 py-2">
                  <Mail className="text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full bg-transparent outline-none text-slate-700"
                  />
                </div>
              </label>

              <label className="block">
                <div className="text-xs font-bold uppercase text-slate-400 mb-2">Password</div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg border border-slate-100 px-3 py-2">
                  <Lock className="text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none text-slate-700"
                  />
                </div>
              </label>

              {error && <div className="text-sm text-red-500 font-bold">{error}</div>}

              <div className="flex items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-black transition"
                >
                  {busy ? 'Working…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                </button>

                <button type="button" onClick={toggleMode} className="px-4 py-3 rounded-xl border border-slate-100 bg-white text-slate-700 font-bold">
                  {mode === 'login' ? 'Create' : 'Sign in'}
                </button>
              </div>

              <div className="text-xs text-slate-400 text-center">By continuing you agree to our terms and privacy policy.</div>

              <div className="text-center">
                {loading ? (
                  <div className="text-sm text-slate-400">Authenticating…</div>
                ) : user ? (
                  <div className="text-sm font-black text-slate-700">Signed in as <span className="font-mono">{user.email}</span></div>
                ) : null}
              </div>
            </div>
          </motion.form>
        </AnimatePresence>
      </div>

      <div className="mt-4 text-center text-sm text-slate-500">
        <div className="mb-1">Having trouble? Contact support@transvera.example</div>
      </div>
    </div>
  );
}
