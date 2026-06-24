import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import api from '../lib/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Xin chào! Tôi là Trợ lý AI của Mùa Hè Xanh Đắk Lắk. Tôi có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: `Đây là thông tin về "${userMsg}". Theo quy định, bạn có thể xem xét các văn bản liên quan trong mục tin tức hoặc nộp hồ sơ tại UBND cấp xã.` 
        }]);
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Xin lỗi, tôi đang bận xử lý hệ thống. Vui lòng thử lại sau!' }]);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Nút bấm tròn nổi */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: 30, right: 30,
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--primary)', color: '#fff',
            border: 'none', cursor: 'pointer', zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,86,214,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s',
          }}
          className="animate-up"
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={28} />
        </button>
      )}

      {/* Cửa sổ Chatbot */}
      {isOpen && (
        <div 
          className="animate-up"
          style={{
            position: 'fixed', bottom: 30, right: 30,
            width: 380, height: 500, background: '#fff',
            borderRadius: '20px', boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', zIndex: 9999,
            overflow: 'hidden', border: '1px solid var(--border)'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--blue-700))',
            padding: '16px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>Trợ lý AI Đắk Lắk</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Luôn sẵn sàng hỗ trợ</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}>
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', background: 'var(--surface-0)' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                display: 'flex', gap: 10, marginBottom: 16, 
                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' 
              }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: msg.sender === 'user' ? 'var(--primary)' : '#fff',
                  color: msg.sender === 'user' ? '#fff' : 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: msg.sender === 'bot' ? 'var(--sh-sm)' : 'none'
                }}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div style={{
                  background: msg.sender === 'user' ? 'var(--primary)' : '#fff',
                  color: msg.sender === 'user' ? '#fff' : 'var(--tx-1)',
                  padding: '12px 16px', borderRadius: '16px',
                  borderTopLeftRadius: msg.sender === 'bot' ? 4 : 16,
                  borderTopRightRadius: msg.sender === 'user' ? 4 : 16,
                  boxShadow: 'var(--sh-sm)', maxWidth: '75%', fontSize: '0.9rem', lineHeight: 1.5
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)' }}><Bot size={16} color="var(--primary)" /></div>
                <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: 4, boxShadow: 'var(--sh-sm)' }}>
                  <span style={{color: 'var(--tx-3)'}}>...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Footer Form */}
          <form onSubmit={handleSend} style={{
            padding: 16, background: '#fff', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10, alignItems: 'center'
          }}>
            <input 
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              style={{ flex: 1, padding: '10px 16px', borderRadius: 20, border: '1px solid var(--border)', outline: 'none', background: 'var(--surface-0)' }}
            />
            <button type="submit" disabled={!input.trim() || loading} style={{
              background: input.trim() ? 'var(--primary)' : 'var(--surface-2)', 
              color: input.trim() ? '#fff' : 'var(--tx-3)',
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'default', transition: '0.2s'
            }}>
              <Send size={18} style={{ marginLeft: -2 }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
