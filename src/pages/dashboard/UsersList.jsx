import React, { useEffect, useState, useMemo } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { UserPlus, Trash2, RefreshCw, Building2, Wrench, Link2, AlertTriangle, Search, Ghost, CheckCircle, Filter, Edit2, X } from 'lucide-react';
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

// Kiểm tra zombie: tài khoản được auto-recovered nhưng chưa gán agency
const isZombie = (u) =>
  u.email?.includes('@webgov.local') || u.email?.includes('recovered_');

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fixingAll, setFixingAll] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'zombie' | 'orphan' | 'ok'
  const [searchText, setSearchText] = useState('');

  // Modal gán agency
  const [assignModal, setAssignModal] = useState({ open: false, user: null, agencyId: '', searchAgency: '', editName: '', editEmail: '' });

  // Form tạo tài khoản mới
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
        if (provAgency) { payload.agencyId = provAgency._id; payload.commune = provAgency.name; }
        else return toast.error('Không tìm thấy Cơ quan cấp Tỉnh.');
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
      text: `Bạn có chắc muốn xóa tài khoản "${uname}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa', cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try { await api.delete(`/users/${id}`); toast.success('Đã xóa'); fetchUsers(); }
        catch { toast.error('Lỗi khi xóa'); }
      }
    });
  };

  // Gán Agency + cập nhật tên/email nếu là zombie
  const handleAssignAgency = async () => {
    if (!assignModal.agencyId) return toast.error('Vui lòng chọn đơn vị');
    try {
      // 1. Gán agency
      await api.patch(`/users/${assignModal.user._id}/agency`, { agencyId: assignModal.agencyId });

      // 2. Nếu đổi tên/email zombie → update thêm
      if (assignModal.editName || assignModal.editEmail) {
        await api.patch(`/users/${assignModal.user._id}`, {
          username: assignModal.editName || assignModal.user.username,
          email: assignModal.editEmail || assignModal.user.email,
        }).catch(() => {}); // Không block nếu lỗi update info
      }

      const selectedAgency = agencies.find(a => a._id === assignModal.agencyId);
      toast.success(`✅ Đã gán "${selectedAgency?.name}" cho tài khoản!`);
      setAssignModal({ open: false, user: null, agencyId: '', searchAgency: '', editName: '', editEmail: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gán đơn vị');
    }
  };

  const handleAutoFixAll = async () => {
    setFixingAll(true);
    try {
      const res = await api.post('/users/auto-fix-agencies');
      const { fixed, failed } = res.data;
      if (fixed > 0) toast.success(`✅ Tự động gán đơn vị cho ${fixed} tài khoản!`);
      if (failed?.length > 0) toast.warn(`⚠️ ${failed.length} tài khoản cần gán tay (zombie)`);
      if (fixed === 0 && !failed?.length) toast.info('Không có tài khoản nào cần sửa.');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi tự động sửa'); }
    setFixingAll(false);
  };

  // Thống kê
  const zombieCount = users.filter(isZombie).length;
  const orphanCount = users.filter(u => ['COMMUNE_ADMIN', 'PROVINCE_ADMIN'].includes(u.role) && !u.agencyId).length;
  const needActionCount = users.filter(u => isZombie(u) || (['COMMUNE_ADMIN', 'PROVINCE_ADMIN'].includes(u.role) && !u.agencyId)).length;

  // Filter + Search
  const filteredUsers = useMemo(() => {
    let list = users;
    if (filterMode === 'zombie') list = list.filter(isZombie);
    else if (filterMode === 'orphan') list = list.filter(u => ['COMMUNE_ADMIN', 'PROVINCE_ADMIN'].includes(u.role) && !u.agencyId);
    else if (filterMode === 'ok') list = list.filter(u => !isZombie(u) && u.agencyId);

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(u =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.agencyId?.name?.toLowerCase().includes(q) ||
        u.locationContext?.commune?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, filterMode, searchText]);

  // Agency search trong modal
  const filteredAgencies = useMemo(() => {
    const q = assignModal.searchAgency?.toLowerCase() || '';
    return agencies
      .filter(a => !q || a.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [agencies, assignModal.searchAgency]);

  return (
    <div className="animate-up">
      <div className="page-header">
        <h2>Quản lý Tài khoản Hệ thống</h2>
        <p>Cấp phát và quản lý quyền truy cập cho các cán bộ địa phương</p>
      </div>

      {/* ── Banner cảnh báo ── */}
      {needActionCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FFF7ED 100%)',
          border: '1.5px solid #F59E0B', borderRadius: 12,
          padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
        }}>
          <AlertTriangle size={20} color="#D97706" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#92400E' }}>
              Phát hiện {needActionCount} tài khoản cần xử lý
            </div>
            <div style={{ fontSize: '0.85rem', color: '#B45309', marginTop: 2 }}>
              {zombieCount > 0 && <span>👻 <strong>{zombieCount}</strong> zombie (auto-recovered, chưa biết xã) &nbsp;·&nbsp;</span>}
              {orphanCount > 0 && <span>⚠️ <strong>{orphanCount}</strong> chưa gán đơn vị</span>}
              &nbsp;→ Họ không nộp được báo cáo!
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-sm"
              onClick={() => setFilterMode('zombie')}
              style={{ background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.82rem' }}
            >
              👻 Xem zombie
            </button>
            <button
              className="btn btn-warning btn-sm"
              onClick={handleAutoFixAll}
              disabled={fixingAll}
              style={{ background: '#D97706', color: '#fff', border: 'none' }}
            >
              <Wrench size={14} />
              {fixingAll ? 'Đang sửa...' : 'Tự động sửa'}
            </button>
          </div>
        </div>
      )}

      {/* ── Create Form ── */}
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
                <label className="form-label"><Building2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Cơ quan trực thuộc <span className="required">*</span></label>
                <select className="form-input form-select" value={form.agencyId} onChange={e => {
                  const sel = agencies.find(a => a._id === e.target.value);
                  setForm({ ...form, agencyId: e.target.value, commune: sel?.name || '' });
                }} required>
                  <option value="">-- Chọn Cơ quan --</option>
                  {agencies.filter(a => {
                    if (!form.province) return true;
                    if (a.level === 'PROVINCE') return false;
                    return a.parentAgency?.name?.includes(form.province) || a.name.includes(form.province);
                  }).map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            <UserPlus size={16} /> Cấp phát tài khoản
          </button>
        </form>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all', label: `Tất cả (${users.length})` },
            { key: 'zombie', label: `👻 Zombie (${zombieCount})`, color: '#7C3AED' },
            { key: 'orphan', label: `⚠️ Thiếu đơn vị (${orphanCount})`, color: '#D97706' },
            { key: 'ok', label: `✅ Bình thường`, color: '#059669' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterMode(f.key)}
              style={{
                padding: '5px 12px', borderRadius: 20, border: '1.5px solid',
                borderColor: filterMode === f.key ? (f.color || 'var(--primary)') : '#E2E8F0',
                background: filterMode === f.key ? (f.color || 'var(--primary)') : '#fff',
                color: filterMode === f.key ? '#fff' : '#374151',
                fontWeight: filterMode === f.key ? 700 : 400,
                cursor: 'pointer', fontSize: '0.82rem', whiteSpace: 'nowrap'
              }}
            >{f.label}</button>
          ))}
        </div>

        <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            className="form-input"
            placeholder="Tìm theo tên, email, xã..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ paddingLeft: 32, height: 36, fontSize: '0.85rem' }}
          />
        </div>

        <button className="btn btn-outline btn-sm" onClick={fetchUsers}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ marginBottom: 8, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
        Hiển thị {filteredUsers.length}/{users.length} tài khoản
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên / Trạng thái</th>
              <th>Email</th>
              <th>Quyền</th>
              <th>Đơn vị được gán</th>
              <th>Địa bàn</th>
              <th style={{ minWidth: 120 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Đang tải...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Không tìm thấy tài khoản nào</td></tr>
            ) : filteredUsers.map(u => {
              const zombie = isZombie(u);
              const orphan = ['COMMUNE_ADMIN', 'PROVINCE_ADMIN'].includes(u.role) && !u.agencyId;
              const rowBg = zombie ? '#F5F3FF' : orphan ? '#FFF7ED' : '';
              return (
                <tr key={u._id} style={{ background: rowBg }}>
                  <td style={{ fontWeight: 600 }}>
                    {zombie && (
                      <span title="Tài khoản zombie - auto-recovered" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#EDE9FE', color: '#7C3AED',
                        borderRadius: 6, padding: '1px 6px', fontSize: '0.72rem',
                        fontWeight: 700, marginRight: 6, verticalAlign: 'middle'
                      }}>
                        👻 ZOMBIE
                      </span>
                    )}
                    {u.username}
                  </td>
                  <td style={{ color: zombie ? '#7C3AED' : 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {u.email}
                  </td>
                  <td><span className={`badge ${ROLE_BADGE[u.role] || 'badge-info'}`}>{u.role}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {orphan ? (
                      <span style={{ color: '#DC2626', fontWeight: 600 }}>⚠️ Chưa gán</span>
                    ) : (
                      <span style={{ color: 'var(--primary)' }}>{u.agencyId?.name || '—'}</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {u.locationContext?.commune || (zombie ? <em style={{ color: '#9CA3AF' }}>Chưa biết</em> : '')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {u.role !== 'SENIOR_ADMIN' && (
                        <button
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.78rem', padding: '3px 10px',
                            background: (zombie || orphan) ? '#7C3AED' : 'transparent',
                            color: (zombie || orphan) ? '#fff' : 'var(--primary)',
                            border: `1px solid ${(zombie || orphan) ? '#7C3AED' : 'var(--primary)'}`,
                            borderRadius: 6, fontWeight: (zombie || orphan) ? 700 : 400
                          }}
                          onClick={() => setAssignModal({
                            open: true, user: u,
                            agencyId: u.agencyId?._id || '',
                            searchAgency: '',
                            editName: zombie ? '' : u.username,
                            editEmail: zombie ? '' : u.email
                          })}
                          title="Gán / đổi đơn vị"
                        >
                          <Link2 size={12} />
                          {(zombie || orphan) ? ' Gán ngay!' : ' Đơn vị'}
                        </button>
                      )}
                      {u.role !== 'SENIOR_ADMIN' ? (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u._id, u.username)}>
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal Gán Agency (nâng cấp) ── */}
      {assignModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 520,
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  <Link2 size={18} style={{ verticalAlign: 'middle', marginRight: 8, color: '#7C3AED' }} />
                  Gán Đơn vị cho tài khoản
                </h3>
                {isZombie(assignModal.user) && (
                  <div style={{
                    marginTop: 6, background: '#EDE9FE', borderRadius: 8, padding: '5px 10px',
                    fontSize: '0.8rem', color: '#7C3AED', fontWeight: 600
                  }}>
                    👻 Tài khoản ZOMBIE — Cần gán đơn vị để nộp báo cáo được
                  </div>
                )}
              </div>
              <button onClick={() => setAssignModal({ open: false, user: null, agencyId: '', searchAgency: '', editName: '', editEmail: '' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={20} />
              </button>
            </div>

            {/* Info user hiện tại */}
            <div style={{
              background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
              padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem'
            }}>
              <div><strong>ID:</strong> <code style={{ fontSize: '0.78rem', color: '#6B7280' }}>{assignModal.user?._id}</code></div>
              <div style={{ marginTop: 4 }}><strong>Email:</strong> {assignModal.user?.email}</div>
              <div style={{ marginTop: 2 }}><strong>Đơn vị hiện tại:</strong> {assignModal.user?.agencyId?.name || <em style={{ color: '#DC2626' }}>Chưa gán</em>}</div>
            </div>

            {/* Nếu là zombie: cho đổi tên + email */}
            {isZombie(assignModal.user) && (
              <div style={{ background: '#FFF7ED', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 8, fontSize: '0.88rem' }}>
                  ✏️ Cập nhật thông tin tài khoản (tuỳ chọn)
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tên hiển thị</label>
                    <input
                      className="form-input"
                      placeholder="VD: Cán bộ Xã Ea Tu"
                      value={assignModal.editName}
                      onChange={e => setAssignModal(m => ({ ...m, editName: e.target.value }))}
                      style={{ fontSize: '0.85rem', height: 36 }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email mới</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="email@gmail.com"
                      value={assignModal.editEmail}
                      onChange={e => setAssignModal(m => ({ ...m, editEmail: e.target.value }))}
                      style={{ fontSize: '0.85rem', height: 36 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Search + Select Agency */}
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
              Chọn Xã/Phường/Đơn vị <span className="required">*</span>
            </label>

            {/* Search box */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                className="form-input"
                placeholder="Gõ tên xã để lọc nhanh..."
                value={assignModal.searchAgency}
                onChange={e => setAssignModal(m => ({ ...m, searchAgency: e.target.value }))}
                style={{ paddingLeft: 32, height: 36, fontSize: '0.85rem' }}
                autoFocus
              />
            </div>

            <select
              className="form-input form-select"
              value={assignModal.agencyId}
              onChange={e => setAssignModal(m => ({ ...m, agencyId: e.target.value }))}
              style={{ marginBottom: 20, height: 160 }}
              size={6}
            >
              <option value="">-- Chọn đơn vị --</option>
              {filteredAgencies.map(a => (
                <option key={a._id} value={a._id}>
                  {a.name} {a.level === 'COMMUNE' ? '(Xã/Phường)' : a.level === 'DISTRICT' ? '(Huyện)' : '(Tỉnh)'}
                </option>
              ))}
            </select>

            {/* Preview selection */}
            {assignModal.agencyId && (
              <div style={{
                background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8,
                padding: '8px 12px', marginBottom: 16, fontSize: '0.85rem', color: '#166534'
              }}>
                <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Sẽ gán: <strong>{agencies.find(a => a._id === assignModal.agencyId)?.name}</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => setAssignModal({ open: false, user: null, agencyId: '', searchAgency: '', editName: '', editEmail: '' })}
              >Hủy</button>
              <button
                className="btn btn-primary"
                onClick={handleAssignAgency}
                style={{ background: '#7C3AED', border: 'none' }}
                disabled={!assignModal.agencyId}
              >
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
