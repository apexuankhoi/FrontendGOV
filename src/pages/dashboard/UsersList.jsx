import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { UserPlus, Trash2, RefreshCw, Building2, Wrench, Link2, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
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
  const [fixingAll, setFixingAll] = useState(false);
  const [assignModal, setAssignModal] = useState({ open: false, user: null, agencyId: '' });
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'COMMUNE_ADMIN', province: 'Đắk Lắk', district: '', commune: '', agencyId: '' });

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
      const payload = { ...form };
      if (payload.role === 'PROVINCE_ADMIN') {
        const provAgency = agencies.find(a => a.level === 'PROVINCE' && a.name.includes(payload.province));
        if (provAgency) {
          payload.agencyId = provAgency._id;
          payload.commune = provAgency.name;
        } else {
          return toast.error('Không tìm thấy Cơ quan cấp Tỉnh cho tỉnh này.');
        }
      }
      await api.post('/users', payload);
      toast.success('✅ Cấp phát tài khoản thành công!');
      fetchUsers();
      setForm({ username: '', email: '', password: '', role: 'COMMUNE_ADMIN', province: 'Đắk Lắk', district: '', commune: '', agencyId: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi tạo tài khoản'); }
  };

  const handleDelete = async (id, uname) => {
    Swal.fire({
      title: 'Xóa tài khoản?',
      text: `Bạn có chắc muốn xóa tài khoản "${uname}"? Hành động này không thể hoàn tác.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/users/${id}`);
          toast.success('Đã xóa');
          fetchUsers();
        } catch { toast.error('Lỗi khi xóa'); }
      }
    });
  };

  // Gán Agency thủ công cho user
  const handleAssignAgency = async () => {
    if (!assignModal.agencyId) return toast.error('Vui lòng chọn đơn vị');
    try {
      const res = await api.patch(`/users/${assignModal.user._id}/agency`, { agencyId: assignModal.agencyId });
      toast.success(res.data.message || '✅ Gán đơn vị thành công!');
      setAssignModal({ open: false, user: null, agencyId: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gán đơn vị');
    }
  };

  // Tự động sửa tất cả user bị thiếu agencyId
  const handleAutoFixAll = async () => {
    setFixingAll(true);
    try {
      const res = await api.post('/users/auto-fix-agencies');
      const { fixed, failed } = res.data;
      if (fixed > 0) toast.success(`✅ Đã tự động gán đơn vị cho ${fixed} tài khoản!`);
      if (failed?.length > 0) toast.warn(`⚠️ ${failed.length} tài khoản không tìm được đơn vị, cần gán tay.`);
      if (fixed === 0 && !failed?.length) toast.info('Không có tài khoản nào cần sửa.');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tự động sửa');
    }
    setFixingAll(false);
  };

  const orphanCount = users.filter(u => 
    ['COMMUNE_ADMIN', 'PROVINCE_ADMIN'].includes(u.role) && !u.agencyId
  ).length;

  return (
    <div className="animate-up">
      <div className="page-header">
        <h2>Quản lý Tài khoản Hệ thống</h2>
        <p>Cấp phát và quản lý quyền truy cập cho các cán bộ địa phương</p>
      </div>

      {/* Cảnh báo + Auto Fix */}
      {orphanCount > 0 && (
        <div style={{
          background: '#FEF3C7', border: '1.5px solid #F59E0B', borderRadius: 10,
          padding: '14px 20px', marginBottom: 20, display: 'flex',
          alignItems: 'center', gap: 12, flexWrap: 'wrap'
        }}>
          <AlertTriangle size={20} color="#D97706" />
          <span style={{ flex: 1, fontWeight: 500, color: '#92400E' }}>
            Có <strong>{orphanCount}</strong> tài khoản cán bộ chưa được gắn đơn vị → Họ sẽ không nộp được báo cáo!
          </span>
          <button
            className="btn btn-warning btn-sm"
            onClick={handleAutoFixAll}
            disabled={fixingAll}
            style={{ background: '#D97706', color: '#fff', border: 'none' }}
          >
            <Wrench size={14} />
            {fixingAll ? 'Đang sửa...' : 'Tự động sửa tất cả'}
          </button>
        </div>
      )}

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
              <input className="form-input" required placeholder="VD: Xã Ea Tu" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
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
              <select className="form-input form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value, agencyId: '', commune: '' })}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tỉnh phụ trách</label>
              <select className="form-input form-select" value={form.province} onChange={e => setForm({ ...form, province: e.target.value, commune: '', agencyId: '' })}>
                {Object.keys(PROVINCES_DATA).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {form.role !== 'PROVINCE_ADMIN' && (
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
                      if (a.level === 'PROVINCE') return false;
                      return a.parentAgency?.name?.includes(form.province) || a.parentAgency?.name?.includes('Tỉnh ' + form.province) || a.name.includes(form.province);
                    })
                    .map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
            )}
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
              <th>Cơ quan / Đơn vị</th>
              <th>Địa bàn</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Đang tải...</td></tr>
            ) : users.map(u => {
              const isOrphan = ['COMMUNE_ADMIN', 'PROVINCE_ADMIN'].includes(u.role) && !u.agencyId;
              return (
                <tr key={u._id} style={isOrphan ? { background: '#FFF7ED' } : {}}>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className={`badge ${ROLE_BADGE[u.role] || 'badge-info'}`}>{u.role}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {isOrphan ? (
                      <span style={{ color: '#DC2626', fontWeight: 600 }}>⚠️ Chưa gán đơn vị</span>
                    ) : (
                      <span style={{ color: 'var(--primary)' }}>{u.agencyId?.name || '—'}</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {u.locationContext?.commune || ''} {u.locationContext?.district || 'Đắk Lắk'}
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {/* Nút gán đơn vị - hiển thị khi bị orphan hoặc muốn đổi */}
                    {u.role !== 'SENIOR_ADMIN' && (
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '0.78rem', padding: '3px 8px' }}
                        onClick={() => setAssignModal({ open: true, user: u, agencyId: u.agencyId?._id || '' })}
                        title="Gán/đổi đơn vị"
                      >
                        <Link2 size={12} /> Đơn vị
                      </button>
                    )}
                    {u.role !== 'SENIOR_ADMIN' ? (
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u._id, u.username)}>
                        <Trash2 size={14} /> Xóa
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Không thể xóa</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Gán Agency */}
      {assignModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: 28,
            width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginBottom: 6 }}>
              <Link2 size={18} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }} />
              Gán Đơn vị cho tài khoản
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
              Tài khoản: <strong>{assignModal.user?.username}</strong> ({assignModal.user?.email})
            </p>

            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>
              Chọn Xã/Phường/Đơn vị <span className="required">*</span>
            </label>
            <select
              className="form-input form-select"
              value={assignModal.agencyId}
              onChange={e => setAssignModal(m => ({ ...m, agencyId: e.target.value }))}
              style={{ marginBottom: 20 }}
            >
              <option value="">-- Chọn đơn vị --</option>
              {agencies
                .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
                .map(a => <option key={a._id} value={a._id}>{a.name} ({a.level})</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setAssignModal({ open: false, user: null, agencyId: '' })}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleAssignAgency}>
                <Link2 size={14} /> Xác nhận gán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
