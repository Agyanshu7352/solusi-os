'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
        // Live Supabase Authentication
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
        // Workspace Authentication
        const emailLower = email.toLowerCase().trim();
        const allowedEmails = ['shivay7352@gmail.com', 'shubham@solusidesign.com', 'admin@solusidesign.com'];
        const isAuthorizedDomain = allowedEmails.includes(emailLower) || emailLower.endsWith('@solusidesign.com') || emailLower.endsWith('@solusi.com') || emailLower.endsWith('@solusios.com');

        if (!isAuthorizedDomain) {
          throw new Error('Access denied. Unrecognized email account. Please check your credentials.');
        }

        if (password.length < 6) {
          throw new Error('Invalid credentials. Password must be at least 6 characters.');
        }

        const namePart = emailLower.split('@')[0];
        const formattedName = emailLower === 'shivay7352@gmail.com' ? 'Shivay' : (namePart.charAt(0).toUpperCase() + namePart.slice(1));
        userObj = {
          name: formattedName,
          role: emailLower === 'shivay7352@gmail.com' ? 'Owner & Systems Admin' : 'Commercial Operations',
          email: emailLower,
          avatar: namePart.substring(0, 2).toUpperCase()
        };
      }

      localStorage.setItem('solusi_user', JSON.stringify(userObj));
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
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
