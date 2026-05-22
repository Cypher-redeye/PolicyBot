import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { queryService, documentService } from '../services/api';
import { 
  BookOpen, 
  MessageSquare, 
  Clock, 
  Cpu, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  Database,
  Cloud
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    documentsCount: 0,
    queriesCount: 0
  });
  const [recentQueries, setRecentQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [queriesData, docsData] = await Promise.all([
          queryService.getRecentQueries(5),
          documentService.getDocuments()
        ]);
        
        setRecentQueries(queriesData || []);
        setStats({
          documentsCount: docsData?.length || 0,
          queriesCount: queriesData?.length || 0
        });
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div>
      <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
        <div>
          <h1 className="title-large">
            Overview
          </h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Monitor your knowledge base and recent assistant activity.</p>
        </div>
        <div 
          className="flex-center" 
          style={{
            background: '#ecfdf5',
            border: '1px solid #d1fae5',
            color: '#059669',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: '600',
            gap: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <CheckCircle size={16} />
          System Online
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="bento" style={{ padding: '24px' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <span className="label-eyebrow">Indexed Documents</span>
            <BookOpen size={18} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
            {loading ? '...' : stats.documentsCount}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Policies available for the AI to read.</p>
        </div>

        <div className="bento" style={{ padding: '24px' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <span className="label-eyebrow">Questions Asked</span>
            <MessageSquare size={18} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
            {loading ? '...' : stats.queriesCount}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total questions answered this session.</p>
        </div>

        <div className="bento" style={{ padding: '24px' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <span className="label-eyebrow">AI Engine</span>
            <Cpu size={18} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '14px 0 4px', color: 'var(--text-primary)' }}>
            GPT-4 Active
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>The AI model is running smoothly.</p>
        </div>
      </div>

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '32px',
          alignItems: 'start'
        }}
      >
        {/* Recent Queries */}
        <div className="bento" style={{ padding: '32px' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '600' }}>Recent Questions</h3>
            <Link to="/chat" className="nav-link" style={{ padding: '4px 8px', fontSize: '0.85rem', color: 'var(--accent-gold)', display: 'flex', gap: '4px', alignItems: 'center' }}>
              Open Chat <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading recent activity...</p>
          ) : recentQueries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <Clock size={32} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem' }}>No questions have been asked yet today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentQueries.map((q, idx) => (
                <div 
                  key={idx} 
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card-secondary)',
                    border: '1px solid var(--border-line)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span 
                      className="label-eyebrow"
                      style={{ 
                        fontSize: '10px', 
                        background: 'var(--accent-gold-glow)', 
                        color: 'var(--text-gold)',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      Question
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{q.query_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Integrations Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="bento" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-line)', paddingBottom: '12px', fontWeight: '600' }}>
              System Integrations
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} /> Database
                </span>
                <span style={{ color: '#059669', fontWeight: '500' }}>Connected</span>
              </div>
              <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cloud size={16} /> Cloud Sync
                </span>
                <span style={{ color: '#059669', fontWeight: '500' }}>Active</span>
              </div>
            </div>
          </div>

          <div 
            className="bento" 
            style={{ 
              padding: '24px', 
              background: 'var(--bg-card-secondary)'
            }}
          >
            <Sparkles size={24} style={{ color: 'var(--accent-gold)', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>Add More Documents</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '16px' }}>
              Upload new corporate guidelines or manuals so the AI assistant can learn from them.
            </p>
            <Link to="/documents" className="gold-btn" style={{ width: '100%' }}>
              Upload Documents
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
