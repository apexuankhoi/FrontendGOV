import React, { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { MessageCircle, X, Send } from 'lucide-react';

const INITIAL_MSG = {
  text: `Xin chào! Tôi là Trợ lý AI Chính quyền số Đắk Lắk 🤖

Tôi có thể giúp bạn:
• Tra cứu thủ tục hành chính
• Tư vấn pháp luật địa phương
• Thông tin chiến dịch tình nguyện
• Kết nối dịch vụ công

Bạn cần hỗ trợ gì hôm nay?`,
  sender: 'bot'
};

const ChatbotWidget = () => {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState([INITIAL_MSG]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const bodyRef               = useRef(null);

  // Listen for quick-service triggers from the homepage
  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      sendMsg(e.detail.query);
    };
    window.addEventListener('openChatbot', handler);
    return () => window.removeEventListener('openChatbot', handler);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, typing]);

  const sendMsg = async (text) => {
    const txt = (text || input).trim();
    if (!txt) return;
    setInput('');
    setMsgs(p => [...p, { text: txt, sender: 'user' }]);
    setTyping(true);
    try {
      const r = await api.post('/ai/chat', { message: txt });
      setMsgs(p => [...p, { text: r.data.reply, sender: 'bot' }]);
    } catch {
      setMsgs(p => [...p, { text: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau ít phút.', sender: 'bot' }]);
    }
    setTyping(false);
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } };

  return (
    <div className="chatbot-fab">
      {open && (
        <div className="chatbot-win">
          {/* Header */}
          <div className="chat-head">
            <div className="chat-head-info">
              <div className="chat-head-avatar">🤖</div>
              <div>
                <div className="chat-head-title">Trợ lý AI Đắk Lắk</div>
                <div className="chat-head-sub">● Đang hoạt động — phản hồi ngay</div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>
              <X size={13} />
            </button>
          </div>

          {/* Body */}
          <div className="chat-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.sender}`}>
                <div className="chat-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              </div>
            ))}
            {typing && (
              <div className="chat-msg bot">
                <div className="chat-bubble">
                  <div className="typing-indicator"><span/><span/><span/></div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {msgs.length <= 1 && (
            <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Thủ tục hành chính', 'Tư vấn pháp luật', 'Tham gia tình nguyện'].map(q => (
                <button key={q}
                  style={{ background: 'var(--primary-bg)', color: 'var(--primary)', border: 'none', borderRadius: 20, padding: '5px 12px', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                  onClick={() => sendMsg(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="chat-footer">
            <input
              className="chat-input"
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
            />
            <button className="chat-send" onClick={() => sendMsg()}>
              <Send size={15}/>
            </button>
          </div>
        </div>
      )}

      <button className="chatbot-btn" onClick={() => setOpen(o => !o)}
        title="Mở AI Trợ lý Đắk Lắk">
        {open ? <X size={22}/> : <MessageCircle size={22}/>}
      </button>
    </div>
  );
};

export default ChatbotWidget;
