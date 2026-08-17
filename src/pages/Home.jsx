import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  Map, Users, Hammer, Heart, ArrowRight, Calendar,
  CheckCircle, ShieldCheck, Search, MessageCircle,
  FileText, ChevronRight, Star, Globe, Phone, Mail,
  Download, BookOpen, Sparkles, FolderDown, FileDown, Bot, Layers
} from 'lucide-react';
import { toast } from 'react-toastify';

import imgTnv1 from '../assets/anhtnv/1786950558107_3758955030588213305_3758955030588213305_e1234173d3ee1ca25eed820610715d72.jpg';
import imgTnv2 from '../assets/anhtnv/1786950558137_3758955030588213305_3758955030588213305_918a0743d1ea9cfa4d6df33bde0b5710.jpg';
import imgTnv3 from '../assets/anhtnv/1786950558152_3758955030588213305_3758955030588213305_162780b94639efb2778239795a097b00.jpg';
import imgTnv4 from '../assets/anhtnv/1786950558164_3758955030588213305_3758955030588213305_14d1c29b70d3565300901c07e6ab5dea.jpg';
import imgTnv5 from '../assets/anhtnv/1786950558175_3758955030588213305_3758955030588213305_56dcb88f9f8f81d00013f14631ba9514.jpg';

const TNV_IMAGES = [imgTnv1, imgTnv2, imgTnv3, imgTnv4, imgTnv5];
const getNewsImg = (item, idx = 0) => {
  if (item?.imageUrl && !item.imageUrl.includes('unsplash.com')) return item.imageUrl;
  return TNV_IMAGES[idx % TNV_IMAGES.length];
};

const CENTER = [12.6667, 108.0383];
const DISTRICT_COORDS = {
  'TP Buôn Ma Thuột': [12.6667, 108.0383],
  'Huyện Krông Búk': [12.873, 108.067],
  "Huyện Ea H'leo": [13.067, 108.15],
  'Huyện Krông Năng': [12.936, 108.35],
  "Huyện M'Đrắk": [12.468, 108.703],
  'Huyện Krông Pắc': [12.55, 108.20],
  'Huyện Lắk': [12.283, 108.183],
  'TX Buôn Hồ': [12.922, 108.268],
};

function getPos(team) {
  const base = DISTRICT_COORDS[team.location?.district] || CENTER;
  return [base[0] + (Math.random() - 0.5) * 0.12, base[1] + (Math.random() - 0.5) * 0.12];
}

// Dịch vụ công nhanh
const QUICK_SERVICES = [
  { icon: '📝', title: 'Thủ tục hành chính', desc: 'Hỏi AI về giấy tờ, hồ sơ cần thiết', query: 'Tôi cần tư vấn về thủ tục hành chính' },
  { icon: '⚖️', title: 'Tư vấn pháp luật', desc: 'Tra cứu quy định, pháp lý địa phương', query: 'Tôi cần tư vấn pháp luật' },
  { icon: '🆘', title: 'Gửi yêu cầu hỗ trợ', desc: 'Gửi yêu cầu để xã cử đoàn viên hỗ trợ', link: '/ho-tro' },
  { icon: '🌱', title: 'Tình nguyện viên', desc: 'Tham gia chiến dịch Mùa Hè Xanh', query: 'Làm thế nào để tham gia chiến dịch tình nguyện?' },
  { icon: '🏥', title: 'Y tế cộng đồng', desc: 'Thông tin y tế, sức khỏe tại địa bàn', query: 'Thông tin y tế cộng đồng tại Đắk Lắk' },
  { icon: '🏗️', title: 'Công trình thanh niên', desc: 'Theo dõi tiến độ các dự án', query: 'Các công trình thanh niên đang triển khai?' },
];

// Danh mục tài liệu tham khảo chính thức
const DOC_CATEGORIES = [
  { id: 'ALL', label: '🌟 Tất cả tài liệu' },
  { id: 'HUONG_DAN', label: '📘 Cẩm nang 11 Chỉ tiêu' },
  { id: 'VAN_BAN', label: '📜 Văn bản Chỉ đạo' },
  { id: 'CONG_NGHE', label: '🤖 AI & Kỹ năng số' },
  { id: 'TRUYEN_THONG', label: '🎨 Nhận diện & Media' },
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
    categoryType: 'CONG_NGHE',
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

const Home = () => {
  const [teams, setTeams] = useState([]);
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState({ total: 0, volunteers: 0, projects: 0, value: 0, beneficiaries: 0 });
  const [swStats, setSwStats] = useState({ total: 0, active: 0 });
  const [search, setSearch] = useState('');
  const [docCategory, setDocCategory] = useState('ALL');
  const mapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/teams?status=APPROVED').then(r => {
      setTeams(r.data);
      const s = r.data.reduce((acc, t) => ({
        total: acc.total + 1,
        volunteers: acc.volunteers + (t.statistics?.volunteersCount || 0),
        projects: acc.projects + (t.statistics?.projectsCount || 0),
        value: acc.value + (t.statistics?.estimatedValue || 0),
        beneficiaries: acc.beneficiaries + (t.statistics?.beneficiaries || 0),
      }), { total: 0, volunteers: 0, projects: 0, value: 0, beneficiaries: 0 });
      setStats(s);
    }).catch(() => { });
    api.get('/news').then(r => setNews(r.data.slice(0, 3))).catch(() => { });
    api.get('/smartweb/public-stats').then(r => setSwStats(r.data)).catch(() => { });
  }, []);

  const handleQuickService = (query) => {
    // Trigger chatbot
    const event = new CustomEvent('openChatbot', { detail: { query } });
    window.dispatchEvent(event);
  };

  const handleDownloadDoc = (doc) => {
    toast.success(`📥 Đang tải xuống "${doc.title}"...`);
  };

  const handleAskAiAboutDoc = (doc) => {
    handleQuickService(`Tóm tắt nội dung chính và hướng dẫn thực hiện theo tài liệu: "${doc.title}"`);
  };

  const filteredTeams = teams.filter(t =>
    !search ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.location?.district?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDocs = REFERENCE_DOCUMENTS.filter(d =>
    docCategory === 'ALL' || d.categoryType === docCategory
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          HERO — Chính quyền số dành cho người dân
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-hero">
        <div className="container">
          <div className="ctz-hero-grid">
            {/* Left: Call to Action */}
            <div className="ctz-hero-left">
              <div className="ctz-hero-badge">
                <ShieldCheck size={14} />
                <span>Cổng thông tin chính quyền số Đắk Lắk 2026</span>
              </div>
              <h1 className="ctz-hero-h1">
                Chính quyền số<br />
                <span className="ctz-hero-accent">phục vụ người dân</span>
              </h1>
              <p className="ctz-hero-sub">
                Chiến dịch chuyển đổi số, sổ tay quản lý văn bản, tra cứu thủ tục hành chính và kết nối với AI Trợ lý 24/7 — mọi thứ bạn cần đều ở đây.
              </p>
              <div className="ctz-hero-actions">
                <button onClick={() => handleQuickService('Xin chào, tôi cần hỗ trợ!')} className="btn btn-white btn-lg">
                  <MessageCircle size={18} /> Hỏi AI Trợ lý ngay
                </button>
                <Link to="/doi-hinh" className="btn btn-outline-white btn-lg">
                  Xem Bản đồ đội hình
                </Link>
              </div>
            </div>

            {/* Right: Glassmorphic Stats Grid */}
            <div className="ctz-hero-right">
              <div className="ctz-stat-grid">
                {[
                  { val: stats.total, suf: '', lbl: 'Đội hình hoạt động', icon: Map },
                  { val: stats.volunteers, suf: '+', lbl: 'Tình nguyện viên', icon: Users },
                  { val: stats.projects, suf: '', lbl: 'Công trình hoàn thành', icon: Hammer },
                  { val: stats.beneficiaries, suf: '+', lbl: 'Người được hỗ trợ', icon: Heart },
                ].map((s, i) => (
                  <div key={i} className="ctz-stat-box">
                    <s.icon size={26} className="ctz-stat-icon" />
                    <div className="ctz-stat-val">
                      {typeof s.val === 'number' ? s.val.toLocaleString('vi-VN') : s.val}{s.suf}
                    </div>
                    <div className="ctz-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          DỊCH VỤ NHANH — Quick Services
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-services">
        <div className="container">
          <div className="ctz-services-header">
            <div>
              <span className="section-label">Dịch vụ công trực tuyến</span>
              <h2 className="section-title" style={{ marginTop: 8, textAlign: 'left' }}>Bạn cần hỗ trợ gì?</h2>
            </div>
            <p className="ctz-services-sub">AI Trợ lý sẽ tư vấn ngay lập tức — không cần chờ đợi, không cần đến trực tiếp.</p>
          </div>
          <div className="ctz-services-grid">
            {QUICK_SERVICES.map((s, i) => (
              <button key={i} className="ctz-service-card anim" style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => s.link ? navigate(s.link) : handleQuickService(s.query)}>
                <div className="ctz-service-icon">{s.icon}</div>
                <div>
                  <div className="ctz-service-title">{s.title}</div>
                  <div className="ctz-service-desc">{s.desc}</div>
                </div>
                <ChevronRight size={16} className="ctz-service-arrow" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BẢN ĐỒ SỐ — Map Section
      ══════════════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="ctz-map-wrap">
            <div className="ctz-map-header">
              <div>
                <span className="section-label">Theo dõi trực tuyến</span>
                <h2 className="section-title" style={{ marginTop: 8 }}>Bản đồ số Đắk Lắk</h2>
                <p style={{ color: 'var(--tx-3)', marginTop: 6, fontSize: '.92rem' }}>
                  {stats.total} đội hình đang hoạt động — Click vào điểm để xem thông tin chi tiết
                </p>
              </div>
              {/* Search */}
              <div className="ctz-map-search">
                <Search size={16} />
                <input
                  placeholder="Tìm huyện, đội hình..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <MapContainer center={CENTER} zoom={9} scrollWheelZoom={true}
              style={{ height: 520, borderRadius: 16, boxShadow: '0 8px 30px rgba(15,23,42,.1)' }}>
              <TileLayer
                attribution='&copy; CartoDB'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              {filteredTeams.map(t => (
                <CircleMarker key={t._id} center={getPos(t)} radius={11}
                  pathOptions={{ color: '#1D4ED8', fillColor: '#3B82F6', fillOpacity: .8, weight: 2.5 }}>
                  <Popup>
                    <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", minWidth: 210 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', marginBottom: 8 }}>{t.name}</div>
                      <div style={{ fontSize: '.8rem', color: '#64748B', marginBottom: 4 }}>🏫 {t.schoolOrUnit}</div>
                      <div style={{ fontSize: '.8rem', color: '#64748B', marginBottom: 10 }}>📍 {t.location?.commune}, {t.location?.district}</div>
                      {t.fieldsOfActivity?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                          {t.fieldsOfActivity.slice(0, 2).map(f => (
                            <span key={f} style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: '.7rem', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{f}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 14, fontSize: '.8rem', fontWeight: 700 }}>
                        <span style={{ color: '#1D4ED8' }}>👥 {t.statistics?.volunteersCount || 0}</span>
                        <span style={{ color: '#16A34A' }}>🏗 {t.statistics?.projectsCount || 0}</span>
                        <span style={{ color: '#E11D48' }}>❤️ {t.statistics?.beneficiaries || 0}</span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Link to="/doi-hinh" className="btn btn-outline">
                Xem tất cả đội hình dạng danh sách <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BIỂU TƯỢNG ĐẮk LẮk — Landmark Showcase
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-landmarks-section">
        <div className="container">
          <div className="ctz-landmarks-header">
            <div>
              <span className="section-label">Bản sắc vùng đất Tây Nguyên</span>
              <h2 className="section-title" style={{ marginTop: 8 }}>Biểu tượng ĐẮk LẮk</h2>
              <p style={{ color: 'var(--tx-3)', marginTop: 8, fontSize: '.95rem', maxWidth: 520, lineHeight: 1.7 }}>
                Mảnh đất ĐẮk LẮk — nơi hội tụ những giá trị lịch sử và vẻ đẹp thiên nhiên không nơi nào có được.
              </p>
            </div>
          </div>
          <div className="ctz-landmarks-grid">
            <div className="ctz-landmark-card">
              <div className="ctz-landmark-img-wrap">
                <img src="/landmark1.jpg" alt="Tượng đài Chiến thắng Buôn Ma Thuột" />
                <div className="ctz-landmark-overlay">
                  <div className="ctz-landmark-tag">Biểu tượng lịch sử</div>
                </div>
              </div>
              <div className="ctz-landmark-info">
                <h3>Tượng đài Chiến thắng Buôn Ma Thuột</h3>
                <p>Biểu tượng hào hùng của chiến thắng Buôn Ma Thuột năm 1975 — điểm khởi đầu của Đại thắng mùa Xuân, giải phóng miền Nam, thống nhất đất nước.</p>
              </div>
            </div>
            <div className="ctz-landmark-card">
              <div className="ctz-landmark-img-wrap">
                <img src="/landmark2.jpg" alt="Tháp Nghinh Phong" />
                <div className="ctz-landmark-overlay">
                  <div className="ctz-landmark-tag">Công trình văn hóa</div>
                </div>
              </div>
              <div className="ctz-landmark-info">
                <h3>Tháp Nghinh Phong</h3>
                <p>Công trình kiến trúc độc đáo của Tây Nguyên — biểu tượng của sự phát triển văn hóa và du lịch tại điểm cuối dòng chảy của vùng đất Tây Nguyên huyền thoại.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          AI CHATBOT BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-ai-banner">
        <div className="container">
          <div className="ctz-ai-inner">
            <div className="ctz-ai-left">
              <div className="ctz-ai-robot">🤖</div>
              <div>
                <h3>AI Trợ lý ảo Đắk Lắk</h3>
                <p>Giải đáp mọi thắc mắc về thủ tục hành chính, pháp luật và chiến dịch tình nguyện — hoàn toàn miễn phí, hoạt động 24/7.</p>
              </div>
            </div>
            <div className="ctz-ai-chips">
              {['Thủ tục đăng ký hộ khẩu?', 'Tôi muốn tham gia tình nguyện', 'Quy định đất đai Đắk Lắk?'].map(q => (
                <button key={q} className="ctz-ai-chip" onClick={() => handleQuickService(q)}>
                  {q} →
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SMARTWEB SHOWCASE
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-section" style={{ background: 'var(--surface-0)', padding: '80px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', color: '#1D4ED8', padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: '.85rem', marginBottom: 20 }}>
                <Globe size={16} /> Chiến dịch 44 ngày đêm
              </div>
              <h2 style={{ fontSize: '2.4rem', color: '#0F172A', marginBottom: 20, lineHeight: 1.2 }}>
                Mỗi tiểu thương <br/><span style={{ color: '#1D4ED8' }}>một Website .VN</span>
              </h2>
              <p style={{ color: 'var(--tx-2)', fontSize: '1.1rem', marginBottom: 30, lineHeight: 1.6 }}>
                Hỗ trợ 100% chi phí đăng ký tên miền .VN và xây dựng website bán hàng chuẩn thương mại điện tử cho các hộ kinh doanh, tiểu thương trên địa bàn tỉnh Đắk Lắk.
              </p>
              
              <div style={{ display: 'flex', gap: 24, marginBottom: 36 }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{swStats.total}+</div>
                  <div style={{ fontSize: '.9rem', color: 'var(--tx-3)', fontWeight: 600, marginTop: 4 }}>Tiểu thương đăng ký</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{swStats.active}+</div>
                  <div style={{ fontSize: '.9rem', color: 'var(--tx-3)', fontWeight: 600, marginTop: 4 }}>Website hoạt động</div>
                </div>
              </div>

              <Link to="/dang-ky-website" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', fontSize: '1.05rem' }}>
                Đăng ký Website miễn phí <ArrowRight size={18} />
              </Link>
            </div>
            
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, background: '#1D4ED820', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
              <div style={{ position: 'absolute', bottom: -20, left: -20, width: 200, height: 200, background: '#10B98120', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
              
              <div style={{ background: 'white', borderRadius: 24, padding: 32, boxShadow: 'var(--sh-xl)', position: 'relative', zIndex: 1, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: 16, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-2)' }}>
                  <div style={{ textAlign: 'center', color: 'var(--tx-4)' }}>
                    <Globe size={48} style={{ opacity: 0.5, margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 600 }}>SmartWeb Demo Preview</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TIN TỨC
      ══════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════
          TIN TỨC & HOẠT ĐỘNG CHUYỂN ĐỔI SỐ
      ══════════════════════════════════════════════════════ */}
      {news.length > 0 && (
        <section className="section" style={{ background: 'var(--bg)', padding: '70px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <span className="section-label">Truyền thông & Hoạt động</span>
                <h2 className="section-title" style={{ marginTop: 8 }}>Tin tức Chiến dịch Chuyển đổi số</h2>
                <p style={{ color: 'var(--tx-3)', marginTop: 6, fontSize: '.95rem' }}>
                  Cập nhật các hoạt động, mô hình số hóa nổi bật từ 102 xã, phường tỉnh Đắk Lắk
                </p>
              </div>
              <Link to="/tin-tuc" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Tất cả tin tức <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid-3">
              {news.slice(0, 3).map((n, i) => (
                <Link to="/tin-tuc" key={n._id || i} className="news-card anim" style={{ animationDelay: `${i * 80}ms`, textDecoration: 'none', color: 'inherit' }}>
                  <div className="news-card-thumb-wrap">
                    <img 
                      src={getNewsImg(n, i)} 
                      alt={n.title}
                      onError={(e) => { e.target.src = TNV_IMAGES[0]; }}
                    />
                    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                      <span className="news-category-tag" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        {n.category || 'Chiến dịch 44 ngày'}
                      </span>
                    </div>
                  </div>
                  <div className="news-card-body">
                    <div className="news-date">
                      <Calendar size={12} />
                      {new Date(n.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    <h3 className="news-title" style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>
                      {n.title}
                    </h3>
                    <p className="news-excerpt" style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.55 }}>
                      {n.summary || n.content}
                    </p>
                    <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Chi tiết</span>
                      <span style={{ color: '#1D4ED8', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Đọc thêm <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TÀI LIỆU & CẨM NANG THAM KHẢO CHUYỂN ĐỔI SỐ
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-docs-section">
        <div className="container">
          <div className="ctz-docs-header">
            <div>
              <span className="section-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FolderDown size={14} /> Tài nguyên & Văn bản biểu mẫu
              </span>
              <h2 className="section-title" style={{ marginTop: 8 }}>
                Tài liệu & Cẩm nang Tham khảo
              </h2>
              <p style={{ color: 'var(--tx-3)', marginTop: 6, fontSize: '.95rem', maxWidth: 640 }}>
                Tổng hợp văn bản chỉ đạo, cẩm nang 11 chỉ tiêu, giáo trình AI, tài liệu tập huấn và bộ nhận diện truyền thông phục vụ cơ sở.
              </p>
            </div>
            <Link to="/dashboard/eoffice/shared-drive" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FileDown size={16} /> Kho dữ liệu số đầy đủ <ArrowRight size={15} />
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="ctz-docs-filter-wrap">
            {DOC_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`ctz-doc-filter-btn ${docCategory === cat.id ? 'active' : ''}`}
                onClick={() => setDocCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Documents Grid */}
          <div className="ctz-docs-grid">
            {filteredDocs.map((doc, idx) => (
              <div key={doc.id || idx} className="ctz-doc-card anim" style={{ animationDelay: `${idx * 60}ms` }}>
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
                      onClick={() => handleDownloadDoc(doc)}
                    >
                      <Download size={15} /> Tải tài liệu ({doc.fileType})
                    </button>
                    <button
                      className="ctz-doc-btn-ai"
                      onClick={() => handleAskAiAboutDoc(doc)}
                      title="Hỏi AI tóm tắt nội dung tài liệu này"
                    >
                      <Bot size={15} color="#1D4ED8" /> Hỏi AI
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA — Đăng ký tài khoản
      ══════════════════════════════════════════════════════ */}
      {!localStorage.getItem('token') && (
        <section className="ctz-cta">
          <div className="container">
            <div className="ctz-cta-inner">
              <div>
                <h3>Tạo tài khoản Citizen miễn phí</h3>
                <p>Đăng ký để nhận thông báo cập nhật chiến dịch, lưu câu hỏi AI và kết nối với cộng đồng tình nguyện Đắk Lắk.</p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg">Đăng ký miễn phí</Link>
                <Link to="/login" className="btn btn-outline btn-lg">Đăng nhập</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Home;
