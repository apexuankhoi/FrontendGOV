import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import {
  Globe, Search, Download, Filter, RefreshCw, CheckCircle,
  Phone, Store, MapPin, QrCode, ExternalLink, Loader2,
  TrendingUp, Clock, AlertCircle, X, ChevronDown
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING',    label: '⏳ Chờ hỗ trợ',          color: '#6366F1' },
  { value: 'CONTACTED',  label: '📞 Đã liên hệ',          color: '#0EA5E9' },
  { value: 'REGISTERED', label: '🌐 Đã đăng ký tên miền', color: '#F59E0B' },
  { value: 'ACTIVE',     label: '🚀 Website hoạt động',   color: '#10B981' },
  { value: 'CANCELLED',  label: '❌ Đã hủy',               color: '#EF4444' },
];

const TYPE_LABEL = {
  BAN_LE: 'Bán lẻ', NONG_SAN: 'Nông sản', AN_UONG: 'Ăn uống',
  THOI_TRANG: 'Thời trang', DICH_VU: 'Dịch vụ', THU_CONG: 'Thủ công', KHAC: 'Khác'
};

const SmartwebAdmin = () => {
  const [docs, setDocs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateForm, setUpdateForm] = useState({});
  const [updating, setUpdating] = useState(false);
  const [qrData, setQrData] = useState(null);
  const role = localStorage.getItem('role') || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
      const [docsRes, statsRes] = await Promise.all([
        api.get('/smartweb', { params }),
        api.get('/smartweb/stats')
      ]);
      setDocs(docsRes.data.docs || []);
      setTotalPages(docsRes.data.totalPages || 1);
      setStats(statsRes.data);
    } catch {
      toast.error('Lỗi tải dữ liệu SmartWeb');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setUpdating(true);
    try {
      await api.put(`/smartweb/${selectedItem._id}`, updateForm);
      toast.success('Cập nhật thành công!');
      setSelectedItem(null);
      fetchData();
    } catch {
      toast.error('Lỗi cập nhật');
    } finally {
      setUpdating(false);
    }
  };

  const handleShowQR = async (agencyId) => {
    try {
      const res = await api.get(`/smartweb/qr/${agencyId}`);
      setQrData(res.data);
    } catch {
      toast.error('Lỗi tạo QR code');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    const token = localStorage.getItem('token');
    const url = `${api.defaults.baseURL}/smartweb/export?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'smartweb_export.xlsx');
    // Cần thêm token vào header — mở cửa sổ mới
    window.open(`${url}&token=${token}`, '_blank');
  };

  const filtered = docs.filter(d =>
    !search ||
    d.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
    d.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone?.includes(search) ||
    d.trackingCode?.includes(search.toUpperCase())
  );

  const statCards = stats ? [
    { label: 'Tổng đăng ký', value: stats.total, color: '#1a3a6b', icon: Store },
    { label: 'Chờ hỗ trợ', value: stats.pending, color: '#6366F1', icon: Clock },
    { label: 'Đã có tên miền', value: stats.registered, color: '#F59E0B', icon: Globe },
    { label: 'Website active', value: stats.active, color: '#10B981', icon: CheckCircle },
  ] : [];

  return (
    <div className="animate-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe size={24} color="var(--primary)" /> Quản lý SmartWeb
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.9rem' }}>Theo dõi đăng ký "Mỗi tiểu thương một website .VN"</p>
        </div>
        <button className="btn btn-outline" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={16} /> Xuất Excel
        </button>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {statCards.map((s, i) => (
            <div key={i} className="stat-card animate-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={22} color={s.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, SĐT, mã..." className="form-input" style={{ paddingLeft: 38 }} />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="form-input" style={{ minWidth: 200 }}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button className="btn btn-outline" onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} /> Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--tx-3)' }}>
            <Loader2 size={28} className="spin" />
            <p style={{ marginTop: 12 }}>Đang tải dữ liệu...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Globe size={32} /></div>
            <p>Chưa có đăng ký nào{filterStatus ? ' theo bộ lọc này' : ''}</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Chủ cơ sở</th>
                    <th>Tên cơ sở</th>
                    <th>SĐT</th>
                    <th>Loại</th>
                    <th>Xã/Phường</th>
                    <th>Tên miền</th>
                    <th>Trạng thái</th>
                    <th>Ngày ĐK</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => {
                    const st = STATUS_OPTIONS.find(s => s.value === d.status) || STATUS_OPTIONS[1];
                    return (
                      <tr key={d._id} className="animate-up" style={{ animationDelay: `${i * 30}ms` }}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '.8rem', color: '#1a3a6b' }}>{d.trackingCode}</td>
                        <td style={{ fontWeight: 600 }}>{d.ownerName}</td>
                        <td>{d.businessName}</td>
                        <td style={{ fontFamily: 'monospace' }}>{d.phone}</td>
                        <td><span style={{ fontSize: '.8rem', color: 'var(--tx-3)' }}>{TYPE_LABEL[d.businessType] || d.businessType}</span></td>
                        <td style={{ fontSize: '.85rem' }}>{d.agencyId?.name || '—'}</td>
                        <td style={{ fontSize: '.85rem', fontFamily: 'monospace', color: '#0ea5e9' }}>
                          {d.domain ? (
                            <a href={d.websiteUrl || `https://${d.domain}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981' }}>
                              {d.domain} <ExternalLink size={12} />
                            </a>
                          ) : '—'}
                        </td>
                        <td>
                          <span style={{ background: `${st.color}18`, color: st.color, padding: '3px 10px', borderRadius: 20, fontSize: '.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {st.label.replace(/^[\S]+ /, '')}
                          </span>
                        </td>
                        <td style={{ fontSize: '.82rem', color: 'var(--tx-3)' }}>{new Date(d.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setSelectedItem(d); setUpdateForm({ status: d.status, domain: d.domain || '', websiteUrl: d.websiteUrl || '', supportedBy: d.supportedBy || '', supportedPhone: d.supportedPhone || '', notes: d.notes || '' }); }}
                              className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '.78rem' }}>
                              Cập nhật
                            </button>
                            {d.agencyId?._id && (
                              <button onClick={() => handleShowQR(d.agencyId._id)}
                                className="btn btn-outline" style={{ padding: '4px 8px' }}
                                title="Tạo QR code điểm đăng ký">
                                <QrCode size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-outline" style={{ padding: '6px 14px' }}>← Trước</button>
                <span style={{ padding: '6px 16px', fontWeight: 600, color: 'var(--tx-2)' }}>Trang {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-outline" style={{ padding: '6px 14px' }}>Sau →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Cập nhật trạng thái */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a3a6b' }}>Cập nhật trạng thái</h3>
              <button onClick={() => setSelectedItem(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--tx-3)' }}><X size={20} /></button>
            </div>

            <div style={{ background: '#F0F9FF', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700 }}>{selectedItem.businessName}</div>
              <div style={{ fontSize: '.85rem', color: 'var(--tx-3)' }}>{selectedItem.ownerName} · {selectedItem.phone}</div>
              <div style={{ fontSize: '.8rem', fontFamily: 'monospace', color: '#6366F1', marginTop: 4 }}>{selectedItem.trackingCode}</div>
            </div>

            {[
              { key: 'status', label: 'Trạng thái', type: 'select', options: STATUS_OPTIONS.filter(s => s.value) },
              { key: 'domain', label: 'Tên miền (.VN)', type: 'text', placeholder: 'hoatuoi-buonmethuot.vn' },
              { key: 'websiteUrl', label: 'URL Website', type: 'text', placeholder: 'https://hoatuoi-buonmethuot.vn' },
              { key: 'supportedBy', label: 'Đoàn viên hỗ trợ', type: 'text', placeholder: 'Tên đoàn viên phụ trách' },
              { key: 'supportedPhone', label: 'SĐT đoàn viên', type: 'text', placeholder: '0901...' },
              { key: 'notes', label: 'Ghi chú', type: 'textarea' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label className="form-label">{field.label}</label>
                {field.type === 'select' ? (
                  <select value={updateForm[field.key] || ''} onChange={e => setUpdateForm(f => ({ ...f, [field.key]: e.target.value }))} className="form-input">
                    {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea value={updateForm[field.key] || ''} onChange={e => setUpdateForm(f => ({ ...f, [field.key]: e.target.value }))} className="form-input" rows={3} />
                ) : (
                  <input type="text" value={updateForm[field.key] || ''} onChange={e => setUpdateForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} className="form-input" />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setSelectedItem(null)} className="btn btn-outline" style={{ flex: 1 }}>Hủy</button>
              <button onClick={handleUpdate} disabled={updating} className="btn btn-primary" style={{ flex: 2 }}>
                {updating ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {qrData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 36, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontWeight: 700, color: '#1a3a6b', marginBottom: 6 }}>QR Điểm Đăng Ký</h3>
            <p style={{ color: 'var(--tx-3)', fontSize: '.85rem', marginBottom: 20 }}>{qrData.agencyName}</p>
            <img src={qrData.qrDataUrl} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 12, border: '8px solid #f0f4ff' }} />
            <p style={{ fontSize: '.78rem', color: 'var(--tx-3)', marginTop: 12, wordBreak: 'break-all' }}>{qrData.registrationUrl}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setQrData(null)} className="btn btn-outline" style={{ flex: 1 }}>Đóng</button>
              <a href={qrData.qrDataUrl} download={`qr_${qrData.agencyName}.png`} className="btn btn-primary" style={{ flex: 2, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Download size={16} /> Tải QR xuống
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartwebAdmin;
