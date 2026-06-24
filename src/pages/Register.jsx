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
    <div className="auth-page-v2">
      <div className="auth-bg-gradient" />
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-center-wrapper">
        <div className="auth-top-brand animate-up">
          <img src="/logo.png" alt="Logo" className="auth-top-logo" />
          <div>
            <h1 className="auth-top-name">Webgov</h1>
            <p className="auth-top-sub">Chính quyền số Đắk Lắk</p>
          </div>
        </div>

        <div className="auth-card auth-card-wide animate-up delay-1">
          <div className="auth-feature-row">
            <div className="auth-feature-pill">
              <Shield size={14} />
              <span>AI eKYC</span>
            </div>
            <div className="auth-feature-pill">
              <Sparkles size={14} />
              <span>Xác thực CCCD</span>
            </div>
            <div className="auth-feature-pill">
              <Globe size={14} />
              <span>Công dân số</span>
            </div>
          </div>

          <div className="auth-card-header">
            <h2>Đăng ký tài khoản</h2>
            <p>Chọn đối tượng đăng ký phù hợp với bạn</p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tab-switcher">
            <button
              type="button"
              className={`auth-tab ${tab === 'CITIZEN' ? 'active' : ''}`}
              onClick={() => { setTab('CITIZEN'); setError(''); }}
            >
              <User size={16} />
              Người dân
            </button>
            <button
              type="button"
              className={`auth-tab ${tab === 'ADMIN' ? 'active' : ''}`}
              onClick={() => { setTab('ADMIN'); setError(''); }}
            >
              <Shield size={16} />
              Cán bộ / Đoàn viên
            </button>
          </div>

          {error && <div className="auth-alert"><AlertCircle size={18} /> {error}</div>}
          {success && (
            <div className="auth-success">
              <CheckCircle size={22} /> Đăng ký thành công! Đang chuyển hướng...
            </div>
          )}

          {!success && (
            <form onSubmit={submit}>
              {/* CITIZEN: eKYC */}
              {tab === 'CITIZEN' && (
                <div className="auth-ekyc-box">
                  <div className="auth-ekyc-header">
                    <Camera size={18} />
                    <div>
                      <strong>Xác thực eKYC</strong>
                      <span>Chụp mặt trước CCCD để AI tự động nhận diện</span>
                    </div>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFrontImage} className="auth-file-input" />
                  {frontImage && <img src={frontImage} alt="CCCD" className="auth-preview-img" />}
                  <button type="button" onClick={scanCCCD} disabled={scanning || !frontImage} className="auth-scan-btn">
                    {scanning ? 'AI Đang quét...' : '🤖 Bắt đầu quét CCCD'}
                  </button>
                  {ekycData && (
                    <div className="auth-ekyc-result">
                      <div><strong>CCCD:</strong> {ekycData.cccd}</div>
                      <div><strong>Họ tên:</strong> {ekycData.fullName}</div>
                      <div><strong>Ngày sinh:</strong> {ekycData.dob}</div>
                      <div className="auth-ekyc-verified">✅ Đã xác thực thành công</div>
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN: Commune + The Nganh */}
              {tab === 'ADMIN' && (
                <>
                  <div className="auth-field">
                    <label>Đơn vị công tác (Xã/Phường)</label>
                    <div className="auth-input-wrap">
                      <MapPin className="auth-input-icon" size={18} />
                      <select required value={form.commune} onChange={e => setForm({...form, commune: e.target.value})}>
                        <option value="">-- Chọn Đơn vị --</option>
                        {DAKLAK_COMMUNES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="Khác">Khác (Cần duyệt thủ công)</option>
                      </select>
                    </div>
                  </div>
                  <div className="auth-ekyc-box auth-ekyc-box-warning">
                    <div className="auth-ekyc-header">
                      <Shield size={18} />
                      <div>
                        <strong>Tải lên Thẻ ngành / QĐ Bổ nhiệm</strong>
                        <span>AI sẽ tự động đối chiếu thông tin trên thẻ</span>
                      </div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleTheNganhImage} className="auth-file-input" required />
                    {theNganhImage && <img src={theNganhImage} alt="Thẻ ngành" className="auth-preview-img" />}
                  </div>
                </>
              )}

              {/* Common fields */}
              <div className="auth-fields-grid">
                <div className="auth-field">
                  <label>Họ và tên</label>
                  <div className="auth-input-wrap">
                    <User className="auth-input-icon" size={18} />
                    <input type="text" required placeholder="Nguyễn Văn A" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={tab === 'CITIZEN' && ekycData} />
                  </div>
                </div>

                <div className="auth-field">
                  <label>Địa chỉ Email</label>
                  <div className="auth-input-wrap">
                    <Mail className="auth-input-icon" size={18} />
                    <input type="email" required placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>

                <div className="auth-field">
                  <label>Số điện thoại</label>
                  <div className="auth-input-wrap">
                    <Phone className="auth-input-icon" size={18} />
                    <input type="tel" required placeholder="0912345678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="auth-field">
                <label>Mã xác thực OTP (Gửi về Email)</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="auth-input-wrap" style={{ flex: 1 }}>
                    <ShieldCheck className="auth-input-icon" size={18} />
                    <input type="text" required placeholder="Nhập mã 6 số" value={form.otp} onChange={e => setForm({ ...form, otp: e.target.value })} maxLength={6} style={{ letterSpacing: 2, fontWeight: 'bold' }} />
                  </div>
                  <button type="button" onClick={sendOtp} disabled={sendingOtp || otpTimer > 0} className="btn btn-outline" style={{ whiteSpace: 'nowrap', borderRadius: 10 }}>
                    {sendingOtp ? 'Đang gửi...' : otpTimer > 0 ? `Thử lại (${otpTimer}s)` : 'Gửi mã OTP'}
                  </button>
                </div>
              </div>

              <div className="auth-fields-grid">
                <div className="auth-field">
                  <label>Mật khẩu</label>
                  <div className="auth-input-wrap">
                    <Lock className="auth-input-icon" size={18} />
                    <input type="password" required placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  </div>
                </div>

                <div className="auth-field">
                  <label>Xác nhận mật khẩu</label>
                  <div className="auth-input-wrap">
                    <Lock className="auth-input-icon" size={18} />
                    <input type="password" required placeholder="Nhập lại mật khẩu" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                  </div>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading || (tab === 'CITIZEN' && !ekycData)}>
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <Fingerprint size={18} />
                    {tab === 'ADMIN' ? 'AI Xét duyệt & Đăng ký' : 'Hoàn tất đăng ký'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="auth-card-footer">
            Bạn đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </div>

        <p className="auth-bottom-text">
          © 2026 Webgov Đắk Lắk · Chính quyền số thông minh
        </p>
      </div>
    </div>
  );
};

export default Register;
