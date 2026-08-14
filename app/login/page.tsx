'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // Backward/Forward Routing Guard: If already authenticated, redirect immediately to dashboard using replace()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solusi_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name) {
            window.location.replace('/');
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

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

      let userObj = null;

      if (!isPlaceholder) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
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
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Invalid email or password. Access denied.');
        }

        userObj = data.user;
      }

      localStorage.setItem('solusi_user', JSON.stringify(userObj));
      window.location.replace('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="authPage" style={{ background: '#0b1220', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Verifying session...</div>
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
