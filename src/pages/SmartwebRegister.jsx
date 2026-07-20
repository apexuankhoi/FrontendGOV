import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import {
  Globe, Phone, User, Store, MapPin, CheckCircle,
  Search, Loader2, ArrowRight, QrCode, ShieldCheck, Sparkles
} from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'BAN_LE', label: 'Bán lẻ / Tạp hóa', icon: '🛒' },
  { value: 'NONG_SAN', label: 'Nông sản / Thực phẩm', icon: '🌾' },
  { value: 'AN_UONG', label: 'Ăn uống / Quán ăn', icon: '🍜' },
  { value: 'THOI_TRANG', label: 'Thời trang / Quần áo', icon: '👗' },
  { value: 'DICH_VU', label: 'Dịch vụ (sửa chữa, cắt tóc...)', icon: '🔧' },
  { value: 'THU_CONG', label: 'Thủ công mỹ nghệ', icon: '🎨' },
  { value: 'KHAC', label: 'Khác', icon: '📦' },
];

const STATUS_MAP = {
  PENDING:    { label: 'Chờ đoàn viên liên hệ', color: '#6366F1', bg: '#EEF2FF', icon: '⏳' },
  CONTACTED:  { label: 'Đoàn viên đã liên hệ', color: '#0EA5E9', bg: '#E0F2FE', icon: '📞' },
  REGISTERED: { label: 'Đã đăng ký tên miền .VN', color: '#F59E0B', bg: '#FEF3C7', icon: '🌐' },
  ACTIVE:     { label: 'Website đã hoạt động', color: '#10B981', bg: '#D1FAE5', icon: '🚀' },
  CANCELLED:  { label: 'Đã hủy', color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
};

const SmartwebRegister = () => {
  const [searchParams] = useSearchParams();
  const presetAgencyId = searchParams.get('agency') || '';

  const [tab, setTab] = useState('register'); // 'register' | 'track'
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [publicStats, setPublicStats] = useState({ total: 0, active: 0, registered: 0 });

  const [form, setForm] = useState({
    ownerName: '',
    phone: '',
    address: '',
    businessName: '',
    businessType: '',
    agencyId: presetAgencyId,
  });

  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  useEffect(() => {
    api.get('/agencies/public').then(r => setCommunes(r.data)).catch(() => {});
    api.get('/smartweb/public-stats').then(r => setPublicStats(r.data)).catch(() => {});
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.ownerName || !form.phone || !form.businessName || !form.agencyId) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/smartweb/register', form);
      setSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi đăng ký';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async e => {
    e.preventDefault();
    if (!trackCode.trim()) return;
    setTrackLoading(true);
    setTrackError('');
    setTrackResult(null);
    try {
      const res = await api.get(`/smartweb/track/${trackCode.trim().toUpperCase()}`);
      setTrackResult(res.data);
    } catch (err) {
      setTrackError(err.response?.data?.message || 'Không tìm thấy mã này.');
    } finally {
      setTrackLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--surface-0)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a6b 0%, #0ea5e9 100%)',
        color: 'white', padding: '60px 0 90px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', background: 'rgba(255,255,255,0.15)', borderRadius: 20, fontSize: '.85rem', fontWeight: 600, marginBottom: 20, backdropFilter: 'blur(10px)' }}>
            <Globe size={14} /> CHIẾN DỊCH 44 NGÀY ĐÊM
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 16, color: 'white' }}>
            Mỗi Tiểu Thương<br />Một Website .VN
          </h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.9, maxWidth: 620, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Đăng ký miễn phí để được đoàn viên thanh niên hỗ trợ tạo website bán hàng với tên miền <strong>.VN</strong> chính thức trên nền tảng <strong>SmartWeb</strong>.
          </p>

          {/* Stats counters */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {[
              { val: publicStats.total, label: 'Đã đăng ký', icon: '📝' },
              { val: publicStats.registered, label: 'Có tên miền .VN', icon: '🌐' },
              { val: publicStats.active, label: 'Website hoạt động', icon: '🚀' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>{s.val.toLocaleString()}</div>
                <div style={{ fontSize: '.85rem', opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: -40, position: 'relative', zIndex: 2 }}>
        {/* TAB */}
        <div style={{ display: 'flex', background: 'white', borderRadius: 16, padding: 8, boxShadow: '0 4px 30px rgba(0,0,0,0.1)', gap: 8, marginBottom: 30, maxWidth: 500, margin: '-40px auto 30px' }}>
          {[
            { id: 'register', label: 'Đăng ký Website', icon: Globe },
            { id: 'track', label: 'Tra cứu tiến độ', icon: Search },
          ].map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 20px', borderRadius: 12, border: 'none',
                background: isActive ? '#1a3a6b' : 'transparent',
                color: isActive ? 'white' : 'var(--tx-2)',
                fontWeight: 700, cursor: 'pointer', transition: 'all .2s', fontSize: '0.9rem'
              }}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* REGISTER TAB */}
        {tab === 'register' && (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {success ? (
              <div style={{ background: 'white', borderRadius: 20, padding: 48, textAlign: 'center', boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={40} color="#10B981" />
                </div>
                <h2 style={{ color: '#10B981', marginBottom: 12 }}>Đăng ký thành công!</h2>
                <p style={{ color: 'var(--tx-2)', marginBottom: 24, lineHeight: 1.7 }}>{success.message}</p>
                <div style={{ background: '#EEF2FF', borderRadius: 12, padding: '16px 24px', display: 'inline-block' }}>
                  <div style={{ fontSize: '.85rem', color: '#6366F1', fontWeight: 600, marginBottom: 4 }}>Mã tra cứu của bạn</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a3a6b', letterSpacing: 2 }}>{success.trackingCode}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 4 }}>Lưu lại mã này để theo dõi tiến độ</div>
                </div>
                <div style={{ marginTop: 28 }}>
                  <button onClick={() => { setTab('track'); setTrackCode(success.trackingCode); }} style={{
                    padding: '12px 28px', background: '#1a3a6b', color: 'white',
                    border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8
                  }}>
                    <Search size={16} /> Tra cứu ngay
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 20, padding: 36, boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24, color: '#1a3a6b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color="#0ea5e9" /> Thông tin đăng ký
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="form-label">Họ tên chủ cơ sở <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
                      <input name="ownerName" value={form.ownerName} onChange={handleChange} required placeholder="Nguyễn Văn A" className="form-input" style={{ paddingLeft: 38 }} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Số điện thoại <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
                      <input name="phone" value={form.phone} onChange={handleChange} required placeholder="0901 234 567" className="form-input" style={{ paddingLeft: 38 }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Tên cơ sở / gian hàng <span style={{ color: 'red' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Store size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
                    <input name="businessName" value={form.businessName} onChange={handleChange} required placeholder="Tạp hóa Hoa Mai" className="form-input" style={{ paddingLeft: 38 }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Loại hình kinh doanh</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                    {BUSINESS_TYPES.map(bt => (
                      <button key={bt.value} type="button" onClick={() => setForm(f => ({ ...f, businessType: bt.value }))}
                        style={{
                          padding: '10px 12px', borderRadius: 10, border: '2px solid',
                          borderColor: form.businessType === bt.value ? '#1a3a6b' : 'var(--border)',
                          background: form.businessType === bt.value ? '#EEF2FF' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: '.85rem', fontWeight: form.businessType === bt.value ? 700 : 500,
                          color: form.businessType === bt.value ? '#1a3a6b' : 'var(--tx-2)',
                          transition: 'all .15s'
                        }}>
                        <span>{bt.icon}</span> {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label">Xã/Phường/Thị trấn <span style={{ color: 'red' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
                    <select name="agencyId" value={form.agencyId} onChange={handleChange} required className="form-input" style={{ paddingLeft: 38 }}>
                      <option value="">-- Chọn xã/phường --</option>
                      {communes.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label className="form-label">Địa chỉ cơ sở</label>
                  <input name="address" value={form.address} onChange={handleChange} placeholder="Số nhà, thôn/buôn, xã..." className="form-input" />
                </div>

                {/* Cam kết */}
                <div style={{ background: '#F0F9FF', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <ShieldCheck size={20} color="#0ea5e9" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '.85rem', color: 'var(--tx-2)', lineHeight: 1.6 }}>
                    Sau khi đăng ký, đoàn viên thanh niên tại địa bàn sẽ <strong>liên hệ trực tiếp</strong> để hỗ trợ bạn tạo website và đăng ký tên miền <strong>.VN miễn phí</strong> trong khuôn khổ chiến dịch.
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '14px', background: loading ? 'var(--tx-3)' : 'linear-gradient(135deg, #1a3a6b, #0ea5e9)',
                  color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .2s'
                }}>
                  {loading ? <Loader2 size={20} className="spin" /> : <Globe size={20} />}
                  {loading ? 'Đang gửi đăng ký...' : 'Đăng ký nhận hỗ trợ'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TRACK TAB */}
        {tab === 'track' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ background: 'white', borderRadius: 20, padding: 36, boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: '#1a3a6b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={20} color="#0ea5e9" /> Tra cứu tiến độ đăng ký
              </h3>
              <p style={{ color: 'var(--tx-3)', marginBottom: 24, fontSize: '.9rem' }}>
                Nhập mã tra cứu có dạng <strong>SW-YYYYMMDD-XXXXX</strong> để xem trạng thái đăng ký website của bạn.
              </p>

              <form onSubmit={handleTrack} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <input
                  value={trackCode} onChange={e => setTrackCode(e.target.value.toUpperCase())}
                  placeholder="SW-20260721-ABCDE"
                  className="form-input" style={{ flex: 1, fontFamily: 'monospace', fontWeight: 600, letterSpacing: 1 }}
                />
                <button type="submit" disabled={trackLoading} style={{
                  padding: '10px 20px', background: '#1a3a6b', color: 'white',
                  border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                }}>
                  {trackLoading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                  Tra cứu
                </button>
              </form>

              {trackError && (
                <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '14px 18px', borderRadius: 10, fontSize: '.9rem' }}>
                  {trackError}
                </div>
              )}

              {trackResult && (() => {
                const st = STATUS_MAP[trackResult.status] || STATUS_MAP['PENDING'];
                return (
                  <div style={{ border: '2px solid', borderColor: st.color, borderRadius: 16, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a3a6b' }}>{trackResult.businessName}</div>
                        <div style={{ color: 'var(--tx-3)', fontSize: '.85rem' }}>Chủ: {trackResult.ownerName}</div>
                      </div>
                      <div style={{ background: st.bg, color: st.color, padding: '6px 14px', borderRadius: 20, fontSize: '.85rem', fontWeight: 700 }}>
                        {st.icon} {st.label}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Mã tra cứu', value: trackResult.trackingCode },
                        { label: 'Xã/Phường', value: trackResult.agencyName },
                        { label: 'Tên miền', value: trackResult.domain || 'Chưa có' },
                        { label: 'Ngày đăng ký', value: new Date(trackResult.createdAt).toLocaleDateString('vi-VN') },
                      ].map((r, i) => (
                        <div key={i} style={{ background: 'var(--surface-1)', padding: '10px 14px', borderRadius: 8 }}>
                          <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginBottom: 2 }}>{r.label}</div>
                          <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{r.value}</div>
                        </div>
                      ))}
                    </div>
                    {trackResult.websiteUrl && (
                      <a href={trackResult.websiteUrl} target="_blank" rel="noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16,
                        padding: '10px 20px', background: '#10B981', color: 'white',
                        borderRadius: 10, textDecoration: 'none', fontWeight: 700
                      }}>
                        <Globe size={16} /> Xem website của bạn <ArrowRight size={14} />
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartwebRegister;
