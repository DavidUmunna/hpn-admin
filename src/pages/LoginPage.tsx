import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FullPageMessage from '../components/FullPageMessage';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      const from = (location.state as { from?: { pathname?: string } })?.from;
      navigate(from?.pathname || '/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !user) {
    return <FullPageMessage loading title="Checking session..." />;
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="eyebrow">HPN Admin</p>
        <h2>Sign in</h2>
        <p className="muted">Use your admin email and password to manage the mobile backend data.</p>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@domain.com"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
            />
          </label>

          {error && <div className="alert error">{error}</div>}

          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
