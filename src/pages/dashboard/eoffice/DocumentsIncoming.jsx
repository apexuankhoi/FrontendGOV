import React, { useEffect, useState, useRef } from 'react';
import api from '../../../lib/api';
import { toast } from 'react-toastify';
import { FileInput, Search, Plus, Eye, Trash2, RefreshCw, Upload, Bot, ChevronDown, X, Save, Calendar, Building2, User, FileText, AlertTriangle, Shield, MessageCircle } from 'lucide-react';
import AiChatPanel, { AiChatButton } from '../../../components/AiChatPanel';

const CATEGORIES = ['Công văn', 'Báo cáo', 'Kế hoạch', 'Tờ trình', 'Thông báo', 'Quyết định', 'Giấy mời', 'Chỉ thị', 'Hướng dẫn', 'Khác'];
const URGENCIES = ['Thường', 'Khẩn', 'Thượng khẩn', 'Hỏa tốc'];
const SECURITY_LEVELS = ['Thường', 'Mật', 'Tối mật', 'Tuyệt mật'];
const STATUSES = ['Chờ xử lý', 'Đang xử lý', 'Hoàn thành', 'Quá hạn', 'Trả lại'];
const URGENCY_BADGE = { 'Thường': 'badge-info', 'Khẩn': 'badge-warning', 'Thượng khẩn': 'badge-danger', 'Hỏa tốc': 'badge-danger' };
const STATUS_BADGE = { 'Chờ xử lý': 'badge-warning', 'Đang xử lý': 'badge-info', 'Hoàn thành': 'badge-success', 'Quá hạn': 'badge-danger', 'Trả lại': '' };

const emptyForm = {
  documentNumber: '', issuedDate: '', receivedDate: new Date().toISOString().slice(0, 10),
  issuingAgency: '', signer: '', signerTitle: '', summary: '', category: 'Công văn',
  field: '', urgency: 'Thường', securityLevel: 'Thường', deadline: '', status: 'Chờ xử lý', notes: ''
};

const DocumentsIncoming = () => {
  const [docs, setDocs] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [suggestedTasks, setSuggestedTasks] = useState([]);

  const fileInputRef = useRef(null);
  const role = localStorage.getItem('role') || '';

  const canCreate = ['COMMUNE_ADMIN', 'PROVINCE_ADMIN', 'SENIOR_ADMIN'].includes(role);
  const canDelete = ['ADMIN', 'SENIOR_ADMIN'].includes(role);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const params = { type: 'INCOMING', search, status: filterStatus, urgency: filterUrgency };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get('/documents', { params });
      setDocs(res.data.documents);
      setTotal(res.data.total);
    } catch { toast.error('Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [search, filterStatus, filterUrgency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.summary) { toast.error('Vui lòng nhập trích yếu nội dung'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(k => form[k] && formData.append(k, form[k]));
      formData.append('type', 'INCOMING');
      files.forEach(f => formData.append('files', f));

      const res = await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('📥 Tạo văn bản đến thành công!');
      setShowForm(false);
      setForm({ ...emptyForm });
      setFiles([]);
      fetchDocs();

      // Nếu có file PDF, hỏi AI đọc luôn
      if (files.length > 0 && files.some(f => f.type === 'application/pdf')) {
        const docId = res.data.document._id;
        handleAiRead(docId);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi tạo văn bản'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa văn bản này? Hành động không thể hoàn tác.')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Đã xóa văn bản');
      fetchDocs();
    } catch { toast.error('Lỗi xóa văn bản'); }
  };

  const handleAiRead = async (docId) => {
    setAiLoading(true);
    setAiResult(null);
    setSuggestedTasks([]);
    try {
      const res = await api.post(`/documents/${docId}/ai-read`);
      setAiResult(res.data.aiResult);
      setSuggestedTasks(res.data.suggestedTasks || []);
      toast.success('🤖 AI đã phân tích văn bản thành công!');
      fetchDocs(); // Refresh to show updated fields
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi AI phân tích');
    }
    setAiLoading(false);
  };

  const handleAiUpload = async () => {
    if (!fileInputRef.current?.files[0]) { toast.error('Chọn file PDF trước'); return; }
    setAiLoading(true);
    setAiResult(null);
    try {
      const fd = new FormData();
      fd.append('file', fileInputRef.current.files[0]);
      const res = await api.post('/documents/ai-upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAiResult(res.data.aiResult);
      setSuggestedTasks(res.data.aiResult?.congViecCanLam || []);
      // Auto-fill form
      const ai = res.data.aiResult;
      if (ai) {
        const parseDate = (dStr) => {
          if (!dStr || dStr.toLowerCase().includes('null')) return '';
          if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
          const match = dStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          return '';
        };

        setForm(prev => ({
          ...prev,
          documentNumber: ai.soVanBan || prev.documentNumber,
          issuingAgency: ai.coQuanBanHanh || prev.issuingAgency,
          signer: ai.nguoiKy || prev.signer,
          signerTitle: ai.chucVuNguoiKy || prev.signerTitle,
          summary: ai.trichYeu || prev.summary,
          category: CATEGORIES.includes(ai.loaiVanBan) ? ai.loaiVanBan : prev.category,
          field: ai.linhVuc || prev.field,
          urgency: URGENCIES.includes(ai.doKhan) ? ai.doKhan : prev.urgency,
          issuedDate: parseDate(ai.ngayBanHanh) || prev.issuedDate,
          deadline: parseDate(ai.hanXuLy) || prev.deadline,
        }));
        // Add file to form
        setFiles([fileInputRef.current.files[0]]);
      }
      toast.success('🤖 AI đã đọc file — thông tin đã được điền tự động!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi AI đọc file');
    }
    setAiLoading(false);
  };

  const handleCreateAiTasks = async (docId) => {
    if (suggestedTasks.length === 0) return;
    try {
      const tasks = suggestedTasks.map(t => (typeof t === 'string' ? { title: t } : t));
      await api.post('/documents/ai-create-tasks', { documentId: docId, tasks });
      toast.success(`✅ Đã tạo ${tasks.length} công việc từ AI`);
      setSuggestedTasks([]);
    } catch { toast.error('Lỗi tạo công việc'); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/documents/${id}`, { status });
      toast.success(`Cập nhật trạng thái: ${status}`);
      fetchDocs();
      if (showDetail?._id === id) setShowDetail({ ...showDetail, status });
    } catch { toast.error('Lỗi cập nhật'); }
  };

  return (
    <div className="animate-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FileInput size={24} color="var(--brand-blue)" /> Văn bản đến</h2>
          <p>Quản lý văn bản tiếp nhận — Tổng: {total} văn bản</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchDocs}><RefreshCw size={15} /> Tải lại</button>
          {canCreate && <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setForm({ ...emptyForm }); setFiles([]); setAiResult(null); }}>
            <Plus size={15} /> Thêm văn bản
          </button>}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
          <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Tìm theo số VB, trích yếu, cơ quan..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 'auto', minWidth: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-input" style={{ width: 'auto', minWidth: 120 }} value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}>
          <option value="">Tất cả độ khẩn</option>
          {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="empty-state"><div className="empty-state-icon">⏳</div><h4>Đang tải...</h4></div>
      ) : docs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📥</div>
          <h4>Chưa có văn bản đến</h4>
          <p>Bấm "Thêm văn bản" để tạo mới hoặc upload PDF để AI đọc tự động</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Số VB</th>
                <th style={{ minWidth: 220 }}>Trích yếu</th>
                <th>Cơ quan</th>
                <th>Ngày đến</th>
                <th>Độ khẩn</th>
                <th>Trạng thái</th>
                <th style={{ width: 150 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d._id}>
                  <td>{i + 1}</td>
                  <td><strong style={{ color: 'var(--brand-blue)' }}>{d.documentNumber || '—'}</strong></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{d.summary || 'Chưa có trích yếu'}</div>
                    {d.category && <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 2 }}>{d.category}{d.field ? ` — ${d.field}` : ''}</div>}
                  </td>
                  <td style={{ fontSize: '.85rem' }}>{d.issuingAgency || '—'}</td>
                  <td style={{ fontSize: '.85rem', whiteSpace: 'nowrap' }}>{d.receivedDate ? new Date(d.receivedDate).toLocaleDateString('vi-VN') : '—'}</td>
                  <td><span className={`badge ${URGENCY_BADGE[d.urgency] || 'badge-info'}`}>{d.urgency}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[d.status] || ''}`}>{d.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={async () => {
                        try {
                          const res = await api.get(`/documents/${d._id}`);
                          setShowDetail(res.data);
                        } catch {
                          setShowDetail(d);
                        }
                      }} title="Xem chi tiết"><Eye size={14} /></button>
                      {d.attachments?.length > 0 && !d.aiExtracted && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--brand-blue)' }} onClick={() => handleAiRead(d._id)} title="AI đọc file">
                          <Bot size={14} />
                        </button>
                      )}
                      {d.aiExtracted && <span title="AI đã đọc" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center' }}>🤖</span>}
                      {canDelete && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(d._id)} title="Xóa"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: Tạo văn bản ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FileInput size={20} /> Thêm văn bản đến</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>

            {/* AI Upload */}
            <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #EFF6FF, #F0FDF4)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Bot size={22} color="var(--brand-blue)" />
                <span style={{ fontWeight: 600, fontSize: '.92rem' }}>AI đọc file tự động</span>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ flex: 1, minWidth: 200 }} className="form-input" />
                <button className="btn btn-primary btn-sm" onClick={handleAiUpload} disabled={aiLoading}>
                  {aiLoading ? '⏳ Đang đọc...' : '🤖 AI Đọc File'}
                </button>
              </div>
              {aiResult && (
                <div style={{ marginTop: 12, padding: 12, background: 'white', borderRadius: 'var(--r-md)', border: '1px solid var(--brand-blue)', fontSize: '.85rem' }}>
                  <strong style={{ color: 'var(--brand-blue)' }}>✅ AI đã trích xuất thông tin và điền vào form bên dưới.</strong>
                  {aiResult.deXuatXuLy && <p style={{ marginTop: 6, color: 'var(--tx-2)' }}>💡 Đề xuất: {aiResult.deXuatXuLy}</p>}
                </div>
              )}
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
                  <input className="form-input" placeholder="VD: An ninh trật tự" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Trích yếu nội dung *</label>
                <textarea className="form-input" rows={2} required placeholder="Nội dung chính của văn bản..." value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Cơ quan ban hành</label>
                  <input className="form-input" placeholder="VD: Công an tỉnh Đắk Lắk" value={form.issuingAgency} onChange={e => setForm({ ...form, issuingAgency: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Người ký</label>
                  <input className="form-input" placeholder="Họ tên" value={form.signer} onChange={e => setForm({ ...form, signer: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Chức vụ người ký</label>
                  <input className="form-input" placeholder="VD: Trưởng Công an xã" value={form.signerTitle} onChange={e => setForm({ ...form, signerTitle: e.target.value })} />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Ngày ban hành</label>
                  <input className="form-input" type="date" value={form.issuedDate} onChange={e => setForm({ ...form, issuedDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày đến</label>
                  <input className="form-input" type="date" value={form.receivedDate} onChange={e => setForm({ ...form, receivedDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hạn xử lý</label>
                  <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Độ khẩn</label>
                  <select className="form-input" value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}>
                    {URGENCIES.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Độ mật</label>
                  <select className="form-input" value={form.securityLevel} onChange={e => setForm({ ...form, securityLevel: e.target.value })}>
                    {SECURITY_LEVELS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tệp đính kèm (PDF, DOC, DOCX, JPG)</label>
                <input type="file" className="form-input" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => {
                  const selectedFiles = Array.from(e.target.files);
                  const processedFiles = [];
                  let processedCount = 0;
                  
                  if (selectedFiles.length === 0) return;
                  
                  selectedFiles.forEach(file => {
                    if (file.type.startsWith('image/')) {
                      import('compressorjs').then(({ default: Compressor }) => {
                        new Compressor(file, {
                          quality: 0.6, // Nén ảnh chất lượng 60%
                          maxWidth: 1600,
                          success(result) {
                            processedFiles.push(new File([result], file.name, { type: result.type }));
                            processedCount++;
                            if (processedCount === selectedFiles.length) setFiles(processedFiles);
                          },
                          error(err) {
                            processedFiles.push(file); // Fallback giữ nguyên gốc
                            processedCount++;
                            if (processedCount === selectedFiles.length) setFiles(processedFiles);
                          }
                        });
                      });
                    } else {
                      processedFiles.push(file);
                      processedCount++;
                      if (processedCount === selectedFiles.length) setFiles(processedFiles);
                    }
                  });
                }} />
                {files.length > 0 && <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 4 }}>{files.length} file đã chọn</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú</label>
                <textarea className="form-input" rows={2} placeholder="Ghi chú thêm..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Save size={15} /> {submitting ? 'Đang lưu...' : 'Lưu văn bản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Chi tiết văn bản ── */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => { setShowDetail(null); setAiResult(null); setSuggestedTasks([]); }}>
          <div className="modal-content modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Eye size={20} /> Chi tiết văn bản #{showDetail.documentNumber || showDetail._id.slice(-6)}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowDetail(null); setAiResult(null); setSuggestedTasks([]); }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24 }}>
              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                {[
                  { icon: FileText, label: 'Số VB', value: showDetail.documentNumber || '—' },
                  { icon: Building2, label: 'Cơ quan', value: showDetail.issuingAgency || '—' },
                  { icon: User, label: 'Người ký', value: showDetail.signer || '—' },
                  { icon: Calendar, label: 'Ngày đến', value: showDetail.receivedDate ? new Date(showDetail.receivedDate).toLocaleDateString('vi-VN') : '—' },
                  { icon: AlertTriangle, label: 'Độ khẩn', value: showDetail.urgency },
                  { icon: Shield, label: 'Độ mật', value: showDetail.securityLevel },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                    <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><item.icon size={13} /> {item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                  <div style={{ fontSize: '.78rem', color: 'var(--tx-3)', marginBottom: 4 }}>📋 Trích yếu</div>
                  <div style={{ fontWeight: 500 }}>{showDetail.summary || 'Chưa có'}</div>
                </div>
                
                {showDetail.qrCode && (
                  <div style={{ width: 100, height: 100, flexShrink: 0, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 4, background: '#fff' }}>
                    <img src={showDetail.qrCode} alt="Mã QR Xác thực" style={{ width: '100%', height: '100%' }} />
                    <div style={{ fontSize: '0.6rem', textAlign: 'center', color: 'var(--tx-3)' }}>Quét xác thực</div>
                  </div>
                )}
              </div>

              {showDetail.aiSuggestion && (
                <div style={{ padding: '14px 16px', background: '#EFF6FF', borderRadius: 'var(--r-md)', marginBottom: 16, border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '.78rem', color: 'var(--brand-blue)', marginBottom: 4 }}>🤖 Đề xuất xử lý từ AI</div>
                  <div style={{ fontWeight: 500, color: 'var(--tx-1)' }}>{showDetail.aiSuggestion}</div>
                </div>
              )}

              {/* Files & Document Viewer */}
              {showDetail.attachments?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: 8 }}>📎 File đính kèm ({showDetail.attachments.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {showDetail.attachments.map((att, i) => (
                      <a key={i} href={att.filePath.startsWith('http') ? att.filePath : `${import.meta.env.VITE_API_URL || 'http://localhost:5005'}/${att.filePath.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer"
                        className="badge badge-info" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                        📄 {att.originalName}
                      </a>
                    ))}
                  </div>
                  
                  {/* Trình xem PDF (Nếu có file PDF) */}
                  {showDetail.attachments.find(a => a.originalName.toLowerCase().endsWith('.pdf')) && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', height: 400 }}>
                      <iframe 
                        src={showDetail.attachments.find(a => a.originalName.toLowerCase().endsWith('.pdf')).filePath.startsWith('http') ? showDetail.attachments.find(a => a.originalName.toLowerCase().endsWith('.pdf')).filePath : `${import.meta.env.VITE_API_URL || 'http://localhost:5005'}/${showDetail.attachments.find(a => a.originalName.toLowerCase().endsWith('.pdf')).filePath.replace(/\\/g, '/')}`} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 'none' }}
                        title="Document Viewer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* AI Tasks */}
              {suggestedTasks.length > 0 && (
                <div style={{ padding: '14px 16px', background: '#F0FDF4', borderRadius: 'var(--r-md)', border: '1px solid #BBF7D0', marginBottom: 16 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--success)', marginBottom: 8 }}>🤖 AI đề xuất {suggestedTasks.length} công việc:</div>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {suggestedTasks.map((t, i) => (
                      <li key={i} style={{ padding: '6px 10px', background: 'white', borderRadius: 'var(--r-sm)', fontSize: '.88rem' }}>
                        ✅ {typeof t === 'string' ? t : t.title}
                      </li>
                    ))}
                  </ul>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => handleCreateAiTasks(showDetail._id)}>
                    Tạo tất cả công việc
                  </button>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                {showDetail.attachments?.length > 0 && !showDetail.aiExtracted && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleAiRead(showDetail._id)} disabled={aiLoading}>
                    <Bot size={15} /> {aiLoading ? 'Đang đọc...' : 'AI Đọc File'}
                  </button>
                )}
                {showDetail.status !== 'Hoàn thành' && (
                  <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(showDetail._id, 'Hoàn thành')}>Hoàn thành</button>
                )}
                {showDetail.status === 'Chờ xử lý' && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleUpdateStatus(showDetail._id, 'Đang xử lý')}>Bắt đầu xử lý</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      <AiChatPanel
        targetId={chatTarget?._id}
        targetType="document"
        targetTitle={chatTarget?.summary || chatTarget?.documentNumber || 'Văn bản'}
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setChatTarget(null); }}
      />

      {/* Nút mở chat khi đang xem chi tiết */}
      {showDetail && !chatOpen && (
        <button onClick={() => { setChatTarget(showDetail); setChatOpen(true); }} title="Chat với AI về văn bản này" style={{
          position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
          borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: 999,
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .2s'
        }}>
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
};

export default DocumentsIncoming;
