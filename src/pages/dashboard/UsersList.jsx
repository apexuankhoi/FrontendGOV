import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { UserPlus, Trash2, RefreshCw, Building2 } from 'lucide-react';
import { PROVINCES_DATA } from '../../constants/locations';

const ROLES = [
  { value: 'COMMUNE_ADMIN', label: '🏡 Cán bộ Xã (Commune Admin)' },
  { value: 'PROVINCE_ADMIN', label: '🏛 Cán bộ Tỉnh (Province Admin)' },
  { value: 'ADMIN', label: '📝 Admin Nội dung (Content Admin)' },
  { value: 'CITIZEN', label: '👤 Người dân (Citizen)' },
];

const ROLE_BADGE = {
  SENIOR_ADMIN: 'badge-danger',
  PROVINCE_ADMIN: 'badge-warning',
  COMMUNE_ADMIN: 'badge-success',
  ADMIN: 'badge-info',
  CITIZEN: 'badge-info',
};

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'COMMUNE_ADMIN', province: 'Đắk Lắk', district: '', commune: '', agencyId: '' });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
    api.get('/agencies').then(r => setAgencies(r.data)).catch(() => {});
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { toast.error('Lỗi tải danh sách tài khoản'); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      toast.success('✅ Cấp phát tài khoản thành công!');
      fetchUsers();
      setForm({ username: '', email: '', password: '', role: 'COMMUNE_ADMIN', province: 'Đắk Lắk', district: '', commune: '', agencyId: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi tạo tài khoản'); }
  };

  const handleDelete = async (id, uname) => {
    if (!window.confirm(`Xóa tài khoản "${uname}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Đã xóa tài khoản');
      fetchUsers();
    } catch { toast.error('Lỗi xóa tài khoản'); }
  };

  return (
    <div className="animate-up">
      <div className="page-header">
        <h2>Quản lý Tài khoản Hệ thống</h2>
        <p>Cấp phát và quản lý quyền truy cập cho các cán bộ địa phương</p>
      </div>

      {/* Create Form */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h4 style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <UserPlus size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Cấp phát tài khoản mới
        </h4>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên người dùng <span className="required">*</span></label>
              <input className="form-input" required placeholder="VD: UBND Xã Ea Tu" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email đăng nhập <span className="required">*</span></label>
              <input type="email" className="form-input" required placeholder="email@daklak.gov.vn" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mật khẩu ban đầu <span className="required">*</span></label>
              <input type="password" className="form-input" required placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phân quyền (Role) <span className="required">*</span></label>
              <select className="form-input form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Tỉnh phụ trách</label>
              <select className="form-input form-select" value={form.province} onChange={e => setForm({ ...form, province: e.target.value, commune: '', agencyId: '' })}>
                {Object.keys(PROVINCES_DATA).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Huyện phụ trách</label>
              <input className="form-input" placeholder="VD: TP Buôn Ma Thuột" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label"><Building2 size={14} style={{verticalAlign:'middle',marginRight:4}}/> Cơ quan trực thuộc <span className="required">*</span></label>
              <select className="form-input form-select" value={form.agencyId} onChange={e => {
                const selectedAgency = agencies.find(a => a._id === e.target.value);
                setForm({ ...form, agencyId: e.target.value, commune: selectedAgency?.name || '' });
              }} required>
                <option value="">-- Chọn Cơ quan --</option>
                {agencies
                  .filter(a => {
                    if (!form.province) return true;
                    if (a.level === 'PROVINCE') return a.name.includes(form.province);
                    return a.parentAgency?.name?.includes(form.province);
                  })
                  .map(a => <option key={a._id} value={a._id}>{a.name} ({a.level === 'PROVINCE' ? 'Tỉnh' : 'Xã'})</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            <UserPlus size={16} /> Cấp phát tài khoản
          </button>
        </form>
      </div>

      {/* Table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h4>Danh sách tài khoản ({users.length})</h4>
        <button className="btn btn-outline btn-sm" onClick={fetchUsers}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên người dùng</th>
              <th>Email</th>
              <th>Quyền (Role)</th>
              <th>Cơ quan</th>
              <th>Địa bàn</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Đang tải...</td></tr>
            ) : users.map(u => (
              <tr key={u._id}>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                <td><span className={`badge ${ROLE_BADGE[u.role] || 'badge-info'}`}>{u.role}</span></td>
                <td style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                  {u.agencyId?.name || '—'}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {u.locationContext?.commune || ''} {u.locationContext?.district || 'Đắk Lắk'}
                </td>
                <td>
                  {u.role !== 'SENIOR_ADMIN' ? (
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u._id, u.username)}>
                      <Trash2 size={14} /> Xóa
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Không thể xóa</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;
