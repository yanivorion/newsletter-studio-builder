'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        await resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
        setLoading(false);
        return;
      }
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signUp(email, password);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(145deg, #eef2f7, #e8edf5, #f0f3f8)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 400,
          padding: 40,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-1)',
              marginBottom: 8,
            }}
          >
            Newsletter Studio
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
            {mode === 'forgot' ? 'Reset your password' : mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {mode !== 'forgot' && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: 4,
              background: 'var(--accent-soft)',
              borderRadius: 10,
              marginBottom: 28,
            }}
          >
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: 14,
                fontWeight: 500, border: 'none', cursor: 'pointer',
                background: mode === 'signin' ? 'var(--accent)' : 'transparent',
                color: mode === 'signin' ? '#fff' : 'var(--text-2)',
                transition: 'all 200ms ease-out',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: 14,
                fontWeight: 500, border: 'none', cursor: 'pointer',
                background: mode === 'signup' ? 'var(--accent)' : 'transparent',
                color: mode === 'signup' ? '#fff' : 'var(--text-2)',
                transition: 'all 200ms ease-out',
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '12px 14px', marginBottom: 20,
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8, fontSize: 13, color: '#dc2626',
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: '12px 14px', marginBottom: 20,
                background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 8, fontSize: 13, color: '#16a34a',
              }}
            >
              {success}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-2)',
                marginBottom: 8,
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: 14,
                border: '1px solid var(--control-border)',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.6)',
                color: 'var(--text-1)',
              }}
            />
          </div>

          {mode !== 'forgot' && (
            <div style={{ marginBottom: mode === 'signup' ? 20 : 8 }}>
              <label htmlFor="password" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
                Password
              </label>
              <input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1px solid var(--control-border)', borderRadius: 8, background: 'rgba(255, 255, 255, 0.6)', color: 'var(--text-1)' }}
              />
            </div>
          )}
          {mode === 'signin' && (
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>
                Forgot password?
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ marginBottom: 28 }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-2)',
                  marginBottom: 8,
                }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 14,
                  border: '1px solid var(--control-border)',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.6)',
                  color: 'var(--text-1)',
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              borderRadius: 8,
              background: 'var(--accent)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 200ms ease-out',
            }}
          >
            {loading ? 'Please wait...' : mode === 'forgot' ? 'Send Reset Link' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mode === 'forgot' && (
            <button type="button" onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--accent)', cursor: 'pointer' }}>
              ← Back to sign in
            </button>
          )}
          <Link href="/" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
