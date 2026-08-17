import React, { useState, useEffect } from 'react';
import { 
  BarChart3, MapPin, Users, ClipboardCheck, CheckCircle2, Circle, 
  Smartphone, ShieldCheck, ShoppingCart, Landmark, ArrowRight, 
  UploadCloud, ChevronRight, Loader2, Sparkles, Award, Globe, 
  Cpu, Building, Layers, Zap, BookOpen, TrendingUp
} from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

const TABS = [
  { id: 'report', icon: BarChart3, label: 'Báo cáo & 11 Chỉ tiêu', color: 'var(--blue-600)' },
  { id: 'targets', icon: MapPin, label: 'Phân nhóm Địa bàn', color: 'var(--amber-600)' },
  { id: 'teams', icon: Users, label: 'Đội hình & Nhóm việc', color: 'var(--green-600)' },
  { id: 'checklist', icon: ClipboardCheck, label: 'Sổ tay & Checklist', color: 'var(--purple-600)' },
];

const CHECKLIST_ITEMS = [
  "Thành lập đội hình Bình dân học vụ số/chuyển đổi số cộng đồng (Chỉ tiêu 5)",
  "Phân công đội trưởng, đội phó, thành viên phụ trách 5 nhóm việc",
  "Chọn điểm hỗ trợ tại bộ phận một cửa cấp xã",
  "Chọn điểm hỗ trợ tại chợ/tuyến phố/hộ kinh doanh (Chỉ tiêu 4)",
  "Chọn điểm hỗ trợ tại nhà văn hóa thôn, buôn, tổ dân phố",
  "Tổ chức lớp/điểm hướng dẫn kỹ năng số cộng đồng (Chỉ tiêu 6)",
  "Hỗ trợ người dân tiếp cận kỹ năng số trực tiếp (Chỉ tiêu 1)",
  "Hỗ trợ người dân kích hoạt VNeID mức 2 (Chỉ tiêu 2)",
  "Hướng dẫn nộp hồ sơ Dịch vụ công trực tuyến (Chỉ tiêu 3)",
  "Xây dựng ít nhất 01 mô hình điểm chuyển đổi số xã/phường (Chỉ tiêu 7)",
  "Hỗ trợ số hóa sản phẩm OCOP & nông sản địa phương (Chỉ tiêu 8)",
  "Tập huấn AI & kỹ năng số cho đoàn viên thanh niên (Chỉ tiêu 9)",
  "Thực hiện ít nhất 01 công trình thanh niên chuyển đổi số (Chỉ tiêu 10)",
  "Hỗ trợ tạo website AI.VN SmartWeb cho HKD, HTX (Chỉ tiêu 11)",
  "Báo cáo số liệu 11 chỉ tiêu hằng ngày trước 19h00 trực tiếp trên app"
];

// CHỈ TIÊU TOÀN TỈNH
const PROVINCE_TARGETS = {
  digitalSkills:   100000,
  vneid:           50000,
  publicServices:  30000,
  qr:              10000,
  activeTeams:     102,
  trainingClasses: 500,
  digitalModels:   102,
  digitalProducts: 1000,
  youthTrained:    20000,
  youthProjects:   102,
  smartwebCount:   102
};

const COMMUNE_GROUPS = [
  {
    id: 'G1',
    name: 'Nhóm 1: Phường Đô thị - TT Hành chính (32 đơn vị)',
    targets: { 
      digitalSkills: 1500, 
      vneidSupport: 700, 
      publicServices: 450, 
      qrSupport: 150, 
      activeTeams: 1, 
      trainingClasses: 6, 
      digitalModels: 1, 
      digitalProducts: 12, 
      youthTrained: 250, 
      youthProjects: 1, 
      smartwebCount: 1 
    },
    communes: ["Phường Buôn Ma Thuột", "Phường Tân An", "Phường Tân Lập", "Phường Thành Nhất", "Phường Ea Kao", "Phường Buôn Hồ", "Phường Cư Bao", "Đoàn phường Phú Yên", "Đoàn phường Tuy Hòa", "Đoàn phường Bình Kiến", "Đoàn phường Xuân Đài", "Đoàn phường Sông Cầu", "Đoàn phường Đông Hòa", "Đoàn phường Hòa Hiệp", "Xã Ea Súp", "Xã Quảng Phú", "Xã Pơng Drang", "Xã Ea Drăng", "Xã Krông Năng", "Xã Krông Pắc", "Xã Ea Kar", "Xã Ea Knốp", "Xã M'Drắk", "Xã Krông Bông", "Xã Liên Sơn Lắk", "Xã Krông Ana", "Đoàn xã Tuy An Bắc", "Đoàn xã Phú Hòa 1", "Đoàn xã Tây Hòa", "Đoàn xã Sơn Hòa", "Đoàn xã Sông Hinh", "Đoàn xã Đồng Xuân"]
  },
  {
    id: 'G2',
    name: 'Nhóm 2: Xã có Chợ - TT Cụm xã (40 đơn vị)',
    targets: { 
      digitalSkills: 1000, 
      vneidSupport: 500, 
      publicServices: 300, 
      qrSupport: 100, 
      activeTeams: 1, 
      trainingClasses: 5, 
      digitalModels: 1, 
      digitalProducts: 10, 
      youthTrained: 200, 
      youthProjects: 1, 
      smartwebCount: 1 
    },
    communes: ["Xã Hòa Phú", "Xã Ea Drông", "Xã Ea Wer", "Xã Ea Nuôl", "Xã Ea Kiết", "Xã Ea M'Droh", "Xã Cuôr Đăng", "Xã Cư M'gar", "Xã Ea Tul", "Xã Krông Búk", "Xã Ea Khal", "Xã Ea Hiao", "Xã Dliê Ya", "Xã Tam Giang", "Xã Phú Xuân", "Xã Ea Knuếc", "Xã Tân Tiến", "Xã Ea Phê", "Xã Ea Kly", "Xã Cư Yang", "Xã Ea Păl", "Xã Hòa Sơn", "Xã Đắk Liêng", "Xã Ea Ning", "Xã Dray Bhăng", "Xã Ea Ktur", "Xã Dur Kmăl", "Xã Ea Na", "Đoàn xã Xuân Thọ", "Đoàn xã Xuân Cảnh", "Đoàn xã Xuân Lộc", "Đoàn xã Hòa Xuân", "Đoàn xã Tuy An Đông", "Đoàn xã Ô Loan", "Đoàn xã Tuy An Nam", "Đoàn xã Phú Hòa 2", "Đoàn xã Hòa Thịnh", "Đoàn xã Hòa Mỹ", "Đoàn xã Sơn Thành", "Đoàn xã Đức Bình"]
  },
  {
    id: 'G3',
    name: 'Nhóm 3: Xã Nông thôn - Vùng sâu (30 đơn vị)',
    targets: { 
      digitalSkills: 600, 
      vneidSupport: 300, 
      publicServices: 150, 
      qrSupport: 45, 
      activeTeams: 1, 
      trainingClasses: 4, 
      digitalModels: 1, 
      digitalProducts: 8, 
      youthTrained: 150, 
      youthProjects: 1, 
      smartwebCount: 1 
    },
    communes: ["Xã Ea Rốk", "Xã Ea Bung", "Xã Cư Pơng", "Xã Ea Wy", "Xã Ea Ô", "Xã Ea Riêng", "Xã Cư M'ta", "Xã Krông Á", "Xã Cư Prao", "Xã Dang Kang", "Xã Yang Mao", "Xã Cư Pui", "Xã Nam Ka", "Xã Đắk Phơi", "Đoàn xã Tuy An Tây", "Đoàn xã Vân Hòa", "Đoàn xã Tây Sơn", "Đoàn xã Suối Trai", "Đoàn xã Ea Ly", "Đoàn xã Ea Bá", "Đoàn xã Xuân Lãnh", "Đoàn xã Phú Mỡ", "Đoàn xã Xuân Phước", "Xã Buôn Đôn", "Xã Ea H'Leo", "Xã Trang", "Xã Ia Lốp", "Xã Ia Rvê", "Xã Krông Nô", "Xã Vụ Bổn"]
  }
];

const PublicCampaigns = () => {
  const [activeTab, setActiveTab] = useState('report');
  const [checkedItems, setCheckedItems] = useState([]);
  
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  let agencyName = localStorage.getItem('agencyName');
  if (!agencyName) {
    try {
      const agencyData = JSON.parse(localStorage.getItem('agency'));
      if (agencyData && agencyData.name) agencyName = agencyData.name;
    } catch (e) {
      // Ignore
    }
  }
  
  const canReport = ['COMMUNE_ADMIN', 'PROVINCE_ADMIN', 'SENIOR_ADMIN'].includes(role);
  
  const [stats, setStats] = useState({
    digitalSkills: 0,
    vneid: 0,
    publicServices: 0,
    qr: 0,
    activeTeams: 0,
    trainingClasses: 0,
    digitalModels: 0,
    digitalProducts: 0,
    youthTrained: 0,
    youthProjects: 0,
    smartwebCount: 0,
    volunteers: 0,
    activeAgencies: 0,
    totalAgencies: 102
  });
  
  const [selectedCommune, setSelectedCommune] = useState('');
  const activeGroup = COMMUNE_GROUPS.find(g => 
    g.communes.some(c => selectedCommune.includes(c) || c.includes(selectedCommune))
  );

  const [formData, setFormData] = useState({
    digitalSkills: '',
    vneidSupport: '',
    publicServices: '',
    qrSupport: '',
    activeTeams: '',
    trainingClasses: '',
    digitalModels: '',
    digitalProducts: '',
    youthTrained: '',
    youthProjects: '',
    smartwebCount: '',
    volunteers: '',
    safetyCampaigns: '',
    mediaPosts: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (agencyName) setSelectedCommune(agencyName);
  }, [agencyName]);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      const res = await api.get('/campaign/stats');
      if (res.data) {
        setStats({
          digitalSkills: res.data.digitalSkills || 0,
          vneid: res.data.vneid || 0,
          publicServices: res.data.publicServices || 0,
          qr: res.data.qr || 0,
          activeTeams: res.data.activeTeams || 0,
          trainingClasses: res.data.trainingClasses || 0,
          digitalModels: res.data.digitalModels || 0,
          digitalProducts: res.data.digitalProducts || 0,
          youthTrained: res.data.youthTrained || 0,
          youthProjects: res.data.youthProjects || 0,
          smartwebCount: res.data.smartwebCount || 0,
          volunteers: res.data.volunteers || 0,
          activeAgencies: res.data.activeAgencies || 0,
          totalAgencies: res.data.totalAgencies || 102
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.warning('Bạn cần đăng nhập bằng tài khoản Cấp Xã để báo cáo!');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/campaign/report', {
        digitalSkills: Number(formData.digitalSkills) || 0,
        vneidSupport: Number(formData.vneidSupport) || 0,
        publicServices: Number(formData.publicServices) || 0,
        qrSupport: Number(formData.qrSupport) || 0,
        activeTeams: Number(formData.activeTeams) || 0,
        trainingClasses: Number(formData.trainingClasses) || 0,
        digitalModels: Number(formData.digitalModels) || 0,
        digitalProducts: Number(formData.digitalProducts) || 0,
        youthTrained: Number(formData.youthTrained) || 0,
        youthProjects: Number(formData.youthProjects) || 0,
        smartwebCount: Number(formData.smartwebCount) || 0,
        volunteers: Number(formData.volunteers) || 0,
        safetyCampaigns: Number(formData.safetyCampaigns) || 0,
        mediaPosts: Number(formData.mediaPosts) || 0
      });
      toast.success('✅ Gửi báo cáo 11 chỉ tiêu thành công!');
      setFormData({
        digitalSkills: '', vneidSupport: '', publicServices: '', qrSupport: '',
        activeTeams: '', trainingClasses: '', digitalModels: '', digitalProducts: '',
        youthTrained: '', youthProjects: '', smartwebCount: '',
        volunteers: '', safetyCampaigns: '', mediaPosts: ''
      });
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (idx) => {
    if (checkedItems.includes(idx)) {
      setCheckedItems(checkedItems.filter(i => i !== idx));
    } else {
      setCheckedItems([...checkedItems, idx]);
    }
  };

  const progress = Math.round((checkedItems.length / CHECKLIST_ITEMS.length) * 100);

  // 11 Thẻ hiển thị lũy kế toàn tỉnh
  const provinceStatList = [
    { key: 'digitalSkills', val: stats.digitalSkills, target: PROVINCE_TARGETS.digitalSkills, label: '1. Kỹ năng số', unit: 'lượt', icon: '💻', color: '#0284C7', bg: '#E0F2FE' },
    { key: 'vneid', val: stats.vneid, target: PROVINCE_TARGETS.vneid, label: '2. VNeID mức 2', unit: 'lượt', icon: '🪪', color: '#16A34A', bg: '#DCFCE7' },
    { key: 'publicServices', val: stats.publicServices, target: PROVINCE_TARGETS.publicServices, label: '3. DVC trực tuyến', unit: 'hồ sơ', icon: '🏛️', color: '#7C3AED', bg: '#EDE9FE' },
    { key: 'qr', val: stats.qr, target: PROVINCE_TARGETS.qr, label: '4. Hộ KD dùng QR', unit: 'hộ', icon: '📱', color: '#D97706', bg: '#FEF3C7' },
    { key: 'activeTeams', val: stats.activeTeams || stats.activeAgencies, target: PROVINCE_TARGETS.activeTeams, label: '5. Đội hình TN số', unit: 'đội hình', icon: '🏃', color: '#2563EB', bg: '#DBEAFE' },
    { key: 'trainingClasses', val: stats.trainingClasses, target: PROVINCE_TARGETS.trainingClasses, label: '6. Lớp/Điểm HD KNS', unit: 'lớp/điểm', icon: '📚', color: '#0D9488', bg: '#CCFBF1' },
    { key: 'digitalModels', val: stats.digitalModels, target: PROVINCE_TARGETS.digitalModels, label: '7. Mô hình điểm CĐS', unit: 'mô hình', icon: '🏪', color: '#E11D48', bg: '#FFE4E6' },
    { key: 'digitalProducts', val: stats.digitalProducts, target: PROVINCE_TARGETS.digitalProducts, label: '8. SP OCOP/Địa phương', unit: 'SP', icon: '🛒', color: '#EA580C', bg: '#FFEDD5' },
    { key: 'youthTrained', val: stats.youthTrained, target: PROVINCE_TARGETS.youthTrained, label: '9. TN tập huấn AI', unit: 'đoàn viên', icon: '🤖', color: '#4F46E5', bg: '#EEF2FF' },
    { key: 'youthProjects', val: stats.youthProjects, target: PROVINCE_TARGETS.youthProjects, label: '10. Công trình TN CĐS', unit: 'công trình', icon: '⚡', color: '#9333EA', bg: '#FAF5FF' },
    { key: 'smartwebCount', val: stats.smartwebCount, target: PROVINCE_TARGETS.smartwebCount, label: '11. Web AI SmartWeb', unit: 'website', icon: '🌐', color: '#1E40AF', bg: '#EFF6FF' },
  ];

  return (
    <div style={{ background: 'var(--surface-0)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* HERO SECTION */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-600) 0%, var(--blue-900) 100%)', color: 'white', padding: '50px 0 70px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: '.85rem', fontWeight: 700, marginBottom: 16, backdropFilter: 'blur(10px)' }}>
            CHIẾN DỊCH 44 NGÀY ĐÊM — BÌNH DÂN HỌC VỤ SỐ
          </span>
          <h1 style={{ fontSize: '2.3rem', fontWeight: 900, marginBottom: 14, color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            THANH NIÊN ĐẮK LẮK <br/> TIÊN PHONG CHUYỂN ĐỔI SỐ
          </h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.9, maxWidth: 750, margin: '0 auto', lineHeight: 1.6 }}>
            "102 Xã/Phường ra quân — Thực hiện nghiêm túc <strong>11 Chỉ tiêu trọng tâm</strong> đưa chuyển đổi số đến từng người dân và hộ kinh doanh."
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: -35, position: 'relative', zIndex: 2 }}>
        
        {/* TAB NAVIGATION */}
        <div style={{ display: 'flex', background: 'white', borderRadius: 'var(--r-lg)', padding: 8, boxShadow: 'var(--sh-lg)', gap: 8, overflowX: 'auto', marginBottom: 24 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  flex: 1, minWidth: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                  padding: '12px 16px', borderRadius: 'var(--r-md)', border: 'none', 
                  background: isActive ? `${tab.color}15` : 'transparent',
                  color: isActive ? tab.color : 'var(--tx-2)',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '.92rem',
                  cursor: 'pointer', transition: 'all .2s',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={18} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        <div className="animate-up">
          
          {/* TAB 1: REPORT & 11 CRITERIA */}
          {activeTab === 'report' && (
            <div style={{ display: 'grid', gap: 24 }}>
              
              {/* LƯỚI TỔNG HỢP 11 CHỈ TIÊU TOÀN TỈNH */}
              <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.25rem' }}>
                      <TrendingUp size={22} color="var(--primary)" />
                      Tiến độ Thực hiện 11 Chỉ tiêu Toàn tỉnh Đắk Lắk
                    </h3>
                    <p style={{ color: 'var(--tx-3)', fontSize: '.85rem', marginTop: 2 }}>
                      Tổng hợp lũy kế thực tế từ 102 Xã/Phường so với mục tiêu tỉnh giao
                    </p>
                  </div>
                  <div style={{ background: '#EFF6FF', color: 'var(--primary)', padding: '6px 14px', borderRadius: 20, fontSize: '.8rem', fontWeight: 700 }}>
                    {stats.activeAgencies}/{stats.totalAgencies} Xã đã ra quân
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 14,
                  marginBottom: 16
                }}>
                  {provinceStatList.map((s) => {
                    const pct = s.target > 0 ? Math.min(100, Math.round(((s.val || 0) / s.target) * 100)) : 0;
                    return (
                      <div key={s.key} style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                            <span style={{
                              fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                              background: pct >= 100 ? '#DCFCE7' : pct >= 50 ? s.bg : '#FEE2E2',
                              color: pct >= 100 ? '#16A34A' : pct >= 50 ? s.color : '#DC2626'
                            }}>
                              {pct}%
                            </span>
                          </div>
                          <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--tx-2)' }}>{s.label}</div>
                          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: s.color, margin: '2px 0' }}>
                            {(s.val || 0).toLocaleString('vi-VN')}
                          </div>
                          <div style={{ fontSize: '.72rem', color: 'var(--tx-3)', marginBottom: 8 }}>
                            Mục tiêu: {s.target.toLocaleString('vi-VN')} {s.unit}
                          </div>
                        </div>

                        {/* Thanh tiến độ */}
                        <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: s.color,
                            borderRadius: 3,
                            transition: 'width .8s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FORM BÁO CÁO CẤP XÃ HOẶC GIỚI THIỆU DỊCH VỤ CÔNG */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                {canReport ? (
                  <div className="card" style={{ borderTop: '4px solid var(--blue-600)' }}>
                    <div style={{ marginBottom: 16 }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.2rem' }}>
                        <UploadCloud size={20} color="var(--blue-600)" /> Nộp Báo Cáo 11 Chỉ Tiêu (Cấp Xã)
                      </h3>
                      <p style={{ color: 'var(--tx-3)', fontSize: '.86rem', marginTop: 4 }}>
                        Nhập số liệu trực tiếp lên hệ thống, tinh gọn văn bản giấy tờ theo chỉ đạo.
                      </p>
                    </div>

                    <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>Cơ quan / Xã Phường</label>
                        <input className="form-input" disabled value={agencyName || 'Không xác định'} style={{ background: '#F1F5F9', fontWeight: 600 }} />
                      </div>

                      {activeGroup ? (
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12 }}>
                          <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--blue-600)', marginBottom: 14 }}>
                            📋 11 CHỈ TIÊU CHIẾN DỊCH ({activeGroup.name})
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px 16px' }}>
                            {/* 1 */}
                            <div className="form-group">
                              <label className="form-label">1. Kỹ năng số <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;{activeGroup.targets.digitalSkills})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.digitalSkills} onChange={e => setFormData({...formData, digitalSkills: e.target.value})} />
                            </div>
                            {/* 2 */}
                            <div className="form-group">
                              <label className="form-label">2. Lượt VNeID <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;{activeGroup.targets.vneidSupport})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.vneidSupport} onChange={e => setFormData({...formData, vneidSupport: e.target.value})} />
                            </div>
                            {/* 3 */}
                            <div className="form-group">
                              <label className="form-label">3. Dịch vụ công <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;{activeGroup.targets.publicServices})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.publicServices} onChange={e => setFormData({...formData, publicServices: e.target.value})} />
                            </div>
                            {/* 4 */}
                            <div className="form-group">
                              <label className="form-label">4. Hộ KD dùng QR <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;{activeGroup.targets.qrSupport})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.qrSupport} onChange={e => setFormData({...formData, qrSupport: e.target.value})} />
                            </div>
                            {/* 5 */}
                            <div className="form-group">
                              <label className="form-label">5. Đội hình TN số <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;={activeGroup.targets.activeTeams})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.activeTeams} onChange={e => setFormData({...formData, activeTeams: e.target.value})} />
                            </div>
                            {/* 6 */}
                            <div className="form-group">
                              <label className="form-label">6. Lớp/Điểm HD <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;={activeGroup.targets.trainingClasses})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.trainingClasses} onChange={e => setFormData({...formData, trainingClasses: e.target.value})} />
                            </div>
                            {/* 7 */}
                            <div className="form-group">
                              <label className="form-label">7. Mô hình CĐS <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;={activeGroup.targets.digitalModels})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.digitalModels} onChange={e => setFormData({...formData, digitalModels: e.target.value})} />
                            </div>
                            {/* 8 */}
                            <div className="form-group">
                              <label className="form-label">8. SP OCOP/Địa phương <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;={activeGroup.targets.digitalProducts})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.digitalProducts} onChange={e => setFormData({...formData, digitalProducts: e.target.value})} />
                            </div>
                            {/* 9 */}
                            <div className="form-group">
                              <label className="form-label">9. TN tập huấn AI <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;={activeGroup.targets.youthTrained})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.youthTrained} onChange={e => setFormData({...formData, youthTrained: e.target.value})} />
                            </div>
                            {/* 10 */}
                            <div className="form-group">
                              <label className="form-label">10. Công trình TN CĐS <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;={activeGroup.targets.youthProjects})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.youthProjects} onChange={e => setFormData({...formData, youthProjects: e.target.value})} />
                            </div>
                            {/* 11 */}
                            <div className="form-group">
                              <label className="form-label">11. Web SmartWeb <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>(&gt;={activeGroup.targets.smartwebCount})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.smartwebCount} onChange={e => setFormData({...formData, smartwebCount: e.target.value})} />
                            </div>
                            {/* TNV */}
                            <div className="form-group">
                              <label className="form-label">Tình nguyện viên tham gia</label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.volunteers} onChange={e => setFormData({...formData, volunteers: e.target.value})} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: 16, background: '#FEF2F2', color: 'var(--danger)', borderRadius: 8, fontSize: '.9rem' }}>
                          Tài khoản ({agencyName}) không nằm trong danh sách nhóm xã được chỉ định hoặc bạn đang đăng nhập tài khoản khác.
                        </div>
                      )}
                      
                      <button type="submit" disabled={loading || !activeGroup} className="btn btn-primary" style={{ width: '100%', padding: 14, fontWeight: 700 }}>
                        {loading ? <Loader2 size={18} className="spin" /> : 'Lưu Báo Cáo 11 Chỉ Tiêu'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="card" style={{ borderTop: '4px solid var(--green-600)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ width: 64, height: 64, background: 'var(--green-600)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Smartphone size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.35rem', color: 'var(--primary-dark)', marginBottom: 8 }}>Bà con cần hỗ trợ Chuyển đổi số?</h3>
                      <p style={{ color: 'var(--tx-2)' }}>102 Đội hình Thanh niên số tại các Xã/Phường hỗ trợ miễn phí 100% cho người dân và hộ kinh doanh.</p>
                    </div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><CheckCircle2 size={18} color="var(--green-600)" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Cài đặt, kích hoạt định danh điện tử VNeID mức 2</span></li>
                      <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><CheckCircle2 size={18} color="var(--green-600)" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Tạo mã QR thanh toán và công cụ bán hàng số</span></li>
                      <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><CheckCircle2 size={18} color="var(--green-600)" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Hướng dẫn nộp hồ sơ Dịch vụ công trực tuyến</span></li>
                      <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><CheckCircle2 size={18} color="var(--green-600)" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Tạo website AI.VN SmartWeb cho tiểu thương, HTX</span></li>
                    </ul>
                    
                    <a href="/ho-tro" className="btn btn-primary" style={{ background: 'var(--green-600)', borderColor: 'var(--green-600)', textAlign: 'center' }}>
                      Gửi yêu cầu hỗ trợ ngay
                    </a>
                  </div>
                )}

                {/* SỨ MỆNH & Ý NGHĨA 11 CHỈ TIÊU */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={20} color="var(--amber-600)" /> 11 Chỉ Tiêu Trọng Tâm Của Tỉnh
                    </h3>
                    <p style={{ color: 'var(--tx-2)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: 16 }}>
                      Chiến dịch 44 ngày đêm tập trung vào 11 tiêu chí cốt lõi nhằm nâng cao chỉ số DTI, đưa dịch vụ số đến tận tay người dân và bà con tiểu thương:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { num: '1-3', text: 'Kỹ năng số, VNeID mức 2 & Dịch vụ công trực tuyến cho người dân' },
                        { num: '4, 8, 11', text: 'Kinh tế số: QR thanh toán, số hóa SP OCOP, tạo website AI SmartWeb' },
                        { num: '5, 6, 9', text: 'Xây dựng đội hình TN số, tổ chức điểm tập huấn và đào tạo AI' },
                        { num: '7, 10', text: 'Xây dựng mô hình điểm CĐS và công trình thanh niên số tại 100% xã' }
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface-1)', padding: '10px 14px', borderRadius: 10 }}>
                          <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: '.75rem', fontWeight: 800 }}>
                            Chỉ tiêu {item.num}
                          </span>
                          <span style={{ fontSize: '.84rem', color: 'var(--tx-1)', fontWeight: 500 }}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                    <span style={{ fontSize: '.82rem', color: 'var(--tx-3)', fontWeight: 600 }}>
                      Cổng báo cáo hằng ngày mở từ 13:00 – 19:00 hằng ngày
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TARGETS PHÂN NHÓM 11 CHỈ TIÊU */}
          {activeTab === 'targets' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {[
                { 
                  title: 'Nhóm 1: Phường, Đô thị, Hành chính', 
                  count: 32, 
                  icon: Landmark, 
                  color: 'var(--blue-600)', 
                  desc: 'Tập trung vào DVC trực tuyến, VNeID mức 2, thanh toán QR, chợ số, website SmartWeb và công trình CĐS.',
                  targets: [
                    '1. Tiếp cận kỹ năng số: > 1.500 lượt',
                    '2. Hướng dẫn VNeID mức 2: > 700 lượt',
                    '3. Hỗ trợ DVC trực tuyến: > 450 lượt',
                    '4. Hộ KD thanh toán QR: > 150 hộ',
                    '5. Đội hình TN số: 100% có ≥ 1 đội',
                    '6. Lớp/Điểm tập huấn KNS: ≥ 6 lớp/điểm',
                    '7. Mô hình điểm CĐS: ≥ 1 mô hình',
                    '8. Số hóa sản phẩm OCOP: ≥ 12 SP',
                    '9. ĐVTN tập huấn AI: ≥ 250 người',
                    '10. Công trình TN CĐS: ≥ 1 công trình',
                    '11. Website SmartWeb CĐS: ≥ 1 website'
                  ]
                },
                { 
                  title: 'Nhóm 2: Xã có chợ, Trung tâm cụm', 
                  count: 40, 
                  icon: ShoppingCart, 
                  color: 'var(--amber-600)', 
                  desc: 'Tập trung vào VNeID, dịch vụ công trực tuyến, chợ số, hộ kinh doanh QR, sản phẩm địa phương số.',
                  targets: [
                    '1. Tiếp cận kỹ năng số: > 1.000 lượt',
                    '2. Hướng dẫn VNeID mức 2: > 500 lượt',
                    '3. Hỗ trợ DVC trực tuyến: > 300 lượt',
                    '4. Hộ KD thanh toán QR: > 100 hộ',
                    '5. Đội hình TN số: 100% có ≥ 1 đội',
                    '6. Lớp/Điểm tập huấn KNS: ≥ 5 lớp/điểm',
                    '7. Mô hình điểm CĐS: ≥ 1 mô hình',
                    '8. Số hóa sản phẩm OCOP: ≥ 10 SP',
                    '9. ĐVTN tập huấn AI: ≥ 200 người',
                    '10. Công trình TN CĐS: ≥ 1 công trình',
                    '11. Website SmartWeb CĐS: ≥ 1 website'
                  ]
                },
                { 
                  title: 'Nhóm 3: Xã nông thôn, Vùng sâu', 
                  count: 30, 
                  icon: MapPin, 
                  color: 'var(--green-600)', 
                  desc: 'Tập trung Bình dân học vụ số, an toàn số cộng đồng, ưu tiên đội hình lưu động đến thôn, buôn.',
                  targets: [
                    '1. Tiếp cận kỹ năng số: > 600 lượt',
                    '2. Hướng dẫn VNeID mức 2: > 300 lượt',
                    '3. Hỗ trợ DVC trực tuyến: > 150 lượt',
                    '4. Hộ KD thanh toán QR: > 45 hộ',
                    '5. Đội hình TN số: 100% có ≥ 1 đội',
                    '6. Lớp/Điểm tập huấn KNS: ≥ 4 lớp/điểm',
                    '7. Mô hình điểm CĐS: ≥ 1 mô hình',
                    '8. Số hóa sản phẩm OCOP: ≥ 8 SP',
                    '9. ĐVTN tập huấn AI: ≥ 150 người',
                    '10. Công trình TN CĐS: ≥ 1 công trình',
                    '11. Website SmartWeb CĐS: ≥ 1 website'
                  ]
                },
              ].map((g, i) => {
                const GIcon = g.icon;
                return (
                  <div key={i} className="card" style={{ borderTop: `4px solid ${g.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${g.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.color }}>
                        <GIcon size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.08rem', marginBottom: 2 }}>{g.title}</h3>
                        <div style={{ fontSize: '.82rem', color: 'var(--tx-3)', fontWeight: 600 }}>{g.count} đơn vị xã/phường</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '.86rem', color: 'var(--tx-2)', marginBottom: 14, lineHeight: 1.5 }}>{g.desc}</p>
                    <div style={{ background: 'var(--surface-1)', padding: '14px 16px', borderRadius: 'var(--r-md)' }}>
                      <div style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--tx-2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        11 CHỈ TIÊU TỐI THIỂU CẦN ĐẠT
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {g.targets.map((t, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '.85rem' }}>
                            <ArrowRight size={13} color={g.color} style={{ marginTop: 4, flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB 3: TEAMS */}
          {activeTab === 'teams' && (
            <div className="card">
              <h3 style={{ marginBottom: 12, textAlign: 'center', fontSize: '1.4rem' }}>Cấu trúc Đội hình "Thanh niên số" & 5 Nhóm việc</h3>
              <p style={{ textAlign: 'center', color: 'var(--tx-2)', marginBottom: 26, fontSize: '.95rem' }}>
                Công thức: <strong>1 xã/phường - 1 đội hình - 3 điểm hỗ trợ - 5 nhóm việc - 1 báo cáo/ngày</strong> (thực hiện đủ 11 chỉ tiêu).
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {[
                  { name: '1. Bình dân học vụ số', desc: 'Hướng dẫn smartphone, ứng dụng thiết yếu, tra cứu thông tin (Chỉ tiêu 1, 6).', icon: Smartphone, color: '#3B82F6' },
                  { name: '2. VNeID & Dịch vụ công', desc: 'Hỗ trợ tạo tài khoản, nộp hồ sơ trực tuyến, quét mã QR TTHC (Chỉ tiêu 2, 3).', icon: Landmark, color: '#10B981' },
                  { name: '3. Chợ số & Thanh toán QR', desc: 'Tạo mã QR bán hàng, phòng tránh lừa đảo chuyển khoản giả (Chỉ tiêu 4).', icon: ShoppingCart, color: '#F59E0B' },
                  { name: '4. Nông thôn số & SmartWeb', desc: 'Đưa sản phẩm OCOP lên sàn số, tạo website AI.VN SmartWeb (Chỉ tiêu 8, 11).', icon: UploadCloud, color: '#8B5CF6' },
                  { name: '5. Đào tạo AI & An toàn số', desc: 'Tập huấn AI, an toàn số cộng đồng, thực hiện công trình số (Chỉ tiêu 7, 9, 10).', icon: ShieldCheck, color: '#EF4444' }
                ].map((task, i) => {
                  const TIcon = task.icon;
                  return (
                    <div key={i} style={{ padding: 20, borderRadius: 'var(--r-lg)', border: `1px solid ${task.color}30`, background: `${task.color}05`, transition: 'all .2s' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: task.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 12 }}>
                        <TIcon size={20} />
                      </div>
                      <h4 style={{ fontSize: '1.02rem', color: task.color, marginBottom: 8 }}>{task.name}</h4>
                      <p style={{ fontSize: '.88rem', color: 'var(--tx-2)', lineHeight: 1.5 }}>{task.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="card" style={{ maxWidth: 840, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: 4 }}>Sổ tay & Checklist 11 Tiêu Chí Cơ sở</h3>
                  <p style={{ color: 'var(--tx-3)', fontSize: '.88rem' }}>Checklist 15 nhiệm vụ trọng tâm bảo đảm hoàn thành 11 chỉ tiêu chiến dịch.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: progress === 100 ? 'var(--green-600)' : 'var(--blue-600)', lineHeight: 1 }}>{progress}%</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', fontWeight: 700 }}>HOÀN THÀNH</div>
                </div>
              </div>

              <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? 'var(--green-600)' : 'var(--blue-600)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CHECKLIST_ITEMS.map((item, idx) => {
                  const isChecked = checkedItems.includes(idx);
                  return (
                    <div 
                      key={idx} 
                      onClick={() => toggleCheck(idx)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', 
                        borderRadius: 'var(--r-md)', border: isChecked ? '1px solid var(--green-600)' : '1px solid var(--border)',
                        background: isChecked ? '#F0FDF4' : 'var(--surface-0)',
                        cursor: 'pointer', transition: 'all .2s'
                      }}
                    >
                      <div style={{ color: isChecked ? 'var(--green-600)' : 'var(--tx-3)', flexShrink: 0 }}>
                        {isChecked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </div>
                      <span style={{ fontSize: '.92rem', fontWeight: 500, color: isChecked ? 'var(--tx-1)' : 'var(--tx-2)', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.75 : 1 }}>
                        {item}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PublicCampaigns;
