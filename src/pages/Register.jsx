import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { User, Shield, Camera, AlertCircle, CheckCircle, MapPin, Mail, Phone, Lock, ShieldCheck, UserPlus } from 'lucide-react';
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
    try {
      await api.post('/auth/send-otp', { email: form.email });
      setOtpSent(true);
      setOtpTimer(60);
      toast.success('Đã gửi mã xác thực đến Email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi OTP');
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
    try {
      const res = await api.post('/auth/ekyc-citizen', { frontImage });
      setEkycData(res.data);
      setForm({ ...form, username: res.data.fullName || '' });
      toast.success('Quét CCCD thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đọc ảnh CCCD');
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
    if (form.password !== form.confirm) return toast.error('Mật khẩu xác nhận không khớp.');
    if (form.password.length < 6) return toast.error('Mật khẩu phải chứa ít nhất 6 ký tự.');
    
    if (tab === 'CITIZEN' && !ekycData) return toast.error('Bạn phải hoàn thành eKYC trước khi đăng ký.');
    if (tab === 'ADMIN') {
      if (!form.commune) return toast.error('Bạn phải chọn đơn vị công tác.');
      if (!theNganhImage) return toast.error('Bạn phải upload Thẻ Cán Bộ.');
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
      toast.success('Đăng ký thành công! Chuyển hướng...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đăng ký, vui lòng thử lại.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-mxh-page">
      <div className="auth-mxh-card" style={{ maxWidth: 1000 }}>
        {/* LEFT */}
        <div className="auth-mxh-left">
          <div className="auth-mxh-pill">Cổng thông tin 2026</div>
          <h2>Tham gia bản đồ số chiến dịch</h2>
          <p>Tạo tài khoản để quản lý đội hình, cập nhật hoạt động, công trình và dữ liệu chiến dịch toàn quốc.</p>
          
          <div className="auth-mxh-stats">
            <div className="auth-mxh-stat-box">
              <h3>34+</h3>
              <span>Tỉnh thành</span>
            </div>
            <div className="auth-mxh-stat-box">
              <h3>Live</h3>
              <span>Cập nhật</span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="auth-mxh-right" style={{ width: 600 }}>
          <div className="auth-mxh-right-header" style={{ marginBottom: 20 }}>
            <UserPlus size={36} />
            <div>
              <h2>Đăng ký tài khoản</h2>
              <p>Điền thông tin bên dưới để bắt đầu sử dụng hệ thống</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 15, background: '#f1f5f9', padding: 5, borderRadius: 8 }}>
            <button type="button" onClick={() => setTab('CITIZEN')} style={{flex: 1, padding: 10, border: 'none', borderRadius: 6, fontWeight: 600, background: tab === 'CITIZEN' ? '#fff' : 'transparent', color: tab === 'CITIZEN' ? '#0f172a' : '#64748b', boxShadow: tab === 'CITIZEN' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5}}><User size={16}/> Công dân</button>
            <button type="button" onClick={() => setTab('ADMIN')} style={{flex: 1, padding: 10, border: 'none', borderRadius: 6, fontWeight: 600, background: tab === 'ADMIN' ? '#fff' : 'transparent', color: tab === 'ADMIN' ? '#0f172a' : '#64748b', boxShadow: tab === 'ADMIN' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5}}><Shield size={16}/> Cán bộ</button>
          </div>

          <form onSubmit={submit}>
            {tab === 'CITIZEN' && (
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 15, marginBottom: 15 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><Camera size={16} color="#3b82f6"/> Tải lên CCCD mặt trước (eKYC)</div>
                <input type="file" accept="image/*" onChange={handleFrontImage} style={{ fontSize: '0.85rem', marginBottom: 10, width: '100%' }} />
                {frontImage && <img src={frontImage} alt="CCCD" style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 6, marginBottom: 10 }} />}
                <button type="button" onClick={scanCCCD} disabled={scanning || !frontImage} style={{ width: '100%', padding: 10, background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                  {scanning ? 'Đang nhận diện...' : 'Bắt đầu nhận diện AI'}
                </button>
                {ekycData && <div style={{ marginTop: 10, fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}><CheckCircle size={14} style={{verticalAlign:'middle', marginRight:4}}/> Nhận diện thành công: {ekycData.fullName}</div>}
              </div>
            )}

            {tab === 'ADMIN' && (
              <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
                <div className="auth-mxh-input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Đơn vị</label>
                  <div className="auth-mxh-input">
                    <MapPin size={18} />
                    <select required value={form.commune} onChange={e => setForm({...form, commune: e.target.value})}>
                      <option value="">-- Chọn --</option>
                      {DAKLAK_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
                <div className="auth-mxh-input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Thẻ Ngành</label>
                  <input type="file" accept="image/*" onChange={handleTheNganhImage} required style={{ width: '100%', fontSize: '0.85rem' }} />
                </div>
              </div>
            )}

            <div className="auth-mxh-input-group">
              <label>Họ và tên</label>
              <div className="auth-mxh-input">
                <User size={18} />
                <input type="text" required placeholder="Nhập họ và tên" value={form.username} onChange={e => setForm({...form, username: e.target.value})} disabled={tab === 'CITIZEN' && ekycData} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 15 }}>
              <div className="auth-mxh-input-group" style={{ flex: 1 }}>
                <label>Email</label>
                <div className="auth-mxh-input">
                  <Mail size={18} />
                  <input type="email" required placeholder="email@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div className="auth-mxh-input-group" style={{ flex: 1 }}>
                <label>Số điện thoại</label>
                <div className="auth-mxh-input">
                  <Phone size={18} />
                  <input type="tel" required placeholder="Nhập số điện thoại" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="auth-mxh-input-group">
              <label>Mã OTP (Xác thực Email)</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="auth-mxh-input" style={{ flex: 1 }}>
                  <ShieldCheck size={18} />
                  <input type="text" required placeholder="Nhập 6 số" value={form.otp} onChange={e => setForm({...form, otp: e.target.value})} maxLength={6} style={{ letterSpacing: 2, fontWeight: 'bold' }} />
                </div>
                <button type="button" onClick={sendOtp} disabled={sendingOtp || otpTimer > 0} style={{ padding: '0 15px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>
                  {sendingOtp ? 'Đang gửi...' : otpTimer > 0 ? `Chờ (${otpTimer}s)` : 'Gửi mã'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 15 }}>
              <div className="auth-mxh-input-group" style={{ flex: 1 }}>
                <label>Mật khẩu</label>
                <div className="auth-mxh-input">
                  <Lock size={18} />
                  <input type="password" required placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </div>
              <div className="auth-mxh-input-group" style={{ flex: 1 }}>
                <label>Xác nhận mật khẩu</label>
                <div className="auth-mxh-input">
                  <Shield size={18} />
                  <input type="password" required placeholder="Nhập lại mật khẩu" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} />
                </div>
              </div>
            </div>

            <button type="submit" className="auth-mxh-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : <><UserPlus size={20} /> Tạo tài khoản</>}
            </button>
          </form>

          <div className="auth-mxh-footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
