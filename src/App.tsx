import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const LIVE_CHAT_URL = "https://support.dolphi.ai/live-chat";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  escalated?: boolean;
  confidence?: number;
  response_type?: string;
  timestamp?: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am DOLPHI, your document-based customer service assistant. I can answer questions based on the documents that have been uploaded to my knowledge base. What would you like to know?',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => Math.random().toString(36).substring(7).toUpperCase());
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [handoffTriggered, setHandoffTriggered] = useState(false);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    fetch('/api/me').then(res => res.json()).then(data => {
      if (data && data.username) setUsername(data.username);
    }).catch(() => {});

    const setupMarked = () => {
      if ((window as any).marked) {
        (window as any).marked.setOptions({
          breaks: true,
          mangle: false,
          headerIds: false
        });
      } else {
        setTimeout(setupMarked, 50);
      }
    };
    setupMarked();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTime = () => {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMsg.content, threshold: 0.35 }),
        signal: controller.signal
      });
      if (!res.ok) {
        let errStr = 'Server error';
        try {
           const errData = await res.json();
           if (errData.error) errStr = errData.error;
        } catch(e) {}
        throw new Error(errStr);
      }
      const data = await res.json();
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.message || 'Server error', 
        escalated: data.escalated,
        confidence: data.confidence,
        response_type: data.response_type,
        timestamp: getTime()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const botMsg: Message = { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: 'Generation stopped',
          response_type: 'aborted',
          timestamp: getTime()
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const botMsg: Message = { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: err.message || 'Connection failed.',
          response_type: 'error',
          timestamp: getTime()
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleHandoff = async () => {
    if (handoffTriggered) return;
    setHandoffTriggered(true);

    const connectMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Connecting you to a human support representative. Please hold on while I transfer your conversation.',
      timestamp: getTime()
    };
    setMessages(prev => [...prev, connectMsg]);

    const currentIsoTime = new Date().toISOString();
    try {
      fetch('/api/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, timestamp: currentIsoTime })
      }).catch(err => console.error('Handoff log failed:', err));
    } catch (err) {
      console.error('Handoff fetch failed:', err);
    }

    setTimeout(() => {
      const cardMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        response_type: 'handoff_card',
        timestamp: getTime()
      };
      setMessages(prev => [...prev, cardMsg]);
    }, 1500);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <path fill="#F5C518" d="M12.5 25C10 25 7.5 24 5 22C8 20 12 18 18 19C24 20 28 17 32 15C33 18 35 22 38 25C33 26 27 26 22 23C18 20 15 25 12.5 25Z" />
            </svg>
          </div>
          <div className="header-text">
            <h1>DOLPHI</h1>
            <p>Hybrid RAG Service Engine</p>
          </div>
        </div>
        <div className="header-status">
          {username && (
            <div style={{ fontSize: '12px', color: 'white', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>Hi, {username}</span>
              <a href="/logout" style={{ color: '#F5C518', textDecoration: 'underline' }}>Logout</a>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <section className="chat-window">
          <div className="chat-scroll-area">
            {messages.length === 0 && (
              <div className="empty-state">
                <h2>System Ready</h2>
                <p>Waiting for user input...</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                <div className="message-bubble" style={
                  msg.response_type === 'handoff_card' ? { padding: 0, backgroundColor: 'transparent' } :
                  msg.response_type === 'aborted' ? { borderLeft: '2px solid #E2E8F0' } :
                  msg.response_type === 'error' ? { borderLeft: '2px solid #DC2626' } : {}
                }>
                  {msg.role === 'assistant' ? (
                    msg.response_type === 'handoff_card' ? (
                      <div className="handoff-card">
                        <div style={{ color: '#1A3A5C', fontWeight: 700, fontSize: '14px' }}>Human Support Options</div>
                        <div style={{ margin: '8px 0', borderTop: '1px solid #E2E8F0' }}></div>
                        
                        <div style={{ padding: '10px 0', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: '#F5C518', fontSize: '16px', marginRight: '10px', verticalAlign: 'middle' }}>✉</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#1A3A5C', fontSize: '13px', fontWeight: 'bold' }}>Email Support</span>
                            <a href="mailto:support@dolphi.ai" style={{ fontSize: '12px', color: '#94A3B8', textDecoration: 'none' }} 
                               onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} 
                               onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>support@dolphi.ai</a>
                          </div>
                        </div>

                        <div style={{ padding: '10px 0', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: '#F5C518', fontSize: '16px', marginRight: '10px', verticalAlign: 'middle' }}>☎</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#1A3A5C', fontSize: '13px', fontWeight: 'bold' }}>Phone Support</span>
                            <a href="tel:+63288880000" style={{ fontSize: '12px', color: '#94A3B8', textDecoration: 'none' }}>+63 2 8888 0000</a>
                          </div>
                        </div>

                        <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: '#F5C518', fontSize: '16px', marginRight: '10px', verticalAlign: 'middle' }}>◉</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#1A3A5C', fontSize: '13px', fontWeight: 'bold' }}>Live Chat</span>
                            <button 
                              type="button"
                              onClick={() => window.open(LIVE_CHAT_URL, '_blank')}
                              style={{
                                background: '#1A3A5C', color: 'white', fontSize: '11px', padding: '4px 12px',
                                borderRadius: '20px', border: 'none', cursor: 'pointer', letterSpacing: '0.05em', marginTop: '4px', alignSelf: 'flex-start'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = '#F5C518'; e.currentTarget.style.color = '#1A3A5C'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = '#1A3A5C'; e.currentTarget.style.color = 'white'; }}
                            >
                              START LIVE CHAT
                            </button>
                          </div>
                        </div>

                        <div style={{ margin: '8px 0', borderTop: '1px solid #E2E8F0' }}></div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Session ID: {sessionId}</div>
                      </div>
                    ) : (
                      <>
                        {msg.escalated && msg.response_type !== 'smalltalk' && (
                          <div className="escalation-warning">
                            <p className="escalation-prefix">⚠️ ESCALATED TO HUMAN SUPPORT</p>
                            <p>Retrieval confidence ({msg.confidence?.toFixed(3)}) is below the threshold. A human support representative has been notified to follow up on this session.</p>
                          </div>
                        )}
                        {msg.response_type === 'aborted' ? (
                          <span style={{ fontStyle: 'italic', color: '#94A3B8', fontSize: '13px' }}>Generation stopped</span>
                        ) : msg.response_type === 'error' ? (
                          <span><strong style={{ color: '#DC2626' }}>Error:</strong> <span style={{ color: '#DC2626' }}>{msg.content}</span></span>
                        ) : (
                          <>
                            <div dangerouslySetInnerHTML={{ __html: (window as any).marked ? (window as any).marked.parse(msg.content) : msg.content }} />
                            <div style={{ marginTop: '8px' }}>
                              {handoffTriggered ? (
                                <span style={{ fontSize: '12px', color: '#94A3B8', cursor: 'default' }}>Agent notified ✓</span>
                              ) : (
                                <span 
                                  onClick={handleHandoff}
                                  style={{ fontSize: '12px', color: '#94A3B8', cursor: 'pointer', textDecoration: 'none' }}
                                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                                >Talk to a human agent →</span>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )
                  ) : (
                    msg.content
                  )}
                </div>
                <span className="message-annotation">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {loading && (
              <div className="message-wrapper assistant">
                 <div className="message-bubble">
                   <div className="typing-indicator">
                     <div className="typing-dot"></div>
                     <div className="typing-dot"></div>
                     <div className="typing-dot"></div>
                   </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area-container">
            <form onSubmit={handleSend} style={{ display: 'flex', width: '100%', gap: '12px' }}>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Enter query for knowledge base retrieval..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
              </div>
              {loading ? (
                <button 
                  type="button" 
                  onClick={() => abortController?.abort()}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #DC2626',
                    color: '#DC2626',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    letterSpacing: '0.05em',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  STOP
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()}>SEND</button>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Developed by Taruc & Alcantara | DOLPHI Customer Service AI</p>
      </footer>
    </div>
  );
}
