import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Eye, EyeOff, Terminal, Sparkles, CheckCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(username, password);
        setSuccessMessage('Registration successful! Decrypt your session below.');
        setIsRegister(false);
      } else {
        await login(username, password);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        (isRegister 
          ? 'Registration failed. Ensure email format is correct.' 
          : 'Authentication failed. Please verify security credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
      
      {/* LEFT SPLIT SCREEN - 55% width (Visual Branding & Bento Highlights) */}
      <div 
        className="hidden lg:flex" 
        style={{
          width: '55%',
          background: 'transparent',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2,
          borderRight: '1px solid var(--border-line)'
        }}
      >
        {/* Top brand header */}
        <div className="flex" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            className="flex-center" 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'rgba(242, 187, 68, 0.1)',
              border: '1px solid rgba(242, 187, 68, 0.2)',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Shield size={16} />
          </div>
          <span className="label-eyebrow" style={{ color: 'var(--accent-gold)', fontSize: '11px', fontWeight: '700' }}>
            PolicyBot Portal
          </span>
        </div>

        {/* Mid Display Typography */}
        <div style={{ margin: 'auto 0' }}>
          <h1 
            style={{ 
              fontFamily: "var(--font-display)", 
              fontSize: '3.75rem', 
              fontWeight: '800', 
              lineHeight: '1.08', 
              letterSpacing: '-0.04em',
              marginBottom: '24px',
              color: 'var(--text-primary)'
            }}
          >
            Policy Analysis.<br />
            Hybrid Graph-RAG.<br />
            <span className="text-gold">Audit-Ready.</span>
          </h1>
          <p 
            style={{ 
              color: 'var(--text-secondary)', 
              maxWidth: '460px', 
              fontSize: '1.025rem', 
              lineHeight: '1.6', 
              marginBottom: '40px' 
            }}
          >
            PolicyBot's premium gateway for corporate guideline parsing — from instant document upload through vector indexing to hybrid vector-graph queries.
          </p>

          {/* Bento Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '580px' }}>
            <div className="bento" style={{ padding: '20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-bento)' }}>
              <div className="label-eyebrow" style={{ marginBottom: '6px' }}>Nodes / Sync</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', fontSize: '1.75rem', fontWeight: '700' }}>
                100k<span style={{ fontSize: '0.9rem', marginLeft: '2px', opacity: 0.7 }}>+</span>
              </div>
            </div>
            
            <div className="bento" style={{ padding: '20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-bento)' }}>
              <div className="label-eyebrow" style={{ marginBottom: '6px' }}>Latency</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', fontSize: '1.75rem', fontWeight: '700' }}>
                ~1.2s<span style={{ fontSize: '0.9rem', marginLeft: '2px', opacity: 0.7 }}>avg</span>
              </div>
            </div>

            <div className="bento" style={{ padding: '20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-bento)' }}>
              <div className="label-eyebrow" style={{ marginBottom: '6px' }}>LLM Core</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', fontSize: '1.5rem', fontWeight: '700' }}>
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          © 2026 PolicyBot Technologies · Built for Secure Corporate Compliance
        </div>
      </div>

      {/* RIGHT SPLIT SCREEN - 45% width (Clean, Minimalist Credentials Form) */}
      <div 
        style={{
          width: '100%',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          position: 'relative',
          zIndex: 2,
          flex: 1
        }}
      >
        <div className="bento" style={{ width: '100%', maxWidth: '420px', padding: '40px', background: 'var(--bg-bento)', border: '1px solid var(--border-line)', boxShadow: 'var(--shadow-bento)', borderRadius: 'var(--radius-bento)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div 
              className="flex-center" 
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(242, 187, 68, 0.08)',
                border: '1px solid rgba(242, 187, 68, 0.2)',
                margin: '0 auto 20px',
                color: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Shield size={28} />
            </div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: '800', marginBottom: '8px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {isRegister ? 'Create Node' : 'Welcome Back'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {isRegister ? 'Register a new secure compliance credentials node.' : 'Sign in with your secure access credentials.'}
            </p>
          </div>

          {/* Premium Tab Selector */}
          <div 
            style={{ 
              display: 'flex', 
              background: 'var(--bg-input)', 
              border: '1px solid var(--border-line)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px',
              marginBottom: '24px',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
                setSuccessMessage('');
              }}
              style={{
                flex: 1,
                background: !isRegister ? 'var(--accent-gold)' : 'transparent',
                color: !isRegister ? 'var(--bg-darker)' : 'var(--text-secondary)',
                border: 'none',
                padding: '8px 16px',
                fontFamily: "var(--font-display)",
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
                setSuccessMessage('');
              }}
              style={{
                flex: 1,
                background: isRegister ? 'var(--accent-gold)' : 'transparent',
                color: isRegister ? 'var(--bg-darker)' : 'var(--text-secondary)',
                border: 'none',
                padding: '8px 16px',
                fontFamily: "var(--font-display)",
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Register
            </button>
          </div>

          {successMessage && (
            <div 
              style={{
                background: 'rgba(39, 194, 108, 0.1)',
                border: '1px solid rgba(39, 194, 108, 0.25)',
                borderLeft: '4px solid var(--accent-gold)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px',
                color: '#4ade80',
                fontSize: '0.85rem',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                boxShadow: 'var(--shadow-bento)'
              }}
            >
              <CheckCircle size={16} style={{ color: 'var(--accent-gold)' }} />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div 
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderLeft: '4px solid #ef4444',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px',
                color: '#f87171',
                fontSize: '0.85rem',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                boxShadow: 'var(--shadow-bento)'
              }}
            >
              <Terminal size={14} style={{ color: '#ef4444' }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="login-username" className="label-eyebrow" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Corporate Email
              </label>
              <input
                id="login-username"
                type="email"
                className="form-input"
                placeholder="admin@policybot.co"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ borderRadius: 'var(--radius-sm)' }}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="label-eyebrow" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Security Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '44px', borderRadius: 'var(--radius-sm)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="gold-btn"
              disabled={loading}
              style={{ 
                marginTop: '8px', 
                width: '100%', 
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '700'
              }}
            >
              {loading ? (isRegister ? 'Creating Node...' : 'Decrypting Session...') : (isRegister ? 'Register Account' : 'Sign In')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
