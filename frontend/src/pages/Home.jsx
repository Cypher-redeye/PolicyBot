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
  ChevronUp,
  Download,
  Mic,
  MicOff,
  Volume2,
  Pause,
  Play,
  Square
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import { jsPDF } from "jspdf";

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
  const [isListening, setIsListening] = useState(false);
  const [playingMsgIdx, setPlayingMsgIdx] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  
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
            setMessages(prev => {
              if (prev.some(m => m.sender === 'user')) return prev;
              return [{ sender: 'bot', text: t(currentLang, 'greeting'), timestamp: new Date() }];
            });
          }
        } catch (err) {
          console.error("Failed to load history", err);
          setMessages(prev => {
            if (prev.some(m => m.sender === 'user')) return prev;
            return [{ sender: 'bot', text: t(currentLang, 'greeting'), timestamp: new Date() }];
          });
        } finally {
          setLoading(false);
        }
      } else {
        setMessages(prev => {
          if (prev.some(m => m.sender === 'user')) return prev;
          return [{ sender: 'bot', text: t(currentLang, 'greeting'), timestamp: new Date() }];
        });
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
      const followUps = response.follow_ups || [];

      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          citations: citations,
          followUps: followUps,
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

  const handleFollowUpClick = (question) => {
    setInputText(question);
    // Need a tiny timeout to let state update before sending
    setTimeout(() => {
      document.getElementById('send-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Input. Try Chrome or Edge.");
      return;
    }
    const getLangCode = (lang) => {
      const map = {
        'Hindi': 'hi-IN',
        'Tamil': 'ta-IN',
        'Telugu': 'te-IN',
        'Bengali': 'bn-IN',
        'Marathi': 'mr-IN',
        'Gujarati': 'gu-IN',
        'Kannada': 'kn-IN',
        'Malayalam': 'ml-IN',
        'Punjabi': 'pa-IN',
        'English': 'en-US'
      };
      return map[lang] || 'en-US';
    };
    recognition.lang = getLangCode(currentLang);
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const getVoiceForLang = (langCode) => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    
    // Normalize target (e.g. 'hi-IN' -> 'hi-in')
    const normalizedTarget = langCode.replace('_', '-').toLowerCase();
    const targetBase = normalizedTarget.split('-')[0];
    
    // 1. Exact match (case insensitive, allowing _ or -)
    let voice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === normalizedTarget);
    
    // 2. Base language match (e.g. 'hi' matches 'hi-IN', 'hi')
    if (!voice) {
      voice = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(targetBase));
    }
    
    // 3. Fallback to matching language name in voice name (e.g., "Google हिन्दी" on Android)
    if (!voice) {
      const langNames = {
        'hi': ['hindi', 'हिन्दी'],
        'ta': ['tamil', 'தமிழ்'],
        'te': ['telugu', 'తెలుగు'],
        'bn': ['bengali', 'বাংলা'],
        'mr': ['marathi', 'मराठी'],
        'gu': ['gujarati', 'ગુજરાતી'],
        'kn': ['kannada', 'ಕನ್ನಡ'],
        'ml': ['malayalam', 'മലയാളം'],
        'pa': ['punjabi', 'ਪੰਜਾਬੀ']
      };
      const namesToMatch = langNames[targetBase];
      if (namesToMatch) {
        voice = voices.find(v => namesToMatch.some(name => v.name.toLowerCase().includes(name)));
      }
    }
    
    return voice || null;
  };

  const speakText = (text, idx) => {
    if (!('speechSynthesis' in window)) return;

    // If currently speaking this exact message
    if (playingMsgIdx === idx) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    // Stop anything currently playing
    window.speechSynthesis.cancel();
    setIsPaused(false);
    setPlayingMsgIdx(idx);

    const utterance = new SpeechSynthesisUtterance(text);
    
    const langMap = {
      'Hindi': 'hi-IN',
      'Tamil': 'ta-IN',
      'Telugu': 'te-IN',
      'Bengali': 'bn-IN',
      'Marathi': 'mr-IN',
      'Gujarati': 'gu-IN',
      'Kannada': 'kn-IN',
      'Malayalam': 'ml-IN',
      'Punjabi': 'pa-IN',
      'English': 'en-US'
    };
    const targetLang = langMap[currentLang] || 'en-US';
    utterance.lang = targetLang;
    
    const voice = getVoiceForLang(targetLang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      setPlayingMsgIdx(null);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setPlayingMsgIdx(null);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setPlayingMsgIdx(null);
    setIsPaused(false);
  };

  // Ensure voices are loaded (Chrome sometimes needs this to populate voices)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const exportChat = () => {
    const doc = new jsPDF();
    let y = 15;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("PolicyBot Chat Transcript", 15, y);
    y += 15;
    
    doc.setFontSize(11);
    
    messages.forEach((m) => {
      // Check if we need a new page before writing
      if (y > 275) {
        doc.addPage();
        y = 15;
      }
      
      const time = m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sender = m.sender === 'user' ? 'YOU' : 'POLICYBOT';
      
      // Draw header (Time & Sender)
      doc.setFont("helvetica", "bold");
      doc.setTextColor(m.sender === 'user' ? 40 : 184, 134, 11); // Dark grey vs Gold/Brownish
      doc.text(`[${time}] ${sender}:`, 15, y);
      y += 6;
      
      // Draw message text
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      
      // Split text to fit within page width (180mm out of 210mm)
      const splitText = doc.splitTextToSize(m.text, 180);
      
      splitText.forEach(line => {
        if (y > 280) {
          doc.addPage();
          y = 15;
        }
        doc.text(line, 15, y);
        y += 6;
      });
      
      y += 8; // Extra padding between messages
    });
    
    doc.save(`PolicyBot_Chat_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const clearChat = async () => {
    if (sessionId) {
      try {
        await queryService.deleteSession(sessionId);
      } catch (err) {
        console.error("Failed to delete chat", err);
      }
    }
    setSessionId(null);
    navigate('/chat', { replace: true });
    setMessages([
      {
        sender: 'bot',
        text: "Chat deleted. What else would you like to know?",
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

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={exportChat}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-line)',
              color: 'var(--text-primary)',
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
          >
            <Download size={16} /> Export
          </button>
          
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
            <Trash2 size={16} /> {t(currentLang, 'clearChat') || 'Delete Chat'}
          </button>
        </div>
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
              <span className="label-eyebrow" style={{ fontSize: '10px', color: 'inherit', flex: 1 }}>
                {msg.sender === 'user' ? 'YOU' : 'PolicyBot'}
              </span>
              {msg.sender === 'bot' && !msg.isError && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {playingMsgIdx === idx ? (
                    <>
                      <button 
                        onClick={() => speakText(msg.text, idx)}
                        title={isPaused ? "Resume" : "Pause"}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px', opacity: 0.8 }}
                      >
                        {isPaused ? <Play size={14} /> : <Pause size={14} />}
                      </button>
                      <button 
                        onClick={stopSpeaking}
                        title="Stop"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0.8 }}
                      >
                        <Square size={14} fill="currentColor" />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => speakText(msg.text, idx)}
                      title="Read Aloud"
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                    >
                      <Volume2 size={14} />
                    </button>
                  )}
                </div>
              )}
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
                            {cite.document_name || cite.metadata?.name || 'Policy Document'}
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

            {/* Smart Follow-Ups */}
            {msg.followUps && msg.followUps.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                {msg.followUps.map((q, fIdx) => (
                  <button
                    key={fIdx}
                    onClick={() => handleFollowUpClick(q)}
                    style={{
                      background: 'var(--bg-card-secondary)',
                      border: '1px solid var(--border-line)',
                      color: 'var(--text-primary)',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, color 0.2s',
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
                    {q}
                  </button>
                ))}
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
      <form id="send-form" onSubmit={handleSend} style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={toggleListen}
          title="Voice Input"
          style={{
            background: isListening ? '#fee2e2' : 'var(--bg-card)',
            border: `1px solid ${isListening ? '#ef4444' : 'var(--border-line)'}`,
            color: isListening ? '#ef4444' : 'var(--text-secondary)',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <input
          type="text"
          className="form-input"
          placeholder={isListening ? "Listening..." : t(currentLang, 'placeholder')}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading || isListening}
          style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-sm)' }}
        />
        <button 
          type="submit" 
          className="gold-btn"
          disabled={loading || !inputText.trim()}
          style={{ padding: '0 24px', borderRadius: 'var(--radius-sm)', height: '48px' }}
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
