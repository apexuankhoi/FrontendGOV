import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Fingerprint, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

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
    <div className="gov-split-page">
      {/* LEFT SCENE */}
      <div className="gov-split-left">
        <div className="gov-split-left-content">
          <img src="/logo.png" alt="Logo" className="gov-split-logo" />
          <h1 className="gov-split-title">Chính quyền số Tỉnh Đắk Lắk</h1>
          <p className="gov-split-desc">
            Nền tảng kết nối người dân, doanh nghiệp và các cấp chính quyền. 
            Cung cấp dịch vụ công trực tuyến nhanh chóng, minh bạch và an toàn.
          </p>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="gov-split-right">
        <h2 className="gov-form-title">Đăng nhập</h2>
        <p className="gov-form-subtitle">Truy cập vào hệ thống Cổng Dịch Vụ Công</p>

        {error && (
          <div className="gov-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="gov-input-group">
            <label>Email hoặc Tên đăng nhập</label>
            <div className="gov-input-wrap">
              <Mail size={18} />
              <input
                type="text"
                placeholder="Nhập email của bạn"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="gov-input-group">
            <label>Mật khẩu truy cập</label>
            <div className="gov-input-wrap">
              <Lock size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <Link to="/forgot-password" className="gov-link" style={{ fontSize: '0.85rem' }}>Quên mật khẩu?</Link>
            </div>
          </div>

          <button type="submit" className="gov-btn-primary" disabled={loading}>
            {loading ? 'Đang xác thực...' : (
              <>
                <Fingerprint size={20} />
                Đăng nhập hệ thống
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.95rem' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="gov-link">Đăng ký ngay</Link>
        </div>

        {/* DEMO LOGINS */}
        <div className="gov-demo-section">
          <div className="gov-demo-title">Tài khoản trải nghiệm (Demo)</div>
          {[
            { label: 'Super Admin', email: 'admin@daklak.gov.vn', pw: '123456', color: '#e11d48' },
            { label: 'Cán bộ Tỉnh', email: 'tinh@daklak.gov.vn', pw: '123456', color: '#7c3aed' },
            { label: 'Người dân', email: 'nguoidan@gmail.com', pw: '123456', color: '#059669' },
          ].map(d => (
            <button key={d.email} type="button" className="gov-demo-btn" onClick={() => setForm({email: d.email, password: d.pw})}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: d.color, marginRight: 15 }}></div>
              <div className="gov-demo-btn-text">
                <strong>{d.label}</strong>
                <span>{d.email}</span>
              </div>
              <ArrowRight size={16} color="#94a3b8" />
            </button>
          ))}
        </div>

        <p style={{ marginTop: 'auto', paddingTop: 40, textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          © 2026 UBND Tỉnh Đắk Lắk. Phát triển bởi VNPT.
        </p>
      </div>
    </div>
  );
};

export default Login;
