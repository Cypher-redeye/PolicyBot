import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Documents from './pages/Documents';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { t, languages } from './utils/i18n';
import { 
  LayoutDashboard, 
  MessageSquareCode, 
  Files, 
  LogOut, 
  ShieldAlert,
  Terminal,
  Bot,
  Menu
} from 'lucide-react';
import Logo from './components/Logo';

// Protected Route Wrapper to enforce JWT sessions
function ProtectedLayout({ children }) {
  const { token, user, logout, updateUserLanguage, loading } = useAuth();
  const navigate = useNavigate();
  const currentLang = user?.preferredLanguage || 'English';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLangChange = (e) => {
    updateUserLanguage(e.target.value);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-darker)',
        color: 'var(--accent-gold)',
        fontFamily: 'Inter, sans-serif',
        fontSize: '1rem',
        fontWeight: '500'
      }}>
        Loading Account...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (window.location.pathname === '/documents' && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Logo size={20} />
          <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>PolicyBot</span>
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Navigation Drawer */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div 
          className="flex" 
          style={{ 
            display: 'flex',
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '32px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-line)'
          }}
        >
          <div 
            className="flex-center" 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: 'rgba(242, 187, 68, 0.1)',
              border: '1px solid rgba(242, 187, 68, 0.2)',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Logo size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1, color: 'var(--text-primary)' }}>
              PolicyBot
            </h1>
            <span className="label-eyebrow" style={{ fontSize: '9px', color: 'var(--accent-gold)', fontWeight: '600' }}>
              AI Assistant
            </span>
          </div>
        </div>

        <nav className="nav-menu">
          <li>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end onClick={() => setIsSidebarOpen(false)}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
              <MessageSquareCode size={18} /> {t(currentLang, 'chatAssistant')}
            </NavLink>
          </li>
          {user?.role === 'admin' && (
            <li>
              <NavLink to="/documents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <Files size={18} /> Documents
              </NavLink>
            </li>
          )}
        </nav>



        {/* User Context & Logout Action footer */}
        <div 
          style={{ 
            paddingTop: '20px', 
            borderTop: '1px solid var(--border-line)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div className="flex" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: 'auto' }}>
            <div 
              className="flex-center" 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--bg-card-secondary)',
                border: '1px solid var(--border-line)',
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '600' }}>
                {user?.username || 'User Account'}
              </h4>
              <span className="label-eyebrow" style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 'normal' }}>
                Member
              </span>
            </div>
          </div>

          <select 
            value={currentLang} 
            onChange={handleLangChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-line)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#ef4444',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fef2f2';
            }}
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            } 
          />
          
          <Route 
            path="/chat" 
            element={
              <ProtectedLayout>
                <Home />
              </ProtectedLayout>
            } 
          />

          <Route 
            path="/documents" 
            element={
              <ProtectedLayout>
                <Documents />
              </ProtectedLayout>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
