import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { User, Shield, Camera, AlertCircle, CheckCircle, MapPin, Mail, Phone, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
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
    <div className="gov-split-page">
      {/* LEFT SCENE (hidden on mobile) */}
      <div className="gov-split-left" style={{ flex: 1.2 }}>
        <div className="gov-split-left-content">
          <img src="/logo.png" alt="Logo" className="gov-split-logo" />
          <h1 className="gov-split-title">Đăng ký Định danh Điện tử</h1>
          <p className="gov-split-desc">
            Xác thực danh tính bằng AI (eKYC) giúp việc đăng ký tài khoản
            trở nên nhanh chóng, an toàn và hoàn toàn tự động.
          </p>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="gov-split-right" style={{ width: '600px' }}>
        <h2 className="gov-form-title">Tạo tài khoản</h2>
        <p className="gov-form-subtitle">Điền thông tin hoặc quét thẻ CCCD</p>

        {/* Tabs */}
        <div className="auth-tab-switcher" style={{ marginBottom: '24px', background: '#f1f5f9', padding: '6px', borderRadius: '12px', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => { setTab('CITIZEN'); setError(''); }}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: tab === 'CITIZEN' ? '#fff' : 'transparent', color: tab === 'CITIZEN' ? '#0f172a' : '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: tab === 'CITIZEN' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <User size={18} /> Công dân
          </button>
          <button
            type="button"
            onClick={() => { setTab('ADMIN'); setError(''); }}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: tab === 'ADMIN' ? '#fff' : 'transparent', color: tab === 'ADMIN' ? '#0f172a' : '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: tab === 'ADMIN' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Shield size={18} /> Cán bộ
          </button>
        </div>

        {error && (
          <div className="gov-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
            <CheckCircle size={40} style={{ margin: '0 auto 15px' }} />
            <h3 style={{ margin: '0 0 10px 0' }}>Đăng ký thành công!</h3>
            <p style={{ margin: 0 }}>Hệ thống đang tự động chuyển hướng về trang Đăng nhập...</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            {tab === 'CITIZEN' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Camera size={20} /></div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#0f172a' }}>Xác thực eKYC</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Tải lên mặt trước CCCD để nhận diện AI</p>
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handleFrontImage} style={{ marginBottom: '12px', width: '100%', fontSize: '0.9rem' }} />
                {frontImage && <img src={frontImage} alt="CCCD" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e2e8f0' }} />}
                <button type="button" onClick={scanCCCD} disabled={scanning || !frontImage} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: (scanning || !frontImage) ? 'not-allowed' : 'pointer', opacity: (scanning || !frontImage) ? 0.7 : 1 }}>
                  {scanning ? 'AI Đang quét...' : 'Bắt đầu quét dữ liệu'}
                </button>
                {ekycData && (
                  <div style={{ marginTop: '16px', padding: '16px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <div style={{ color: '#059669', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} /> Đã xác thực CCCD</div>
                    <div style={{ fontSize: '0.9rem', color: '#0f172a' }}><strong>Họ tên:</strong> {ekycData.fullName}</div>
                    <div style={{ fontSize: '0.9rem', color: '#0f172a' }}><strong>CCCD:</strong> {ekycData.cccd}</div>
                  </div>
                )}
              </div>
            )}

            {tab === 'ADMIN' && (
              <>
                <div className="gov-input-group">
                  <label>Đơn vị công tác</label>
                  <div className="gov-input-wrap">
                    <MapPin size={18} />
                    <select required value={form.commune} onChange={e => setForm({...form, commune: e.target.value})}>
                      <option value="">-- Chọn Đơn vị --</option>
                      {DAKLAK_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
                <div style={{ background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', color: '#be123c', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={20} /> Tải Thẻ Ngành / Quyết định</h4>
                  <input type="file" accept="image/*" onChange={handleTheNganhImage} required style={{ width: '100%' }} />
                  {theNganhImage && <img src={theNganhImage} alt="Thẻ ngành" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px', marginTop: '12px', border: '1px solid #fecdd3' }} />}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="gov-input-group" style={{ flex: 1 }}>
                <label>Họ và tên</label>
                <div className="gov-input-wrap">
                  <User size={18} />
                  <input type="text" required placeholder="Họ tên" value={form.username} onChange={e => setForm({...form, username: e.target.value})} disabled={tab === 'CITIZEN' && ekycData} />
                </div>
              </div>
              <div className="gov-input-group" style={{ flex: 1 }}>
                <label>Số điện thoại</label>
                <div className="gov-input-wrap">
                  <Phone size={18} />
                  <input type="tel" required placeholder="SĐT" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="gov-input-group">
              <label>Email liên hệ</label>
              <div className="gov-input-wrap">
                <Mail size={18} />
                <input type="email" required placeholder="name@domain.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>

            <div className="gov-input-group">
              <label>Xác thực Email (Mã OTP)</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="gov-input-wrap" style={{ flex: 1 }}>
                  <ShieldCheck size={18} />
                  <input type="text" required placeholder="Nhập mã 6 số" value={form.otp} onChange={e => setForm({...form, otp: e.target.value})} maxLength={6} style={{ letterSpacing: '4px', fontWeight: 'bold' }} />
                </div>
                <button type="button" onClick={sendOtp} disabled={sendingOtp || otpTimer > 0} style={{ padding: '0 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#0f172a', fontWeight: 600, cursor: (sendingOtp || otpTimer > 0) ? 'not-allowed' : 'pointer' }}>
                  {sendingOtp ? 'Đang gửi...' : otpTimer > 0 ? `Thử lại (${otpTimer}s)` : 'Gửi mã OTP'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="gov-input-group" style={{ flex: 1 }}>
                <label>Mật khẩu</label>
                <div className="gov-input-wrap">
                  <Lock size={18} />
                  <input type="password" required placeholder="Tạo mật khẩu" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </div>
              <div className="gov-input-group" style={{ flex: 1 }}>
                <label>Xác nhận lại</label>
                <div className="gov-input-wrap">
                  <Lock size={18} />
                  <input type="password" required placeholder="Nhập lại" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} />
                </div>
              </div>
            </div>

            <button type="submit" className="gov-btn-primary" disabled={loading} style={{ marginTop: '20px' }}>
              {loading ? 'Đang xử lý...' : <><ShieldCheck size={20} /> Đăng ký tài khoản</>}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.95rem' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" className="gov-link">Đăng nhập tại đây</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
