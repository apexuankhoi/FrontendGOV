import React, { useEffect, useState, useRef } from 'react';
import api from '../../../lib/api';
import { toast } from 'react-toastify';
import { FileOutput, Search, Plus, Eye, Trash2, RefreshCw, Bot, X, Save, Calendar, Building2, User, FileText, AlertTriangle, Shield, Sparkles } from 'lucide-react';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.summary) { toast.error('Vui lòng nhập trích yếu nội dung'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(k => form[k] && formData.append(k, form[k]));
      formData.append('type', 'OUTGOING');
      files.forEach(f => formData.append('files', f));

      await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('📤 Tạo văn bản đi thành công!');
      setShowForm(false);
      fetchDocs();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi tạo văn bản'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa văn bản này?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Đã xóa văn bản');
      fetchDocs();
    } catch { toast.error('Lỗi xóa văn bản'); }
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
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Nơi nhận</label>
                  <input className="form-input" placeholder="Các đơn vị nhận" value={form.receivingAgency} onChange={e => setForm({ ...form, receivingAgency: e.target.value })} />
                </div>
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
                <button type="submit" className="btn btn-primary" disabled={submitting}><Save size={15} /> Lưu</button>
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    {showDetail.attachments.map((att, i) => (
                      <a key={i} href={`${import.meta.env.VITE_API_URL}/${att.filePath.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="badge badge-info" style={{ textDecoration: 'none' }}>
                        📄 {att.originalName}
                      </a>
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
    </div>
  );
};

export default DocumentsOutgoing;
