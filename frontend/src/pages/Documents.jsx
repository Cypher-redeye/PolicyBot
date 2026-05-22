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
  Trash2
} from 'lucide-react';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to retrieve documents.', type: 'error' });
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
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage({ text: 'Uploading document...', type: 'info' });

    try {
      await documentService.uploadFile(file);

      setMessage({ text: `Successfully uploaded: ${file.name}`, type: 'success' });
      setFile(null);
      // Reset input element
      const fileInput = document.getElementById('policy-file-upload');
      if (fileInput) fileInput.value = '';
      
      // Refresh list
      await fetchDocuments();
    } catch (err) {
      console.error(err);
      
      const errorMsg = err.response?.data?.detail || 'An error occurred during file upload.';
      
      setMessage({ 
        text: errorMsg, 
        type: 'error' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;
    setDeleting(docId);
    try {
      await documentService.deleteDocument(docId);
      setMessage({ text: `Deleted: ${filename}`, type: 'success' });
      await fetchDocuments();
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to delete document.', type: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-large" style={{ fontWeight: '700' }}>Documents</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Upload documents for your AI assistant to learn from.</p>
        </div>
        <button 
          onClick={fetchDocuments}
          className="flex-center"
          style={{
            background: 'var(--bg-card-secondary)',
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
            fontWeight: '500'
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
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Refresh
        </button>
      </div>

      {message.text && (
        <div 
          style={{
            background: message.type === 'success' ? '#ecfdf5' : 
                        message.type === 'error' ? '#fef2f2' : '#f0fdfa',
            border: `1px solid ${
              message.type === 'success' ? '#d1fae5' : 
              message.type === 'error' ? '#fee2e2' : '#ccfbf1'
            }`,
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '32px',
            color: message.type === 'error' ? '#dc2626' : 
                   message.type === 'success' ? '#059669' : '#0f766e',
            fontSize: '0.9rem',
            alignItems: 'center',
            gap: '12px',
            display: 'flex'
          }}
        >
          {message.type === 'success' ? (
            <CheckCircle size={18} />
          ) : message.type === 'error' ? (
            <AlertTriangle size={18} />
          ) : (
            <RefreshCw size={18} className="spin-anim" />
          )}
          <span style={{ fontWeight: '500' }}>{message.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Upload Form Box */}
        <div className="bento" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: '600' }}>
            Upload File
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Select a PDF document to add to the knowledge base.
          </p>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div 
              style={{
                border: '1px dashed var(--border-line)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px 24px',
                textAlign: 'center',
                background: 'var(--bg-card-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-line)';
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
              <UploadCloud size={40} style={{ color: file ? 'var(--accent-gold)' : 'var(--text-secondary)', marginBottom: '16px', transition: 'color 0.2s', margin: '0 auto' }} />
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '6px', fontWeight: '500' }}>
                {file ? file.name : 'Select Document'}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {file ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Click to browse for a file'}
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
                fontSize: '0.95rem',
                gap: '10px'
              }}
            >
              <UploadCloud size={18} /> 
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        </div>

        {/* Database Guideline Grid */}
        <div className="bento" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: '600' }}>
            Available Documents
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            These documents are currently available for the AI to read.
          </p>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading documents...</p>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <Database size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.95rem' }}>No documents uploaded yet.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Use the file uploader to add documents.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {documents.map((doc, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card-secondary)',
                    border: '1px solid var(--border-line)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-line)';
                  }}
                >
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      background: 'var(--accent-gold-glow)',
                      color: 'var(--accent-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '500' }}>
                      {doc.filename || doc.name}
                    </h4>
                    <div className="flex" style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                      <span className="flex" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Clock size={14} /> {new Date(doc.uploaded_at || doc.created_at).toLocaleDateString()}
                      </span>
                      {doc.status === 'indexed' && (
                        <span 
                          style={{ 
                            color: '#059669', 
                            background: '#ecfdf5', 
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '500',
                            fontSize: '0.75rem'
                          }}
                        >
                          Indexed
                        </span>
                      )}
                      {(doc.status === 'uploaded' || doc.status === 'processing') && (
                        <span 
                          className="flex"
                          style={{ 
                            color: '#d97706', 
                            background: '#fffbeb', 
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '500',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <RefreshCw size={10} className="spin-anim" /> Indexing...
                        </span>
                      )}
                      {doc.status === 'failed' && (
                        <span 
                          style={{ 
                            color: '#dc2626', 
                            background: '#fef2f2', 
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '500',
                            fontSize: '0.75rem'
                          }}
                        >
                          Failed
                        </span>
                      )}
                      {!['indexed', 'uploaded', 'processing', 'failed'].includes(doc.status) && (
                        <span 
                          style={{ 
                            color: '#059669', 
                            background: '#ecfdf5', 
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '500',
                            fontSize: '0.75rem'
                          }}
                        >
                          Indexed
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id, doc.filename || doc.name);
                    }}
                    disabled={deleting === doc.id}
                    title="Delete document"
                    style={{
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: 'var(--text-secondary)',
                      cursor: deleting === doc.id ? 'wait' : 'pointer',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'var(--transition-fast)',
                      opacity: deleting === doc.id ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.background = '#fef2f2';
                      e.currentTarget.style.borderColor = '#fee2e2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
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
