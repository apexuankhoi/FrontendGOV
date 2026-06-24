import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, User, Mail, Lock, ArrowRight, Bot, Camera, Shield, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { DAKLAK_COMMUNES } from '../lib/communes';

const Register = () => {
  const [tab, setTab] = useState('CITIZEN'); // 'CITIZEN' | 'ADMIN'
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', commune: '' });
  
  // eKYC Citizen State
  const [frontImage, setFrontImage] = useState('');
  const [ekycData, setEkycData] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Admin Verification State
  const [theNganhImage, setTheNganhImage] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Helper convert file to base64
  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleFrontImage = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const b64 = await toBase64(file);
    setFrontImage(b64);
  };

  const scanCCCD = async () => {
    if (!frontImage) return toast.error('Vui lòng upload ảnh CCCD mặt trước!');
    setScanning(true);
    setError('');
    try {
      const res = await api.post('/auth/ekyc-citizen', { frontImage });
      setEkycData(res.data);
      setForm({ ...form, username: res.data.fullName || '' });
      toast.success('Quét CCCD thành công!');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đọc ảnh CCCD');
    }
    setScanning(false);
  };

  const handleTheNganhImage = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const b64 = await toBase64(file);
    setTheNganhImage(b64);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp.'); return; }
    if (form.password.length < 6) { setError('Mật khẩu phải chứa ít nhất 6 ký tự.'); return; }
    
    if (tab === 'CITIZEN' && !ekycData) {
      setError('Bạn phải hoàn thành quét CCCD eKYC trước khi đăng ký.'); return;
    }
    if (tab === 'ADMIN') {
      if (!form.commune) { setError('Bạn phải chọn đơn vị công tác (Xã/Phường).'); return; }
      if (!theNganhImage) { setError('Bạn phải upload Thẻ Cán Bộ / Thẻ Ngành.'); return; }
    }

    setLoading(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        role: tab === 'ADMIN' ? 'COMMUNE_ADMIN' : 'CITIZEN'
      };

      if (tab === 'CITIZEN') {
        payload.cccd = ekycData.cccd;
        payload.dob = ekycData.dob;
        payload.address = ekycData.address;
      } else {
        payload.commune = form.commune;
        payload.theNganhImage = theNganhImage;
      }

      await api.post('/auth/register', payload);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đăng ký, vui lòng thử lại.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-split-page">
      <div className="auth-split-left" style={{ background: 'linear-gradient(145deg, #094b3f 0%, #16a34a 50%, #0d3b6e 100%)' }}>
        <div className="auth-brand" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <img src="/logo.png" alt="Webgov Logo" style={{ height: 50, width: 50, objectFit: 'contain' }} />
          <div className="auth-brand-text" style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '1.6rem', marginBottom: 2, lineHeight: 1 }}>Webgov</h1>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0 }}>Tỉnh Đắk Lắk</p>
          </div>
        </div>
        <div className="auth-hero-content animate-up">
          <h2>Tạo tài khoản <br /><span>Công dân số</span></h2>
          <p>Đăng ký để tiếp cận đầy đủ các dịch vụ công, theo dõi chiến dịch tình nguyện Mùa Hè Xanh, và trải nghiệm AI Trợ lý thông minh.</p>
          <div className="auth-glass-card">
            <div className="auth-glass-icon" style={{ color: '#fff' }}><Shield size={28} /></div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Bảo mật AI Tuyệt đối</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Nhận diện CCCD & Thẻ cán bộ tự động</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-split-right">
        <div className="auth-form-container animate-up delay-1">
          <div className="auth-form-header" style={{ marginBottom: 20 }}>
            <h3>Đăng ký mới</h3>
            <p>Chọn đối tượng đăng ký của bạn</p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 24, background: 'var(--surface-2)', padding: 6, borderRadius: 'var(--r-md)' }}>
            <button type="button" onClick={() => { setTab('CITIZEN'); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: tab === 'CITIZEN' ? '#fff' : 'transparent', boxShadow: tab === 'CITIZEN' ? 'var(--sh-sm)' : 'none', fontWeight: 600, color: tab === 'CITIZEN' ? 'var(--primary)' : 'var(--tx-3)', cursor: 'pointer', transition: 'all .2s' }}>Người dân</button>
            <button type="button" onClick={() => { setTab('ADMIN'); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: tab === 'ADMIN' ? '#fff' : 'transparent', boxShadow: tab === 'ADMIN' ? 'var(--sh-sm)' : 'none', fontWeight: 600, color: tab === 'ADMIN' ? 'var(--primary)' : 'var(--tx-3)', cursor: 'pointer', transition: 'all .2s' }}>Cán bộ / Đoàn viên</button>
          </div>

          {error && <div className="auth-alert"><AlertCircle size={18} /> {error}</div>}
          {success && <div style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1.5px solid #86EFAC', padding: '16px', borderRadius: 'var(--r-md)', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', fontSize: '0.95rem', fontWeight: 500 }}><CheckCircle size={22} /> Đăng ký thành công! Đang chuyển hướng...</div>}

          {!success && (
            <form onSubmit={submit}>
              
              {tab === 'CITIZEN' && (
                <div style={{ padding: 16, background: 'rgba(59, 130, 246, 0.05)', border: '1.5px dashed var(--primary-mid)', borderRadius: 12, marginBottom: 20 }}>
                  <label className="premium-label" style={{ color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 6 }}><Camera size={16}/> Chụp mặt trước CCCD (eKYC)</label>
                  <input type="file" accept="image/*" onChange={handleFrontImage} style={{ marginBottom: 10, display: 'block', fontSize: 13 }} />
                  {frontImage && <img src={frontImage} alt="CCCD" style={{ height: 60, borderRadius: 6, marginBottom: 10, border: '1px solid var(--border)' }}/>}
                  <button type="button" onClick={scanCCCD} disabled={scanning || !frontImage} className="btn btn-primary btn-sm" style={{ width: '100%' }}>{scanning ? 'AI Đang quét...' : 'Bắt đầu quét CCCD'}</button>
                  {ekycData && (
                    <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--tx-2)' }}>
                      <div><strong>CCCD:</strong> {ekycData.cccd}</div>
                      <div><strong>Họ tên:</strong> {ekycData.fullName}</div>
                      <div><strong>DOB:</strong> {ekycData.dob}</div>
                      <div style={{ color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>✅ Đã xác thực</div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'ADMIN' && (
                <>
                  <div className="premium-input-group">
                    <label className="premium-label">Đơn vị công tác (Xã/Phường)</label>
                    <div className="premium-input-wrap">
                      <MapPin className="premium-input-icon" size={18} />
                      <select className="premium-input" required value={form.commune} onChange={e => setForm({...form, commune: e.target.value})}>
                        <option value="">-- Chọn Đơn vị --</option>
                        {DAKLAK_COMMUNES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="Khác">Khác (Cần duyệt thủ công)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(245, 158, 11, 0.05)', border: '1.5px dashed rgba(245, 158, 11, 0.4)', borderRadius: 12, marginBottom: 20 }}>
                    <label className="premium-label" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={16}/> Tải lên Thẻ ngành / QĐ Bổ nhiệm</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--tx-3)', margin: '4px 0 10px' }}>AI sẽ tự động đối chiếu thông tin trên thẻ với đơn vị bạn vừa chọn.</p>
                    <input type="file" accept="image/*" onChange={handleTheNganhImage} style={{ display: 'block', fontSize: 13 }} required />
                    {theNganhImage && <img src={theNganhImage} alt="Thẻ ngành" style={{ height: 60, borderRadius: 6, marginTop: 10, border: '1px solid var(--border)' }}/>}
                  </div>
                </>
              )}

              <div className="premium-input-group">
                <label className="premium-label">Họ và tên</label>
                <div className="premium-input-wrap">
                  <User className="premium-input-icon" size={18} />
                  <input type="text" className="premium-input" required placeholder="Nguyễn Văn A" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={tab === 'CITIZEN' && ekycData} />
                </div>
              </div>

              <div className="premium-input-group">
                <label className="premium-label">Địa chỉ Email</label>
                <div className="premium-input-wrap">
                  <Mail className="premium-input-icon" size={18} />
                  <input type="email" className="premium-input" required placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div className="premium-input-group">
                <label className="premium-label">Mật khẩu</label>
                <div className="premium-input-wrap">
                  <Lock className="premium-input-icon" size={18} />
                  <input type="password" className="premium-input" required placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>

              <div className="premium-input-group">
                <label className="premium-label">Xác nhận mật khẩu</label>
                <div className="premium-input-wrap">
                  <Lock className="premium-input-icon" size={18} />
                  <input type="password" className="premium-input" required placeholder="Nhập lại mật khẩu" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="premium-btn" disabled={loading || (tab === 'CITIZEN' && !ekycData)} style={{ marginTop: 24 }}>
                {loading ? 'Đang xử lý...' : (tab === 'ADMIN' ? 'AI Xét duyệt & Đăng ký' : 'Hoàn tất đăng ký')}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          <div className="auth-footer">
            Bạn đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
