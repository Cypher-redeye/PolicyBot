import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';

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
        setSuccessMessage('Registration successful! You can now sign in.');
        setIsRegister(false);
      } else {
        await login(username, password);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      let errMsg = '';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errMsg = detail;
        } else if (Array.isArray(detail)) {
          errMsg = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        } else {
          errMsg = JSON.stringify(detail);
        }
      } else {
        errMsg = isRegister 
          ? 'Registration failed. Please ensure your details are correct.' 
          : 'Sign in failed. Please check your credentials.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-darker)' }}>
      
      <div className="bento" style={{ width: '100%', maxWidth: '440px', padding: '40px', margin: '20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div 
            className="flex-center" 
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--accent-gold-glow)',
              color: 'var(--accent-gold)',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Logo size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
            {isRegister ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {isRegister ? 'Sign up to access your policy assistant.' : 'Sign in to access your policy assistant.'}
          </p>
        </div>

        {/* Tab Selector */}
        <div 
          style={{ 
            display: 'flex', 
            background: 'var(--bg-darker)', 
            borderRadius: 'var(--radius-sm)',
            padding: '4px',
            marginBottom: '24px'
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
              background: !isRegister ? '#ffffff' : 'transparent',
              color: !isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: !isRegister ? '1px solid var(--border-line)' : '1px solid transparent',
              padding: '8px 16px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: !isRegister ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
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
              background: isRegister ? '#ffffff' : 'transparent',
              color: isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: isRegister ? '1px solid var(--border-line)' : '1px solid transparent',
              padding: '8px 16px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: isRegister ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Register
          </button>
        </div>

        {successMessage && (
          <div 
            style={{
              background: '#ecfdf5',
              border: '1px solid #d1fae5',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px',
              color: '#059669',
              fontSize: '0.9rem',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div 
            style={{
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px',
              color: '#dc2626',
              fontSize: '0.9rem',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="login-username" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              Email Address
            </label>
            <input
              id="login-username"
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '44px' }}
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            {loading ? 'Please wait...' : (isRegister ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

      </div>
    </div>
  );
}
