import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Map, Users, Hammer, Clock, CheckCircle, Printer,
  Globe, QrCode, Smartphone, Shield, TrendingUp, Zap, RefreshCw, Landmark,
  Settings, X, Save, Calendar, ExternalLink, AlertCircle, Search, Filter,
  CheckCircle2, XCircle, FileSpreadsheet, Eye, ChevronRight, Info
} from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#1a3a6b', '#9333EA', '#EF4444'];

// Helper map chuẩn 15 huyện/thị của Đắk Lắk (Loại bỏ hoàn toàn rác "Đắk Lắk")
function getCleanDistrict(team) {
  let d = team.location?.district || '';
  const c = team.location?.commune || team.name || '';
  
  if (!d || d === 'Đắk Lắk' || d === 'Tỉnh Đắk Lắk' || d === 'Khác' || d === 'Chưa rõ') {
    if (c.includes('Buôn Ma Thuột') || c.includes('Tân An') || c.includes('Tân Lập') || c.includes('Thành Nhất') || c.includes('Ea Kao') || c.includes('Hòa Phú')) return 'TP Buôn Ma Thuột';
    if (c.includes('Buôn Hồ') || c.includes('Cư Bao') || c.includes('Ea Drông')) return 'TX Buôn Hồ';
    if (c.includes('Cư M\'gar') || c.includes('Quảng Phú') || c.includes('Cuôr Đăng') || c.includes('Ea Kiết') || c.includes('Ea Tul')) return 'Cư M\'gar';
    if (c.includes('Krông Pắc') || c.includes('Phước An') || c.includes('Ea Knuếc') || c.includes('Tân Tiến') || c.includes('Ea Phê') || c.includes('Ea Kly')) return 'Krông Pắc';
    if (c.includes('Ea H\'leo') || c.includes('Ea Drăng') || c.includes('Ea Khal') || c.includes('Ea Wy') || c.includes('Ea Hiao')) return "Ea H'leo";
    if (c.includes('Krông Búk') || c.includes('Pơng Drang') || c.includes('Cư Pơng')) return 'Krông Búk';
    if (c.includes('Krông Năng') || c.includes('Dliê Ya') || c.includes('Tam Giang') || c.includes('Phú Xuân')) return 'Krông Năng';
    if (c.includes('Ea Kar') || c.includes('Ea Knốp') || c.includes('Ea Ô') || c.includes('Cư Yang')) return 'Ea Kar';
    if (c.includes('M\'Đrắk') || c.includes('M\'Drắk') || c.includes('Ea Riêng') || c.includes('Krông Á')) return "M'Đrắk";
    if (c.includes('Krông Bông') || c.includes('Hòa Sơn') || c.includes('Dang Kang') || c.includes('Yang Mao')) return 'Krông Bông';
    if (c.includes('Lắk') || c.includes('Liên Sơn') || c.includes('Đắk Liêng')) return 'Lắk';
    if (c.includes('Buôn Đôn') || c.includes('Ea Wer') || c.includes('Ea Nuôl')) return 'Buôn Đôn';
    if (c.includes('Ea Súp') || c.includes('Ea Rốk') || c.includes('Ia Rvê') || c.includes('Ia Lốp')) return 'Ea Súp';
    if (c.includes('Krông Ana') || c.includes('Buôn Tráp') || c.includes('Ea Na') || c.includes('Dray Bhăng') || c.includes('Ea Ktur')) return 'Krông Ana';
    if (c.includes('Cư Kuin') || c.includes('Dray Bhăng') || c.includes('Ea Ning') || c.includes('Ea Tiêu')) return 'Cư Kuin';
    return 'TP Buôn Ma Thuột';
  }
  return d.replace('Huyện ', '').replace('Thị xã ', 'TX ').replace('Thành phố ', 'TP ');
}

// Progress bar component
const ProgressBar = ({ value, max, color = '#1a3a6b', label }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: 4 }}>
        <span style={{ color: 'var(--tx-2)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value?.toLocaleString('vi-VN')} <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>/ {max?.toLocaleString('vi-VN')}</span></span>
      </div>
      <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 4, transition: 'width 1s ease',
          boxShadow: `0 0 8px ${color}60`
        }} />
      </div>
    </div>
  );
};

const Overview = () => {
  const [teams, setTeams] = useState([]);
  const [campaignStats, setCampaignStats] = useState(null);
  const [smartwebStats, setSmartwebStats] = useState(null);
  const [communesStatus, setCommunesStatus] = useState({ communes: [], reportedCount: 0, unreportedCount: 0, totalCount: 102 });
  const [loading, setLoading] = useState(true);
  const [loadingCommunes, setLoadingCommunes] = useState(true);
  
  // Tab phân bổ biểu đồ (Mặc định chuẩn 100%: Theo Xã/Phường)
  const [chartViewMode, setChartViewMode] = useState('COMMUNE'); // 'COMMUNE' | 'DISTRICT'

  // Tab lọc danh sách 102 Xã
  const [communeTab, setCommuneTab] = useState('ALL'); // 'ALL' | 'REPORTED' | 'UNREPORTED'
  const [communeSearch, setCommuneSearch] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // Cấu hình thời gian Chiến dịch
  const [config, setConfig] = useState({
    campaignStartDate: '2026-08-01',
    campaignEndDate: '2026-09-13',
    campaignTotalDays: 44,
    campaignName: 'Chiến dịch 44 ngày đêm — Đánh giá tiến độ 11 chỉ tiêu Chuyển đổi số',
    openTime: '13:00',
    closeTime: '18:30',
    editDeadline: '19:00',
    alwaysOpen: false,
    customNotice: ''
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const role = localStorage.getItem('role') || '';
  const canConfig = ['SENIOR_ADMIN', 'ADMIN', 'PROVINCE_ADMIN'].includes(role);

  // Fetch dữ liệu tổng hợp
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, statsRes, swRes, cfgRes] = await Promise.all([
        api.get('/teams/admin').catch(() => ({ data: [] })),
        api.get('/campaign/stats').catch(() => ({ data: {} })),
        api.get('/smartweb/public-stats').catch(() => ({ data: {} })),
        api.get('/campaign/config').catch(() => ({ data: {} }))
      ]);
      setTeams(teamsRes.data || []);
      setCampaignStats(statsRes.data || {});
      setSmartwebStats(swRes.data || {});
      if (cfgRes.data && cfgRes.data.campaignStartDate) {
        setConfig(prev => ({ ...prev, ...cfgRes.data }));
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  // Fetch danh sách 102 xã theo ngày được chọn
  const fetchCommunesStatus = useCallback(async () => {
    setLoadingCommunes(true);
    try {
      const res = await api.get('/campaign/communes-status', { params: { date: filterDate } });
      if (res.data) setCommunesStatus(res.data);
    } catch { /* silent */ }
    setLoadingCommunes(false);
  }, [filterDate]);

  useEffect(() => { 
    fetchAll(); 
  }, [fetchAll]);

  useEffect(() => {
    fetchCommunesStatus();
  }, [fetchCommunesStatus]);

  // Dynamic countdown calculation based on config
  const countdownData = useMemo(() => {
    const now = new Date();
    const start = new Date(config.campaignStartDate ? `${config.campaignStartDate}T00:00:00` : '2026-08-01T00:00:00');
    const end = new Date(config.campaignEndDate ? `${config.campaignEndDate}T23:59:59` : '2026-09-13T23:59:59');
    const totalDays = config.campaignTotalDays || 44;

    if (now < start) {
      const diffStart = start - now;
      return {
        status: 'UPCOMING',
        days: Math.floor(diffStart / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diffStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diffStart % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diffStart % (1000 * 60)) / 1000),
        progress: 0,
        elapsed: 0,
        totalDays
      };
    }

    if (now > end) {
      return {
        status: 'ENDED',
        progress: 100,
        elapsed: totalDays,
        totalDays
      };
    }

    const diffEnd = end - now;
    const elapsedDays = Math.max(1, Math.min(totalDays, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1));
    const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

    return {
      status: 'RUNNING',
      days: Math.floor(diffEnd / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diffEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diffEnd % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diffEnd % (1000 * 60)) / 1000),
      progress,
      elapsed: elapsedDays,
      totalDays
    };
  }, [config]);

  // Lưu cấu hình thời gian chiến dịch
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.put('/campaign/config', config);
      toast.success(res.data.message || '✅ Đã lưu cài đặt chiến dịch thành công!');
      setConfig(prev => ({ ...prev, ...res.data.config }));
      setShowConfigModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu cấu hình chiến dịch');
    } finally {
      setSavingConfig(false);
    }
  };

  const approved = teams.filter(t => t.status === 'APPROVED');
  const pending = teams.filter(t => t.status === 'PENDING');
  const totalVolunteers = teams.reduce((s, t) => s + (t.statistics?.volunteersCount || 0), 0);

  // Xử lý dữ liệu biểu đồ Huyện/Thị sạch sẽ (Loại bỏ hoàn toàn rác "Đắk Lắk")
  const districtData = {};
  const communeMapData = {};
  teams.forEach(t => {
    const cleanDist = getCleanDistrict(t);
    districtData[cleanDist] = (districtData[cleanDist] || 0) + 1;

    const comm = t.location?.commune || t.name?.replace('Đội hình Thanh niên số ', '') || 'Xã khác';
    communeMapData[comm] = (communeMapData[comm] || 0) + 1;
  });

  const barDataDistrict = Object.entries(districtData)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const barDataCommune = Object.entries(communeMapData)
    .map(([name, count]) => ({ name: name.replace('Xã ', '').replace('Phường ', 'P. '), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 xã

  const activeBarData = chartViewMode === 'DISTRICT' ? barDataDistrict : barDataCommune;

  // Dữ liệu Pie Chart
  const pieData = [
    { name: 'Đã duyệt', value: approved.length || 0, color: '#10B981' },
    { name: 'Chờ duyệt', value: pending.length || 0, color: '#F59E0B' },
  ];

  // 11 Chỉ tiêu toàn tỉnh chính thức
  const TARGET = {
    digitalSkills:   100000, // 1. Kỹ năng số
    vneid:           50000,  // 2. VNeID mức 2
    publicServices:  30000,  // 3. DVC trực tuyến
    qr:              10000,  // 4. QR thanh toán
    activeTeams:     102,    // 5. Đội hình TN số
    trainingClasses: 500,    // 6. Lớp tập huấn KNS
    digitalModels:   102,    // 7. Mô hình CĐS
    digitalProducts: 1000,   // 8. SP OCOP số hóa
    youthTrained:    20000,  // 9. TN tập huấn AI
    youthProjects:   102,    // 10. Công trình TN CĐS
    smartweb:        102,    // 11. Website SmartWeb
    activeAgencies:  102,
  };

  const cs = campaignStats || {};
  const sw = smartwebStats || {};

  // Lọc danh sách xã theo Tab và từ khóa
  const filteredCommunes = (communesStatus.communes || []).filter(c => {
    const matchSearch = !communeSearch || 
      c.agencyName?.toLowerCase().includes(communeSearch.toLowerCase().trim()) ||
      c.district?.toLowerCase().includes(communeSearch.toLowerCase().trim()) ||
      c.reporterName?.toLowerCase().includes(communeSearch.toLowerCase().trim());

    if (!matchSearch) return false;
    if (communeTab === 'REPORTED') return c.hasReported;
    if (communeTab === 'UNREPORTED') return !c.hasReported;
    return true;
  });

  return (
    <div className="animate-up" style={{ paddingBottom: 40 }}>
      {/* ════ PAGE HEADER ════ */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Map size={26} color="var(--primary)" /> Dashboard Tổng quan
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.92rem', marginTop: 4 }}>
            {config.campaignName || 'Chiến dịch 44 ngày đêm — Đánh giá tiến độ 11 chỉ tiêu Chuyển đổi số'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {canConfig && (
            <button 
              className="btn btn-outline" 
              onClick={() => setShowConfigModal(true)} 
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#0284C7', color: '#0284C7', background: '#F0F9FF', fontWeight: 700 }}
              title="Chỉnh sửa thời gian bắt đầu, kết thúc và khung giờ chiến dịch"
            >
              <Settings size={15} /> Cài đặt Chiến dịch
            </button>
          )}
          <button className="btn btn-outline" onClick={fetchAll} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} /> Làm mới
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => window.print()}>
            <Printer size={16} /> Xuất Báo cáo
          </button>
        </div>
      </div>

      {/* ════ COUNTDOWN TIMER BANNER (DỮ LIỆU ĐỘNG 100%) ════ */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0284C7 100%)',
        borderRadius: 20, padding: '24px 32px', marginBottom: 24, color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20,
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.35)'
      }}>
        <div>
          <div style={{ fontSize: '.85rem', opacity: 0.85, fontWeight: 700, marginBottom: 8, letterSpacing: '.05em', textTransform: 'uppercase' }}>
            {countdownData.status === 'UPCOMING' ? '⏳ CHIẾN DỊCH SẮP BẮT ĐẦU' : (countdownData.status === 'ENDED' ? '🏆 TỔNG KẾT CHIẾN DỊCH' : '⏳ CHIẾN DỊCH KẾT THÚC SAU')}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {countdownData.status === 'ENDED' ? (
              <span style={{ fontSize: '1.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                🎉 Chiến dịch đã hoàn thành xuất sắc!
              </span>
            ) : countdownData.status === 'UPCOMING' ? (
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                Bắt đầu vào ngày {new Date(config.campaignStartDate).toLocaleDateString('vi-VN')} (Còn {countdownData.days} ngày)
              </span>
            ) : (
              [
                { val: countdownData.days, label: 'Ngày' },
                { val: countdownData.hours, label: 'Giờ' },
                { val: countdownData.minutes, label: 'Phút' },
                { val: countdownData.seconds, label: 'Giây' }
              ].map((unit, i) => (
                <React.Fragment key={unit.label}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {String(unit.val || 0).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: '.72rem', opacity: 0.8, fontWeight: 700, marginTop: 4, textTransform: 'uppercase' }}>
                      {unit.label}
                    </div>
                  </div>
                  {i < 3 && <div style={{ fontSize: '2rem', opacity: 0.5, fontWeight: 200, marginTop: -8 }}>:</div>}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: 200 }}>
          <div style={{ fontSize: '.85rem', opacity: 0.85, marginBottom: 6, fontWeight: 600 }}>Tiến độ chiến dịch</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{countdownData.progress}%</div>
          <div style={{ width: 200, height: 7, background: 'rgba(255,255,255,0.25)', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${countdownData.progress}%`, height: '100%', background: '#FFFFFF', borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
          <div style={{ fontSize: '.78rem', opacity: 0.85, marginTop: 6, fontWeight: 600 }}>
            Ngày {countdownData.elapsed} / {countdownData.totalDays}
          </div>
        </div>
      </div>

      {/* ════ KPI STAT CARDS ════ */}
      <div className="overview-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: Map,        val: teams.length,                    label: 'Tổng đội hình',      color: '#1E3A8A' },
          { icon: CheckCircle,val: approved.length,                 label: 'Đã duyệt',           color: '#10B981' },
          { icon: Users,      val: (cs.volunteers || totalVolunteers).toLocaleString('vi-VN'), label: 'Tình nguyện viên', color: '#9333EA' },
          { icon: Smartphone, val: (cs.digitalSkills || 0).toLocaleString('vi-VN'), label: '1. Kỹ năng số', color: '#0284C7' },
          { icon: Landmark,   val: (cs.vneid || 0).toLocaleString('vi-VN'), label: '2. VNeID mức 2', color: '#16A34A' },
          { icon: QrCode,     val: (cs.qr || 0).toLocaleString('vi-VN'),     label: '4. Hộ KD dùng QR', color: '#F59E0B' },
          { icon: Globe,      val: (cs.smartwebCount || sw.total || 0).toLocaleString('vi-VN'),  label: '11. SmartWeb', color: '#6366F1' },
          { 
            icon: TrendingUp, 
            val: `${cs.activeAgencies || communesStatus.reportedCount || 0} / 102`, 
            label: 'Xã đã báo cáo', 
            color: '#DC2626',
            clickable: true,
            onClick: () => {
              const el = document.getElementById('communes-monitoring-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          },
        ].map((s, i) => (
          <div 
            key={i} 
            className="stat-card animate-up" 
            style={{ 
              animationDelay: `${i * 50}ms`,
              cursor: s.clickable ? 'pointer' : 'default',
              transition: 'transform .2s, box-shadow .2s',
              border: s.clickable ? '1.5px solid #FCA5A5' : '1px solid var(--border)'
            }}
            onClick={s.onClick}
            title={s.clickable ? 'Bấm để cuộn xem danh sách chi tiết các xã & link minh chứng' : ''}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-value" style={{ color: s.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.val}
                  {s.clickable && <span style={{ fontSize: '.75rem', padding: '2px 6px', background: '#FEE2E2', color: '#DC2626', borderRadius: 6, fontWeight: 700 }}>Xem DS</span>}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={22} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ════ TIẾN ĐỘ THỰC TẾ vs CHỈ TIÊU ════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="card animate-up delay-2">
          <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#1E3A8A' }}>
            <TrendingUp size={20} color="#1E3A8A" /> Tiến độ 11 Chỉ tiêu Thực tế vs Mục tiêu
          </h4>
          <ProgressBar value={cs.digitalSkills||0} max={TARGET.digitalSkills} color="#0284C7" label="💻 1. Kỹ năng số" />
          <ProgressBar value={cs.vneid||0} max={TARGET.vneid} color="#16A34A" label="🪪 2. VNeID mức 2" />
          <ProgressBar value={cs.publicServices||0} max={TARGET.publicServices} color="#7C3AED" label="🏛️ 3. DVC Trực tuyến" />
          <ProgressBar value={cs.qr||0} max={TARGET.qr} color="#D97706" label="📱 4. QR Thanh toán" />
          <ProgressBar value={cs.activeTeams||0} max={TARGET.activeTeams} color="#2563EB" label="🏃 5. Đội hình TN số" />
          <ProgressBar value={cs.trainingClasses||0} max={TARGET.trainingClasses} color="#0D9488" label="📚 6. Lớp/Điểm HD KNS" />
          <ProgressBar value={cs.digitalModels||0} max={TARGET.digitalModels} color="#E11D48" label="🏪 7. Mô hình điểm CĐS" />
          <ProgressBar value={cs.digitalProducts||0} max={TARGET.digitalProducts} color="#EA580C" label="🛒 8. SP OCOP số hóa" />
          <ProgressBar value={cs.youthTrained||0} max={TARGET.youthTrained} color="#4F46E5" label="🤖 9. TN học AI" />
          <ProgressBar value={cs.youthProjects||0} max={TARGET.youthProjects} color="#9333EA" label="⚡ 10. Công trình TN CĐS" />
          <ProgressBar value={cs.smartwebCount||sw.total||0} max={TARGET.smartweb} color="#1E40AF" label="🌐 11. Website SmartWeb" />
          <ProgressBar value={cs.activeAgencies||communesStatus.reportedCount||0} max={TARGET.activeAgencies} color="#DC2626" label="🏘️ Xã/Phường ra quân" />
        </div>

        <div className="card animate-up delay-3">
          <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#4F46E5' }}>
            <Globe size={20} color="#4F46E5" /> SmartWeb — Trạng thái tiểu thương
          </h4>
          {[
            { label: 'Tổng đăng ký', val: sw.total||0, color: '#6366F1', pct: 100 },
            { label: 'Có tên miền .VN', val: sw.registered||0, color: '#F59E0B', pct: sw.total > 0 ? Math.round(sw.registered/sw.total*100) : 0 },
            { label: 'Website hoạt động', val: sw.active||0, color: '#10B981', pct: sw.total > 0 ? Math.round(sw.active/sw.total*100) : 0 },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                <span style={{ fontSize: '.9rem', color: 'var(--tx-2)' }}>{r.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: '.8rem', color: 'var(--tx-3)' }}>{r.pct}%</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: r.color }}>{r.val.toLocaleString('vi-VN')}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '100%', background: '#6366F130', borderRadius: 4 }} />
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${sw.total > 0 ? sw.registered/sw.total*100 : 0}%`, background: '#F59E0B', borderRadius: 4, transition: 'width 1s' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${sw.total > 0 ? sw.active/sw.total*100 : 0}%`, background: '#10B981', borderRadius: 4, transition: 'width 1s' }} />
          </div>
        </div>
      </div>

      {/* ════ CHARTS SECTION (ĐÃ SỬA SẠN HUYỆN/THỊ & LEGEND) ════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Biểu đồ Phân bổ đội hình */}
        <div className="card animate-up delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h4 style={{ margin: 0, color: '#1E3A8A', fontSize: '1.05rem', fontWeight: 800 }}>
                {chartViewMode === 'DISTRICT' ? 'Phân bổ đội hình theo Huyện/Thị' : 'Phân bổ đội hình theo Xã/Phường'}
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: 'var(--tx-3)' }}>
                {chartViewMode === 'DISTRICT' ? '15 Huyện/Thị/Thành phố thuộc Đắk Lắk' : 'Top các Xã/Phường có đội hình hoạt động'}
              </p>
            </div>
            {/* Toggle switch Xã/Phường vs Huyện/Thị */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 8, border: '1px solid #CBD5E1' }}>
              <button
                type="button"
                onClick={() => setChartViewMode('COMMUNE')}
                style={{
                  padding: '4px 12px', fontSize: '.76rem', fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: chartViewMode === 'COMMUNE' ? '#1E3A8A' : 'transparent',
                  color: chartViewMode === 'COMMUNE' ? '#FFFFFF' : '#475569',
                  transition: 'all .2s'
                }}
              >
                🏘️ Theo Xã/Phường
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('DISTRICT')}
                style={{
                  padding: '4px 12px', fontSize: '.76rem', fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: chartViewMode === 'DISTRICT' ? '#1E3A8A' : 'transparent',
                  color: chartViewMode === 'DISTRICT' ? '#FFFFFF' : '#475569',
                  transition: 'all .2s'
                }}
              >
                🏛️ Theo Huyện/Thị
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={activeBarData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                angle={-25}
                textAnchor="end"
                dy={6}
                style={{ fontSize: '0.72rem', fontWeight: 600 }} 
              />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'rgba(2,132,199,0.06)' }}
                contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.86rem', boxShadow: 'var(--shadow-lg)' }}
              />
              <Bar dataKey="count" fill="url(#blueGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} name="Số đội hình" />
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E3A8A" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ Tỉ lệ kiểm duyệt */}
        <div className="card animate-up delay-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: 8, color: '#1E3A8A', fontSize: '1.05rem', fontWeight: 800 }}>
            Tỉ lệ kiểm duyệt đội hình
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: '.78rem', color: 'var(--tx-3)' }}>
            Trạng thái xét duyệt hoạt động của các đội hình
          </p>

          <div style={{ flex: 1, minHeight: 180 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={55} 
                  outerRadius={80} 
                  paddingAngle={pieData.length > 1 ? 4 : 0} 
                  dataKey="value"
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.86rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Clear Legend Box */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 4
          }}>
            <div style={{
              background: '#ECFDF5', padding: '8px 12px', borderRadius: 10, border: '1px solid #A7F3D0',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#10B981', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '.72rem', color: '#065F46', fontWeight: 600 }}>Đã duyệt</div>
                <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#047857' }}>
                  {approved.length} <span style={{ fontSize: '.72rem', fontWeight: 600 }}>({teams.length > 0 ? Math.round(approved.length/teams.length*100) : 100}%)</span>
                </div>
              </div>
            </div>

            <div style={{
              background: '#FFFBEB', padding: '8px 12px', borderRadius: 10, border: '1px solid #FDE68A',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#F59E0B', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '.72rem', color: '#92400E', fontWeight: 600 }}>Chờ duyệt</div>
                <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#B45309' }}>
                  {pending.length} <span style={{ fontSize: '.72rem', fontWeight: 600 }}>({teams.length > 0 ? Math.round(pending.length/teams.length*100) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════ SECTION GIÁM SÁT 102 XÃ/PHƯỜNG & LINK MINH CHỨNG (GIẢI QUYẾT ẢNH 4) ════ */}
      <div id="communes-monitoring-section" className="card animate-up" style={{ padding: '24px 28px', border: '1.5px solid #BFDBFE' }}>
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.25rem', fontWeight: 800, color: '#1E3A8A' }}>
              📋 Tiến độ Báo cáo & Link Minh chứng 102 Xã/Phường
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '.84rem', color: 'var(--tx-3)' }}>
              Theo dõi chi tiết đơn vị đã nộp báo cáo, kiểm tra hình ảnh/Google Drive minh chứng và đôn đốc các xã chưa nộp
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', padding: '6px 12px', borderRadius: 10, border: '1px solid #CBD5E1' }}>
              <Calendar size={15} color="#0284C7" />
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)} 
                style={{ border: 'none', background: 'transparent', fontSize: '.86rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
              />
            </div>
            <button className="btn btn-outline" onClick={fetchCommunesStatus} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={15} /> Làm mới
            </button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          {/* Tabs Filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `Tất cả (${communesStatus.totalCount || 102} Xã)`, count: communesStatus.totalCount || 102, color: '#1E3A8A' },
              { id: 'REPORTED', label: `🟢 Đã nộp (${communesStatus.reportedCount || 0})`, count: communesStatus.reportedCount || 0, color: '#059669' },
              { id: 'UNREPORTED', label: `🔴 Chưa nộp (${communesStatus.unreportedCount || 0})`, count: communesStatus.unreportedCount || 0, color: '#DC2626' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCommuneTab(tab.id)}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: '.84rem', fontWeight: 700, cursor: 'pointer',
                  border: communeTab === tab.id ? `1.5px solid ${tab.color}` : '1px solid #E2E8F0',
                  background: communeTab === tab.id ? (tab.id === 'REPORTED' ? '#ECFDF5' : (tab.id === 'UNREPORTED' ? '#FEF2F2' : '#EFF6FF')) : '#FFFFFF',
                  color: communeTab === tab.id ? tab.color : '#64748B',
                  transition: 'all .2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: 240, flex: 1, maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="🔍 Tìm tên Xã, Huyện, người nộp..."
              value={communeSearch}
              onChange={e => setCommuneSearch(e.target.value)}
              style={{ paddingLeft: 36, height: 38, borderRadius: 10, width: '100%' }}
            />
          </div>
        </div>

        {/* Communes Table */}
        {loadingCommunes ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx-3)' }}>
            <RefreshCw size={28} className="spin" style={{ color: '#0284C7', margin: '0 auto 10px' }} />
            <p style={{ margin: 0 }}>Đang kiểm tra tiến độ 102 Xã/Phường...</p>
          </div>
        ) : filteredCommunes.length === 0 ? (
          <div className="empty-state" style={{ padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
            <p style={{ color: 'var(--tx-3)', margin: 0 }}>Không tìm thấy xã/phường nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="table-scroll" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: 900, fontSize: '.84rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ width: 46, textAlign: 'center' }}>#</th>
                  <th style={{ minWidth: 180 }}>Xã / Phường</th>
                  <th style={{ minWidth: 120 }}>Huyện / Thị</th>
                  <th style={{ textAlign: 'center', minWidth: 110 }}>Trạng thái</th>
                  <th style={{ textAlign: 'center', minWidth: 100 }}>Người nộp</th>
                  <th style={{ textAlign: 'center', minWidth: 80 }}>1. KNS</th>
                  <th style={{ textAlign: 'center', minWidth: 80 }}>2. VNeID</th>
                  <th style={{ textAlign: 'center', minWidth: 80 }}>4. QR</th>
                  <th style={{ minWidth: 190 }}>Link Minh chứng (Drive / Ảnh)</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommunes.map((c, i) => (
                  <tr key={c._id || i} style={{ background: c.hasReported ? 'transparent' : '#FFFDFD' }}>
                    <td style={{ textAlign: 'center', color: 'var(--tx-3)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 700, color: '#1E293B' }}>{c.agencyName}</td>
                    <td style={{ color: '#64748B', fontWeight: 500 }}>{c.district || 'Đắk Lắk'}</td>
                    
                    {/* Trạng thái */}
                    <td style={{ textAlign: 'center' }}>
                      {c.hasReported ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '.75rem' }}>
                          <CheckCircle2 size={13} /> Đã nộp
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: '.75rem' }}>
                          <XCircle size={13} /> Chưa nộp
                        </span>
                      )}
                    </td>

                    {/* Người nộp */}
                    <td style={{ textAlign: 'center', fontSize: '.8rem', color: c.reporterName ? '#1E293B' : '#94A3B8' }}>
                      {c.reporterName || '—'}
                    </td>

                    {/* Số liệu tóm tắt */}
                    <td style={{ textAlign: 'center', fontWeight: 700, color: c.hasReported ? '#0284C7' : '#CBD5E1' }}>
                      {c.hasReported ? c.digitalSkills.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: c.hasReported ? '#16A34A' : '#CBD5E1' }}>
                      {c.hasReported ? c.vneidSupport.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: c.hasReported ? '#D97706' : '#CBD5E1' }}>
                      {c.hasReported ? c.qrSupport.toLocaleString('vi-VN') : '—'}
                    </td>

                    {/* LINK MINH CHỨNG (RẤT QUAN TRỌNG) */}
                    <td>
                      {c.evidenceLinks ? (
                        <a 
                          href={c.evidenceLinks} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                            background: '#EFF6FF', color: '#1D4ED8', borderRadius: 8, fontWeight: 700,
                            fontSize: '.78rem', textDecoration: 'none', border: '1px solid #BFDBFE',
                            transition: 'all .2s'
                          }}
                          title={c.evidenceLinks}
                        >
                          <ExternalLink size={13} /> Xem Link Minh chứng
                        </a>
                      ) : (
                        <span style={{ fontSize: '.78rem', color: '#94A3B8', fontStyle: 'italic' }}>
                          {c.hasReported ? 'Chưa đính kèm link' : 'Chưa có báo cáo'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════ MODAL CÀI ĐẶT THỜI GIAN CHIẾN DỊCH (DÀNH CHO SUPER ADMIN) ════ */}
      {showConfigModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div style={{
            maxWidth: 580, width: '100%', padding: '24px 28px', borderRadius: 20,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)', border: '1px solid #E2E8F0',
            background: '#FFFFFF', color: '#0F172A', maxHeight: '92vh', overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
                  <Settings size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1E3A8A' }}>
                    Cài đặt Thời gian Chiến dịch
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '.8rem', color: '#64748B' }}>
                    Thiết lập ngày bắt đầu, ngày kết thúc và khung giờ báo cáo 11 chỉ tiêu
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowConfigModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#64748B', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig}>
              {/* Tên chiến dịch */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 700, fontSize: '.82rem', color: '#1E293B', display: 'block', marginBottom: 4 }}>
                  🏷️ Tên Chiến dịch
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={config.campaignName || ''}
                  onChange={e => setConfig(c => ({ ...c, campaignName: e.target.value }))}
                  required
                  style={{ width: '100%', height: 40, borderRadius: 8, borderColor: '#CBD5E1' }}
                />
              </div>

              {/* 2 Date Picker: Ngày bắt đầu & Ngày kết thúc */}
              <div style={{
                background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', marginBottom: 18
              }}>
                <div style={{ fontSize: '.84rem', fontWeight: 800, color: '#1E3A8A', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={16} color="#0284C7" /> Thời gian Chiến dịch:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontWeight: 700, fontSize: '.8rem', color: '#334155', display: 'block', marginBottom: 4 }}>
                      🚀 Ngày bắt đầu
                    </label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={config.campaignStartDate || '2026-08-01'}
                      onChange={e => {
                        const s = e.target.value;
                        setConfig(c => {
                          const end = c.campaignEndDate;
                          let diff = c.campaignTotalDays;
                          if (s && end) {
                            const d = Math.round((new Date(end) - new Date(s)) / (1000 * 60 * 60 * 24)) + 1;
                            if (d > 0) diff = d;
                          }
                          return { ...c, campaignStartDate: s, campaignTotalDays: diff };
                        });
                      }}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8, fontWeight: 700, borderColor: '#CBD5E1' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 700, fontSize: '.8rem', color: '#334155', display: 'block', marginBottom: 4 }}>
                      🏁 Ngày kết thúc
                    </label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={config.campaignEndDate || '2026-09-13'}
                      onChange={e => {
                        const end = e.target.value;
                        setConfig(c => {
                          const s = c.campaignStartDate;
                          let diff = c.campaignTotalDays;
                          if (s && end) {
                            const d = Math.round((new Date(end) - new Date(s)) / (1000 * 60 * 60 * 24)) + 1;
                            if (d > 0) diff = d;
                          }
                          return { ...c, campaignEndDate: end, campaignTotalDays: diff };
                        });
                      }}
                      required
                      style={{ width: '100%', height: 40, borderRadius: 8, fontWeight: 700, borderColor: '#CBD5E1' }}
                    />
                  </div>
                </div>

                {/* Tổng số ngày */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#EFF6FF', padding: '8px 12px', borderRadius: 8 }}>
                  <span style={{ fontSize: '.82rem', fontWeight: 600, color: '#1E40AF' }}>Tổng thời lượng:</span>
                  <span style={{ fontSize: '.9rem', fontWeight: 900, color: '#1D4ED8' }}>
                    {config.campaignTotalDays || 44} Ngày đêm
                  </span>
                </div>
              </div>

              {/* Khung giờ nhận & sửa báo cáo hằng ngày */}
              <div style={{
                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, marginBottom: 18
              }}>
                <div style={{ fontSize: '.84rem', fontWeight: 800, color: '#1E3A8A', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color="#D97706" /> Khung giờ nộp & chỉnh sửa báo cáo hằng ngày:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '.76rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>
                      1. Mở cổng
                    </label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={config.openTime || '13:00'}
                      onChange={e => setConfig(c => ({ ...c, openTime: e.target.value }))}
                      style={{ textAlign: 'center', fontWeight: 800, width: '100%', height: 38 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '.76rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>
                      2. Đóng nộp mới
                    </label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={config.closeTime || '18:30'}
                      onChange={e => setConfig(c => ({ ...c, closeTime: e.target.value }))}
                      style={{ textAlign: 'center', fontWeight: 800, width: '100%', height: 38 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '.76rem', fontWeight: 700, color: '#B45309', display: 'block', marginBottom: 2 }}>
                      3. Hạn chót sửa
                    </label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={config.editDeadline || config.closeTime || '19:00'}
                      onChange={e => setConfig(c => ({ ...c, editDeadline: e.target.value }))}
                      style={{ textAlign: 'center', fontWeight: 800, width: '100%', height: 38, borderColor: '#F59E0B', background: '#FFFBEB' }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowConfigModal(false)}
                >
                  Đóng
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingConfig}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1D4ED8' }}
                >
                  {savingConfig ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                  {savingConfig ? 'Đang lưu...' : 'Lưu Cài đặt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
