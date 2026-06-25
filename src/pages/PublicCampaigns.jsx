import React, { useState, useEffect } from 'react';
import { BarChart3, MapPin, Users, ClipboardCheck, CheckCircle2, Circle, Smartphone, ShieldCheck, ShoppingCart, Landmark, ArrowRight, UploadCloud, ChevronRight, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'react-toastify';

const TABS = [
  { id: 'report', icon: BarChart3, label: 'Báo cáo & Số liệu', color: 'var(--blue-600)' },
  { id: 'targets', icon: MapPin, label: 'Phân nhóm Địa bàn', color: 'var(--amber-600)' },
  { id: 'teams', icon: Users, label: 'Đội hình & Nhóm việc', color: 'var(--green-600)' },
  { id: 'checklist', icon: ClipboardCheck, label: 'Sổ tay & Checklist', color: 'var(--purple-600)' },
];

const CHECKLIST_ITEMS = [
  "Thành lập đội hình Bình dân học vụ số/chuyển đổi số cộng đồng",
  "Phân công đội trưởng, đội phó, thành viên phụ trách từng nhóm việc",
  "Chọn điểm hỗ trợ tại bộ phận một cửa",
  "Chọn điểm hỗ trợ tại chợ/tuyến phố/hộ kinh doanh",
  "Chọn điểm hỗ trợ tại nhà văn hóa thôn, buôn, tổ dân phố",
  "Tổ chức lớp/điểm hướng dẫn kỹ năng số cộng đồng",
  "Hỗ trợ người dân sử dụng VNeID, dịch vụ công trực tuyến",
  "Hỗ trợ hộ kinh doanh, tiểu thương sử dụng mã QR",
  "Hỗ trợ sản phẩm địa phương lên nền tảng số",
  "Tuyên truyền an toàn số, phòng chống lừa đảo trực tuyến",
  "Tập huấn AI, kỹ năng số cho đoàn viên, thanh niên",
  "Xây dựng ít nhất 01 mô hình điểm chuyển đổi số",
  "Thực hiện ít nhất 01 công trình/phần việc thanh niên chuyển đổi số",
  "Báo cáo số liệu hằng ngày trước 20h00",
  "Gửi báo cáo tổng kết, minh chứng sau chiến dịch"
];

const COMMUNE_GROUPS = [
  {
    id: 'G1',
    name: 'Nhóm 1: Phường Đô thị - TT Hành chính',
    targets: { digitalSkills: 1500, vneidSupport: 700, publicServices: 500, qrSupport: 160, trainingClasses: 6, digitalProducts: 12, youthTrained: 250 },
    communes: ["Phường Buôn Ma Thuột", "Phường Tân An", "Phường Tân Lập", "Phường Thành Nhất", "Phường Ea Kao", "Phường Buôn Hồ", "Phường Cư Bao", "Đoàn phường Phú Yên", "Đoàn phường Tuy Hòa", "Đoàn phường Bình Kiến", "Đoàn phường Xuân Đài", "Đoàn phường Sông Cầu", "Đoàn phường Đông Hòa", "Đoàn phường Hòa Hiệp", "Xã Ea Súp", "Xã Quảng Phú", "Xã Pơng Drang", "Xã Ea Drăng", "Xã Krông Năng", "Xã Krông Pắc", "Xã Ea Kar", "Xã Ea Knốp", "Xã M'Drắk", "Xã Krông Bông", "Xã Liên Sơn Lắk", "Xã Krông Ana", "Đoàn xã Tuy An Bắc", "Đoàn xã Phú Hòa 1", "Đoàn xã Tây Hòa", "Đoàn xã Sơn Hòa", "Đoàn xã Sông Hinh", "Đoàn xã Đồng Xuân"]
  },
  {
    id: 'G2',
    name: 'Nhóm 2: Xã có Chợ - TT Cụm xã',
    targets: { digitalSkills: 1000, vneidSupport: 500, publicServices: 300, qrSupport: 100, trainingClasses: 5, digitalProducts: 10, youthTrained: 200 },
    communes: ["Xã Hòa Phú", "Xã Ea Drông", "Xã Ea Wer", "Xã Ea Nuôl", "Xã Ea Kiết", "Xã Ea M'Droh", "Xã Cuôr Đăng", "Xã Cư M'gar", "Xã Ea Tul", "Xã Krông Búk", "Xã Ea Khal", "Xã Ea Hiao", "Xã Dliê Ya", "Xã Tam Giang", "Xã Phú Xuân", "Xã Ea Knuếc", "Xã Tân Tiến", "Xã Ea Phê", "Xã Ea Kly", "Xã Cư Yang", "Xã Ea Păl", "Xã Hòa Sơn", "Xã Đắk Liêng", "Xã Ea Ning", "Xã Dray Bhăng", "Xã Ea Ktur", "Xã Dur Kmăl", "Xã Ea Na", "Đoàn xã Xuân Thọ", "Đoàn xã Xuân Cảnh", "Đoàn xã Xuân Lộc", "Đoàn xã Hòa Xuân", "Đoàn xã Tuy An Đông", "Đoàn xã Ô Loan", "Đoàn xã Tuy An Nam", "Đoàn xã Phú Hòa 2", "Đoàn xã Hòa Thịnh", "Đoàn xã Hòa Mỹ", "Đoàn xã Sơn Thành", "Đoàn xã Đức Bình"]
  },
  {
    id: 'G3',
    name: 'Nhóm 3: Xã Nông thôn - Vùng sâu',
    targets: { digitalSkills: 600, vneidSupport: 300, publicServices: 150, qrSupport: 30, trainingClasses: 4, digitalProducts: 8, youthTrained: 150 },
    communes: ["Xã Ea Rốk", "Xã Ea Bung", "Xã Cư Pơng", "Xã Ea Wy", "Xã Ea Ô", "Xã Ea Riêng", "Xã Cư M'ta", "Xã Krông Á", "Xã Cư Prao", "Xã Dang Kang", "Xã Yang Mao", "Xã Cư Pui", "Xã Nam Ka", "Xã Đắk Phơi", "Đoàn xã Tuy An Tây", "Đoàn xã Vân Hòa", "Đoàn xã Tây Sơn", "Đoàn xã Suối Trai", "Đoàn xã Ea Ly", "Đoàn xã Ea Bá", "Đoàn xã Xuân Lãnh", "Đoàn xã Phú Mỡ", "Đoàn xã Xuân Phước", "Xã Buôn Đôn", "Xã Ea H'Leo", "Xã Ea Trang", "Xã Ia Lốp", "Xã Ia Rvê", "Xã Krông Nô", "Xã Vụ Bổn"]
  }
];

const PublicCampaigns = () => {
  const [activeTab, setActiveTab] = useState('report');
  const [checkedItems, setCheckedItems] = useState([]);
  
  // Use localStorage for auth state like in other components
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  // Safely get agency name
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
    vneid: 12450, qr: 5230, digitalSkills: 0, publicServices: 0, activeAgencies: 102, totalAgencies: 102
  });
  
  const [selectedCommune, setSelectedCommune] = useState('');
  const activeGroup = COMMUNE_GROUPS.find(g => 
    g.communes.some(c => selectedCommune.includes(c) || c.includes(selectedCommune))
  );

  const [formData, setFormData] = useState({
    activeTeams: '', volunteers: '', digitalSkills: '', vneidSupport: '',
    publicServices: '', qrSupport: '', trainingClasses: '', digitalProducts: '',
    youthTrained: '', safetyCampaigns: '', mediaPosts: ''
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
          vneid: res.data.vneid || 0,
          qr: res.data.qr || 0,
          digitalSkills: res.data.digitalSkills || 0,
          publicServices: res.data.publicServices || 0,
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
        activeTeams: Number(formData.activeTeams) || 0,
        volunteers: Number(formData.volunteers) || 0,
        digitalSkills: Number(formData.digitalSkills) || 0,
        vneidSupport: Number(formData.vneidSupport) || 0,
        publicServices: Number(formData.publicServices) || 0,
        qrSupport: Number(formData.qrSupport) || 0,
        trainingClasses: Number(formData.trainingClasses) || 0,
        digitalProducts: Number(formData.digitalProducts) || 0,
        youthTrained: Number(formData.youthTrained) || 0,
        safetyCampaigns: Number(formData.safetyCampaigns) || 0,
        mediaPosts: Number(formData.mediaPosts) || 0
      });
      toast.success('Gửi báo cáo thành công!');
      setFormData({
        activeTeams: '', volunteers: '', digitalSkills: '', vneidSupport: '',
        publicServices: '', qrSupport: '', trainingClasses: '', digitalProducts: '',
        youthTrained: '', safetyCampaigns: '', mediaPosts: ''
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

  return (
    <div style={{ background: 'var(--surface-0)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* HERO SECTION */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-600) 0%, var(--blue-900) 100%)', color: 'white', padding: '60px 0 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: '.85rem', fontWeight: 600, marginBottom: 20, backdropFilter: 'blur(10px)' }}>
            CHIẾN DỊCH 44 NGÀY ĐÊM
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16, color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            THANH NIÊN ĐẮK LẮK <br/> TIÊN PHONG CHUYỂN ĐỔI SỐ
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
            "Bình dân học vụ số - Thanh niên hành động" <br/>
            Khẩu hiệu: 44 ngày đêm hành động - 44 ngày đêm cống hiến - 44 ngày đêm đưa chuyển đổi số đến với người dân.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: -40, position: 'relative', zIndex: 2 }}>
        
        {/* TAB NAVIGATION */}
        <div style={{ display: 'flex', background: 'white', borderRadius: 'var(--r-lg)', padding: 8, boxShadow: 'var(--sh-lg)', gap: 8, overflowX: 'auto', marginBottom: 30 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, 
                  padding: '12px 20px', borderRadius: 'var(--r-md)', border: 'none', 
                  background: isActive ? `${tab.color}15` : 'transparent',
                  color: isActive ? tab.color : 'var(--tx-2)',
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer', transition: 'all .2s'
                }}
              >
                <Icon size={18} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        <div className="animate-up">
          
          {/* TAB 1: REPORT */}
          {activeTab === 'report' && (
            <div style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                
                {/* Form Báo cáo (Chỉ dành cho Cán bộ) */}
                {canReport ? (
                  <div className="card" style={{ borderTop: '4px solid var(--blue-600)' }}>
                    <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><UploadCloud size={20} color="var(--blue-600)"/> Báo cáo Hằng ngày (Cấp Xã)</h3>
                    <p style={{ color: 'var(--tx-3)', fontSize: '.9rem', marginBottom: 20 }}>Chọn Xã/Phường để xem Chỉ tiêu tối thiểu tương ứng của nhóm và nhập liệu báo cáo trong ngày.</p>
                    
                    <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmitReport}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>Cơ quan / Xã Phường</label>
                        <input className="form-input" disabled value={agencyName || 'Không xác định'} style={{ background: '#F1F5F9', fontWeight: 600 }} />
                      </div>

                      {activeGroup ? (
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 8 }}>
                          <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--blue-600)', marginBottom: 12 }}>
                            MỤC TIÊU CHIẾN DỊCH ({activeGroup.name})
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                            <div className="form-group">
                              <label className="form-label">1. Số lượt HT Kỹ năng số <span style={{color:'var(--danger)', fontSize:'.75rem'}}>(Chỉ tiêu: &gt;{activeGroup.targets.digitalSkills})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.digitalSkills} onChange={e => setFormData({...formData, digitalSkills: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">2. Số lượt HT VNeID <span style={{color:'var(--danger)', fontSize:'.75rem'}}>(Chỉ tiêu: &gt;{activeGroup.targets.vneidSupport})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.vneidSupport} onChange={e => setFormData({...formData, vneidSupport: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">3. Số lượt HT Dịch vụ công <span style={{color:'var(--danger)', fontSize:'.75rem'}}>(Chỉ tiêu: &gt;{activeGroup.targets.publicServices})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.publicServices} onChange={e => setFormData({...formData, publicServices: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">4. Số hộ KD hỗ trợ QR <span style={{color:'var(--danger)', fontSize:'.75rem'}}>(Chỉ tiêu: &gt;{activeGroup.targets.qrSupport})</span></label>
                              <input type="number" min="0" className="form-input" placeholder="0" value={formData.qrSupport} onChange={e => setFormData({...formData, qrSupport: e.target.value})} />
                            </div>
                          </div>

                          <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--tx-2)', marginTop: 16, marginBottom: 12 }}>CÁC CHỈ TIÊU KHÁC</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div className="form-group"><label className="form-label">Đội hình ra quân</label><input type="number" min="0" className="form-input" placeholder="0" value={formData.activeTeams} onChange={e => setFormData({...formData, activeTeams: e.target.value})} /></div>
                            <div className="form-group"><label className="form-label">Tình nguyện viên</label><input type="number" min="0" className="form-input" placeholder="0" value={formData.volunteers} onChange={e => setFormData({...formData, volunteers: e.target.value})} /></div>
                            <div className="form-group"><label className="form-label">Lớp/Điểm HD <span style={{color:'var(--danger)', fontSize:'.7rem'}}>(&gt;{activeGroup.targets.trainingClasses})</span></label><input type="number" min="0" className="form-input" placeholder="0" value={formData.trainingClasses} onChange={e => setFormData({...formData, trainingClasses: e.target.value})} /></div>
                            <div className="form-group"><label className="form-label">Sản phẩm số hóa <span style={{color:'var(--danger)', fontSize:'.7rem'}}>(&gt;{activeGroup.targets.digitalProducts})</span></label><input type="number" min="0" className="form-input" placeholder="0" value={formData.digitalProducts} onChange={e => setFormData({...formData, digitalProducts: e.target.value})} /></div>
                            <div className="form-group"><label className="form-label">Đoàn viên học AI <span style={{color:'var(--danger)', fontSize:'.7rem'}}>(&gt;{activeGroup.targets.youthTrained})</span></label><input type="number" min="0" className="form-input" placeholder="0" value={formData.youthTrained} onChange={e => setFormData({...formData, youthTrained: e.target.value})} /></div>
                            <div className="form-group"><label className="form-label">HĐ an toàn số</label><input type="number" min="0" className="form-input" placeholder="0" value={formData.safetyCampaigns} onChange={e => setFormData({...formData, safetyCampaigns: e.target.value})} /></div>
                            <div className="form-group" style={{gridColumn:'span 3'}}><label className="form-label">Số lượng tin bài/video truyền thông</label><input type="number" min="0" className="form-input" placeholder="0" value={formData.mediaPosts} onChange={e => setFormData({...formData, mediaPosts: e.target.value})} /></div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: 16, background: '#FEF2F2', color: 'var(--danger)', borderRadius: 8, fontSize: '.9rem' }}>
                          Tài khoản của bạn ({agencyName}) không thuộc danh sách 102 Xã/Phường được giao chỉ tiêu. Chức năng nhập liệu chỉ dành cho Quản trị viên cấp Xã.
                        </div>
                      )}
                      
                      <button type="submit" disabled={loading || !activeGroup} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                        {loading ? <Loader2 size={16} className="spin" /> : 'Lưu Báo Cáo Chuyển Đổi Số'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="card" style={{ borderTop: '4px solid var(--green-600)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ width: 64, height: 64, background: 'var(--green-600)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Smartphone size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-dark)', marginBottom: 8 }}>Bạn cần hỗ trợ Chuyển đổi số?</h3>
                      <p style={{ color: 'var(--tx-2)' }}>102 Đội hình thanh niên tại các Xã/Phường luôn sẵn sàng hỗ trợ bạn hoàn toàn miễn phí.</p>
                    </div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><CheckCircle2 size={18} color="var(--green-600)" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Cài đặt và định danh điện tử VNeID mức 2</span></li>
                      <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><CheckCircle2 size={18} color="var(--green-600)" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Tạo mã QR thanh toán cho Hộ kinh doanh/Tiểu thương</span></li>
                      <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><CheckCircle2 size={18} color="var(--green-600)" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Hướng dẫn nộp hồ sơ Dịch vụ công trực tuyến</span></li>
                      <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><CheckCircle2 size={18} color="var(--green-600)" style={{ flexShrink: 0, marginTop: 2 }} /> <span>Bảo mật thông tin, phòng chống lừa đảo trên mạng</span></li>
                    </ul>
                    
                    <button className="btn btn-primary" style={{ background: 'var(--green-600)', borderColor: 'var(--green-600)', width: '100%' }}>
                      Tìm điểm hỗ trợ gần bạn nhất
                    </button>
                  </div>
                )}

                <div className="card">
                  <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><BarChart3 size={20} color="var(--amber-600)"/> Bảng Tổng hợp Lũy kế (Toàn Tỉnh)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: '#EFF6FF', padding: 16, borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--blue-600)' }}>{stats.vneid.toLocaleString('vi-VN')}</div>
                      <div style={{ fontSize: '.8rem', color: 'var(--tx-2)', fontWeight: 600 }}>Lượt hỗ trợ VNeID</div>
                    </div>
                    <div style={{ background: '#F0FDF4', padding: 16, borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--green-600)' }}>{stats.qr.toLocaleString('vi-VN')}</div>
                      <div style={{ fontSize: '.8rem', color: 'var(--tx-2)', fontWeight: 600 }}>Hộ kinh doanh QR</div>
                    </div>
                    <div style={{ background: '#FEF2F2', padding: 16, borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)' }}>{stats.activeAgencies}/{stats.totalAgencies}</div>
                      <div style={{ fontSize: '.8rem', color: 'var(--tx-2)', fontWeight: 600 }}>Đội hình ra quân</div>
                    </div>
                    <div style={{ background: '#FAF5FF', padding: 16, borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--purple-600)' }}>
                        {Math.round((stats.activeAgencies / stats.totalAgencies) * 100) || 0}%
                      </div>
                      <div style={{ fontSize: '.8rem', color: 'var(--tx-2)', fontWeight: 600 }}>Tiến độ toàn chiến dịch</div>
                    </div>
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((stats.activeAgencies / stats.totalAgencies) * 100) || 0}%`, height: '100%', background: 'var(--blue-600)' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TARGETS */}
          {activeTab === 'targets' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {[
                { title: 'Nhóm 1: Phường, Đô thị, Hành chính', count: 32, icon: Landmark, color: 'var(--blue-600)', desc: 'Tập trung vào DVC trực tuyến, VNeID, thanh toán QR, tuyến phố/chợ không tiền mặt, mô hình đô thị số.', targets: ['Hỗ trợ kỹ năng số: > 1.500 lượt', 'VNeID & Tiện ích: > 700 lượt', 'Dịch vụ công: > 500 lượt', 'Hộ kinh doanh QR: > 160 hộ', 'Tổ chức lớp/điểm hướng dẫn: 6 lớp', 'Số hóa sản phẩm OCOP: 12 sản phẩm', 'Đoàn viên tập huấn AI: 250 người', 'Mô hình điểm: Tuyến phố/Chợ không tiền mặt'] },
                { title: 'Nhóm 2: Xã có chợ, Trung tâm cụm', count: 40, icon: ShoppingCart, color: 'var(--amber-600)', desc: 'Tập trung vào VNeID, dịch vụ công trực tuyến, chợ số, hộ kinh doanh QR, sản phẩm địa phương số.', targets: ['Hỗ trợ kỹ năng số: > 1.000 lượt', 'VNeID & Tiện ích: > 500 lượt', 'Dịch vụ công: > 300 lượt', 'Hộ kinh doanh QR: > 100 hộ', 'Tổ chức lớp/điểm hướng dẫn: 5 lớp', 'Số hóa sản phẩm OCOP: 10 sản phẩm', 'Đoàn viên tập huấn AI: 200 người', 'Mô hình điểm: Chợ số, Khu dân cư số'] },
                { title: 'Nhóm 3: Xã nông thôn, Vùng sâu', count: 30, icon: MapPin, color: 'var(--green-600)', desc: 'Tập trung Bình dân học vụ số, an toàn số cộng đồng, ưu tiên đội hình lưu động đến thôn, buôn.', targets: ['Hỗ trợ kỹ năng số: > 600 lượt', 'VNeID & Tiện ích: > 300 lượt', 'Dịch vụ công: > 150 lượt', 'Hộ kinh doanh QR: > 30 hộ', 'Tổ chức lớp/điểm hướng dẫn: 4 lớp', 'Số hóa sản phẩm OCOP: 8 sản phẩm', 'Đoàn viên tập huấn AI: 150 người', 'Mô hình điểm: Thôn/buôn số, Khu dân cư an toàn số'] },
              ].map((g, i) => {
                const GIcon = g.icon;
                return (
                  <div key={i} className="card" style={{ borderTop: `4px solid ${g.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${g.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.color }}>
                        <GIcon size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: 2 }}>{g.title}</h3>
                        <div style={{ fontSize: '.85rem', color: 'var(--tx-3)', fontWeight: 600 }}>{g.count} đơn vị xã/phường</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '.9rem', color: 'var(--tx-2)', marginBottom: 16 }}>{g.desc}</p>
                    <div style={{ background: 'var(--surface-1)', padding: '12px 16px', borderRadius: 'var(--r-md)' }}>
                      <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--tx-2)', marginBottom: 10, textTransform: 'uppercase' }}>Chỉ tiêu tối thiểu (Phụ lục 1)</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {g.targets.map((t, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '.9rem' }}>
                            <ArrowRight size={14} color={g.color} style={{ marginTop: 3, flexShrink: 0 }} />
                            <span>{t}</span>
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
              <h3 style={{ marginBottom: 20, textAlign: 'center', fontSize: '1.4rem' }}>Cấu trúc Đội hình "Thanh niên số" & 5 Nhóm việc</h3>
              <p style={{ textAlign: 'center', color: 'var(--tx-2)', marginBottom: 30 }}>Công thức: 1 xã/phường - 1 đội hình - 3 điểm hỗ trợ - 5 nhóm việc - 1 báo cáo/ngày.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {[
                  { name: '1. Bình dân học vụ số', desc: 'Hướng dẫn smartphone, ứng dụng thiết yếu, tra cứu thông tin.', icon: Smartphone, color: '#3B82F6' },
                  { name: '2. VNeID & Dịch vụ công', desc: 'Hỗ trợ tạo tài khoản, nộp hồ sơ, quét QR thủ tục hành chính.', icon: Landmark, color: '#10B981' },
                  { name: '3. Chợ số & Thanh toán QR', desc: 'Tạo mã QR bán hàng, phòng tránh lừa đảo chuyển khoản giả.', icon: ShoppingCart, color: '#F59E0B' },
                  { name: '4. Nông thôn số & OCOP', desc: 'Đưa sản phẩm lên mxh, sàn TMĐT, số hóa quảng bá địa phương.', icon: UploadCloud, color: '#8B5CF6' },
                  { name: '5. An toàn số cộng đồng', desc: 'Tuyên truyền phòng chống lừa đảo mạng, bảo vệ thông tin cá nhân.', icon: ShieldCheck, color: '#EF4444' }
                ].map((task, i) => {
                  const TIcon = task.icon;
                  return (
                    <div key={i} style={{ padding: 20, borderRadius: 'var(--r-lg)', border: `1px solid ${task.color}30`, background: `${task.color}05`, transition: 'all .2s' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: task.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 12 }}>
                        <TIcon size={20} />
                      </div>
                      <h4 style={{ fontSize: '1.05rem', color: task.color, marginBottom: 8 }}>{task.name}</h4>
                      <p style={{ fontSize: '.9rem', color: 'var(--tx-2)', lineHeight: 1.5 }}>{task.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: 6 }}>Sổ tay & Checklist Cơ sở</h3>
                  <p style={{ color: 'var(--tx-3)', fontSize: '.9rem' }}>Theo dõi tiến độ thực hiện nhiệm vụ của xã/phường (Mô phỏng 15 bước).</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: progress === 100 ? 'var(--green-600)' : 'var(--blue-600)', lineHeight: 1 }}>{progress}%</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', fontWeight: 600 }}>HOÀN THÀNH</div>
                </div>
              </div>

              <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', marginBottom: 24 }}>
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
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', 
                        borderRadius: 'var(--r-md)', border: isChecked ? '1px solid var(--green-600)' : '1px solid var(--border)',
                        background: isChecked ? '#F0FDF4' : 'var(--surface-0)',
                        cursor: 'pointer', transition: 'all .2s'
                      }}
                    >
                      <div style={{ color: isChecked ? 'var(--green-600)' : 'var(--tx-3)', flexShrink: 0, transition: 'all .2s' }}>
                        {isChecked ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                      </div>
                      <span style={{ fontSize: '.95rem', fontWeight: 500, color: isChecked ? 'var(--tx-1)' : 'var(--tx-2)', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.7 : 1 }}>
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
