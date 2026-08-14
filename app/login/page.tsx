'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DEMO_ACCOUNTS = [
  { name: 'Shubham (Owner)', email: 'shubham@solusidesign.com', role: 'Owner' },
  { name: 'Vikram (PM)', email: 'vikram.pm@solusidesign.com', role: 'PM' },
  { name: 'Ananya (Designer)', email: 'ananya.design@solusidesign.com', role: 'Designer' },
  { name: 'Rajesh (Supervisor)', email: 'rajesh.site@solusidesign.com', role: 'Supervisor' },
  { name: 'Shivay (Admin)', email: 'shivay7352@gmail.com', role: 'Admin' }
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // Guard: If already logged in, redirect immediately to dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solusi_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name) {
            window.location.href = '/';
            return;
          }
        } catch (e) {
          localStorage.removeItem('solusi_user');
        }
      }
    }
    setCheckingSession(false);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

      let userObj = null;

      if (!isPlaceholder) {
        // Live Supabase Authentication if configured
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError || !data.user) {
          throw new Error(authError?.message || 'Invalid email or password. Access denied.');
        }

        userObj = {
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          role: data.user.user_metadata?.role || 'Commercial Operations',
          email: data.user.email,
          avatar: (data.user.email || 'US').substring(0, 2).toUpperCase()
        };
      } else {
        // Authenticate via Solusi OS Database API
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Invalid email or password. Access denied.');
        }

        userObj = data.user;
      }

      localStorage.setItem('solusi_user', JSON.stringify(userObj));
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="authPage" style={{ background: '#0b1220', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: 14, color: '#94a3b8' }}>Checking active session...</div>
      </main>
    );
  }

  return (
    <main className="authPage">
      <div className="authCard">
        <div className="authBrand">
          <div className="mark">S</div>
          <div>
            <b>solusi</b>
            <small>OPERATING SYSTEM</small>
          </div>
        </div>

        <div className="authIntro">
          <span className="authIcon"><LockKeyhole size={18} /></span>
          <h1>Sign in to Solusi OS</h1>
          <p>Run commercial interior design, BOQs, site control & finance in one workspace.</p>
        </div>

        {/* DEMO ACCOUNTS QUICK-SELECT CHIPS */}
        <div style={{ marginBottom: 16, background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserCheck size={12} /> Select Demo Profile:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('solusi123');
                  setError('');
                }}
                style={{
                  background: email === acc.email ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${email === acc.email ? '#3b82f6' : 'rgba(255, 255, 255, 0.12)'}`,
                  color: email === acc.email ? '#60a5fa' : '#cbd5e1',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                {acc.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="authForm">
          <label>
            Email Address
            <span>
              <Mail size={13} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </span>
          </label>

          <label>
            Password
            <span>
              <LockKeyhole size={13} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                style={{ border: 0, background: 'transparent', padding: '0 6px', color: '#778397', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </span>
          </label>

          {error && <div className="authError">{error}</div>}

          <button type="submit" className="primary authButton" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'} <ArrowRight size={15} />
          </button>
        </form>

        <div className="authNote">
          <ShieldCheck size={14} />
          <span>Private commercial workspace. Access is authenticated & role-protected.</span>
        </div>
      </div>
    </main>
  );
}
