import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';

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
    <div className="fb-auth-page">
      <div className="fb-auth-container">
        {/* Left Branding */}
        <div className="fb-auth-brand">
          <img src="/logo.png" alt="Logo" className="fb-auth-logo" />
          <h2 className="fb-auth-tagline">
            Chính quyền số giúp bạn kết nối và giải quyết thủ tục hành chính nhanh chóng hơn.
          </h2>
        </div>

        {/* Right Card */}
        <div className="fb-auth-card-wrap">
          <div className="fb-auth-card">
            {error && <div className="fb-alert">{error}</div>}
            <form onSubmit={submit}>
              <input
                type="email"
                className="fb-input"
                placeholder="Email hoặc số điện thoại"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                type="password"
                className="fb-input"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="submit" className="fb-btn-primary" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <a href="#" className="fb-forgot">Quên mật khẩu?</a>

            <div className="fb-divider"></div>

            <Link to="/register" className="fb-btn-success">
              Tạo tài khoản mới
            </Link>
          </div>

          {/* Quick Demo Logins */}
          <div className="fb-demo-section">
            <div className="fb-demo-title">Truy cập nhanh (Demo)</div>
            <button className="fb-demo-btn" onClick={() => { setForm({ email: 'admin@daklak.gov.vn', password: 'password123' }); }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e41e3f', marginRight: 10, flexShrink: 0 }}></div>
              <div>
                <strong>Super Admin</strong>
                <span>admin@daklak.gov.vn</span>
              </div>
            </button>
            <button className="fb-demo-btn" onClick={() => { setForm({ email: 'tinh@daklak.gov.vn', password: 'password123' }); }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8b5cf6', marginRight: 10, flexShrink: 0 }}></div>
              <div>
                <strong>Cán bộ Tỉnh</strong>
                <span>tinh@daklak.gov.vn</span>
              </div>
            </button>
            <button className="fb-demo-btn" onClick={() => { setForm({ email: 'nguoidan@gmail.com', password: 'password123' }); }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', marginRight: 10, flexShrink: 0 }}></div>
              <div>
                <strong>Người dân</strong>
                <span>nguoidan@gmail.com</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
