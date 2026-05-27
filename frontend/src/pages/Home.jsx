import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { queryService } from '../services/api';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  BookOpen, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

export default function Home() {
  const { user } = useAuth();
  const currentLang = user?.preferredLanguage || 'English';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(searchParams.get('session_id') || null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCitationIdx, setExpandedCitationIdx] = useState(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    async function loadHistory() {
      if (sessionId) {
        setLoading(true);
        try {
          const history = await queryService.getSessionHistory(sessionId);
          if (history && history.length > 0) {
            // History comes ordered by created_at desc, so we reverse it
            const reversed = [...history].reverse();
            const formattedMessages = [];
            reversed.forEach(item => {
              formattedMessages.push({
                sender: 'user',
                text: item.query_text,
                timestamp: new Date(item.created_at)
              });
              formattedMessages.push({
                sender: 'bot',
                text: item.answer || "No answer recorded.",
                timestamp: new Date(item.created_at)
              });
            });
            setMessages(formattedMessages);
          } else {
             setMessages([{ sender: 'bot', text: t(currentLang, 'greeting'), timestamp: new Date() }]);
          }
        } catch (err) {
          console.error("Failed to load history", err);
          setMessages([{ sender: 'bot', text: t(currentLang, 'greeting'), timestamp: new Date() }]);
        } finally {
          setLoading(false);
        }
      } else {
        setMessages([{ sender: 'bot', text: t(currentLang, 'greeting'), timestamp: new Date() }]);
      }
    }
    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId && messages.length === 1 && messages[0].sender === 'bot') {
      setMessages([{ sender: 'bot', text: t(currentLang, 'greeting'), timestamp: new Date() }]);
    }
  }, [currentLang, sessionId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    let activeSession = sessionId;
    if (!activeSession) {
      activeSession = crypto.randomUUID();
      setSessionId(activeSession);
      navigate(`/chat?session_id=${activeSession}`, { replace: true });
    }

    const userQuery = inputText;
    setInputText('');
    
    // Append User Message
    setMessages(prev => [
      ...prev, 
      { sender: 'user', text: userQuery, timestamp: new Date() }
    ]);
    
    setLoading(true);
    try {
      const response = await queryService.ask(userQuery, activeSession);
      
      const botReply = response.answer || "I could not find an answer in the uploaded documents. Please try rephrasing your question.";
      const citations = response.sources || [];

      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          citations: citations,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "I'm sorry, I encountered an error while searching for the answer. Please try again later.",
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setSessionId(null);
    navigate('/chat', { replace: true });
    setMessages([
      {
        sender: 'bot',
        text: "Chat cleared. What else would you like to know?",
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <div className="chat-container">
      {/* Chat Title / Toolbar */}
      <div 
        className="flex-between" 
        style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '20px', 
          borderBottom: '1px solid var(--border-line)',
          marginBottom: '20px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            {t(currentLang, 'chatAssistant')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t(currentLang, 'chatSubtitle')}
          </p>
        </div>

        <button 
          onClick={clearChat}
          style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#ef4444',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
        >
          <Trash2 size={16} /> {t(currentLang, 'clearChat')}
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`message-bubble ${msg.sender === 'user' ? 'message-user' : 'message-bot'}`}
            style={{
              ... (msg.isError ? { borderLeft: '3px solid #ef4444', background: '#fef2f2', color: '#dc2626' } : {}),
            }}
          >
            {/* Avatar header */}
            <div 
              className="flex" 
              style={{ 
                display: 'flex',
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '8px',
                fontSize: '0.8rem',
                color: msg.sender === 'user' ? 'inherit' : 'var(--accent-gold)'
              }}
            >
              {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
              <span className="label-eyebrow" style={{ fontSize: '10px', color: 'inherit' }}>
                {msg.sender === 'user' ? 'YOU' : 'PolicyBot'}
              </span>
            </div>

            {/* Answer body */}
            <p style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{msg.text}</p>

            {/* Knowledge Citations Drawer */}
            {msg.citations && msg.citations.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-line)', paddingTop: '12px' }}>
                <button 
                  onClick={() => setExpandedCitationIdx(expandedCitationIdx === idx ? null : idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-gold)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '600',
                    padding: '4px 0'
                  }}
                >
                  <BookOpen size={14} /> 
                  {expandedCitationIdx === idx ? 'Hide Sources' : `View ${msg.citations.length} Sources`}
                  {expandedCitationIdx === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {expandedCitationIdx === idx && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                    {msg.citations.map((cite, cIdx) => (
                      <div 
                        key={cIdx} 
                        className="citation-card"
                      >
                        <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {cite.document_name || 'Policy Document'}
                          </span>
                        </div>
                        <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          "...{cite.text_snippet || cite.text || cite.content}..."
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading / Thinking indicator */}
        {loading && (
          <div className="message-bubble message-bot" style={{ opacity: 0.9 }}>
            <div className="flex" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)' }}>
              <Bot size={14} />
              <span className="label-eyebrow" style={{ fontSize: '10px' }}>Thinking...</span>
            </div>
            <div className="flex" style={{ display: 'flex', gap: '6px', marginTop: '12px', alignItems: 'center' }}>
              <div 
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent-gold)',
                  animation: 'bounce 0.8s infinite alternate'
                }}
              />
              <div 
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent-gold)',
                  animation: 'bounce 0.8s infinite alternate 0.15s'
                }}
              />
              <div 
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent-gold)',
                  animation: 'bounce 0.8s infinite alternate 0.3s'
                }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                Finding answers...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input tray */}
      <form onSubmit={handleSend} style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
        <input
          type="text"
          className="form-input"
          placeholder={t(currentLang, 'placeholder')}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-sm)' }}
        />
        <button 
          type="submit" 
          className="gold-btn"
          disabled={loading || !inputText.trim()}
          style={{ padding: '0 24px', borderRadius: 'var(--radius-sm)' }}
        >
          <Send size={18} />
        </button>
      </form>

      {/* Simple style override for bouncy loader */}
      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
