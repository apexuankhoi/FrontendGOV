import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, User, Mail, Lock, ArrowRight, Bot } from 'lucide-react';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp.'); return; }
    if (form.password.length < 6) { setError('Mật khẩu phải chứa ít nhất 6 ký tự.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        role: 'CITIZEN',
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đăng ký, vui lòng thử lại.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-split-page">
      {/* LEFT: BRANDING & GLASSMORPHISM */}
      <div className="auth-split-left" style={{ background: 'linear-gradient(145deg, #094b3f 0%, #16a34a 50%, #0d3b6e 100%)' }}>
        <div className="auth-brand">
          <div className="auth-logo-mark">W</div>
          <div className="auth-brand-text">
            <h1>Webgov</h1>
            <p>Tỉnh Đắk Lắk</p>
          </div>
        </div>

        <div className="auth-hero-content animate-up">
          <h2>Tạo tài khoản <br /><span>Công dân số</span></h2>
          <p>
            Đăng ký để tiếp cận đầy đủ các dịch vụ công, theo dõi chiến dịch tình nguyện Mùa Hè Xanh, và trải nghiệm AI Trợ lý thông minh độc quyền dành riêng cho người dân Đắk Lắk.
          </p>

          <div className="auth-glass-card">
            <div className="auth-glass-icon" style={{ color: '#fff' }}>
              <Bot size={28} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Tích hợp AI Trợ lý 24/7</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                Hỗ trợ giải đáp thủ tục hành chính và tra cứu tự động.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: REGISTER FORM */}
      <div className="auth-split-right">
        <div className="auth-form-container animate-up delay-1">
          <div className="auth-form-header">
            <h3>Đăng ký mới</h3>
            <p>Điền thông tin của bạn để bắt đầu</p>
          </div>

          {error && (
            <div className="auth-alert">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1.5px solid #86EFAC', padding: '16px', borderRadius: 'var(--r-md)', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', fontSize: '0.95rem', fontWeight: 500, animation: 'slideUp 0.3s ease' }}>
              <CheckCircle size={22} /> Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...
            </div>
          )}

          {!success && (
            <form onSubmit={submit}>
              <div className="premium-input-group">
                <label className="premium-label">Họ và tên</label>
                <div className="premium-input-wrap">
                  <User className="premium-input-icon" size={18} />
                  <input
                    type="text"
                    className="premium-input"
                    required
                    placeholder="Nguyễn Văn A"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="premium-input-group">
                <label className="premium-label">Địa chỉ Email</label>
                <div className="premium-input-wrap">
                  <Mail className="premium-input-icon" size={18} />
                  <input
                    type="email"
                    className="premium-input"
                    required
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="premium-input-group">
                <label className="premium-label">Mật khẩu</label>
                <div className="premium-input-wrap">
                  <Lock className="premium-input-icon" size={18} />
                  <input
                    type="password"
                    className="premium-input"
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="premium-input-group">
                <label className="premium-label">Xác nhận mật khẩu</label>
                <div className="premium-input-wrap">
                  <Lock className="premium-input-icon" size={18} />
                  <input
                    type="password"
                    className="premium-input"
                    required
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirm}
                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="premium-btn" disabled={loading} style={{ marginTop: 24 }}>
                {loading ? 'Đang khởi tạo tài khoản...' : 'Hoàn tất đăng ký'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          <div className="auth-footer">
            Bạn đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
