import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, UserPlus, ShieldCheck, LogIn, Key, HelpCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ADMIN_ROLES = ['COMMUNE_ADMIN', 'PROVINCE_ADMIN', 'ADMIN', 'SENIOR_ADMIN'];

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/auth/login', form);
      localStorage.setItem('token',        r.data.token);
      localStorage.setItem('refreshToken', r.data.refreshToken);
      localStorage.setItem('role',         r.data.role);
      localStorage.setItem('username',     r.data.username);
      if (r.data.agency) {
        localStorage.setItem('agency', JSON.stringify(r.data.agency));
        localStorage.setItem('agencyName', r.data.agency.name);
      }

      if (ADMIN_ROLES.includes(r.data.role)) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sai email hoặc mật khẩu.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-mxh-page">
      <div className="auth-mxh-card">
        {/* LEFT */}
        <div className="auth-mxh-left">
          <div className="auth-mxh-pill">Cổng thông tin 2026</div>
          <h2>Chào mừng bạn quay trở lại</h2>
          <p>Đăng nhập để quản lý đội hình, cập nhật công trình, hoạt động và dữ liệu chiến dịch toàn quốc.</p>
          
          {/* Landmark image collage */}
          <div className="login-landmark-collage">
            <div className="login-lm-main">
              <img src="/landmark1.jpg" alt="Tượng đài Chiến thắng Buôn Ma Thuột" />
              <span>Tượng đài Chiến thắng BMT</span>
            </div>
            <div className="login-lm-side">
              <img src="/landmark2.jpg" alt="Tháp Nghênh Phong" />
              <span>Tháp Nghênh Phong</span>
            </div>
          </div>

          <div className="auth-mxh-stats">
            <div className="auth-mxh-stat-box">
              <h3>100%</h3>
              <span>Trực tuyến</span>
            </div>
            <div className="auth-mxh-stat-box">
              <h3>Live</h3>
              <span>Đồng bộ</span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="auth-mxh-right">
          <div className="auth-mxh-right-header">
            <ShieldCheck size={36} />
            <div>
              <h2>Đăng nhập</h2>
              <p>Đăng nhập để tiếp tục sử dụng hệ thống</p>
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="auth-mxh-input-group">
              <label>Email</label>
              <div className="auth-mxh-input">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="email@example.com"
                  required
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
            </div>

            <div className="auth-mxh-input-group">
              <label>Mật khẩu</label>
              <div className="auth-mxh-input">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="Nhập mật khẩu"
                  required
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="auth-mxh-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : <><LogIn size={20} /> Đăng nhập</>}
            </button>
          </form>

          <div className="auth-mxh-footer">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </div>

          {/* Quick Demo Logins for Portfolio */}
          <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>Trải nghiệm nhanh</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setForm({email:'admin@daklak.gov.vn', password:'123456'})} style={{flex: 1, padding: 8, fontSize: '0.85rem', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600}}>Cán bộ</button>
              <button type="button" onClick={() => setForm({email:'nguoidan@gmail.com', password:'123456'})} style={{flex: 1, padding: 8, fontSize: '0.85rem', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600}}>Người dân</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
