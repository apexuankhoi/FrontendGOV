import React, { useState } from 'react';
import { 
  FolderDown, 
  Search, 
  Download, 
  Bot, 
  Sparkles, 
  FileText, 
  ExternalLink, 
  Check, 
  Building2, 
  Calendar, 
  Clock,
  Layers,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const DOC_CATEGORIES = [
  { id: 'ALL', label: '🌟 Tất cả tài liệu' },
  { id: 'HUONG_DAN', label: '📘 Cẩm nang 11 Chỉ tiêu' },
  { id: 'VAN_BAN', label: '📜 Văn bản Chỉ đạo' },
  { id: 'CONG_NGHE', label: '🤖 AI & Kỹ năng số' },
  { id: 'TRUYEN_THONG', label: '🎨 Nhận diện & Media' },
  { id: 'KINH_TE_SO', label: '🛒 Kinh tế số & OCOP' }
];

const REFERENCE_DOCUMENTS = [
  {
    id: 1,
    title: 'Sổ tay Hướng dẫn 11 Chỉ tiêu Chiến dịch 44 ngày đêm Chuyển đổi số 2026',
    categoryType: 'HUONG_DAN',
    categoryName: 'Cẩm nang Hướng dẫn',
    fileType: 'PDF',
    size: '4.2 MB',
    agency: 'Ban Chỉ đạo CĐS Tỉnh',
    date: '17/08/2026',
    desc: 'Cẩm nang chi tiết từng bước triển khai 11 chỉ tiêu số hóa: tiếp cận kỹ năng số, kích hoạt VNeID mức 2, DVC trực tuyến, thanh toán QR và lập Đội hình Thanh niên số.',
    color: '#DC2626',
    bg: '#FEF2F2',
    badge: 'Tài liệu Trọng tâm'
  },
  {
    id: 2,
    title: 'Kế hoạch số 44/KH-UBND: Phát động Chiến dịch 44 ngày đêm Thanh niên Đắk Lắk tiên phong CĐS',
    categoryType: 'VAN_BAN',
    categoryName: 'Văn bản Chỉ đạo',
    fileType: 'PDF',
    size: '1.8 MB',
    agency: 'UBND Tỉnh Đắk Lắk',
    date: '15/08/2026',
    desc: 'Văn bản chỉ đạo chính thức của UBND tỉnh ban hành về mục tiêu, lộ trình, phân công nhiệm vụ cho các sở ban ngành và UBND 102 xã/phường/thị trấn.',
    color: '#DC2626',
    bg: '#FEF2F2',
    badge: 'Văn bản Tỉnh'
  },
  {
    id: 3,
    title: 'Giáo trình Tập huấn Trí tuệ Nhân tạo (AI) cho Cán bộ Đoàn & Cơ sở năm 2026',
    categoryType: 'CONG_NGHE',
    categoryName: 'AI & Kỹ năng số',
    fileType: 'DOCX',
    size: '2.5 MB',
    agency: 'Tổ Công nghệ số Cộng đồng',
    date: '16/08/2026',
    desc: 'Tài liệu thực hành các công cụ AI: tự động hóa báo cáo, soạn thảo văn bản, thiết kế infographic truyền thông và giải đáp công dân trực tuyến 24/7.',
    color: '#2563EB',
    bg: '#EFF6FF',
    badge: 'Ứng dụng AI'
  },
  {
    id: 4,
    title: 'Hướng dẫn Kích hoạt VNeID Mức 2 & Nộp hồ sơ Dịch vụ công Quốc gia Toàn trình',
    categoryType: 'HUONG_DAN',
    categoryName: 'Dân sinh & DVC',
    fileType: 'PDF',
    size: '3.1 MB',
    agency: 'Công an Tỉnh & Tỉnh Đoàn',
    date: '12/08/2026',
    desc: 'Bộ infographic và hướng dẫn người dân tự tích hợp CCCD gắn chip, thẻ BHYT, GPLX và tra cứu thông tin hành chính trên điện thoại thông minh.',
    color: '#16A34A',
    bg: '#F0FDF4',
    badge: 'Phổ cập Dân sinh'
  },
  {
    id: 5,
    title: 'Bộ Nhận diện Thương hiệu & Ấn phẩm Truyền thông Chiến dịch 44 ngày đêm',
    categoryType: 'TRUYEN_THONG',
    categoryName: 'Nhận diện & Media',
    fileType: 'ZIP',
    size: '15.4 MB',
    agency: 'Ban Tuyên giáo Tỉnh Đoàn',
    date: '14/08/2026',
    desc: 'Trọn bộ File thiết kế gốc Logo, Banner sân khấu ra quân, Standee tuyên truyền, Khung Avatar Facebook và mẫu bài viết truyền thông chiến dịch.',
    color: '#D97706',
    bg: '#FEF3C7',
    badge: 'Ấn phẩm số'
  },
  {
    id: 6,
    title: 'Sổ tay 5 Bước Đăng ký & Vận hành Website AI.VN SmartWeb cho Tiểu thương, HTX',
    categoryType: 'KINH_TE_SO',
    categoryName: 'Kinh tế số & OCOP',
    fileType: 'PDF',
    size: '2.0 MB',
    agency: 'Trung tâm Hỗ trợ Khởi nghiệp',
    date: '10/08/2026',
    desc: 'Cẩm nang tạo gian hàng số, nhận tài trợ tên miền .VN miễn phí, đưa nông sản OCOP lên bản đồ số và tích hợp thanh toán mã QR tự động.',
    color: '#9333EA',
    bg: '#FAF5FF',
    badge: 'Kinh tế số'
  }
];

const PublicDocuments = () => {
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  const handleDownload = (doc) => {
    toast.success(`📥 Đang tải xuống tài liệu: "${doc.title}" (${doc.fileType} • ${doc.size})`);
  };

  const handleAskAi = (doc) => {
    const event = new CustomEvent('openChatbot', { 
      detail: { query: `Tóm tắt nội dung chính và hướng dẫn thực hiện theo tài liệu: "${doc.title}"` } 
    });
    window.dispatchEvent(event);
  };

  const filteredDocs = REFERENCE_DOCUMENTS.filter(doc => {
    const matchesCat = category === 'ALL' || doc.categoryType === category;
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || 
      doc.title.toLowerCase().includes(query) || 
      doc.desc.toLowerCase().includes(query) ||
      doc.agency.toLowerCase().includes(query) ||
      doc.categoryName.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ background: '#F8FAFC', minHeight: '90vh', paddingBottom: 80 }}>
      {/* Hero Header */}
      <section className="news-portal-header">
        <div className="container">
          <div className="news-portal-pill">
            <Sparkles size={14} /> Kho Tư Liệu & Biểu Mẫu Chính Thức
          </div>
          <h1 className="news-portal-title">
            Tài Liệu & Cẩm Nang Tham Khảo
          </h1>
          <p className="news-portal-subtitle">
            Hệ thống văn bản chỉ đạo, cẩm nang 11 chỉ tiêu, giáo trình tập huấn AI và bộ nhận diện truyền thông phục vụ 102 xã/phường và nhân dân toàn tỉnh Đắk Lắk.
          </p>

          {/* Search & Category Filter Bar */}
          <div className="news-filter-bar">
            <div className="news-categories-wrap">
              {DOC_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`news-cat-btn ${category === cat.id ? 'active' : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="news-search-wrap">
              <Search size={16} className="news-search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu, văn bản, hướng dẫn..."
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

      {/* Main Content */}
      <div className="container" style={{ marginTop: 40 }}>
        {filteredDocs.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 0', background: '#fff', borderRadius: 20 }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem' }}>📁</div>
            <h4 style={{ fontSize: '1.2rem', marginTop: 12 }}>Không tìm thấy tài liệu phù hợp</h4>
            <p style={{ color: '#64748B', marginTop: 6 }}>Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển danh mục.</p>
            <button 
              className="btn btn-outline btn-sm" 
              style={{ marginTop: 18 }}
              onClick={() => { setSearch(''); setCategory('ALL'); }}
            >
              Xem tất cả tài liệu
            </button>
          </div>
        ) : (
          <div className="ctz-docs-grid">
            {filteredDocs.map((doc, idx) => (
              <div key={doc.id || idx} className="ctz-doc-card animate-up" style={{ animationDelay: `${idx * 60}ms` }}>
                <div>
                  <div className="ctz-doc-top">
                    <div className="ctz-doc-icon-box" style={{ background: doc.bg, color: doc.color }}>
                      {doc.fileType}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: doc.bg,
                          color: doc.color
                        }}>
                          {doc.categoryName}
                        </span>
                        {doc.badge && (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#D97706',
                            background: '#FEF3C7',
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            ★ {doc.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="ctz-doc-title">
                        {doc.title}
                      </h3>
                    </div>
                  </div>

                  <p className="ctz-doc-desc">
                    {doc.desc}
                  </p>
                </div>

                <div>
                  <div className="ctz-doc-meta">
                    <span>🏢 {doc.agency}</span>
                    <span>•</span>
                    <span>📅 {doc.date}</span>
                    <span>•</span>
                    <span>💾 {doc.size}</span>
                  </div>

                  <div className="ctz-doc-actions">
                    <button
                      className="ctz-doc-btn-download"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download size={15} /> Tải tài liệu ({doc.fileType})
                    </button>
                    <button
                      className="ctz-doc-btn-ai"
                      onClick={() => handleAskAi(doc)}
                      title="Hỏi AI tóm tắt nội dung tài liệu này"
                    >
                      <Bot size={15} color="#1D4ED8" /> Hỏi AI
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicDocuments;
