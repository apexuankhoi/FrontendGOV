import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Globe, Fingerprint } from 'lucide-react';

const ADMIN_ROLES = ['COMMUNE_ADMIN', 'PROVINCE_ADMIN', 'ADMIN', 'SENIOR_ADMIN'];

const Login = ({ onSwitch, onSuccess }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api.post('/auth/login', form);
      localStorage.setItem('token',        r.data.token);
      localStorage.setItem('refreshToken', r.data.refreshToken);
      localStorage.setItem('role',         r.data.role);
      localStorage.setItem('username',     r.data.username);

      if (onSuccess) onSuccess();
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Sai email hoặc mật khẩu.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page-v2">
      {/* Animated background */}
      <div className="auth-bg-gradient" />
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-center-wrapper" style={{ position: 'relative' }}>
        {onSuccess && (
          <button onClick={onSuccess} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
        
        {/* Branding top */}
        <div className="auth-top-brand animate-up">
          <img src="/logo.png" alt="Logo" className="auth-top-logo" />
          <div>
            <h1 className="auth-top-name">Webgov</h1>
            <p className="auth-top-sub">Chính quyền số Đắk Lắk</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="auth-card animate-up delay-1">
          {/* Feature pills */}
          <div className="auth-feature-row">
            <div className="auth-feature-pill">
              <ShieldCheck size={14} />
              <span>Bảo mật cao</span>
            </div>
            <div className="auth-feature-pill">
              <Sparkles size={14} />
              <span>AI Tích hợp</span>
            </div>
            <div className="auth-feature-pill">
              <Globe size={14} />
              <span>eOffice</span>
            </div>
          </div>

          <div className="auth-card-header">
            <h2>Đăng nhập</h2>
            <p>Chào mừng bạn quay trở lại hệ thống</p>
          </div>

          {error && (
            <div className="auth-alert">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="auth-field">
              <label>Địa chỉ Email</label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" size={18} />
                <input
                  type="email"
                  required
                  placeholder="admin@daklak.gov.vn"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Mật khẩu truy cập</label>
              <div className="auth-input-wrap">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <Fingerprint size={18} />
                  Đăng nhập vào hệ thống
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Test */}
          <div className="auth-quick-section">
            <div className="auth-quick-title">Truy cập nhanh (Demo)</div>
            <div className="auth-quick-grid">
              {[
                { role: 'Super Admin', email: 'admin@daklak.gov.vn', pw: '123456', color: '#E11D48' },
                { role: 'Cán bộ Tỉnh', email: 'tinh@daklak.gov.vn', pw: '123456', color: '#7C3AED' },
                { role: 'Người dân', email: 'nguoidan@gmail.com', pw: '123456', color: '#0D9488' },
              ].map(t => (
                <button
                  key={t.email}
                  className="auth-quick-btn"
                  onClick={() => setForm({ email: t.email, password: t.pw })}
                  type="button"
                >
                  <span className="auth-quick-dot" style={{ background: t.color }} />
                  <div>
                    <span className="auth-quick-role">{t.role}</span>
                    <span className="auth-quick-email">{t.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="auth-bottom-text">
            Chưa có tài khoản?{' '}
            {onSwitch ? (
              <button type="button" onClick={onSwitch} className="auth-link-btn">
                Đăng ký ngay
              </button>
            ) : (
              <Link to="/register">Đăng ký ngay</Link>
            )}
          </p>
        </div>

        <p className="auth-bottom-text">
          © 2026 Webgov Đắk Lắk · Chính quyền số thông minh
        </p>
      </div>
    </div>
  );
};

export default Login;
