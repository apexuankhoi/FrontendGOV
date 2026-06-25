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

const PublicCampaigns = () => {
  const [activeTab, setActiveTab] = useState('report');
  const [checkedItems, setCheckedItems] = useState([]);
  
  // Use localStorage for auth state like in other components
  const token = localStorage.getItem('token');
  const agencyName = localStorage.getItem('agencyName');
  
  const [stats, setStats] = useState({
    vneid: 12450, qr: 5230, digitalSkills: 0, publicServices: 0, activeAgencies: 102, totalAgencies: 102
  });
  
  const [formData, setFormData] = useState({
    digitalSkills: '', qrSupport: ''
  });
  
  const [loading, setLoading] = useState(false);
  
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
        digitalSkills: Number(formData.digitalSkills),
        qrSupport: Number(formData.qrSupport)
      });
      toast.success('Gửi báo cáo thành công!');
      setFormData({ digitalSkills: '', qrSupport: '' });
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
                <div className="card" style={{ borderTop: '4px solid var(--blue-600)' }}>
                  <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><UploadCloud size={20} color="var(--blue-600)"/> Nhập liệu Hằng ngày (Cấp Xã)</h3>
                  <p style={{ color: 'var(--tx-3)', fontSize: '.9rem', marginBottom: 20 }}>Dành cho các đội hình khai báo số liệu trực tiếp mỗi 20h00.</p>
                  
                  <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={handleSubmitReport}>
                    <div className="form-group"><label className="form-label">Cơ quan / Xã Phường</label><input className="form-input" disabled value={token ? (agencyName || localStorage.getItem('username') || 'Đã đăng nhập') : 'Yêu cầu đăng nhập'} /></div>
                    <div className="form-group"><label className="form-label">Số lượt người dân được hỗ trợ kỹ năng số</label><input type="number" min="0" required className="form-input" placeholder="0" value={formData.digitalSkills} onChange={e => setFormData({...formData, digitalSkills: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Số hộ kinh doanh, tiểu thương hỗ trợ QR</label><input type="number" min="0" required className="form-input" placeholder="0" value={formData.qrSupport} onChange={e => setFormData({...formData, qrSupport: e.target.value})} /></div>
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                      {loading ? <Loader2 size={16} className="spin" /> : 'Gửi Báo Cáo Nhanh'}
                    </button>
                  </form>
                </div>

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
                { title: 'Nhóm 1: Phường, Đô thị, Hành chính', count: 32, icon: Landmark, color: 'var(--blue-600)', targets: ['Hỗ trợ kỹ năng số: > 1.500 lượt', 'VNeID & Tiện ích: > 700 lượt', 'Dịch vụ công: > 500 lượt', 'Hộ kinh doanh QR: > 160 hộ', 'Điểm chuyển đổi số: Tuyến phố ko tiền mặt'] },
                { title: 'Nhóm 2: Xã có chợ, Trung tâm cụm', count: 40, icon: ShoppingCart, color: 'var(--amber-600)', targets: ['Hỗ trợ kỹ năng số: > 1.000 lượt', 'VNeID & Tiện ích: > 500 lượt', 'Dịch vụ công: > 300 lượt', 'Hộ kinh doanh QR: > 100 hộ', 'Điểm chuyển đổi số: Chợ số, Khu dân cư số'] },
                { title: 'Nhóm 3: Xã nông thôn, Vùng sâu', count: 30, icon: MapPin, color: 'var(--green-600)', targets: ['Hỗ trợ kỹ năng số: > 600 lượt', 'VNeID & Tiện ích: > 300 lượt', 'Dịch vụ công: > 150 lượt', 'Hộ kinh doanh QR: > 30 hộ', 'Điểm chuyển đổi số: Thôn/buôn số'] },
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
                    <div style={{ background: 'var(--surface-1)', padding: '12px 16px', borderRadius: 'var(--r-md)' }}>
                      <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--tx-2)', marginBottom: 10, textTransform: 'uppercase' }}>Chỉ tiêu tối thiểu</div>
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
