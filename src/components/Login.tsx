import { useState, type FormEvent } from 'react';
import { useApp } from '../store/AppContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Login() {
  const { state, actions } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed && !password) {
      setError('Email address and password are required.');
      return;
    }
    if (!trimmed) {
      setError('Email address is required.');
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    setError('');
    void actions.doLogin(trimmed, password);
  };

  const formError = error || state.toast;

  return (
    <div style={{ minHeight: '100vh', background: '#1c3b2c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg,#1c3b2c,#1c3b2c 22px,#20422f 22px,#20422f 44px)', opacity: 0.5 }} />
      <div className="ch-fade" style={{ position: 'relative', width: '100%', maxWidth: 412 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 34, fontWeight: 600, letterSpacing: '.16em', color: '#f6f3ea' }}>CHEDI</div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: '.22em', color: '#d9b45f', marginTop: 4 }}>ADMIN CONSOLE</div>
        </div>
        <form onSubmit={submit} noValidate style={{ background: '#f6f3ea', borderRadius: 8, padding: 32 }}>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 26, color: '#1c3b2c', margin: 0 }}>Sign in</h2>
          <p style={{ fontSize: 14, color: '#6f7566', margin: '6px 0 20px' }}>Enter your email and password to continue</p>
          <label htmlFor="admin-email" style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>Email address</label>
          <input
            id="admin-email"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="you@chedi.in"
            style={{ width: '100%', margin: '6px 0 14px', padding: '12px 14px', border: '1px solid #d8cfb8', borderRadius: 3, fontSize: 14, background: '#faf8f2' }}
          />
          <label htmlFor="admin-password" style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>Password</label>
          <input
            id="admin-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Password"
            style={{ width: '100%', margin: '6px 0 20px', padding: '12px 14px', border: '1px solid #d8cfb8', borderRadius: 3, fontSize: 14, background: '#faf8f2' }}
          />
          {formError && (
            <div style={{ background: '#f9e6df', border: '1px solid #eabfb2', color: '#b0361f', padding: '10px 12px', borderRadius: 4, fontSize: 13, margin: '-8px 0 16px' }}>
              {formError}
            </div>
          )}
          <button
            type="submit"
            disabled={state.busy}
            className="ch-btn-primary"
            style={{ width: '100%', padding: 15, borderRadius: 2, fontWeight: 600, fontSize: 16, opacity: state.busy ? 0.7 : 1 }}
          >
            {state.busy ? 'Signing in…' : 'Sign in to console'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#8fa389', margin: '18px 0 0', fontFamily: "'Space Mono',monospace", letterSpacing: '.05em' }}>
          CHEDI FARM CLUB · TAMIL NADU
        </p>
      </div>
    </div>
  );
}
