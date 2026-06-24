import React, { useState } from 'react';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, LogOut, ArrowLeft, Save, Shield } from 'lucide-react';

const ROLE_INFO = {
  CITIZEN:        { label: 'Người dân', color: 'var(--tx-3)', bg: 'var(--surface-2)' },
  COMMUNE_ADMIN:  { label: 'Cán bộ Xã', color: 'var(--success)', bg: 'var(--success-bg)' },
  PROVINCE_ADMIN: { label: 'Cán bộ Tỉnh', color: 'var(--warning)', bg: 'var(--warning-bg)' },
  ADMIN:          { label: 'Admin Content', color: 'var(--primary)', bg: 'var(--primary-bg)' },
  SENIOR_ADMIN:   { label: 'Super Admin', color: 'var(--danger)', bg: 'var(--danger-bg)' },
};

const PublicProfile = () => {
  const username = localStorage.getItem('username') || '';
  const role     = localStorage.getItem('role') || 'CITIZEN';
  const token    = localStorage.getItem('token');
  const navigate = useNavigate();

  const [pwForm, setPwForm] = useState({ current: '', newPass: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const roleInfo = ROLE_INFO[role] || ROLE_INFO['CITIZEN'];

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPass !== pwForm.confirm) { toast.error('Mật khẩu xác nhận không khớp.'); return; }
    if (pwForm.newPass.length < 6) { toast.error('Mật khẩu mới tối thiểu 6 ký tự.'); return; }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPass,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPwForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đổi mật khẩu.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--bg)', padding: '48px 0' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        {/* Back */}
        <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
          <ArrowLeft size={15}/> Về trang chủ
        </Link>

        {/* Profile Card */}
        <div className="card anim" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), var(--green-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '2rem', fontWeight: 800, fontFamily: "'Lexend Deca', sans-serif",
            }}>
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 6 }}>{username || 'Người dùng'}</h2>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 'var(--r-pill)',
                background: roleInfo?.bg || 'var(--surface-2)', color: roleInfo?.color || 'var(--tx-3)',
                fontSize: '.78rem', fontWeight: 700,
              }}>
                <Shield size={12}/> {roleInfo?.label || 'Người dân'}
              </span>
            </div>
            <button onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: 'var(--r-pill)', cursor: 'pointer', fontWeight: 600, fontSize: '.875rem', fontFamily: 'inherit', transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEC9D2'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--danger-bg)'}
            >
              <LogOut size={15}/> Đăng xuất
            </button>
          </div>

          {/* Quick links for citizen */}
          {role === 'CITIZEN' && (
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {[
                { icon: '🗺️', title: 'Bản đồ đội hình', to: '/' },
                { icon: '📰', title: 'Tin tức chiến dịch', to: '/tin-tuc' },
                { icon: '📋', title: 'Danh sách đội hình', to: '/doi-hinh' },
                { icon: '🤖', title: 'Hỏi AI Trợ lý', to: '/', action: 'chatbot' },
              ].map((item, i) => (
                <Link key={i} to={item.to}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)', color: 'var(--tx-1)', textAlign: 'center', fontWeight: 600, fontSize: '.82rem', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-bg)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--tx-1)'; }}>
                  <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                  {item.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="card anim anim-d1">
          <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            <Lock size={18} color="var(--primary)"/> Đổi mật khẩu
          </h4>
          <form onSubmit={changePassword}>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input type="password" className="form-input" required placeholder="••••••••"
                  value={pwForm.current}
                  onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input type="password" className="form-input" required placeholder="Tối thiểu 6 ký tự"
                  value={pwForm.newPass}
                  onChange={e => setPwForm({ ...pwForm, newPass: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu</label>
                <input type="password" className="form-input" required placeholder="Nhập lại"
                  value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={15}/> {loading ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
