import React, { useState, useRef, useEffect } from 'react';
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

export default function Home() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am PolicyBot. Ask me any question regarding your corporate policies, security guidelines, or operational manuals.",
      timestamp: new Date()
    }
  ]);
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userQuery = inputText;
    setInputText('');
    
    // Append User Message
    setMessages(prev => [
      ...prev, 
      { sender: 'user', text: userQuery, timestamp: new Date() }
    ]);
    
    setLoading(true);
    try {
      const response = await queryService.ask(userQuery);
      
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
            Chat Assistant
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Ask questions about your company policies and get instant answers.
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
          <Trash2 size={16} /> Clear Chat
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
          placeholder="Ask a question (e.g. 'What is our data privacy policy?')"
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
