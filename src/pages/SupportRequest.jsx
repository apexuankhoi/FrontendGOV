import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  Send, MapPin, Phone, User, FileText, AlertTriangle,
  ChevronDown, Camera, CheckCircle, Search, Clock,
  Shield, Heart, ArrowRight, X, Loader2, Info
} from 'lucide-react';

const CATEGORIES = [
  { value: 'THIEN_TAI', label: 'Thiên tai (bão, lụt, sạt lở...)', icon: '🌊', color: '#DC2626' },
  { value: 'DOI_SONG', label: 'Đời sống khó khăn', icon: '🏠', color: '#F59E0B' },
  { value: 'Y_TE', label: 'Y tế, sức khỏe', icon: '🏥', color: '#10B981' },
  { value: 'GIAO_DUC', label: 'Giáo dục', icon: '📚', color: '#6366F1' },
  { value: 'HA_TANG', label: 'Hạ tầng (đường, điện, nước)', icon: '🏗️', color: '#0EA5E9' },
  { value: 'AN_NINH', label: 'An ninh trật tự', icon: '🛡️', color: '#8B5CF6' },
  { value: 'KHAC', label: 'Khác', icon: '📋', color: '#64748B' },
];

const URGENCY = [
  { value: 'LOW', label: 'Bình thường', color: '#10B981', bg: '#D1FAE5' },
  { value: 'MEDIUM', label: 'Cần sớm', color: '#F59E0B', bg: '#FEF3C7' },
  { value: 'HIGH', label: 'Gấp', color: '#F97316', bg: '#FFEDD5' },
  { value: 'CRITICAL', label: 'Khẩn cấp', color: '#DC2626', bg: '#FEE2E2' },
];

const STATUS_MAP = {
  'NEW': { label: 'Mới gửi', color: '#6366F1', bg: '#EEF2FF', icon: '📩' },
  'RECEIVED': { label: 'Đã tiếp nhận', color: '#0EA5E9', bg: '#E0F2FE', icon: '✅' },
  'IN_PROGRESS': { label: 'Đang xử lý', color: '#F59E0B', bg: '#FEF3C7', icon: '⏳' },
  'RESOLVED': { label: 'Đã hỗ trợ', color: '#10B981', bg: '#D1FAE5', icon: '🎉' },
  'REJECTED': { label: 'Từ chối', color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
};

const SupportRequest = () => {
  const [tab, setTab] = useState('submit'); // 'submit' | 'track'
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  // Form state
  const [form, setForm] = useState({
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    category: '',
    content: '',
    urgency: 'MEDIUM',
    agencyId: '',
  });

  // Track state
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  useEffect(() => {
    api.get('/support-requests/communes')
      .then(r => setCommunes(r.data))
      .catch(() => { });
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.senderName || !form.senderPhone || !form.content || !form.agencyId) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/support-requests/submit', form);
      setSuccess(res.data);
      setForm({ senderName: '', senderPhone: '', senderAddress: '', category: '', content: '', urgency: 'MEDIUM', agencyId: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackQuery) return;
    setTrackLoading(true);
    setTrackError('');
    setTrackResults(null);
    try {
      // Nếu query bắt đầu bằng HT- thì tìm theo code, còn lại tìm theo SĐT
      const isCode = trackQuery.toUpperCase().startsWith('HT-');
      const param = isCode ? `code=${trackQuery}` : `phone=${trackQuery}`;
      const res = await api.get(`/support-requests/track?${param}`);
      setTrackResults(res.data);
    } catch (err) {
      setTrackError(err.response?.data?.message || 'Không tìm thấy kết quả.');
    } finally {
      setTrackLoading(false);
    }
  };

  // ═══════════════ RENDER THÀNH CÔNG ═══════════════
  if (success) {
    return (
      <>
        <section className="ctz-hero" style={{ minHeight: 'auto', padding: '60px 0 40px' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: 540, margin: '0 auto' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'fadeUp .5s ease' }}>
                <CheckCircle size={40} color="#10B981" />
              </div>
              <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, marginBottom: 10 }}>Gửi yêu cầu thành công!</h2>
              <p style={{ color: 'rgba(255,255,255,.8)', lineHeight: 1.7, marginBottom: 20 }}>
                Xã/Phường sẽ sớm tiếp nhận và liên hệ bạn. Hãy lưu lại mã tra cứu bên dưới.
              </p>
            </div>
          </div>
        </section>

        <section className="section" style={{ background: 'var(--bg)' }}>
          <div className="container" style={{ maxWidth: 500 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,.06)', textAlign: 'center' }}>
              <div style={{ fontSize: '.85rem', color: 'var(--tx-3)', marginBottom: 8 }}>Mã tra cứu của bạn</div>
              <div style={{
                fontSize: '1.8rem', fontWeight: 800, letterSpacing: 2, color: 'var(--primary)',
                background: 'var(--primary-bg)', borderRadius: 12, padding: '14px 24px', display: 'inline-block',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                {success.trackingCode}
              </div>
              <p style={{ marginTop: 16, fontSize: '.85rem', color: 'var(--tx-3)', lineHeight: 1.6 }}>
                Dùng mã này hoặc số điện thoại của bạn để tra cứu trạng thái xử lý.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => { setSuccess(null); setTab('track'); setTrackQuery(success.trackingCode); }}>
                  <Search size={16} /> Tra cứu ngay
                </button>
                <button className="btn btn-outline" onClick={() => setSuccess(null)}>
                  Gửi yêu cầu khác
                </button>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="ctz-hero" style={{ minHeight: 'auto', padding: '80px 0 60px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>

            {/* Badge */}
            <div className="ctz-hero-badge" style={{ justifyContent: 'center', marginBottom: 20 }}>
              <Heart size={14} />
              <span>Đoàn Thanh niên Đắk Lắk — Hỗ trợ bà con 24/7</span>
            </div>

            {/* Title 2 dòng — dòng 1 trắng rõ, dòng 2 gradient xanh */}
            <h1 style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 3.2rem)',
              fontWeight: 900,
              lineHeight: 1.25,
              marginBottom: 20,
              letterSpacing: '-0.5px',
            }}>
              {/* Dòng 1: trắng rõ, textShadow mạnh để thấy trên nền tối */}
              <span style={{
                display: 'block',
                color: '#FFFFFF',
                textShadow: '0 0 30px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.9)',
              }}>
                🆘 Gửi Yêu cầu
              </span>
              {/* Dòng 2: gradient xanh lá → cyan */}
              <span style={{
                display: 'block',
                background: 'linear-gradient(135deg, #6EE7B7 0%, #34D399 40%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.5))',
              }}>
                Hỗ trợ Bà con
              </span>
            </h1>

            {/* Subtitle rõ */}
            <p style={{
              color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.8,
              fontSize: '1rem',
              maxWidth: 500,
              margin: '0 auto 28px',
            }}>
              Mô tả tình hình khó khăn — xã/phường phụ trách sẽ tiếp nhận
              và cử đoàn viên xuống hỗ trợ trong thời gian sớm nhất.
            </p>

            {/* Pills */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { icon: '⚡', label: 'Phản hồi nhanh' },
                { icon: '🔍', label: 'Tra cứu realtime' },
                { icon: '🛡️', label: 'Không cần đăng nhập' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.13)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: 20, padding: '7px 16px',
                  fontSize: '.83rem', color: 'rgba(255,255,255,0.92)',
                  fontWeight: 500,
                }}>
                  {item.icon} {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TAB SWITCHER ═══════════════ */}
      <section className="section" style={{ background: 'var(--bg)', paddingTop: 24, marginTop: 0 }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="sr-tabs">
            <button className={`sr-tab ${tab === 'submit' ? 'active' : ''}`} onClick={() => setTab('submit')}>
              <Send size={16} /> Gửi yêu cầu hỗ trợ
            </button>
            <button className={`sr-tab ${tab === 'track' ? 'active' : ''}`} onClick={() => setTab('track')}>
              <Search size={16} /> Tra cứu trạng thái
            </button>
          </div>

          {/* ═══════════════ FORM GỬI YÊU CẦU ═══════════════ */}
          {tab === 'submit' && (
            <form onSubmit={handleSubmit} className="sr-form anim">
              {/* Thông tin cá nhân */}
              <div className="sr-section">
                <div className="sr-section-title">
                  <User size={18} /> Thông tin của bạn
                </div>
                <div className="sr-row">
                  <div className="sr-field">
                    <label>Họ và tên <span className="required">*</span></label>
                    <input type="text" placeholder="Nguyễn Văn A" value={form.senderName}
                      onChange={e => handleChange('senderName', e.target.value)} required />
                  </div>
                  <div className="sr-field">
                    <label>Số điện thoại <span className="required">*</span></label>
                    <input type="tel" placeholder="0901 234 567" value={form.senderPhone}
                      onChange={e => handleChange('senderPhone', e.target.value)} required />
                  </div>
                </div>
                <div className="sr-field">
                  <label>Địa chỉ cụ thể (nếu có)</label>
                  <input type="text" placeholder="Thôn/Buôn, Xã, Huyện..." value={form.senderAddress}
                    onChange={e => handleChange('senderAddress', e.target.value)} />
                </div>
              </div>

              {/* Chọn xã/phường */}
              <div className="sr-section">
                <div className="sr-section-title">
                  <MapPin size={18} /> Gửi đến Xã/Phường nào? <span className="required">*</span>
                </div>
                <div className="sr-field">
                  <select value={form.agencyId} onChange={e => handleChange('agencyId', e.target.value)} required>
                    <option value="">-- Chọn Xã/Phường --</option>
                    {communes.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sr-hint">
                  <Info size={13} /> Hệ thống sẽ chuyển yêu cầu đến đúng xã/phường bạn chọn.
                </div>
              </div>

              {/* Phân loại & Mức độ */}
              <div className="sr-section">
                <div className="sr-section-title">
                  <AlertTriangle size={18} /> Phân loại yêu cầu
                </div>

                <div className="sr-field">
                  <label>Loại hỗ trợ</label>
                  <div className="sr-categories">
                    {CATEGORIES.map(cat => (
                      <button type="button" key={cat.value}
                        className={`sr-cat-btn ${form.category === cat.value ? 'active' : ''}`}
                        style={{ '--cat-color': cat.color }}
                        onClick={() => handleChange('category', cat.value)}>
                        <span className="sr-cat-icon">{cat.icon}</span>
                        <span className="sr-cat-label">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sr-field">
                  <label>Mức độ khẩn cấp</label>
                  <div className="sr-urgency">
                    {URGENCY.map(u => (
                      <button type="button" key={u.value}
                        className={`sr-urgency-btn ${form.urgency === u.value ? 'active' : ''}`}
                        style={{ '--urg-color': u.color, '--urg-bg': u.bg }}
                        onClick={() => handleChange('urgency', u.value)}>
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nội dung */}
              <div className="sr-section">
                <div className="sr-section-title">
                  <FileText size={18} /> Nội dung cần hỗ trợ <span className="required">*</span>
                </div>
                <div className="sr-field">
                  <textarea
                    rows={5}
                    placeholder="Mô tả chi tiết tình hình khó khăn, địa điểm cụ thể, số người cần hỗ trợ..."
                    value={form.content}
                    onChange={e => handleChange('content', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
                style={{ marginTop: 8, gap: 8 }}>
                {loading ? <><Loader2 size={18} className="spin" /> Đang gửi...</> : <><Send size={18} /> Gửi yêu cầu hỗ trợ</>}
              </button>

              <p style={{ textAlign: 'center', fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 12 }}>
                Yêu cầu sẽ được gửi trực tiếp đến xã/phường bạn chọn. Đoàn viên thanh niên sẽ liên hệ bạn sớm nhất.
              </p>
            </form>
          )}

          {/* ═══════════════ TRA CỨU TRẠNG THÁI ═══════════════ */}
          {tab === 'track' && (
            <div className="sr-form anim">
              <div className="sr-section">
                <div className="sr-section-title">
                  <Search size={18} /> Tra cứu yêu cầu hỗ trợ
                </div>
                <form onSubmit={handleTrack}>
                  <div className="sr-field">
                    <label>Nhập mã tra cứu (HT-...) hoặc số điện thoại</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input type="text" placeholder="HT-20260716-ABCDE hoặc 0901234567"
                        value={trackQuery}
                        onChange={e => setTrackQuery(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button type="submit" className="btn btn-primary" disabled={trackLoading}>
                        {trackLoading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                      </button>
                    </div>
                  </div>
                </form>

                {trackError && (
                  <div className="sr-empty">{trackError}</div>
                )}

                {trackResults && trackResults.length > 0 && (
                  <div className="sr-track-results">
                    {trackResults.map(r => {
                      const st = STATUS_MAP[r.status] || STATUS_MAP['NEW'];
                      return (
                        <div key={r._id} className="sr-track-card">
                          <div className="sr-track-header">
                            <div>
                              <div style={{ fontSize: '.75rem', color: 'var(--tx-3)' }}>Mã: <strong>{r.trackingCode}</strong></div>
                              <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 4 }}>{r.senderName}</div>
                            </div>
                            <span className="sr-status-badge" style={{ background: st.bg, color: st.color }}>
                              {st.icon} {st.label}
                            </span>
                          </div>
                          <p style={{ fontSize: '.88rem', color: 'var(--tx-2)', margin: '10px 0', lineHeight: 1.6 }}>{r.content}</p>
                          <div className="sr-track-meta">
                            <span><MapPin size={13} /> {r.agencyId?.name || '—'}</span>
                            <span><Clock size={13} /> {new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                            <span><Phone size={13} /> {r.senderPhone}</span>
                          </div>
                          {r.assignedTo && (
                            <div style={{ marginTop: 10, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, fontSize: '.82rem', color: '#15803D' }}>
                              👤 Được phân công cho: <strong>{r.assignedTo}</strong> {r.assignedPhone && `(${r.assignedPhone})`}
                            </div>
                          )}
                          {r.resolution && (
                            <div style={{ marginTop: 8, padding: '8px 12px', background: '#ECFDF5', borderRadius: 8, fontSize: '.82rem', color: '#065F46' }}>
                              ✅ Kết quả: {r.resolution}
                            </div>
                          )}
                          {r.rejectionReason && (
                            <div style={{ marginTop: 8, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, fontSize: '.82rem', color: '#991B1B' }}>
                              ❌ Lý do từ chối: {r.rejectionReason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="section" style={{ background: 'var(--surface-2)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="section-label">Quy trình xử lý</span>
            <h2 className="section-title" style={{ marginTop: 8 }}>Yêu cầu của bạn được xử lý thế nào?</h2>
          </div>
          <div className="sr-steps">
            {[
              { icon: '📝', title: 'Gửi yêu cầu', desc: 'Bạn điền form mô tả tình hình cần hỗ trợ và chọn xã/phường.' },
              { icon: '🏛️', title: 'Chuyển đến xã', desc: 'Hệ thống tự động gửi yêu cầu đến đúng xã/phường bạn chọn.' },
              { icon: '👥', title: 'Phân công đoàn viên', desc: 'Cán bộ xã tiếp nhận và cử đoàn viên thanh niên xuống hỗ trợ.' },
              { icon: '✅', title: 'Hoàn thành hỗ trợ', desc: 'Bạn nhận được hỗ trợ. Xã nộp báo cáo kết quả.' },
            ].map((step, i) => (
              <div key={i} className="sr-step anim" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="sr-step-num">{i + 1}</div>
                <div className="sr-step-icon">{step.icon}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default SupportRequest;
