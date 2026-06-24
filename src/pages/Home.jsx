import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import {
  Map, Users, Hammer, Heart, ArrowRight, Calendar,
  CheckCircle, ShieldCheck, Search, MessageCircle,
  FileText, ChevronRight, Star, Globe, Phone, Mail
} from 'lucide-react';

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
  { icon: '🌱', title: 'Tình nguyện viên', desc: 'Tham gia chiến dịch Mùa Hè Xanh', query: 'Làm thế nào để tham gia chiến dịch tình nguyện?' },
  { icon: '🏥', title: 'Y tế cộng đồng', desc: 'Thông tin y tế, sức khỏe tại địa bàn', query: 'Thông tin y tế cộng đồng tại Đắk Lắk' },
  { icon: '🏗️', title: 'Công trình thanh niên', desc: 'Theo dõi tiến độ các dự án', query: 'Các công trình thanh niên đang triển khai?' },
  { icon: '📞', title: 'Đường dây hỗ trợ', desc: 'Liên hệ trực tiếp cán bộ địa phương', query: 'Số điện thoại liên hệ cơ quan địa phương?' },
];

const Home = () => {
  const [teams, setTeams] = useState([]);
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState({ total: 0, volunteers: 0, projects: 0, value: 0, beneficiaries: 0 });
  const [search, setSearch] = useState('');
  const mapRef = useRef(null);

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
  }, []);

  const handleQuickService = (query) => {
    // Trigger chatbot
    const event = new CustomEvent('openChatbot', { detail: { query } });
    window.dispatchEvent(event);
  };

  const filteredTeams = teams.filter(t =>
    !search ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.location?.district?.toLowerCase().includes(search.toLowerCase())
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
                Chiến dịch chuyển đổi số, sổ tay quản lý văn bản, tra cứu ...., tra cứu thủ tục hành chính và kết nối với AI Trợ lý 24/7 — mọi thứ bạn cần đều ở đây.
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

            {/* Right: Stats card */}
            <div className="ctz-hero-right">
              <div className="ctz-stat-grid">
                {[
                  { val: stats.total, suf: '', lbl: 'Đội hình hoạt động', icon: Map },
                  { val: stats.volunteers, suf: '+', lbl: 'Tình nguyện viên', icon: Users },
                  { val: stats.projects, suf: '', lbl: 'Công trình đã hoàn thành', icon: Hammer },
                  { val: stats.beneficiaries, suf: '+', lbl: 'Người được hỗ trợ', icon: Heart },
                ].map((s, i) => (
                  <div key={i} className="ctz-stat-box">
                    <s.icon size={22} className="ctz-stat-icon" />
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
                onClick={() => handleQuickService(s.query)}>
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
          TIN TỨC
      ══════════════════════════════════════════════════════ */}
      {news.length > 0 && (
        <section className="section" style={{ background: 'var(--bg)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <span className="section-label">Cập nhật mới nhất</span>
                <h2 className="section-title" style={{ marginTop: 8 }}>Tin tức Chiến dịch</h2>
              </div>
              <Link to="/tin-tuc" className="btn btn-ghost">Tất cả tin tức <ArrowRight size={15} /></Link>
            </div>
            <div className="grid-3">
              {news.map((n, i) => (
                <div key={n._id} className="news-card anim" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="news-card-accent" />
                  <div className="news-card-body">
                    <div className="news-date"><Calendar size={12} />{new Date(n.createdAt).toLocaleDateString('vi-VN')}</div>
                    <h3 className="news-title">{n.title}</h3>
                    <p className="news-excerpt">{n.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
