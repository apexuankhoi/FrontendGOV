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
  CheckCircle2, XCircle, FileSpreadsheet, Eye, ChevronRight, Info,
  Copy, Check, Share2, FileText, Sparkles, Layers
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

  // Chế độ xem số liệu thống kê: 'ALL' (Lũy kế toàn chiến dịch) | 'DAILY' (Trong ngày chọn)
  const [statMode, setStatMode] = useState('ALL');
  const [copiedMedia, setCopiedMedia] = useState(false);

  // Fetch dữ liệu tổng hợp
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, statsRes, swRes, cfgRes] = await Promise.all([
        api.get('/teams/admin').catch(() => ({ data: [] })),
        api.get('/campaign/stats', { params: { date: filterDate } }).catch(() => ({ data: {} })),
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
  }, [filterDate]);

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
  const daily = cs.daily || {};
  const cum = cs.cumulative || cs;
  const isDaily = statMode === 'DAILY';

  const formattedFilterDate = useMemo(() => {
    try {
      return new Date(filterDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return filterDate;
    }
  }, [filterDate]);

  // Danh sách 11 chỉ tiêu chính thức
  const CORE_TARGET_LIST = useMemo(() => [
    { key: 'digitalSkills',   dailyKey: 'digitalSkills',   label: '1. Tiếp cận Kỹ năng số cộng đồng', unit: 'lượt', max: TARGET.digitalSkills, icon: '💻', color: '#0284C7' },
    { key: 'vneid',           dailyKey: 'vneid',           label: '2. Kích hoạt VNeID mức 2 & tiện ích', unit: 'lượt', max: TARGET.vneid,  icon: '🪪', color: '#16A34A' },
    { key: 'publicServices',  dailyKey: 'publicServices',  label: '3. Hỗ trợ Dịch vụ công trực tuyến', unit: 'hồ sơ', max: TARGET.publicServices, icon: '🏛️', color: '#7C3AED' },
    { key: 'qr',              dailyKey: 'qr',              label: '4. Hộ KD / Tiểu thương dùng QR', unit: 'hộ', max: TARGET.qr, icon: '📱', color: '#D97706' },
    { key: 'activeTeams',     dailyKey: 'activeTeams',     label: '5. Đội hình "Thanh niên số"', unit: 'đội hình', max: TARGET.activeTeams, icon: '🏃', color: '#2563EB' },
    { key: 'trainingClasses', dailyKey: 'trainingClasses', label: '6. Lớp/Điểm tập huấn kỹ năng số', unit: 'lớp', max: TARGET.trainingClasses, icon: '📚', color: '#0D9488' },
    { key: 'digitalModels',   dailyKey: 'digitalModels',   label: '7. Mô hình điểm Chuyển đổi số', unit: 'mô hình', max: TARGET.digitalModels, icon: '🏪', color: '#E11D48' },
    { key: 'digitalProducts', dailyKey: 'digitalProducts', label: '8. Số hóa SP OCOP / địa phương', unit: 'sản phẩm', max: TARGET.digitalProducts, icon: '🛒', color: '#EA580C' },
    { key: 'youthTrained',    dailyKey: 'youthTrained',    label: '9. Đoàn viên TN học AI & an toàn số', unit: 'đoàn viên', max: TARGET.youthTrained, icon: '🤖', color: '#4F46E5' },
    { key: 'youthProjects',   dailyKey: 'youthProjects',   label: '10. Công trình thanh niên CĐS', unit: 'công trình', max: TARGET.youthProjects, icon: '⚡', color: '#9333EA' },
    { key: 'smartwebCount',   dailyKey: 'smartwebCount',   label: '11. Xây dựng website SmartWeb', unit: 'website', max: TARGET.smartweb, icon: '🌐', color: '#1E40AF' },
  ], [TARGET]);

  // Sinh nội dung bài truyền thông tự động
  const generateMediaContent = useCallback(() => {
    const dKns = Number(daily.digitalSkills || 0).toLocaleString('vi-VN');
    const dVneid = Number(daily.vneid || 0).toLocaleString('vi-VN');
    const dDvc = Number(daily.publicServices || 0).toLocaleString('vi-VN');
    const dQr = Number(daily.qr || 0).toLocaleString('vi-VN');
    const dSmartweb = Number(daily.smartwebCount || 0).toLocaleString('vi-VN');
    const dClasses = Number(daily.trainingClasses || 0).toLocaleString('vi-VN');
    const dReported = daily.reportedCount || communesStatus.reportedCount || 0;

    const cKns = Number(cum.digitalSkills || 0).toLocaleString('vi-VN');
    const cVneid = Number(cum.vneid || 0).toLocaleString('vi-VN');
    const cDvc = Number(cum.publicServices || 0).toLocaleString('vi-VN');
    const cQr = Number(cum.qr || 0).toLocaleString('vi-VN');
    const cTeams = Number(cum.activeTeams || 0).toLocaleString('vi-VN');
    const cClasses = Number(cum.trainingClasses || 0).toLocaleString('vi-VN');
    const cModels = Number(cum.digitalModels || 0).toLocaleString('vi-VN');
    const cOcop = Number(cum.digitalProducts || 0).toLocaleString('vi-VN');
    const cAi = Number(cum.youthTrained || 0).toLocaleString('vi-VN');
    const cProjects = Number(cum.youthProjects || 0).toLocaleString('vi-VN');
    const cSmartweb = Number(cum.smartwebCount || sw.total || 0).toLocaleString('vi-VN');

    const pctKns = Math.round(((cum.digitalSkills || 0) / TARGET.digitalSkills) * 100);
    const pctVneid = Math.round(((cum.vneid || 0) / TARGET.vneid) * 100);
    const pctDvc = Math.round(((cum.publicServices || 0) / TARGET.publicServices) * 100);
    const pctQr = Math.round(((cum.qr || 0) / TARGET.qr) * 100);

    return `🔥 [BẢN TIN TRUYỀN THÔNG CĐS] TIẾN ĐỘ CHIẾN DỊCH 44 NGÀY ĐÊM
📅 Báo cáo ngày: ${formattedFilterDate} (Ngày thứ ${countdownData.elapsed}/${countdownData.totalDays})

🚀 1. KẾT QUẢ NỔI BẬT TRONG NGÀY (${formattedFilterDate}):
• Số đơn vị cấp xã ra quân & nộp báo cáo: ${dReported}/102 Xã/Phường
• Tiếp cận kỹ năng số cộng đồng: +${dKns} lượt người
• Hỗ trợ kích hoạt VNeID mức 2: +${dVneid} tài khoản
• Hướng dẫn Dịch vụ công trực tuyến: +${dDvc} lượt hồ sơ
• Phổ cập mã QR thanh toán không tiền mặt: +${dQr} hộ kinh doanh
• Tổ chức lớp/điểm tập huấn kỹ năng số: +${dClasses} lớp
• Nền tảng AI.VN SmartWeb cho HKD, thanh niên: +${dSmartweb} website

🏆 2. TỔNG LŨY KẾ TOÀN TỈNH TỪ ĐẦU CHIẾN DỊCH:
1️⃣ Kỹ năng số cộng đồng: ${cKns} / 100.000 lượt (${pctKns}%)
2️⃣ VNeID mức 2 & tiện ích: ${cVneid} / 50.000 lượt (${pctVneid}%)
3️⃣ Dịch vụ công trực tuyến: ${cDvc} / 30.000 hồ sơ (${pctDvc}%)
4️⃣ Hộ kinh doanh dùng QR: ${cQr} / 10.000 hộ (${pctQr}%)
5️⃣ Đội hình Thanh niên số: ${cTeams} / 102 đội hình
6️⃣ Lớp/Điểm tập huấn KNS: ${cClasses} / 500 lớp
7️⃣ Mô hình điểm CĐS: ${cModels} / 102 mô hình
8️⃣ Sản phẩm OCOP số hóa: ${cOcop} / 1.000 sản phẩm
9️⃣ Đoàn viên tập huấn AI: ${cAi} / 20.000 đoàn viên
🔟 Công trình thanh niên CĐS: ${cProjects} / 102 công trình
1️⃣1️⃣ Website SmartWeb: ${cSmartweb} / 102 website

#ChuyenDoiSo #ChienDich44NgayDem #ThanhNienSo #DakLak`;
  }, [daily, cum, sw, formattedFilterDate, countdownData, communesStatus, TARGET]);

  const handleCopyMedia = async () => {
    try {
      const text = generateMediaContent();
      await navigator.clipboard.writeText(text);
      setCopiedMedia(true);
      toast.success('📋 Đã sao chép nội dung bài truyền thông vào bộ nhớ tạm!');
      setTimeout(() => setCopiedMedia(false), 3000);
    } catch {
      toast.error('Lỗi khi sao chép');
    }
  };

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
            <Printer size={16} /> In Báo cáo
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

      {/* ════ BỘ ĐIỀU KHIỂN CHUYỂN ĐỔI: LŨY KẾ vs TRONG NGÀY (PHỤC VỤ TRUYỀN THÔNG) ════ */}
      <div style={{
        background: '#FFFFFF', borderRadius: 16, padding: '16px 20px', marginBottom: 20,
        border: '1.5px solid #E2E8F0', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#1E3A8A' }}>
              Chế độ hiển thị Số liệu Thống kê:
            </div>
            <div style={{ fontSize: '.78rem', color: '#64748B' }}>
              {statMode === 'ALL' 
                ? 'Đang xem: Tổng cộng dồn toàn tỉnh từ ngày đầu chiến dịch đến nay' 
                : `Đang xem: Số liệu phát sinh riêng trong ngày ${formattedFilterDate}`}
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 12, border: '1px solid #CBD5E1', flexWrap: 'wrap', gap: 4 }}>
          <button
            type="button"
            onClick={() => setStatMode('ALL')}
            style={{
              padding: '8px 18px', fontSize: '.84rem', fontWeight: 700, borderRadius: 9, border: 'none', cursor: 'pointer',
              background: statMode === 'ALL' ? '#1E3A8A' : 'transparent',
              color: statMode === 'ALL' ? '#FFFFFF' : '#475569',
              boxShadow: statMode === 'ALL' ? '0 2px 6px rgba(30,58,138,0.25)' : 'none',
              transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            🏆 Lũy kế Toàn chiến dịch
          </button>
          <button
            type="button"
            onClick={() => setStatMode('DAILY')}
            style={{
              padding: '8px 18px', fontSize: '.84rem', fontWeight: 700, borderRadius: 9, border: 'none', cursor: 'pointer',
              background: statMode === 'DAILY' ? '#0284C7' : 'transparent',
              color: statMode === 'DAILY' ? '#FFFFFF' : '#475569',
              boxShadow: statMode === 'DAILY' ? '0 2px 6px rgba(2,132,199,0.25)' : 'none',
              transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            📅 Trong ngày ({formattedFilterDate})
          </button>
        </div>
      </div>

      {/* ════ KPI STAT CARDS (ĐỔI ĐỘNG THEO CHẾ ĐỘ LŨY KẾ / TRONG NGÀY) ════ */}
      <div className="overview-grid" style={{ marginBottom: 24 }}>
        {[
          { 
            icon: Map, 
            val: isDaily ? (daily.activeTeams || 0).toLocaleString('vi-VN') : teams.length, 
            label: isDaily ? 'Đội hình hôm nay' : 'Tổng đội hình', 
            sub: isDaily ? `Ngày ${formattedFilterDate}` : 'Toàn chiến dịch',
            color: '#1E3A8A' 
          },
          { 
            icon: CheckCircle, 
            val: isDaily ? (daily.trainingClasses || 0).toLocaleString('vi-VN') : approved.length, 
            label: isDaily ? 'Lớp tập huấn hôm nay' : 'Đội hình đã duyệt', 
            sub: isDaily ? 'Lớp/Điểm HD KNS' : 'Đạt chuẩn',
            color: '#10B981' 
          },
          { 
            icon: Users, 
            val: (isDaily ? (daily.volunteers || 0) : (cum.volunteers || totalVolunteers)).toLocaleString('vi-VN'), 
            label: 'Tình nguyện viên', 
            sub: isDaily ? `Trong ngày` : 'Lũy kế',
            color: '#9333EA' 
          },
          { 
            icon: Smartphone, 
            val: (isDaily ? (daily.digitalSkills || 0) : (cum.digitalSkills || 0)).toLocaleString('vi-VN'), 
            label: '1. Kỹ năng số', 
            sub: isDaily ? `+${(daily.digitalSkills || 0).toLocaleString('vi-VN')} hôm nay` : 'Lũy kế toàn tỉnh',
            color: '#0284C7' 
          },
          { 
            icon: Landmark, 
            val: (isDaily ? (daily.vneid || 0) : (cum.vneid || 0)).toLocaleString('vi-VN'), 
            label: '2. VNeID mức 2', 
            sub: isDaily ? `+${(daily.vneid || 0).toLocaleString('vi-VN')} hôm nay` : 'Lũy kế toàn tỉnh',
            color: '#16A34A' 
          },
          { 
            icon: QrCode, 
            val: (isDaily ? (daily.qr || 0) : (cum.qr || 0)).toLocaleString('vi-VN'), 
            label: '4. Hộ KD dùng QR', 
            sub: isDaily ? `+${(daily.qr || 0).toLocaleString('vi-VN')} hôm nay` : 'Lũy kế toàn tỉnh',
            color: '#F59E0B' 
          },
          { 
            icon: Globe, 
            val: (isDaily ? (daily.smartwebCount || 0) : (cum.smartwebCount || sw.total || 0)).toLocaleString('vi-VN'), 
            label: '11. SmartWeb', 
            sub: isDaily ? `+${(daily.smartwebCount || 0)} web hôm nay` : 'Website khởi tạo',
            color: '#6366F1' 
          },
          { 
            icon: TrendingUp, 
            val: isDaily 
              ? `${daily.reportedCount || communesStatus.reportedCount || 0} / 102` 
              : `${cum.activeAgencies || 102} / 102`, 
            label: isDaily ? 'Xã đã nộp hôm nay' : 'Xã tham gia chiến dịch', 
            sub: isDaily ? 'Bấm để xem danh sách' : '100% cơ sở Đoàn',
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
              border: s.clickable ? '1.5px solid #FCA5A5' : '1px solid var(--border)',
              position: 'relative', overflow: 'hidden'
            }}
            onClick={s.onClick}
            title={s.clickable ? 'Bấm để cuộn xem danh sách chi tiết các xã & link minh chứng' : ''}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value" style={{ color: s.color, display: 'flex', alignItems: 'center', gap: 6, fontSize: '1.55rem' }}>
                  {s.val}
                  {s.clickable && <span style={{ fontSize: '.72rem', padding: '2px 6px', background: '#FEE2E2', color: '#DC2626', borderRadius: 6, fontWeight: 700 }}>Xem DS</span>}
                </div>
                <div className="stat-label" style={{ fontWeight: 700, marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--tx-3)', marginTop: 2, fontWeight: 500 }}>{s.sub}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={22} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ════ SECTION: BẢNG SO SÁNH 11 CHỈ TIÊU & CÔNG CỤ LÊN BÀI TRUYỀN THÔNG ════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Cột Trái: Bảng So sánh 11 Chỉ tiêu (Trong ngày vs Lũy kế vs Mục tiêu) */}
        <div className="card animate-up" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#1E3A8A', fontSize: '1.1rem', fontWeight: 800 }}>
                <TrendingUp size={20} color="#1E3A8A" /> Bảng Tiến độ 11 Chỉ tiêu Chiến dịch
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: '.78rem', color: 'var(--tx-3)' }}>
                So sánh số liệu <strong>Trong ngày ({formattedFilterDate})</strong> vs <strong>Lũy kế</strong> vs <strong>Chỉ tiêu tỉnh</strong>
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '.8rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 700 }}>Chỉ tiêu</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: '#0284C7', fontWeight: 700 }}>Trong ngày</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: '#1E3A8A', fontWeight: 700 }}>Lũy kế</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B', fontWeight: 700 }}>Chỉ tiêu</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#16A34A', fontWeight: 700 }}>Đạt</th>
                </tr>
              </thead>
              <tbody>
                {CORE_TARGET_LIST.map((item, idx) => {
                  const dayVal = Number(daily[item.dailyKey] || 0);
                  const cumVal = Number(cum[item.key] || (item.key === 'smartwebCount' ? sw.total : 0) || 0);
                  const pct = item.max > 0 ? Math.min(100, Math.round((cumVal / item.max) * 100)) : 0;
                  return (
                    <tr key={item.key} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? 'transparent' : '#FAFAFA' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>
                        <span style={{ marginRight: 6 }}>{item.icon}</span> {item.label}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: dayVal > 0 ? '#0284C7' : '#94A3B8' }}>
                        {dayVal > 0 ? `+${dayVal.toLocaleString('vi-VN')}` : '0'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#1E3A8A' }}>
                        {cumVal.toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748B' }}>
                        {item.max.toLocaleString('vi-VN')} <span style={{ fontSize: '.7rem' }}>{item.unit}</span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                          background: pct >= 100 ? '#DCFCE7' : (pct >= 50 ? '#E0F2FE' : '#FEF3C7'),
                          color: pct >= 100 ? '#15803D' : (pct >= 50 ? '#0369A1' : '#B45309'),
                          fontWeight: 800, fontSize: '.72rem'
                        }}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cột Phải: Khung Soạn bài Truyền thông Tự động (One-Click Press Release / Media Post) */}
        <div className="card animate-up" style={{ padding: '22px 24px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', border: '1.5px solid #BFDBFE' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#1D4ED8', fontSize: '1.1rem', fontWeight: 800 }}>
                <Sparkles size={20} color="#2563EB" /> Công cụ Lên bài Truyền thông Tự động
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: '.78rem', color: 'var(--tx-3)' }}>
                Tự động tổng hợp số liệu hôm nay & lũy kế chuẩn format để đăng Zalo / Fanpage / Báo cáo
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyMedia}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 10, background: copiedMedia ? '#10B981' : '#1D4ED8', color: '#FFFFFF',
                fontWeight: 700, fontSize: '.84rem', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)', transition: 'all .2s'
              }}
            >
              {copiedMedia ? <Check size={16} /> : <Copy size={16} />}
              {copiedMedia ? 'Đã sao chép!' : '📋 Sao chép bài viết'}
            </button>
          </div>

          {/* Textarea Preview */}
          <div style={{ position: 'relative' }}>
            <textarea
              readOnly
              value={generateMediaContent()}
              style={{
                width: '100%', height: 320, padding: 14, borderRadius: 12,
                border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A',
                fontSize: '.8rem', fontFamily: 'monospace', lineHeight: 1.6,
                resize: 'none', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8, fontSize: '.75rem', color: '#64748B' }}>
            <span>💡 <em>Chỉ cần bấm "Sao chép bài viết" rồi dán vào Fanpage Đoàn hoặc Zalo nhóm.</em></span>
            <span>Cập nhật theo ngày: <strong>{formattedFilterDate}</strong></span>
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
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem' }} />
              <Tooltip 
                formatter={(val) => [`${val} đội hình`, 'Số lượng']}
                contentStyle={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ Trạng thái Duyệt & SmartWeb */}
        <div className="card animate-up delay-3">
          <h4 style={{ marginBottom: 16, color: '#4F46E5', fontSize: '1.05rem', fontWeight: 800 }}>
            🌐 Nền tảng AI.VN SmartWeb — Chuyển đổi số Tiểu thương
          </h4>
          {[
            { label: 'Tổng hộ KD đăng ký', val: sw.total||0, color: '#6366F1', pct: 100 },
            { label: 'Đã gắn tên miền .VN', val: sw.registered||0, color: '#F59E0B', pct: sw.total > 0 ? Math.round(sw.registered/sw.total*100) : 0 },
            { label: 'Website chính thức hoạt động', val: sw.active||0, color: '#10B981', pct: sw.total > 0 ? Math.round(sw.active/sw.total*100) : 0 },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                <span style={{ fontSize: '.88rem', color: 'var(--tx-2)', fontWeight: 600 }}>{r.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: '.78rem', color: 'var(--tx-3)' }}>{r.pct}%</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: r.color }}>{r.val.toLocaleString('vi-VN')}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 18, height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
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
