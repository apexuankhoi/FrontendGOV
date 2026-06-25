import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Calendar } from 'lucide-react';

const PublicNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/news')
      .then(res => { setNews(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', background: 'var(--surface-0)' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-label">Cập nhật mới nhất</span>
          <h2 className="section-title">Tin tức Chiến dịch Mùa Hè Xanh</h2>
          <p className="section-desc">Thông tin và câu chuyện từ các đội hình đang hoạt động tại Đắk Lắk</p>
        </div>

        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><h4>Đang tải...</h4></div>
        ) : news.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📰</div>
            <h4>Chưa có tin tức nào</h4>
            <p>Các bài viết sẽ được cập nhật sớm</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
            {news.map((n, i) => (
              <div key={n._id} className="news-card animate-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div style={{ height: 8, background: 'linear-gradient(90deg, var(--brand-blue), var(--brand-green))' }} />
                <div className="news-card-content">
                  <div className="news-card-date">
                    <Calendar size={12} />
                    {n.createdAt && !isNaN(new Date(n.createdAt)) 
                      ? new Date(n.createdAt).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Mới cập nhật'}
                  </div>
                  <h3>{n.title}</h3>
                  <p style={{ whiteSpace: 'pre-wrap', WebkitLineClamp: 5, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>{n.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicNews;
