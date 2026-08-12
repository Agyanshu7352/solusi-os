'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else window.location.href = '/';
    setBusy(false);
  }

  return <main className="authPage">
    <div className="authCard">
      <div className="authBrand"><div className="mark">S</div><div><b>solusi</b><small>OPERATING SYSTEM</small></div></div>
      <div className="authIntro"><span className="authIcon"><LockKeyhole size={17}/></span><h1>Sign in to Solusi OS</h1><p>Run projects, procurement, inventory, design and finance from one operating system.</p></div>
      <form onSubmit={submit} className="authForm">
        <label>Email <span><Mail size={13}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required /></span></label>
        <label>Password <span><LockKeyhole size={13}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required /></span></label>
        {error && <div className="authError">{error}</div>}
        {message && <div className="authMessage">{message}</div>}
        <button className="primary authButton" disabled={busy}>{busy?'Signing in…':'Sign in'} <ArrowRight size={15}/></button>
      </form>
      <div className="authNote"><ShieldCheck size={14}/><span>Private workspace. Access is controlled through Supabase authentication.</span></div>
      <p className="authHelp">First-time setup: create your first user in Supabase → Authentication → Users, then sign in here.</p>
    </div>
  </main>
}
