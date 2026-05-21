import React, { useState, useEffect } from 'react';
import { documentService } from '../services/api';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Database, 
  RefreshCw,
  Clock,
  Sparkles,
  Terminal
} from 'lucide-react';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [cliLogs, setCliLogs] = useState([
    "SYS: Compliance Node Standby. Ingestion engine ready.",
    "DB: Connected to active SQLite relational fallback storage.",
    "RAG: ChromaDB Local Vector store collection ready."
  ]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to retrieve policy documents list.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setMessage({ text: '', type: '' });
      setCliLogs(prev => [
        ...prev,
        `LATCH: Payload detected [${selectedFile.name}] (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB).`,
        `SYS: Awaiting index trigger...`
      ]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage({ text: 'Parsing document nodes & computing vector embeddings...', type: 'info' });
    
    // Add real pipeline trigger logs
    setCliLogs([
      `SYS: Starting ingestion for file payload: [${file.name}]`,
      `SYS: Computing payload size metrics (${(file.size / 1024 / 1024).toFixed(2)} MB)...`,
      `API: POST /v1/documents/ - Dispatching payload content...`
    ]);

    try {
      const response = await documentService.uploadFile(file);
      
      // Real API success logs
      setCliLogs(prev => [
        ...prev,
        `API: POST /v1/documents/ - HTTP 201 Created`,
        `SYS: Ingestion pipeline execution complete.`,
        `DB: Database record committed (ID: ${response.id}).`,
        `RAG: Chroma local vector indexing complete. Status: ${response.status || 'indexed'}.`,
        `SYS: Policy successfully synchronised. Node standby.`
      ]);

      setMessage({ text: `Successfully indexed: ${file.name}! Vector DB synchronised.`, type: 'success' });
      setFile(null);
      // Reset input element
      const fileInput = document.getElementById('policy-file-upload');
      if (fileInput) fileInput.value = '';
      
      // Refresh list
      await fetchDocuments();
    } catch (err) {
      console.error(err);
      
      const errorMsg = err.response?.data?.detail || 'An error occurred during file ingestion and embedding.';
      const statusText = err.response ? `HTTP ${err.response.status} ${err.response.statusText || 'Error'}` : 'Network Error';
      
      setCliLogs(prev => [
        ...prev,
        `API: POST /v1/documents/ - ${statusText}`,
        `ERROR: Ingestion pipeline execution failed: ${errorMsg}`,
        `SYS: System halted. Awaiting fresh payload.`
      ]);

      setMessage({ 
        text: errorMsg, 
        type: 'error' 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-large" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>Policy <span className="text-gold">Management</span></h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Upload, index, and synchronise guideline sources into the Vector-Graph Network</p>
        </div>
        <button 
          onClick={fetchDocuments}
          className="flex-center"
          style={{
            background: 'var(--bg-bento)',
            border: '1px solid var(--border-line)',
            color: 'var(--text-primary)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            gap: '8px',
            display: 'flex',
            alignItems: 'center',
            transition: 'var(--transition-fast)',
            fontFamily: 'var(--font-display)',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-gold)';
            e.currentTarget.style.color = 'var(--accent-gold)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-line)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Sync Store
        </button>
      </div>

      {message.text && (
        <div 
          style={{
            background: message.type === 'success' ? 'rgba(39, 194, 108, 0.1)' : 
                        message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(242, 187, 68, 0.1)',
            border: `1px solid ${
              message.type === 'success' ? 'rgba(39, 194, 108, 0.2)' : 
              message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(242, 187, 68, 0.2)'
            }`,
            borderLeft: `4px solid ${
              message.type === 'success' ? '#27c26c' : 
              message.type === 'error' ? '#ef4444' : 'var(--accent-gold)'
            }`,
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '32px',
            color: message.type === 'error' ? '#f87171' : 
                   message.type === 'success' ? '#4ade80' : 'var(--accent-gold)',
            fontSize: '0.875rem',
            alignItems: 'center',
            gap: '12px',
            display: 'flex',
            boxShadow: 'var(--shadow-bento)'
          }}
        >
          {message.type === 'success' ? (
            <CheckCircle size={18} style={{ color: 'var(--accent-gold)' }} />
          ) : message.type === 'error' ? (
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
          ) : (
            <RefreshCw size={18} className="spin-anim" style={{ color: 'var(--accent-gold)' }} />
          )}
          <span style={{ fontWeight: '500' }}>{message.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Upload Form Box */}
        <div className="bento" style={{ padding: '32px' }}>
          <span className="label-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>UPLOADER PORTAL</span>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
            Ingest Corporate <span className="text-gold">Policy</span>
          </h3>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div 
              style={{
                border: '1px dashed var(--border-line)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px 24px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-gold)';
                e.currentTarget.style.background = 'rgba(242, 187, 68, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-line)';
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
              }}
              onClick={() => document.getElementById('policy-file-upload').click()}
            >
              <input 
                id="policy-file-upload"
                type="file" 
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <UploadCloud size={40} style={{ color: file ? 'var(--accent-gold)' : 'var(--text-secondary)', marginBottom: '16px', transition: 'color 0.2s' }} />
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '6px', fontWeight: '600', fontFamily: file ? 'var(--font-mono)' : 'inherit' }}>
                {file ? file.name : 'Select Corporate Policy PDF'}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                {file ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drag and drop or click to browse'}
              </p>
            </div>

            <button 
              type="submit" 
              className="gold-btn flex-center"
              disabled={uploading || !file}
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                gap: '10px'
              }}
            >
              <UploadCloud size={16} /> 
              {uploading ? 'Processing Guidelines...' : 'Index Guideline PDF'}
            </button>
          </form>

          {/* CLI Parsing Terminal */}
          <div style={{ marginTop: '24px' }}>
            <div className="flex" style={{ display: 'flex', gap: '8px', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: '700', alignItems: 'center', marginBottom: '10px', fontFamily: 'var(--font-mono)' }}>
              <Terminal size={14} className="text-gold" />
              <span>INGESTION CLI CONSOLE</span>
            </div>
            <div 
              style={{
                background: '#030303',
                border: '1px solid var(--border-line)',
                borderRadius: '6px',
                padding: '16px',
                height: '180px',
                overflowY: 'auto',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.85)',
                lineHeight: '1.6'
              }}
            >
              {cliLogs.map((log, lIdx) => (
                <div key={lIdx} style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#475569', userSelect: 'none' }}>{(lIdx + 1).toString().padStart(2, '0')}</span>
                  <span style={{ 
                    color: log.startsWith('ERROR:') ? '#ef4444' : 
                           log.startsWith('SYS:') ? '#10b981' : 
                           log.startsWith('NEON_DB:') ? '#f2bb44' : '#38bdf8' 
                  }}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-line)' }}>
            <div className="flex" style={{ display: 'flex', gap: '8px', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: '700', alignItems: 'center' }}>
              <Sparkles size={14} /> TECHNICAL NODE DETAILS
            </div>
            <ul style={{ 
              paddingLeft: '16px', 
              color: 'var(--text-secondary)', 
              fontSize: '0.8rem', 
              marginTop: '12px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              lineHeight: '1.4'
            }}>
              <li>Extracts raw markdown segments from your policy guidelines PDF.</li>
              <li>Performs semantic embedding using standard cosine comparison.</li>
              <li>Stores vector indices inside localized Neon Postgres databases.</li>
            </ul>
          </div>
        </div>

        {/* Database Guideline Grid */}
        <div className="bento" style={{ padding: '32px' }}>
          <span className="label-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>VECTOR NETWORK</span>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
            Index Synchronized <span className="text-gold">Policies</span>
          </h3>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Synchronising documents database...</p>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <Database size={40} style={{ margin: '0 auto 16px', opacity: 0.3, color: 'var(--accent-gold)' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No guidelines index stored in the database.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-muted)' }}>Use the file uploader to synchronize.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {documents.map((doc, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-line)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'var(--transition-fast)',
                    boxShadow: 'var(--shadow-bento)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-gold)';
                    e.currentTarget.style.boxShadow = '0 6px 20px -8px rgba(242,187,68,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-line)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-bento)';
                  }}
                >
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      background: 'rgba(242, 187, 68, 0.05)',
                      border: '1px solid rgba(242, 187, 68, 0.15)',
                      color: 'var(--accent-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.875rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '600' }}>
                      {doc.filename || doc.name}
                    </h4>
                    <div className="flex" style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                      <span className="flex" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Clock size={12} /> {new Date(doc.uploaded_at || doc.created_at).toLocaleDateString()}
                      </span>
                      <span 
                        style={{ 
                          color: 'var(--accent-gold)', 
                          background: 'rgba(242, 187, 68, 0.08)', 
                          padding: '2px 8px',
                          borderRadius: '2px',
                          fontWeight: '700',
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          fontFamily: 'monospace'
                        }}
                      >
                        Indexed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1s infinite linear;
        }
      `}</style>
    </div>
  );
}
