import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const ADMIN_ROLES = ['COMMUNE_ADMIN', 'PROVINCE_ADMIN', 'ADMIN', 'SENIOR_ADMIN'];

const Login = () => {
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

      if (ADMIN_ROLES.includes(r.data.role)) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Sai email hoặc mật khẩu.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-split-page">
      {/* LEFT: BRANDING & GLASSMORPHISM */}
      <div className="auth-split-left">
        <div className="auth-brand">
          <div className="auth-logo-mark">W</div>
          <div className="auth-brand-text">
            <h1>Webgov</h1>
            <p>Tỉnh Đắk Lắk</p>
          </div>
        </div>

        <div className="auth-hero-content animate-up">
          <h2>Chính quyền số <br /><span>thông minh 2026</span></h2>
          <p>
            Đăng nhập để truy cập vào hệ thống quản lý tập trung, eOffice, và trải nghiệm AI Trợ lý thông minh độc quyền dành riêng cho người dân và cán bộ tỉnh Đắk Lắk.
          </p>

          <div className="auth-glass-card">
            <div className="auth-glass-icon">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Hệ thống bảo mật cấp cao</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                Mọi dữ liệu được mã hóa và bảo vệ an toàn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: LOGIN FORM */}
      <div className="auth-split-right">
        <div className="auth-form-container animate-up delay-1">
          <div className="auth-form-header">
            <h3>Đăng nhập</h3>
            <p>Chào mừng bạn quay trở lại hệ thống</p>
          </div>

          {error && (
            <div className="auth-alert">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="premium-input-group">
              <label className="premium-label">Địa chỉ Email</label>
              <div className="premium-input-wrap">
                <Mail className="premium-input-icon" size={18} />
                <input
                  type="email"
                  className="premium-input"
                  required
                  placeholder="admin@daklak.gov.vn"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="premium-input-group">
              <label className="premium-label">Mật khẩu truy cập</label>
              <div className="premium-input-wrap">
                <Lock className="premium-input-icon" size={18} />
                <input
                  type="password"
                  className="premium-input"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="premium-btn" disabled={loading}>
              {loading ? 'Đang xác thực hệ thống...' : 'Đăng nhập vào hệ thống'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Quick Test Accounts for Developers/Demo */}
          <div className="quick-test-accounts animate-up delay-2">
            <div className="quick-test-title">Truy cập nhanh (Dành cho Demo)</div>
            {[
              { role: 'Super Admin', email: 'admin@daklak.gov.vn', pw: '123456' },
              { role: 'Cán bộ Tỉnh', email: 'tinh@daklak.gov.vn', pw: '123456' },
              { role: 'Người dân', email: 'nguoidan@gmail.com', pw: '123456' },
            ].map(t => (
              <button
                key={t.email}
                className="quick-btn"
                onClick={() => setForm({ email: t.email, password: t.pw })}
                type="button"
              >
                <span><span className="quick-role">{t.role}</span></span>
                <span style={{ fontSize: '0.75rem' }}>{t.email}</span>
              </button>
            ))}
          </div>

          <div className="auth-footer">
            Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
