import React, { useEffect, useState, useRef } from 'react';
import api from '../../../lib/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { getFileUrl, downloadFile } from '../../../utils/fileHelper';
import { FileOutput, Search, Plus, Eye, Trash2, RefreshCw, Bot, X, Save, Calendar, Building2, User, FileText, AlertTriangle, Shield, Sparkles, Send } from 'lucide-react';

const CATEGORIES = ['Công văn', 'Báo cáo', 'Kế hoạch', 'Tờ trình', 'Thông báo', 'Quyết định', 'Giấy mời', 'Chỉ thị', 'Hướng dẫn', 'Khác'];
const URGENCIES = ['Thường', 'Khẩn', 'Thượng khẩn', 'Hỏa tốc'];
const SECURITY_LEVELS = ['Thường', 'Mật', 'Tối mật', 'Tuyệt mật'];
const STATUSES = ['Chờ xử lý', 'Đang xử lý', 'Hoàn thành', 'Trả lại'];
const URGENCY_BADGE = { 'Thường': 'badge-info', 'Khẩn': 'badge-warning', 'Thượng khẩn': 'badge-danger', 'Hỏa tốc': 'badge-danger' };
const STATUS_BADGE = { 'Chờ xử lý': 'badge-warning', 'Đang xử lý': 'badge-info', 'Hoàn thành': 'badge-success', 'Trả lại': '' };

const emptyForm = {
  documentNumber: '', issuedDate: new Date().toISOString().slice(0, 10), receivedDate: new Date().toISOString().slice(0, 10),
  receivingAgency: '', signer: '', signerTitle: '', summary: '', category: 'Công văn',
  field: '', urgency: 'Thường', securityLevel: 'Thường', status: 'Hoàn thành', notes: ''
};

const DocumentsOutgoing = () => {
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDrafting, setAiDrafting] = useState(false);

  const [form, setForm] = useState({ ...emptyForm });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Dispatch (Liên thông)
  const [showDispatch, setShowDispatch] = useState(null);
  const [dispatchProvince, setDispatchProvince] = useState('');
  const [agencies, setAgencies] = useState([]);
  const [selectedAgencies, setSelectedAgencies] = useState([]);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchFilterLevel, setDispatchFilterLevel] = useState('ALL');
  const [dispatchSearch, setDispatchSearch] = useState('');

  // Create Form Selection
  const [createProvince, setCreateProvince] = useState('');
  const [createSelectedAgencies, setCreateSelectedAgencies] = useState([]);
  const [createFilterLevel, setCreateFilterLevel] = useState('ALL');
  const [createSearch, setCreateSearch] = useState('');
  
  const role = localStorage.getItem('role') || '';
  const canCreate = ['COMMUNE_ADMIN', 'PROVINCE_ADMIN', 'SENIOR_ADMIN'].includes(role);
  const canDelete = ['ADMIN', 'SENIOR_ADMIN'].includes(role);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents', { params: { type: 'OUTGOING', search: search || undefined } });
      setDocs(res.data.documents);
      setTotal(res.data.total);
    } catch { toast.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [search]);

  useEffect(() => {
    api.get('/agencies').then(r => setAgencies(r.data)).catch(() => {});
  }, []);

  // Quick Selection Helpers for Create Modal
  const selectCreateOnlyProvince = () => {
    const provIds = agencies.filter(a => a.level === 'PROVINCE').map(a => a._id);
    setCreateSelectedAgencies(provIds);
    toast.info(`Đã chọn ${provIds.length} cơ quan Cấp Tỉnh`);
  };

  const selectCreateOnlyCommunes = () => {
    const comIds = agencies.filter(a => a.level === 'COMMUNE').map(a => a._id);
    setCreateSelectedAgencies(comIds);
    toast.info(`Đã chọn ${comIds.length} Xã/Phường`);
  };

  const selectCreateAll = () => {
    const allIds = agencies.map(a => a._id);
    setCreateSelectedAgencies(allIds);
    toast.info(`Đã chọn tất cả ${allIds.length} cơ quan (Toàn tỉnh)`);
  };

  const clearCreateSelected = () => {
    setCreateSelectedAgencies([]);
  };

  // Quick Selection Helpers for Dispatch Modal
  const selectDispatchOnlyProvince = () => {
    const provIds = agencies.filter(a => a.level === 'PROVINCE').map(a => a._id);
    setSelectedAgencies(provIds);
    toast.info(`Đã chọn ${provIds.length} cơ quan Cấp Tỉnh`);
  };

  const selectDispatchOnlyCommunes = () => {
    const comIds = agencies.filter(a => a.level === 'COMMUNE').map(a => a._id);
    setSelectedAgencies(comIds);
    toast.info(`Đã chọn ${comIds.length} Xã/Phường`);
  };

  const selectDispatchAll = () => {
    const allIds = agencies.map(a => a._id);
    setSelectedAgencies(allIds);
    toast.info(`Đã chọn tất cả ${allIds.length} cơ quan (Toàn tỉnh)`);
  };

  const clearDispatchSelected = () => {
    setSelectedAgencies([]);
  };

  const handleDispatch = async () => {
    if (selectedAgencies.length === 0) return toast.error('Vui lòng chọn ít nhất 1 cơ quan nhận');
    setDispatching(true);
    try {
      const res = await api.post(`/documents/${showDispatch._id}/dispatch`, { targetAgencyIds: selectedAgencies });
      toast.success(res.data.message);
      setShowDispatch(null);
      setSelectedAgencies([]);
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi gửi liên thông'); }
    setDispatching(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.summary) { toast.error('Vui lòng nhập trích yếu nội dung'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(k => form[k] && formData.append(k, form[k]));
      formData.append('type', 'OUTGOING');
      files.forEach(f => formData.append('files', f));

      if (createSelectedAgencies.length > 0) {
        // Auto set receivingAgency string if empty
        const names = createSelectedAgencies.map(id => agencies.find(a => a._id === id)?.name);
        if (!form.receivingAgency) {
          formData.set('receivingAgency', names.join(', '));
        }
      }

      const resDoc = await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      // Auto dispatch if agencies selected
      if (createSelectedAgencies.length > 0) {
        await api.post(`/documents/${resDoc.data.document._id}/dispatch`, { targetAgencyIds: createSelectedAgencies });
      }
      
      toast.success('📤 Tạo và gửi văn bản thành công!');
      setShowForm(false);
      setCreateSelectedAgencies([]);
      setForm({ ...emptyForm });
      fetchDocs();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi tạo văn bản'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Xóa văn bản?',
      text: "Bạn có chắc muốn xóa văn bản này?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/documents/${id}`);
          toast.success('Đã xóa văn bản');
          fetchDocs();
        } catch { toast.error('Lỗi xóa văn bản'); }
      }
    });
  };

  return (
    <div className="animate-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FileOutput size={24} color="#0891B2" /> Văn bản đi</h2>
          <p>Quản lý văn bản đã ban hành — Tổng: {total} văn bản</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchDocs}><RefreshCw size={15} /> Tải lại</button>
          {canCreate && (
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)' }} onClick={() => { setForm({ ...emptyForm }); setAiPrompt(''); setShowAiDraft(true); }}>
              <Sparkles size={15} /> AI Soạn thảo
            </button>
          )}
          {canCreate && <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => { setForm({ ...emptyForm }); setShowForm(true); }}>
            <Plus size={15} /> Tạo văn bản đi
          </button>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
          <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Tìm theo số VB, trích yếu, nơi nhận..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-state-icon">⏳</div><h4>Đang tải...</h4></div>
      ) : docs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📤</div>
          <h4>Chưa có văn bản đi</h4>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Số VB</th>
                <th style={{ minWidth: 220 }}>Trích yếu</th>
                <th>Nơi nhận</th>
                <th>Ngày ban hành</th>
                <th>Trạng thái</th>
                <th style={{ width: 100 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d._id}>
                  <td>{i + 1}</td>
                  <td><strong style={{ color: '#0891B2' }}>{d.documentNumber || '—'}</strong></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{d.summary}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 2 }}>{d.category}</div>
                  </td>
                  <td style={{ fontSize: '.85rem' }}>{d.receivingAgency || '—'}</td>
                  <td style={{ fontSize: '.85rem' }}>{d.issuedDate ? new Date(d.issuedDate).toLocaleDateString('vi-VN') : '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[d.status] || ''}`}>{d.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowDetail(d)}><Eye size={14} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }} title="Gửi Liên thông" onClick={() => { setShowDispatch(d); setSelectedAgencies([]); }}><Send size={14} /></button>
                      {canDelete && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(d._id)}><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL Tạo VB */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FileOutput size={20} /> Tạo văn bản đi</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Số văn bản</label>
                  <input className="form-input" placeholder="VD: 125/KH-CAX" value={form.documentNumber} onChange={e => setForm({ ...form, documentNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Loại văn bản</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Lĩnh vực</label>
                  <input className="form-input" placeholder="VD: Hành chính" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Trích yếu nội dung *</label>
                <textarea className="form-input" rows={2} required value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
              </div>

              
              <div className="form-group" style={{ marginTop: 8, padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="form-label" style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                    📤 Chọn Nơi nhận / Gửi Liên thông Tự động
                  </label>
                  <span style={{ fontSize: '.82rem', color: createSelectedAgencies.length > 0 ? '#1D4ED8' : '#64748B', fontWeight: 700 }}>
                    Đã chọn: {createSelectedAgencies.length} đơn vị
                  </span>
                </div>

                {/* 1. Nút chọn nhanh (Presets) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <button type="button" onClick={selectCreateOnlyProvince} className="btn btn-sm" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    🏛️ Gửi lên Cấp Tỉnh ({agencies.filter(a => a.level === 'PROVINCE').length})
                  </button>
                  <button type="button" onClick={selectCreateOnlyCommunes} className="btn btn-sm" style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    🏘️ Gửi Tất cả 102 Xã/Phường
                  </button>
                  <button type="button" onClick={selectCreateAll} className="btn btn-sm" style={{ background: '#FAF5FF', color: '#7E22CE', border: '1px solid #E9D5FF', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    🌐 Gửi Toàn tỉnh (Cả Tỉnh + 102 Xã)
                  </button>
                  {createSelectedAgencies.length > 0 && (
                    <button type="button" onClick={clearCreateSelected} className="btn btn-sm btn-ghost" style={{ color: '#EF4444', borderRadius: 8, fontWeight: 600 }}>
                      🧹 Bỏ chọn ({createSelectedAgencies.length})
                    </button>
                  )}
                </div>

                {/* 2. Lọc và Tìm kiếm */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <select className="form-input" style={{ fontSize: '.85rem', background: '#FFF' }} value={createFilterLevel} onChange={e => setCreateFilterLevel(e.target.value)}>
                    <option value="ALL">📁 Tất cả cấp bậc ({agencies.length})</option>
                    <option value="PROVINCE">🏛️ Chỉ Cấp Tỉnh ({agencies.filter(a => a.level === 'PROVINCE').length})</option>
                    <option value="COMMUNE">🏘️ Chỉ Cấp Xã/Phường ({agencies.filter(a => a.level === 'COMMUNE').length})</option>
                  </select>
                  <input 
                    className="form-input" 
                    style={{ fontSize: '.85rem', background: '#FFF' }}
                    placeholder="🔍 Gõ tìm tên cơ quan, xã, phường..."
                    value={createSearch}
                    onChange={e => setCreateSearch(e.target.value)}
                  />
                </div>

                {/* 3. Danh sách cơ quan */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                  <label style={{ cursor: 'pointer', fontSize: '.8rem', color: '#1D4ED8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" onChange={e => {
                      const filteredList = agencies.filter(a => {
                        const matchLevel = createFilterLevel === 'ALL' || a.level === createFilterLevel;
                        const matchSearch = !createSearch || a.name.toLowerCase().includes(createSearch.toLowerCase().trim());
                        return matchLevel && matchSearch;
                      });
                      if (e.target.checked) {
                        const newSelected = [...new Set([...createSelectedAgencies, ...filteredList.map(a => a._id)])];
                        setCreateSelectedAgencies(newSelected);
                      } else {
                        const filteredIds = filteredList.map(a => a._id);
                        setCreateSelectedAgencies(createSelectedAgencies.filter(id => !filteredIds.includes(id)));
                      }
                    }} /> Chọn toàn bộ danh sách đang lọc
                  </label>
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: 4, background: '#FFF', borderRadius: 8, border: '1px solid #CBD5E1' }}>
                  {agencies
                    .filter(a => {
                      const matchLevel = createFilterLevel === 'ALL' || a.level === createFilterLevel;
                      const matchSearch = !createSearch || a.name.toLowerCase().includes(createSearch.toLowerCase().trim());
                      return matchLevel && matchSearch;
                    })
                    .map(a => {
                      const isChecked = createSelectedAgencies.includes(a._id);
                      return (
                        <label key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6, background: isChecked ? '#EFF6FF' : '#FFF', border: isChecked ? '1.5px solid #3B82F6' : '1px solid #E2E8F0', cursor: 'pointer', transition: 'all .1s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" checked={isChecked} onChange={() => setCreateSelectedAgencies(prev => prev.includes(a._id) ? prev.filter(x => x !== a._id) : [...prev, a._id])} />
                            <span style={{ fontSize: '.88rem', fontWeight: isChecked ? 700 : 500, color: isChecked ? '#1D4ED8' : '#1E293B' }}>{a.name}</span>
                          </div>
                          <span className={`badge ${a.level === 'PROVINCE' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '.72rem', padding: '3px 8px' }}>
                            {a.level === 'PROVINCE' ? '🏛️ Cấp Tỉnh' : '🏘️ Xã/Phường'}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Người ký</label>
                  <input className="form-input" value={form.signer} onChange={e => setForm({ ...form, signer: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Chức vụ người ký</label>
                  <input className="form-input" value={form.signerTitle} onChange={e => setForm({ ...form, signerTitle: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">File đính kèm (Bản ký số / PDF)</label>
                <input type="file" className="form-input" multiple accept=".pdf,.doc,.docx" onChange={e => setFiles(Array.from(e.target.files))} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}><Save size={15} /> Lưu & Gửi phát hành</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL Chi tiết */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Eye size={20} /> Chi tiết văn bản đi #{showDetail.documentNumber}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDetail(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                <div style={{ fontSize: '.78rem', color: 'var(--tx-3)', marginBottom: 4 }}>📋 Trích yếu</div>
                <div style={{ fontWeight: 500 }}>{showDetail.summary}</div>
              </div>
              {showDetail.attachments?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 8 }}>📎 File đính kèm</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {showDetail.attachments.map((att, i) => (
                      <button key={i} onClick={() => downloadFile(getFileUrl(att.filePath), att.originalName)} className="badge badge-info" style={{ textDecoration: 'none', cursor: 'pointer', border: 'none' }}>
                        📄 {att.originalName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal form thêm sửa... */}
      {showAiDraft && (
        <div className="modal-overlay">
          <div className="modal-content animate-up" style={{ maxWidth: 600 }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--brand-blue), #9333EA)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={22} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Trợ lý AI Soạn thảo Văn bản</h3>
              </div>
              <button onClick={() => setShowAiDraft(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: 24 }}>
              <div style={{ background: 'var(--surface-0)', padding: 16, borderRadius: 'var(--r-md)', marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--tx-2)', lineHeight: 1.5 }}>
                  Hãy mô tả ngắn gọn nội dung văn bản bạn muốn tạo. AI sẽ tự động sinh Trích yếu, Số văn bản, Nơi nhận và các tiêu chí phân loại phù hợp.
                </p>
              </div>
              <div className="form-group">
                <label>Yêu cầu soạn thảo:</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="VD: Viết công văn gửi các Tỉnh đoàn yêu cầu chuẩn bị chiến dịch Mùa Hè Xanh năm 2026..."
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAiDraft(false)}>Hủy</button>
              <button className="btn btn-primary" disabled={!aiPrompt.trim() || aiDrafting} onClick={() => {
                setAiDrafting(true);
                // Giả lập AI sinh text
                setTimeout(() => {
                  setForm({
                    ...emptyForm,
                    summary: `V/v ${aiPrompt.split(' ').slice(0, 8).join(' ')}...`,
                    receivingAgency: 'Các Tỉnh đoàn, Thành đoàn trực thuộc',
                    category: 'Công văn',
                    urgency: 'Thường',
                    securityLevel: 'Thường',
                    notes: 'Do AI tự động sinh dựa trên yêu cầu: ' + aiPrompt
                  });
                  setAiDrafting(false);
                  setShowAiDraft(false);
                  setShowForm(true); // Mở form văn bản với dữ liệu đã điền
                }, 1500);
              }}>
                {aiDrafting ? <><span className="dot-typing">...</span> Đang xử lý</> : <><Sparkles size={16} /> Tạo bản nháp</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Gửi Liên thông */}
      {showDispatch && (
        <div className="modal-overlay" onClick={() => setShowDispatch(null)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Send size={20} /> Gửi Liên thông Văn bản</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDispatch(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16, padding: 16, background: '#EFF6FF', borderRadius: 'var(--r-md)', border: '1px solid #BFDBFE' }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: '#1E3A8A' }}>{showDispatch.summary}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--tx-3)' }}>Số: {showDispatch.documentNumber || '—'} | Loại: {showDispatch.category}</div>
              </div>

              {/* 1. Nút chọn nhanh (Presets) */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <button type="button" onClick={selectDispatchOnlyProvince} className="btn btn-sm" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  🏛️ Gửi lên Cấp Tỉnh ({agencies.filter(a => a.level === 'PROVINCE').length})
                </button>
                <button type="button" onClick={selectDispatchOnlyCommunes} className="btn btn-sm" style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  🏘️ Gửi Tất cả 102 Xã/Phường
                </button>
                <button type="button" onClick={selectDispatchAll} className="btn btn-sm" style={{ background: '#FAF5FF', color: '#7E22CE', border: '1px solid #E9D5FF', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  🌐 Gửi Toàn tỉnh (Cả Tỉnh + 102 Xã)
                </button>
                {selectedAgencies.length > 0 && (
                  <button type="button" onClick={clearDispatchSelected} className="btn btn-sm btn-ghost" style={{ color: '#EF4444', borderRadius: 8, fontWeight: 600 }}>
                    🧹 Bỏ chọn ({selectedAgencies.length})
                  </button>
                )}
              </div>

              {/* 2. Lọc và Tìm kiếm */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <select className="form-input" style={{ fontSize: '.85rem' }} value={dispatchFilterLevel} onChange={e => setDispatchFilterLevel(e.target.value)}>
                  <option value="ALL">📁 Tất cả cấp bậc ({agencies.length})</option>
                  <option value="PROVINCE">🏛️ Chỉ Cấp Tỉnh ({agencies.filter(a => a.level === 'PROVINCE').length})</option>
                  <option value="COMMUNE">🏘️ Chỉ Cấp Xã/Phường ({agencies.filter(a => a.level === 'COMMUNE').length})</option>
                </select>
                <input 
                  className="form-input" 
                  style={{ fontSize: '.85rem' }}
                  placeholder="🔍 Gõ tìm tên cơ quan, xã, phường..."
                  value={dispatchSearch}
                  onChange={e => setDispatchSearch(e.target.value)}
                />
              </div>

              {/* 3. Danh sách cơ quan */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '.82rem', color: selectedAgencies.length > 0 ? '#1D4ED8' : '#64748B', fontWeight: 700 }}>
                  Đã chọn: {selectedAgencies.length} đơn vị
                </span>
                <label style={{ cursor: 'pointer', fontSize: '.8rem', color: '#1D4ED8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" onChange={e => {
                    const filteredList = agencies.filter(a => {
                      const matchLevel = dispatchFilterLevel === 'ALL' || a.level === dispatchFilterLevel;
                      const matchSearch = !dispatchSearch || a.name.toLowerCase().includes(dispatchSearch.toLowerCase().trim());
                      return matchLevel && matchSearch;
                    });
                    if (e.target.checked) {
                      const newSelected = [...new Set([...selectedAgencies, ...filteredList.map(a => a._id)])];
                      setSelectedAgencies(newSelected);
                    } else {
                      const filteredIds = filteredList.map(a => a._id);
                      setSelectedAgencies(selectedAgencies.filter(id => !filteredIds.includes(id)));
                    }
                  }} /> Chọn toàn bộ danh sách đang lọc
                </label>
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: 4, background: '#F8FAFC', borderRadius: 8, border: '1px solid #CBD5E1' }}>
                {agencies
                  .filter(a => {
                    const matchLevel = dispatchFilterLevel === 'ALL' || a.level === dispatchFilterLevel;
                    const matchSearch = !dispatchSearch || a.name.toLowerCase().includes(dispatchSearch.toLowerCase().trim());
                    return matchLevel && matchSearch;
                  })
                  .map(a => {
                    const isChecked = selectedAgencies.includes(a._id);
                    return (
                      <label key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6, background: isChecked ? '#EFF6FF' : '#FFF', border: isChecked ? '1.5px solid #3B82F6' : '1px solid #E2E8F0', cursor: 'pointer', transition: 'all .1s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" checked={isChecked} onChange={() => setSelectedAgencies(prev => prev.includes(a._id) ? prev.filter(x => x !== a._id) : [...prev, a._id])} />
                          <span style={{ fontSize: '.88rem', fontWeight: isChecked ? 700 : 500, color: isChecked ? '#1D4ED8' : '#1E293B' }}>{a.name}</span>
                        </div>
                        <span className={`badge ${a.level === 'PROVINCE' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '.72rem', padding: '3px 8px' }}>
                          {a.level === 'PROVINCE' ? '🏛️ Cấp Tỉnh' : '🏘️ Xã/Phường'}
                        </span>
                      </label>
                    );
                  })}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-ghost" onClick={() => setShowDispatch(null)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleDispatch} disabled={dispatching || selectedAgencies.length === 0}>
                  {dispatching ? 'Đang gửi...' : `📤 Gửi tới ${selectedAgencies.length} cơ quan`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsOutgoing;
