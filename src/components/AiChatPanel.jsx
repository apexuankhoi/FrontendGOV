import React, { useState, useEffect, useRef } from 'react';
import api, { BASE_URL } from '../lib/api';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { Bot, Send, X, Trash2, FileDown, MessageCircle } from 'lucide-react';

const MarkdownRender = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.7 }}>
      {lines.map((line, i) => {
        if (line.startsWith('# '))   return <h3 key={i} style={{ fontSize: '1rem', fontWeight: 800, margin: '12px 0 6px', color: 'var(--primary-dark)' }}>{line.slice(2)}</h3>;
        if (line.startsWith('## '))  return <h4 key={i} style={{ fontSize: '.95rem', fontWeight: 700, margin: '10px 0 5px', color: 'var(--primary)' }}>{line.slice(3)}</h4>;
        if (line.startsWith('### ')) return <h5 key={i} style={{ fontSize: '.9rem', fontWeight: 700, margin: '8px 0 4px' }}>{line.slice(4)}</h5>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: 16, marginBottom: 2, fontSize: '.85rem' }}>{line.slice(2)}</li>;
        if (/^\d+\.\s/.test(line)) return <li key={i} style={{ marginLeft: 16, marginBottom: 2, fontSize: '.85rem' }}>{line.replace(/^\d+\.\s/, '')}</li>;
        if (!line.trim()) return <br key={i} />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return <p key={i} style={{ margin: '2px 0', fontSize: '.85rem' }}>{parts.map((p,j) => j%2===1 ? <strong key={j}>{p}</strong> : p)}</p>;
      })}
    </div>
  );
};

const AiChatPanel = ({ targetId, targetType, targetTitle, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const apiBase = targetType === 'task' ? '/tasks' : '/documents';

  // Load lich su chat
  useEffect(() => {
    if (isOpen && targetId) {
      setLoadingHistory(true);
      api.get(`${apiBase}/${targetId}/chat`, { params: { type: targetType } })
        .then(res => setMessages(res.data))
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
  }, [isOpen, targetId]);

  // Auto scroll xuong cuoi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input khi mo
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    
    // Optimistic: hien tin nhan user ngay
    const tempUserMsg = { _id: 'temp-' + Date.now(), role: 'user', content: userText, createdAt: new Date() };
    setMessages(prev => [...prev, tempUserMsg]);
    
    setLoading(true);
    try {
      const res = await api.post(`${apiBase}/${targetId}/chat`, {
        message: userText,
        type: targetType
      });
      
      // Thay tin nhan tam bang tin nhan that
      setMessages(prev => {
        const filtered = prev.filter(m => m._id !== tempUserMsg._id);
        return [...filtered, res.data.userMessage, res.data.aiMessage];
      });
      
      if (res.data.generatedFile) {
        toast.success('AI da tao file dinh kem!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Loi gui tin nhan');
      setMessages(prev => prev.filter(m => m._id !== tempUserMsg._id));
    }
    setLoading(false);
  };

  const handleClear = async () => {
    Swal.fire({
      title: 'Xóa lịch sử?',
      text: "Xóa toàn bộ lịch sử chat với AI?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`${apiBase}/${targetId}/chat`, { params: { type: targetType } });
          setMessages([]);
          toast.success('Đã xóa lịch sử');
        } catch { toast.error('Lỗi xóa lịch sử'); }
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)',
        zIndex: 9998, transition: 'opacity .3s'
      }} />
      
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', maxWidth: '100vw',
        background: 'var(--bg-1)', boxShadow: '-4px 0 24px rgba(0,0,0,.15)',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight .3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={22} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '.95rem' }}>AI Chat</div>
              <div style={{ fontSize: '.75rem', opacity: .8 }}>{targetTitle || 'Van ban'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleClear} title="Xoa lich su" style={{
              background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 6,
              padding: '6px 8px', cursor: 'pointer', color: '#fff', display: 'flex'
            }}><Trash2 size={16} /></button>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 6,
              padding: '6px 8px', cursor: 'pointer', color: '#fff', display: 'flex'
            }}><X size={16} /></button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 12
        }}>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--tx-4)' }}>Dang tai...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--tx-4)' }}>
              <Bot size={48} style={{ opacity: .3, marginBottom: 12 }} />
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Chat voi AI ve van ban nay</p>
              <div style={{ fontSize: '.8rem', textAlign: 'left', maxWidth: 280, margin: '0 auto' }}>
                <p>Thu hoi:</p>
                <p style={{ color: 'var(--brand-blue)' }}>"Tom tat van ban nay"</p>
                <p style={{ color: 'var(--brand-blue)' }}>"Soan cong van tra loi"</p>
                <p style={{ color: 'var(--brand-blue)' }}>"Trich xuat so lieu"</p>
                <p style={{ color: 'var(--brand-blue)' }}>"Tao file Word bao cao"</p>
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg._id} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #2563eb, #3b82f6)' 
                    : 'var(--bg-2)',
                  color: msg.role === 'user' ? '#fff' : 'var(--tx-1)',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                  borderBottomLeftRadius: msg.role === 'user' ? 12 : 4,
                  boxShadow: '0 1px 3px rgba(0,0,0,.08)'
                }}>
                  {msg.role === 'user' ? (
                    <p style={{ margin: 0, fontSize: '.85rem', lineHeight: 1.5 }}>{msg.content}</p>
                  ) : (
                    <MarkdownRender text={msg.content} />
                  )}
                  
                  {/* File dinh kem tu AI */}
                  {msg.generatedFile && (
                    <a href={`${BASE_URL}/${msg.generatedFile.filePath}`}
                       target="_blank" rel="noreferrer"
                       style={{
                         display: 'flex', alignItems: 'center', gap: 6,
                         marginTop: 8, padding: '6px 10px', borderRadius: 8,
                         background: msg.role === 'user' ? 'rgba(255,255,255,.15)' : '#EFF6FF',
                         border: '1px solid #BFDBFE', fontSize: '.8rem',
                         color: 'var(--brand-blue)', textDecoration: 'none'
                       }}>
                      <FileDown size={14} />
                      <span>{msg.generatedFile.fileName}</span>
                    </a>
                  )}
                  
                  <div style={{ fontSize: '.7rem', opacity: .5, marginTop: 4, textAlign: 'right' }}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 16px', borderRadius: 12, background: 'var(--bg-2)',
                borderBottomLeftRadius: 4, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)',
                      animation: `bounce .6s ${i*0.15}s infinite alternate`
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '.8rem', color: 'var(--tx-3)' }}>AI dang suy nghi...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--bg-1)'
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hoi AI bat cu dieu gi ve van ban nay..."
            rows={1}
            style={{
              flex: 1, resize: 'none', border: '1px solid var(--border)',
              borderRadius: 12, padding: '10px 14px', fontSize: '.85rem',
              fontFamily: 'inherit', outline: 'none', background: 'var(--bg-2)',
              maxHeight: 120, overflowY: 'auto', lineHeight: 1.4,
              transition: 'border-color .2s'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: input.trim() ? 'var(--primary)' : 'var(--bg-3)',
              color: '#fff', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .2s', flexShrink: 0
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes bounce {
          from { transform: translateY(0); opacity: .4; }
          to { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
};

// Nut mo chat (Floating Button)
export const AiChatButton = ({ onClick }) => (
  <button onClick={onClick} title="Chat voi AI" style={{
    position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: 999,
    background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
    color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform .2s, box-shadow .2s'
  }}
  onMouseEnter={e => { e.target.style.transform = 'scale(1.1)'; e.target.style.boxShadow = '0 6px 24px rgba(37,99,235,.5)'; }}
  onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 16px rgba(37,99,235,.4)'; }}
  >
    <MessageCircle size={24} />
  </button>
);

export default AiChatPanel;
