import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { queryService, documentService } from '../services/api';
import { 
  Activity, 
  BookOpen, 
  MessageSquare, 
  Clock, 
  Database, 
  Cpu, 
  Sparkles,
  ArrowRight,
  Shield,
  TrendingUp,
  Server
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    documentsCount: 0,
    queriesCount: 0,
    activeSession: 'Active Local DB/RAG',
    systemHealth: 'Online',
    llmEngine: 'Standard OpenAI Fallback Engine'
  });
  const [recentQueries, setRecentQueries] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiLogs, setApiLogs] = useState([]);

  useEffect(() => {
    function loadLogs() {
      const stored = localStorage.getItem('policybot_api_logs');
      if (stored) {
        setApiLogs(JSON.parse(stored));
      }
    }
    loadLogs();
    window.addEventListener('policybot_new_api_log', loadLogs);
    return () => {
      window.removeEventListener('policybot_new_api_log', loadLogs);
    };
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [queriesData, docsData] = await Promise.all([
          queryService.getRecentQueries(5),
          documentService.getDocuments()
        ]);
        
        setRecentQueries(queriesData || []);
        setRecentDocs(docsData || []);
        setStats({
          documentsCount: docsData?.length || 0,
          queriesCount: queriesData?.length || 0,
          activeSession: 'Active Local DB/RAG',
          systemHealth: 'Online',
          llmEngine: 'Standard OpenAI Fallback Enabled'
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
          <h1 className="title-large" style={{ color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
            GoalFlow <span className="text-gold">Dashboard</span>
          </h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Hybrid Vector-Graph Retriever Operational Center</p>
        </div>
        <div 
          className="flex-center" 
          style={{
            background: 'var(--accent-gold-glow)',
            border: '1px solid rgba(242, 187, 68, 0.25)',
            color: 'var(--text-primary)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: '600',
            gap: '8px',
            display: 'flex',
            alignItems: 'center',
            fontFamily: "'Roboto Mono', monospace"
          }}
        >
          <span 
            className="pulse-dot"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent-gold)'
            }}
          />
          NODE STATUS: OPERATIONAL
        </div>
      </div>

      {/* Bento Metrics Grid */}
      <div className="metrics-grid">
        <div className="bento" style={{ padding: '24px' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <span className="label-eyebrow">Indexed Policies</span>
            <BookOpen size={16} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '4px', fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}>
            {loading ? '...' : stats.documentsCount}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Active Document Chunks in DB</p>
        </div>

        <div className="bento" style={{ padding: '24px' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <span className="label-eyebrow">Executed Queries</span>
            <MessageSquare size={16} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '4px', fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}>
            {loading ? '...' : stats.queriesCount}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Session-scoped logs tracked</p>
        </div>

        <div className="bento" style={{ padding: '24px' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <span className="label-eyebrow">LLM CORE ENGINE</span>
            <Cpu size={16} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '14px 0 4px', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
            OpenAI API Fallback
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Self-healing deployment nodes</p>
        </div>
      </div>

      {/* RAG Data Pipeline Schematic Map */}
      <div className="bento" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span className="label-eyebrow">GRAPH-RAG PIPELINE FLOWMAP</span>
            <h3 style={{ fontSize: '1.25rem', marginTop: '4px', fontWeight: '700', color: 'var(--text-primary)' }}>Active Knowledge Retrieval Schematic</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: "'Roboto Mono', monospace", background: 'rgba(242, 187, 68, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
            STATUS: ACTIVE SWEEP
          </span>
        </div>
        
        {/* Flowchart container */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr auto 1fr', gap: '8px', alignItems: 'center', overflowX: 'auto', padding: '10px 0' }}>
          
          {/* Step 1 */}
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-line)', borderRadius: '8px', minWidth: '130px' }}>
            <Database size={20} style={{ color: 'var(--accent-gold)', margin: '0 auto 8px' }} />
            <h4 style={{ fontSize: '0.8rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>1. Ingestion</h4>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>PDF Guidelines</span>
          </div>
          
          {/* Connect 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '30px' }}>
            <span style={{ color: 'var(--border-line)', fontWeight: 'bold', fontSize: '1rem' }}>▶</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f2bb44', display: 'block' }}></span>
          </div>
          
          {/* Step 2 */}
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-line)', borderRadius: '8px', minWidth: '130px' }}>
            <Cpu size={20} style={{ color: '#62d6e8', margin: '0 auto 8px' }} />
            <h4 style={{ fontSize: '0.8rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>2. Chunking</h4>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>512t Overlap</span>
          </div>

          {/* Connect 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '30px' }}>
            <span style={{ color: 'var(--border-line)', fontWeight: 'bold', fontSize: '1rem' }}>▶</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#62d6e8', display: 'block' }}></span>
          </div>

          {/* Step 3 */}
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-line)', borderRadius: '8px', minWidth: '130px' }}>
            <Sparkles size={20} style={{ color: '#81e6a4', margin: '0 auto 8px' }} />
            <h4 style={{ fontSize: '0.8rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>3. Embeddings</h4>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>1536d OpenAI</span>
          </div>

          {/* Connect 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '30px' }}>
            <span style={{ color: 'var(--border-line)', fontWeight: 'bold', fontSize: '1rem' }}>▶</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#81e6a4', display: 'block' }}></span>
          </div>

          {/* Step 4 */}
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-line)', borderRadius: '8px', minWidth: '130px' }}>
            <Activity size={20} style={{ color: '#f55d8f', margin: '0 auto 8px' }} />
            <h4 style={{ fontSize: '0.8rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>4. Cosine Scan</h4>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ChromaDB Local</span>
          </div>

          {/* Connect 4 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '30px' }}>
            <span style={{ color: 'var(--border-line)', fontWeight: 'bold', fontSize: '1rem' }}>▶</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f55d8f', display: 'block' }}></span>
          </div>

          {/* Step 5 */}
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-line)', borderRadius: '8px', minWidth: '130px' }}>
            <Server size={20} style={{ color: '#e0a62d', margin: '0 auto 8px' }} />
            <h4 style={{ fontSize: '0.8rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>5. LLM Synth</h4>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Compliance Reply</span>
          </div>

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
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>Recent Logged Sessions</h3>
            <Link to="/chat" className="nav-link" style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--accent-gold)', display: 'flex', gap: '4px', alignItems: 'center' }}>
              Launch Chat Room <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Fetching session history...</p>
          ) : recentQueries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <Clock size={32} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>No queries executed in the current session.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentQueries.map((q, idx) => (
                <div 
                  key={idx} 
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
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
                        fontSize: '9px', 
                        background: 'rgba(242, 187, 68, 0.1)', 
                        color: 'var(--text-gold)',
                        padding: '2px 8px',
                        fontWeight: '700',
                        borderRadius: '4px'
                      }}
                    >
                      SESSION QUERY
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: "'Roboto Mono', monospace" }}>
                      {new Date(q.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>{q.query_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health Check Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="bento" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-line)', paddingBottom: '12px' }} className="label-eyebrow">
              Environment Integration
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Log DB fallback:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700', fontFamily: "'Roboto Mono', monospace" }}>SQLite Online</span>
              </div>
              <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Vector Store:</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: "'Roboto Mono', monospace", fontWeight: '700' }}>ChromaDB Local</span>
              </div>
              <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Primary DB:</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: "'Roboto Mono', monospace" }}>Neon Postgres</span>
              </div>
              <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Server Target:</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: '700', fontFamily: "'Roboto Mono', monospace" }}>Render Cloud</span>
              </div>
            </div>
          </div>

          <div 
            className="bento" 
            style={{ 
              padding: '24px', 
              border: '1px solid rgba(242, 187, 68, 0.25)'
            }}
          >
            <Sparkles size={24} style={{ color: 'var(--accent-gold)', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'var(--text-primary)' }} className="label-eyebrow">Quick Knowledge Sync</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.5', marginBottom: '16px' }}>
              Upload new corporate guidelines or manuals to instantly build up vector indexes.
            </p>
            <Link to="/documents" className="gold-btn" style={{ padding: '8px 16px', fontSize: '0.75rem', width: '100%', borderRadius: 'var(--radius-sm)' }}>
              Ingest PDF Policies
            </Link>
          </div>
        </div>
      </div>

      {/* Client-Server API Trace Logs */}
      <div className="bento" style={{ padding: '32px', marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span className="label-eyebrow">API TRACE / LIVE LOG CONSOLE</span>
            <h3 style={{ fontSize: '1.25rem', marginTop: '4px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>Recent Client-Server Call Logs</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: "'Roboto Mono', monospace" }}>
            API Root: http://localhost:8000
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: "'Roboto Mono', monospace" }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-line)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 8px' }}>TIMESTAMP</th>
                <th style={{ padding: '12px 8px' }}>METHOD</th>
                <th style={{ padding: '12px 8px' }}>ROUTE</th>
                <th style={{ padding: '12px 8px' }}>STATUS</th>
                <th style={{ padding: '12px 8px' }}>LATENCY</th>
              </tr>
            </thead>
            <tbody>
              {apiLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No client-server interactions recorded in telemetry buffer.
                  </td>
                </tr>
              ) : (
                apiLogs.map((log, idx) => {
                  let methodColor = '#62d6e8';
                  if (log.method === 'POST') methodColor = '#f55d8f';
                  if (log.method === 'DELETE') methodColor = '#ef4444';
                  
                  const isSuccess = log.status.includes('200') || log.status.includes('201') || log.status.includes('OK');
                  
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-line)' }}>
                      <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{log.timestamp}</td>
                      <td style={{ padding: '12px 8px', fontWeight: '700', color: methodColor }}>{log.method}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>{log.route}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          color: isSuccess ? '#27c26c' : '#ef4444', 
                          background: isSuccess ? 'rgba(39, 194, 108, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontWeight: 'bold' 
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--accent-gold)' }}>{log.latency}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
