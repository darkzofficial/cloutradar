import LoginForm from '@/components/LoginForm';
import { supabaseConfigured } from '@/lib/config';

export const metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  if (!supabaseConfigured()) {
    return (
      <div className="wrap">
        <div className="auth panel">
          <div className="eyebrow">Coming soon</div>
          <h2>Sign-in isn&apos;t switched on yet</h2>
          <p className="muted" style={{ margin: 0 }}>
            CloutRadar accounts open shortly. Check back soon to run your free scans.
          </p>
        </div>
      </div>
    );
  }
  return <LoginForm />;
}
