import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, User, Mail, Lock, ArrowRight, Camera, Shield, MapPin, Fingerprint, Sparkles, Globe, Phone, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { DAKLAK_COMMUNES } from '../lib/communes';

const Register = () => {
  const [tab, setTab] = useState('CITIZEN');
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '', confirm: '', commune: '', otp: '' });
  
  const [frontImage, setFrontImage] = useState('');
  const [ekycData, setEkycData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [theNganhImage, setTheNganhImage] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    let interval;
    if (otpTimer > 0) interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const sendOtp = async () => {
    if (!form.email) return toast.error('Vui lòng nhập email trước!');
    setSendingOtp(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { email: form.email });
      setOtpSent(true);
      setOtpTimer(60);
      toast.success('Đã gửi mã xác thực đến Email!');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi gửi OTP');
    }
    setSendingOtp(false);
  };

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
        phone: form.phone,
        otp: form.otp,
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
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đăng ký, vui lòng thử lại.');
    }
    setLoading(false);
  };

  return (
    <div className="fb-auth-page">
      <div className="fb-auth-container" style={{ justifyContent: 'center' }}>
        <div className="fb-auth-card" style={{ maxWidth: 600, width: '100%', padding: '30px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>Đăng ký</h2>
            <p style={{ color: '#606770', margin: '5px 0 0' }}>Nhanh chóng và dễ dàng.</p>
          </div>
          <div className="fb-divider"></div>

          {/* Tab Switcher */}
          <div className="auth-tab-switcher" style={{ marginBottom: 20 }}>
            <button
              type="button"
              className={`auth-tab ${tab === 'CITIZEN' ? 'active' : ''}`}
              onClick={() => { setTab('CITIZEN'); setError(''); }}
              style={{ flex: 1 }}
            >
              <User size={16} /> Người dân
            </button>
            <button
              type="button"
              className={`auth-tab ${tab === 'ADMIN' ? 'active' : ''}`}
              onClick={() => { setTab('ADMIN'); setError(''); }}
              style={{ flex: 1 }}
            >
              <Shield size={16} /> Cán bộ / Đoàn viên
            </button>
          </div>

          {error && <div className="fb-alert"><AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: 5 }} /> {error}</div>}
          {success && (
            <div className="auth-success" style={{ background: '#e7f3ff', border: '1px solid #1877f2', color: '#1877f2', padding: 15, borderRadius: 6, marginBottom: 15 }}>
              <CheckCircle size={22} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Đăng ký thành công! Đang chuyển hướng...
            </div>
          )}

          {!success && (
            <form onSubmit={submit} style={{ textAlign: 'left' }}>
              {/* CITIZEN: eKYC */}
              {tab === 'CITIZEN' && (
                <div className="auth-ekyc-box" style={{ background: '#f5f6f7', border: '1px solid #ccd0d5', borderRadius: 8, padding: 15, marginBottom: 15 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Camera size={18} color="#1877f2" />
                    <div>
                      <strong style={{ display: 'block', color: '#1c1e21' }}>Xác thực eKYC</strong>
                      <span style={{ fontSize: '0.85rem', color: '#606770' }}>Chụp mặt trước CCCD để tự động điền thông tin</span>
                    </div>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFrontImage} style={{ marginBottom: 10, width: '100%' }} />
                  {frontImage && <img src={frontImage} alt="CCCD" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6, marginBottom: 10 }} />}
                  <button type="button" onClick={scanCCCD} disabled={scanning || !frontImage} className="fb-btn-success" style={{ width: '100%', padding: '8px 16px', fontSize: '1rem', background: '#1877f2' }}>
                    {scanning ? 'AI Đang quét...' : 'Bắt đầu quét CCCD'}
                  </button>
                  {ekycData && (
                    <div style={{ marginTop: 15, padding: 10, background: '#e7f3ff', borderRadius: 6, fontSize: '0.9rem' }}>
                      <div style={{ color: '#1877f2', fontWeight: 'bold', marginBottom: 5 }}>✅ Đã xác thực</div>
                      <div><strong>CCCD:</strong> {ekycData.cccd}</div>
                      <div><strong>Họ tên:</strong> {ekycData.fullName}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN: Commune + The Nganh */}
              {tab === 'ADMIN' && (
                <>
                  <select className="fb-input" required value={form.commune} onChange={e => setForm({...form, commune: e.target.value})}>
                    <option value="">-- Đơn vị công tác (Xã/Phường) --</option>
                    {DAKLAK_COMMUNES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Khác">Khác</option>
                  </select>
                  <div className="auth-ekyc-box" style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 15, marginBottom: 15 }}>
                    <strong style={{ display: 'block', color: '#991b1b', marginBottom: 5 }}>Tải lên Thẻ ngành / QĐ Bổ nhiệm</strong>
                    <input type="file" accept="image/*" onChange={handleTheNganhImage} required style={{ width: '100%' }} />
                    {theNganhImage && <img src={theNganhImage} alt="Thẻ ngành" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6, marginTop: 10 }} />}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <input type="text" className="fb-input" required placeholder="Họ và tên" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={tab === 'CITIZEN' && ekycData} style={{ flex: 1 }} />
                <input type="tel" className="fb-input" required placeholder="Số điện thoại" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ flex: 1 }} />
              </div>

              <input type="email" className="fb-input" required placeholder="Địa chỉ Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input type="text" className="fb-input" required placeholder="Mã OTP 6 số" value={form.otp} onChange={e => setForm({ ...form, otp: e.target.value })} maxLength={6} style={{ flex: 1, marginBottom: 0 }} />
                <button type="button" onClick={sendOtp} disabled={sendingOtp || otpTimer > 0} className="fb-btn-success" style={{ background: '#e4e6eb', color: '#1c1e21', whiteSpace: 'nowrap', padding: '0 20px', fontSize: '1rem' }}>
                  {sendingOtp ? 'Đang gửi...' : otpTimer > 0 ? `Thử lại (${otpTimer}s)` : 'Gửi mã OTP'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <input type="password" className="fb-input" required placeholder="Mật khẩu mới" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ flex: 1 }} />
                <input type="password" className="fb-input" required placeholder="Xác nhận mật khẩu" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} style={{ flex: 1 }} />
              </div>

              <p style={{ fontSize: '0.75rem', color: '#606770', margin: '10px 0 20px' }}>
                Bằng cách nhấp vào Đăng ký, bạn đồng ý với Điều khoản và Chính sách dữ liệu của chúng tôi.
              </p>

              <div style={{ textAlign: 'center' }}>
                <button type="submit" className="fb-btn-success" disabled={loading} style={{ width: '200px' }}>
                  {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>
              </div>
            </form>
          )}

          <div className="fb-divider" style={{ marginTop: 20 }}></div>
          <div style={{ textAlign: 'center' }}>
            <Link to="/login" className="fb-forgot" style={{ fontSize: '1.05rem' }}>Đã có tài khoản?</Link>
          </div>
        </div>

        <p style={{ marginTop: 30, color: '#606770', fontSize: '0.9rem' }}>
          © 2026 Webgov Đắk Lắk · Chính quyền số
        </p>
      </div>
    </div>
  );
};

export default Register;
