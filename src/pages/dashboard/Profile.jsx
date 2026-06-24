import React, { useState } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { Save, Key } from 'lucide-react';

const Profile = () => {
  const username = localStorage.getItem('username') || '';
  const role     = localStorage.getItem('role') || '';
  const token    = localStorage.getItem('token');

  const [pwForm, setPwForm] = useState({ current: '', newPass: '', confirm: '' });
  const [loading, setLoading] = useState(false);

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

  const ROLE_MAP = {
    SENIOR_ADMIN:   { label: 'Super Admin', badge: 'badge-danger' },
    PROVINCE_ADMIN: { label: 'Cán bộ Tỉnh', badge: 'badge-warning' },
    COMMUNE_ADMIN:  { label: 'Cán bộ Xã', badge: 'badge-success' },
    ADMIN:          { label: 'Admin Content', badge: 'badge-info' },
    CITIZEN:        { label: 'Người dân', badge: 'badge-gray' },
  };
  const roleInfo = ROLE_MAP[role] || { label: role, badge: 'badge-gray' };

  return (
    <div className="anim">
      <div className="page-hd">
        <h2>Hồ sơ cá nhân</h2>
        <p>Thông tin tài khoản và bảo mật</p>
      </div>

      {/* Profile Info */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--green-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Lexend Deca', sans-serif" }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: '1.4rem' }}>{username}</h3>
            <span className={`badge badge-dot ${roleInfo.badge}`} style={{ marginTop: 6 }}>{roleInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Key size={18} color="var(--primary)" /> Đổi mật khẩu
        </h4>
        <form onSubmit={changePassword}>
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Mật khẩu hiện tại</label>
              <input type="password" className="form-input" required placeholder="••••••••"
                value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu mới</label>
              <input type="password" className="form-input" required placeholder="Tối thiểu 6 ký tự"
                value={pwForm.newPass} onChange={e => setPwForm({ ...pwForm, newPass: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input type="password" className="form-input" required placeholder="Nhập lại"
                value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={15}/> {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
