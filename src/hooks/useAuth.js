"use client";

import { useContext } from 'react';
import AuthContext from '@/context/AuthContext';

// Small convenience hook to access AuthContext.
// Throws an informative error when used outside the provider.
export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
