import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { Plus, Trash2, RefreshCw, Calendar } from 'lucide-react';

const NewsAdmin = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/news');
      setNews(res.data);
    } catch { toast.error('Lỗi tải danh sách tin tức'); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/news', form);
      toast.success('📰 Đã đăng bản tin thành công!');
      fetchNews();
      setForm({ title: '', content: '' });
    } catch { toast.error('Lỗi đăng tin tức'); }
    setSubmitting(false);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xóa bài "${title}"?`)) return;
    try {
      await api.delete(`/news/${id}`);
      toast.success('Đã xóa bài viết');
      fetchNews();
    } catch { toast.error('Lỗi xóa bài viết'); }
  };

  return (
    <div className="animate-up">
      <div className="page-header">
        <h2>Quản lý Tin tức Truyền thông</h2>
        <p>Soạn thảo và xuất bản bản tin chiến dịch tình nguyện</p>
      </div>

      {/* Compose Form */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h4 style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <Plus size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Viết bài mới
        </h4>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Tiêu đề bản tin <span className="required">*</span></label>
            <input
              className="form-input"
              required
              placeholder="VD: Đội hình Bách Khoa hoàn thành xây dựng điểm trường tại Ea Tu"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nội dung chi tiết <span className="required">*</span></label>
            <textarea
              className="form-input"
              style={{ resize: 'vertical', minHeight: 160 }}
              required
              rows={6}
              placeholder="Nhập nội dung bài viết chi tiết tại đây..."
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Plus size={16} /> {submitting ? 'Đang đăng...' : 'Đăng bản tin'}
          </button>
        </form>
      </div>

      {/* List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h4>Bài viết đã đăng ({news.length})</h4>
        <button className="btn btn-outline btn-sm" onClick={fetchNews}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-state-icon">⏳</div><h4>Đang tải...</h4></div>
      ) : news.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📰</div>
            <h4>Chưa có bài viết nào</h4>
            <p>Hãy soạn và đăng bản tin đầu tiên ở form trên.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {news.map(n => (
            <div key={n._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--brand-blue)', marginBottom: 6 }}>{n.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 8 }}>
                  <Calendar size={12} />
                  {n.createdAt && !isNaN(new Date(n.createdAt)) 
                    ? new Date(n.createdAt).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Mới cập nhật'}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {n.content}
                </p>
              </div>
              <button className="btn btn-sm btn-danger" style={{ flexShrink: 0 }} onClick={() => handleDelete(n._id, n.title)}>
                <Trash2 size={14} /> Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsAdmin;
