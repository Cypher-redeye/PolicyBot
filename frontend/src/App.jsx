import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Documents from './pages/Documents';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  LayoutDashboard, 
  MessageSquareCode, 
  Files, 
  LogOut, 
  ShieldAlert,
  Terminal,
  Bot,
  Shield
} from 'lucide-react';

// Protected Route Wrapper to enforce JWT sessions
function ProtectedLayout({ children }) {
  const { token, user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [telemetryLogs, setTelemetryLogs] = useState(() => {
    const stored = localStorage.getItem('policybot_telemetry_logs');
    return stored ? JSON.parse(stored).slice(0, 4) : [
      "[SYS: OK] Node Core Ready",
      "[DB: OK] Connected SQLite Fallback",
      "[RAG: SYN] Vector schema hydrated"
    ];
  });

  useEffect(() => {
    function loadLogs() {
      const stored = localStorage.getItem('policybot_telemetry_logs');
      if (stored) {
        setTelemetryLogs(JSON.parse(stored).slice(0, 4));
      }
    }
    window.addEventListener('policybot_new_api_log', loadLogs);
    return () => {
      window.removeEventListener('policybot_new_api_log', loadLogs);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-darker)',
        color: 'var(--accent-gold)',
        fontFamily: 'monospace',
        fontSize: '1rem'
      }}>
        Initializing Compliance Node Session...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation Drawer */}
      <aside className="sidebar">
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
            <Shield size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: 1, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
              PolicyBot
            </h1>
            <span className="label-eyebrow" style={{ fontSize: '9px', color: 'var(--accent-gold)', fontWeight: '700' }}>
              GoalFlow Integration
            </span>
          </div>
        </div>

        <nav className="nav-menu">
          <li>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <MessageSquareCode size={18} /> Q&A Chat Room
            </NavLink>
          </li>
          <li>
            <NavLink to="/documents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Files size={18} /> Policies Sync
            </NavLink>
          </li>
        </nav>

        {/* Node Telemetry Stream Console */}
        <div 
          style={{
            marginTop: 'auto',
            marginBottom: '20px',
            padding: '10px 12px',
            background: '#030303',
            border: '1px solid var(--border-line)',
            borderRadius: '6px',
            fontSize: '9.5px',
            fontFamily: "'Roboto Mono', monospace",
            color: 'var(--text-secondary)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.85)',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid var(--border-line)', paddingBottom: '4px' }}>
            <span style={{ color: 'var(--accent-gold)', fontWeight: '700', letterSpacing: '0.05em' }}>SYS TELEMETRY</span>
            <span className="pulse-dot" style={{ width: '4px', height: '4px' }}></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {telemetryLogs.map((log, lIdx) => {
              let color = 'var(--text-secondary)';
              if (log.includes('SYS:')) color = '#81e6a4';
              if (log.includes('API:')) color = '#62d6e8';
              if (log.includes('RAG:')) color = '#f55d8f';
              if (log.includes('DB:')) color = '#f2bb44';
              return (
                <div key={lIdx} style={{ color, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

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
          <div className="flex" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div 
              className="flex-center" 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                background: 'rgba(242, 187, 68, 0.1)',
                border: '1px solid var(--border-line)',
                color: 'var(--accent-gold)',
                fontWeight: '700',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '600', fontFamily: "'Space Grotesk', sans-serif" }}>
                {user?.username || 'cto_admin'}
              </h4>
              <span className="label-eyebrow" style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>
                Compliance Node
              </span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid var(--border-line)',
              color: 'var(--text-secondary)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontWeight: '600',
              transition: 'var(--transition-fast)',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--accent-gold)';
              e.currentTarget.style.background = 'rgba(242, 187, 68, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-line)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <LogOut size={14} /> Disconnect Session
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
