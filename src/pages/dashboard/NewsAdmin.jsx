import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import {
  Plus, Trash2, RefreshCw, Calendar, Link2,
  Eye, Edit3, X, Check, Loader2, Globe, Image as ImageIcon,
  FileText, ArrowRight, AlertCircle, Sparkles, Newspaper,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import Swal from 'sweetalert2';

const FacebookIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// ── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Chiến dịch 44 ngày đêm',
  'Thanh niên số',
  'SmartWeb & AI',
  'Mô hình điểm',
  'Tập huấn & Đào tạo',
  'Chuyển đổi số',
];

const TABS = [
  { id: 'import', label: '🔗 Import từ Facebook / Web', icon: <FacebookIcon size={15} /> },
  { id: 'manual', label: '✏️ Viết bài thủ công', icon: <Edit3 size={15} /> },
  { id: 'list', label: '📋 Danh sách bài viết', icon: <Newspaper size={15} /> },
];

const emptyForm = {
  title: '',
  summary: '',
  content: '',
  imageUrl: '',
  category: CATEGORIES[0],
  sourceUrl: '',
  sourceType: 'manual',
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const isFBUrl = (url) =>
  url.includes('facebook.com') || url.includes('fb.com') || url.includes('fb.watch');

// ── Component ────────────────────────────────────────────────────────────────
const NewsAdmin = () => {
  const [news, setNews]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('import');

  // Import tab state
  const [importUrl, setImportUrl] = useState('');
  const [scraping, setScraping]   = useState(false);
  const [preview, setPreview]     = useState(null); // scraped data
  const [scrapeError, setScrapeError] = useState('');
  const [editForm, setEditForm]   = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [imgError, setImgError]   = useState(false);

  // Manual tab state
  const [manualForm, setManualForm] = useState({ ...emptyForm });
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // List state
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchNews(); }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/news');
      setNews(res.data || []);
    } catch {
      toast.error('Lỗi tải danh sách tin tức');
    }
    setLoading(false);
  };

  // ── Scrape / Import ────────────────────────────────────────────────────────
  const handleScrape = async () => {
    if (!importUrl.trim()) return toast.warning('Vui lòng nhập link bài viết');
    if (!importUrl.startsWith('http')) return toast.warning('Link phải bắt đầu bằng http:// hoặc https://');

    setScraping(true);
    setPreview(null);
    setScrapeError('');
    setImgError(false);

    try {
      const res = await api.post('/news/scrape', { url: importUrl.trim() });
      const data = res.data;

      if (data.fallback) {
        // Server couldn't scrape — offer manual fill
        setScrapeError(data.message || 'Không thể tải nội dung tự động.');
        setEditForm({
          ...emptyForm,
          sourceUrl: importUrl.trim(),
          sourceType: data.sourceType || 'facebook',
        });
        setPreview({ fallback: true, sourceUrl: importUrl.trim(), sourceType: data.sourceType });
      } else {
        setPreview(data);
        setEditForm({
          title: data.title || '',
          summary: data.summary || '',
          content: data.content || '',
          imageUrl: data.imageUrl || '',
          category: CATEGORIES[0],
          sourceUrl: data.sourceUrl || importUrl.trim(),
          sourceType: data.sourceType || 'web',
        });
        toast.success('✅ Đã đọc nội dung từ link!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi kết nối khi đọc link';
      setScrapeError(msg);
      // Still allow manual entry with prefilled sourceUrl
      setEditForm({ ...emptyForm, sourceUrl: importUrl.trim(), sourceType: isFBUrl(importUrl) ? 'facebook' : 'web' });
      setPreview({ fallback: true, sourceUrl: importUrl.trim() });
    } finally {
      setScraping(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return toast.warning('Vui lòng nhập tiêu đề');
    if (!editForm.content.trim()) return toast.warning('Vui lòng nhập nội dung');

    setSubmitting(true);
    try {
      await api.post('/news', editForm);
      toast.success('🎉 Đã đăng bản tin lên bảng tin!');
      setPreview(null);
      setImportUrl('');
      setScrapeError('');
      setEditForm({ ...emptyForm });
      fetchNews();
      setActiveTab('list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đăng bài');
    }
    setSubmitting(false);
  };

  // ── Manual create ──────────────────────────────────────────────────────────
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualSubmitting(true);
    try {
      await api.post('/news', { ...manualForm, sourceType: 'manual' });
      toast.success('📰 Đã đăng bản tin thành công!');
      setManualForm({ ...emptyForm });
      fetchNews();
      setActiveTab('list');
    } catch {
      toast.error('Lỗi đăng tin tức');
    }
    setManualSubmitting(false);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: 'Xóa bài viết?',
      text: `Bạn có chắc muốn xóa bài "${title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/news/${id}`);
        toast.success('Đã xóa bài viết');
        fetchNews();
      } catch {
        toast.error('Lỗi khi xóa');
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="animate-up">
      {/* Page Header */}
      <div className="page-header">
        <h2>📰 Quản lý Bảng Tin Truyền Thông</h2>
        <p>Import bài viết từ Facebook / web, hoặc soạn bản tin mới để xuất bản lên trang công khai</p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 28,
        borderBottom: '2px solid var(--border)', paddingBottom: 0,
        flexWrap: 'wrap'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 16px', border: 'none', borderRadius: '10px 10px 0 0',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
              transition: 'all .2s',
              background: activeTab === tab.id ? 'var(--brand-blue)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand-blue)' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
        {/* refresh on list tab */}
        {activeTab === 'list' && (
          <button className="btn btn-outline btn-sm" onClick={fetchNews} style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            <RefreshCw size={13} /> Làm mới
          </button>
        )}
      </div>

      {/* ━━━━━━━━━━━━━ TAB: IMPORT TỪ FACEBOOK / WEB ━━━━━━━━━━━━━ */}
      {activeTab === 'import' && (
        <div>
          {/* Step 1 – URL Input */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: 'linear-gradient(135deg,#1877F2,#0ea5e9)',
                color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700
              }}>BƯỚC 1</span>
              Dán link bài viết Facebook hoặc trang web
            </h4>

            {/* Info banner */}
            <div style={{
              background: 'linear-gradient(135deg,#EFF6FF,#F0FDF4)', border: '1px solid #BFDBFE',
              borderRadius: 12, padding: '12px 16px', marginBottom: 16,
              display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.85rem', color: '#1e40af'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Lưu ý về Facebook:</strong> Facebook thường chặn bot đọc tự động.
                Nếu không kéo được nội dung, hệ thống sẽ mở form để bạn điền thủ công và vẫn gắn link nguồn gốc Facebook.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 280px', position: 'relative' }}>
                <Globe size={16} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'
                }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="https://www.facebook.com/... hoặc link trang báo, tin tức"
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScrape()}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleScrape}
                disabled={scraping || !importUrl.trim()}
                style={{ whiteSpace: 'nowrap', minWidth: 130 }}
              >
                {scraping
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Đang đọc...</>
                  : <><Link2 size={15} /> Đọc nội dung</>
                }
              </button>
            </div>
          </div>

          {/* Step 2 – Preview & Edit Form (shown after scrape) */}
          {preview && (
            <form onSubmit={handleImportSubmit}>
              <div className="card" style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    background: scrapeError ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'linear-gradient(135deg,#10b981,#059669)',
                    color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700
                  }}>{scrapeError ? 'BƯỚC 2 – NHẬP THỦ CÔNG' : 'BƯỚC 2 – CHỈNH SỬA & ĐĂNG'}</span>
                  {scrapeError
                    ? 'Facebook chặn tải tự động — hãy điền nội dung dưới đây'
                    : 'Kiểm tra, chỉnh sửa nội dung rồi bấm đăng'}
                </h4>

                {/* Scrape error notice */}
                {scrapeError && (
                  <div style={{
                    background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10,
                    padding: '12px 16px', marginBottom: 16, fontSize: '0.85rem', color: '#92400E',
                    display: 'flex', gap: 8, alignItems: 'flex-start'
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>{scrapeError}</div>
                  </div>
                )}

                {/* Image preview */}
                {editForm.imageUrl && !imgError && (
                  <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', maxHeight: 220, position: 'relative' }}>
                    <img
                      src={editForm.imageUrl}
                      alt="preview"
                      style={{ width: '100%', height: 220, objectFit: 'cover' }}
                      onError={() => setImgError(true)}
                    />
                    <div style={{
                      position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.5)',
                      borderRadius: 6, padding: '3px 8px', color: '#fff', fontSize: '0.75rem',
                      display: 'flex', alignItems: 'center', gap: 5
                    }}>
                      <ImageIcon size={11} /> Ảnh thumbnail
                    </div>
                  </div>
                )}

                {/* Source URL badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                  borderRadius: 20, marginBottom: 16, fontSize: '0.78rem', fontWeight: 600,
                  background: isFBUrl(editForm.sourceUrl || '') ? '#EEF2FF' : '#F0FDF4',
                  color: isFBUrl(editForm.sourceUrl || '') ? '#4338CA' : '#166534',
                  border: `1px solid ${isFBUrl(editForm.sourceUrl || '') ? '#C7D2FE' : '#BBF7D0'}`,
                  maxWidth: '100%'
                }}>
                  <ExternalLink size={12} />
                  {isFBUrl(editForm.sourceUrl || '') ? '🟦 Facebook' : '🌐 Web'}
                  <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {editForm.sourceUrl}
                  </span>
                </div>

                {/* Form fields */}
                <div style={{ display: 'grid', gap: 14 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tiêu đề bản tin <span className="required">*</span></label>
                    <input
                      className="form-input"
                      required
                      placeholder="Tiêu đề bài viết"
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Tóm tắt (hiển thị trên card)</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Mô tả ngắn 1-2 câu về nội dung bài viết..."
                      value={editForm.summary}
                      onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nội dung chi tiết <span className="required">*</span></label>
                    <textarea
                      className="form-input"
                      rows={7}
                      required
                      placeholder="Nội dung bài viết đầy đủ... (copy paste từ bài FB nếu cần)"
                      style={{ resize: 'vertical', minHeight: 160 }}
                      value={editForm.content}
                      onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Ảnh bìa (URL)</label>
                      <div style={{ position: 'relative' }}>
                        <ImageIcon size={14} style={{
                          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'
                        }} />
                        <input
                          className="form-input"
                          style={{ paddingLeft: 30 }}
                          placeholder="https://... (để trống dùng ảnh mặc định)"
                          value={editForm.imageUrl}
                          onChange={e => { setEditForm({ ...editForm, imageUrl: e.target.value }); setImgError(false); }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Danh mục</label>
                      <select
                        className="form-input"
                        value={editForm.category}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang đăng...</>
                      : <><Sparkles size={14} /> Đăng lên Bảng Tin</>
                    }
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => { setPreview(null); setImportUrl(''); setScrapeError(''); setEditForm({ ...emptyForm }); }}
                  >
                    <X size={14} /> Hủy
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━ TAB: VIẾT BÀI THỦ CÔNG ━━━━━━━━━━━━━ */}
      {activeTab === 'manual' && (
        <div className="card">
          <h4 style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit3 size={18} /> Viết bản tin mới
          </h4>
          <form onSubmit={handleManualSubmit}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tiêu đề bản tin <span className="required">*</span></label>
                <input
                  className="form-input"
                  required
                  placeholder="VD: Đội hình Bách Khoa hoàn thành xây dựng điểm trường tại Ea Tu"
                  value={manualForm.title}
                  onChange={e => setManualForm({ ...manualForm, title: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tóm tắt (hiển thị trên card tin)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Tóm tắt 1-2 câu về nội dung bài viết..."
                  value={manualForm.summary}
                  onChange={e => setManualForm({ ...manualForm, summary: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nội dung chi tiết <span className="required">*</span></label>
                <textarea
                  className="form-input"
                  style={{ resize: 'vertical', minHeight: 180 }}
                  required
                  rows={7}
                  placeholder="Nhập nội dung bài viết chi tiết tại đây..."
                  value={manualForm.content}
                  onChange={e => setManualForm({ ...manualForm, content: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ảnh bìa (URL)</label>
                  <input
                    className="form-input"
                    placeholder="https://... (để trống dùng ảnh mặc định)"
                    value={manualForm.imageUrl}
                    onChange={e => setManualForm({ ...manualForm, imageUrl: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Danh mục</label>
                  <select
                    className="form-input"
                    value={manualForm.category}
                    onChange={e => setManualForm({ ...manualForm, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={manualSubmitting} style={{ marginTop: 20 }}>
              {manualSubmitting
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang đăng...</>
                : <><Plus size={16} /> Đăng bản tin</>
              }
            </button>
          </form>
        </div>
      )}

      {/* ━━━━━━━━━━━━━ TAB: DANH SÁCH BÀI VIẾT ━━━━━━━━━━━━━ */}
      {activeTab === 'list' && (
        <div>
          {loading ? (
            <div className="empty-state"><div className="empty-state-icon">⏳</div><h4>Đang tải...</h4></div>
          ) : news.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📰</div>
                <h4>Chưa có bài viết nào</h4>
                <p>Hãy import từ Facebook hoặc viết bài mới ở tab trên.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setActiveTab('import')}>
                  <Link2 size={14} /> Import bài viết
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {news.map((n, idx) => (
                <div key={n._id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                    {/* Left – info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        {/* Source badge */}
                        {n.sourceType === 'facebook' && (
                          <span style={{
                            background: '#EEF2FF', color: '#4338CA', borderRadius: 20,
                            padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #C7D2FE'
                          }}>
                            🟦 Facebook
                          </span>
                        )}
                        {n.sourceType === 'web' && (
                          <span style={{
                            background: '#F0FDF4', color: '#166534', borderRadius: 20,
                            padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #BBF7D0'
                          }}>
                            🌐 Web
                          </span>
                        )}
                        <span style={{
                          background: '#F1F5F9', color: '#475569', borderRadius: 20,
                          padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600
                        }}>
                          {n.category}
                        </span>
                      </div>

                      <h4 style={{ color: 'var(--brand-blue)', marginBottom: 4, fontSize: '0.95rem', fontWeight: 700 }}>
                        {n.title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 6 }}>
                        <Calendar size={11} />
                        {n.createdAt && !isNaN(new Date(n.createdAt))
                          ? new Date(n.createdAt).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                          : 'Mới cập nhật'}
                        <span>•</span>
                        <Eye size={11} /> {n.views || 0} lượt xem
                      </div>

                      {/* Expandable content */}
                      <p style={{
                        color: 'var(--text-secondary)', fontSize: '0.85rem',
                        display: expandedId === n._id ? 'block' : '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: expandedId === n._id ? 'visible' : 'hidden',
                        marginBottom: 6
                      }}>
                        {n.summary || n.content}
                      </p>

                      {(n.summary || n.content).length > 120 && (
                        <button
                          style={{ background: 'none', border: 'none', color: 'var(--brand-blue)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          onClick={() => setExpandedId(expandedId === n._id ? null : n._id)}
                        >
                          {expandedId === n._id ? <><ChevronUp size={12} /> Thu gọn</> : <><ChevronDown size={12} /> Xem thêm</>}
                        </button>
                      )}

                      {/* Source link */}
                      {n.sourceUrl && (
                        <div style={{ marginTop: 6 }}>
                          <a
                            href={n.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', color: '#4338CA', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <ExternalLink size={11} /> Xem nguồn gốc
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Right – thumbnail + actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      {n.imageUrl && (
                        <img
                          src={n.imageUrl}
                          alt={n.title}
                          style={{ width: 90, height: 65, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        style={{ flexShrink: 0 }}
                        onClick={() => handleDelete(n._id, n.title)}
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default NewsAdmin;
