'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';

// Supabase's messages are safe to show, so keep the original text after a plain explanation.
function friendlyAuthError(message: string, status?: number) {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || status === 429)
    return 'Too many sign-in emails were sent recently. Wait an hour, or set up custom email sending in Supabase.';
  if (m.includes('not authorized') || m.includes('not allowed for this'))
    return `Supabase's built-in email only sends to members of the Supabase project until custom email (SMTP) is set up. (${message})`;
  if (m.includes('signups not allowed') || m.includes('signup is disabled'))
    return `New sign-ups are switched off in Supabase. (${message})`;
  if (m.includes('invalid api key') || m.includes('secret api key') || status === 401)
    return `The site's Supabase key was rejected. Check NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel. (${message})`;
  return `Could not send the email: ${message || 'unknown error'}${status ? ` (code ${status})` : ''}`;
}

function LoginForm() {
  const params = useSearchParams();
  const nextRaw = params.get('next') || '/scan';
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/scan';
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>(params.get('error') ? 'error' : 'idle');
  const [msg, setMsg] = useState(params.get('error') ? 'That sign-in link has expired or was already used. Send a new one.' : '');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setState('error');
      setMsg('Enter a valid email address.');
      return;
    }
    setState('sending');
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setState('error');
      setMsg(friendlyAuthError(error.message, error.status));
      console.error('Sign-in email failed', error.status, error.message);
    } else setState('sent');
  }

  return (
    <div className="wrap">
      <div className="auth panel">
        <div className="eyebrow">Sign in or create an account</div>
        <h2>Get your sign-in link</h2>
        {state === 'sent' ? (
          <div className="notice good">Check your inbox. We sent a sign-in link to <b>{email}</b>. It works once and expires in an hour.</div>
        ) : (
          <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <button className="btn primary big" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Email me a link'}</button>
            {state === 'error' && <div className="notice err" role="alert">{msg}</div>}
            <p className="hint">No password needed. New here? The same link creates your free account.</p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
