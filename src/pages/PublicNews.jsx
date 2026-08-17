import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { 
  Calendar, 
  Search, 
  Eye, 
  ArrowRight, 
  Flame, 
  X, 
  Share2, 
  Sparkles, 
  Clock, 
  Layers, 
  Bookmark, 
  Check, 
  Building2,
  Filter
} from 'lucide-react';
import { toast } from 'react-toastify';

import imgTnv1 from '../assets/anhtnv/1786950558107_3758955030588213305_3758955030588213305_e1234173d3ee1ca25eed820610715d72.jpg';
import imgTnv2 from '../assets/anhtnv/1786950558137_3758955030588213305_3758955030588213305_918a0743d1ea9cfa4d6df33bde0b5710.jpg';
import imgTnv3 from '../assets/anhtnv/1786950558152_3758955030588213305_3758955030588213305_162780b94639efb2778239795a097b00.jpg';
import imgTnv4 from '../assets/anhtnv/1786950558164_3758955030588213305_3758955030588213305_14d1c29b70d3565300901c07e6ab5dea.jpg';
import imgTnv5 from '../assets/anhtnv/1786950558175_3758955030588213305_3758955030588213305_56dcb88f9f8f81d00013f14631ba9514.jpg';

const TNV_IMAGES = [imgTnv1, imgTnv2, imgTnv3, imgTnv4, imgTnv5];
const DEFAULT_IMAGE = imgTnv1;

const getArticleImage = (item, idx = 0) => {
  if (item?.imageUrl && !item.imageUrl.includes('unsplash.com')) {
    return item.imageUrl;
  }
  return TNV_IMAGES[idx % TNV_IMAGES.length];
};

const CATEGORIES = [
  { id: 'ALL', label: '🌟 Tất cả tin tức' },
  { id: 'Chiến dịch 44 ngày đêm', label: '🚀 Chiến dịch 44 ngày đêm' },
  { id: 'Thanh niên số', label: '👥 Thanh niên số' },
  { id: 'SmartWeb & AI', label: '🌐 SmartWeb & AI' },
  { id: 'Mô hình điểm', label: '📍 Mô hình điểm' },
  { id: 'Tập huấn & Đào tạo', label: '🎓 Tập huấn & Đào tạo' },
  { id: 'Chuyển đổi số', label: '💻 Chuyển đổi số' }
];

const PublicNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/news');
      setNews(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải tin tức:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter news based on category and search keyword
  const filteredNews = news.filter(item => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || 
      item.title?.toLowerCase().includes(query) || 
      item.summary?.toLowerCase().includes(query) || 
      item.content?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = filteredNews.length > 0 ? filteredNews[0] : null;
  const regularNews = filteredNews.length > 1 ? filteredNews.slice(1) : [];

  const handleShare = (article) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Đã sao chép liên kết bài viết vào clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getEstimatedReadingTime = (content = '') => {
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 150));
    return `${minutes} phút đọc`;
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '90vh', paddingBottom: 80 }}>
      {/* ══════════════════════════════════════════════════════
          HERO BANNER & HEADER
      ══════════════════════════════════════════════════════ */}
      <section className="news-portal-header">
        <div className="container">
          <div className="news-portal-pill">
            <Sparkles size={14} /> Trang Thông tin & Truyền thông Chuyển đổi số Đắk Lắk
          </div>
          <h1 className="news-portal-title">
            Tin tức & Hoạt động Chuyển đổi số 2026
          </h1>
          <p className="news-portal-subtitle">
            Cập nhật diễn biến Chiến dịch 44 ngày đêm, phong trào Thanh niên số, tiến độ 11 chỉ tiêu và những câu chuyện thực tiễn tại 102 xã, phường, thị trấn tỉnh Đắk Lắk.
          </p>

          {/* Filter Bar */}
          <div className="news-filter-bar">
            {/* Category Pills */}
            <div className="news-categories-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`news-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="news-search-wrap">
              <Search size={16} className="news-search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm tin bài, từ khóa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════════ */}
      <div className="container" style={{ marginTop: 40 }}>
        {loading ? (
          <div className="empty-state" style={{ padding: '80px 0', background: '#fff', borderRadius: 20 }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem' }}>⏳</div>
            <h4 style={{ fontSize: '1.2rem', marginTop: 12 }}>Đang tải tin bài mới nhất...</h4>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 0', background: '#fff', borderRadius: 20 }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem' }}>📰</div>
            <h4 style={{ fontSize: '1.2rem', marginTop: 12 }}>Không tìm thấy bài viết phù hợp</h4>
            <p style={{ color: '#64748B', marginTop: 6 }}>Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển danh mục.</p>
            <button 
              className="btn btn-outline btn-sm" 
              style={{ marginTop: 18 }}
              onClick={() => { setSearch(''); setActiveCategory('ALL'); }}
            >
              Xem tất cả tin bài
            </button>
          </div>
        ) : (
          <>
            {/* ── 1. SPOTLIGHT / FEATURED ARTICLE ── */}
            {featuredArticle && (
              <div 
                className="news-featured-card animate-up"
                onClick={() => setSelectedArticle(featuredArticle)}
              >
                <div className="news-featured-img-wrap">
                  <img 
                    src={getArticleImage(featuredArticle, 0)} 
                    alt={featuredArticle.title}
                    onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                  />
                  <div className="news-featured-badge">
                    <Flame size={13} /> Tin Tiêu Điểm
                  </div>
                </div>

                <div className="news-featured-body">
                  <div>
                    <div className="news-meta-row">
                      <span className="news-category-tag">
                        {featuredArticle.category || 'Chiến dịch 44 ngày đêm'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Calendar size={13} />
                        {new Date(featuredArticle.createdAt).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} />
                        {getEstimatedReadingTime(featuredArticle.content)}
                      </span>
                    </div>

                    <h2 className="news-featured-title">
                      {featuredArticle.title}
                    </h2>

                    <p className="news-featured-excerpt">
                      {featuredArticle.summary || featuredArticle.content}
                    </p>
                  </div>

                  <div className="news-card-author-footer">
                    <div className="news-author-info">
                      <div className="news-author-avatar">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="news-author-name">
                          {featuredArticle.author?.username || 'Ban Chỉ đạo Chuyển đổi số Đắk Lắk'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          Cổng thông tin Điện tử
                        </div>
                      </div>
                    </div>

                    <div className="news-read-more-btn">
                      Đọc chi tiết <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 2. REGULAR NEWS GRID ── */}
            {regularNews.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Layers size={20} color="#1D4ED8" /> Tin bài mới cập nhật ({regularNews.length})
                  </h3>
                </div>

                <div className="news-portal-grid">
                  {regularNews.map((item, idx) => (
                    <div 
                      key={item._id || idx} 
                      className="news-card animate-up"
                      style={{ animationDelay: `${idx * 60}ms` }}
                      onClick={() => setSelectedArticle(item)}
                    >
                      <div className="news-card-thumb-wrap">
                        <img 
                          src={getArticleImage(item, idx + 1)} 
                          alt={item.title}
                          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                        />
                        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                          <span className="news-category-tag" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            {item.category || 'Tin tức'}
                          </span>
                        </div>
                      </div>

                      <div className="news-card-body">
                        <div className="news-meta-row" style={{ marginBottom: 8, fontSize: '0.78rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} />
                            {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} />
                            {getEstimatedReadingTime(item.content)}
                          </span>
                        </div>

                        <h3 className="news-card-title">
                          {item.title}
                        </h3>

                        <p className="news-card-excerpt">
                          {item.summary || item.content}
                        </p>

                        <div className="news-card-author-footer" style={{ marginTop: 'auto' }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={13} color="#1D4ED8" />
                            {item.author?.username || 'Cán bộ Chuyển đổi số'}
                          </div>

                          <div className="news-read-more-btn" style={{ fontSize: '0.82rem' }}>
                            Xem tiếp <ArrowRight size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          ARTICLE DETAIL READER MODAL
      ══════════════════════════════════════════════════════ */}
      {selectedArticle && (
        <div className="news-modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="news-modal-dialog" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              className="news-modal-close-btn"
              onClick={() => setSelectedArticle(null)}
              title="Đóng bài viết"
            >
              <X size={20} />
            </button>

            {/* Cover Image */}
            <img 
              src={getArticleImage(selectedArticle, filteredNews.findIndex(n => (n._id && n._id === selectedArticle._id) || n.title === selectedArticle.title))} 
              alt={selectedArticle.title}
              className="news-modal-cover"
              onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
            />

            {/* Body */}
            <div className="news-modal-body">
              <div className="news-meta-row" style={{ marginBottom: 16 }}>
                <span className="news-category-tag" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                  {selectedArticle.category || 'Chiến dịch 44 ngày đêm'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} />
                  {new Date(selectedArticle.createdAt).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} />
                  {getEstimatedReadingTime(selectedArticle.content)}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={14} />
                  {selectedArticle.views || 250} lượt xem
                </span>
              </div>

              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.35, marginBottom: 20 }}>
                {selectedArticle.title}
              </h1>

              {/* Author Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="news-author-avatar" style={{ width: 40, height: 40 }}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                      {selectedArticle.author?.username || 'Ban Chỉ đạo Chuyển đổi số Đắk Lắk'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Cơ quan Phát hành • Chiến dịch 44 ngày đêm
                    </div>
                  </div>
                </div>

                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => handleShare(selectedArticle)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {copied ? <Check size={14} color="#16A34A" /> : <Share2 size={14} />}
                  {copied ? 'Đã sao chép' : 'Chia sẻ'}
                </button>
              </div>

              {/* Highlight / Summary Box */}
              {selectedArticle.summary && (
                <div className="news-modal-highlight-box">
                  <strong>Tóm tắt cốt lõi: </strong>
                  {selectedArticle.summary}
                </div>
              )}

              {/* Full Content */}
              <div className="news-modal-content-text">
                {selectedArticle.content}
              </div>

              {/* Modal Footer */}
              <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Nguồn: <strong>Cổng thông tin Điều hành Chuyển đổi số tỉnh Đắk Lắk (Webgov)</strong>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => setSelectedArticle(null)}
                >
                  Đóng bài viết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicNews;
