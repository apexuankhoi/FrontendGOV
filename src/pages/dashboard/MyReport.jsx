import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import {
  Send, CheckCircle, Loader2, ClipboardList,
  AlertCircle, Clock, Info, Globe
} from 'lucide-react';

const FIELDS = [
  { key: 'activeTeams',     label: 'Số đội hình ra quân',        placeholder: '0', icon: '🏃', hint: 'Tổng số đội hình hoạt động trong ngày' },
  { key: 'volunteers',      label: 'Số tình nguyện viên',         placeholder: '0', icon: '👥', hint: 'Tổng lượt đoàn viên/TNV tham gia' },
  { key: 'digitalSkills',   label: 'Hỗ trợ kỹ năng số',          placeholder: '0', icon: '💻', hint: 'Số người được hỗ trợ kỹ năng số' },
  { key: 'vneidSupport',    label: 'Hỗ trợ VNeID',               placeholder: '0', icon: '🪪', hint: 'Số người được hỗ trợ cài VNeID' },
  { key: 'publicServices',  label: 'Dịch vụ công trực tuyến',    placeholder: '0', icon: '🏛️', hint: 'Số hồ sơ DVC trực tuyến được hỗ trợ' },
  { key: 'qrSupport',       label: 'Hỗ trợ thanh toán QR',       placeholder: '0', icon: '📱', hint: 'Số tiểu thương/hộ dân được hỗ trợ QR' },
  { key: 'smartwebCount',   label: 'Đăng ký website SmartWeb',   placeholder: '0', icon: '🌐', hint: 'Số tiểu thương đăng ký website .VN SmartWeb' },
  { key: 'websitesCreated', label: 'Website đã được tạo/active', placeholder: '0', icon: '✅', hint: 'Số website đã kích hoạt và hoạt động' },
  { key: 'trainingClasses', label: 'Lớp tập huấn số',            placeholder: '0', icon: '📚', hint: 'Số lớp/buổi tập huấn kỹ năng số' },
  { key: 'digitalProducts', label: 'Sản phẩm số địa phương',     placeholder: '0', icon: '🛒', hint: 'Số sản phẩm địa phương đưa lên nền tảng số' },
  { key: 'youthTrained',    label: 'Thanh niên tập huấn AI',     placeholder: '0', icon: '🤖', hint: 'Số thanh niên được tập huấn AI' },
  { key: 'safetyCampaigns', label: 'Chiến dịch an toàn số',      placeholder: '0', icon: '🛡️', hint: 'Số buổi tuyên truyền phòng chống lừa đảo' },
  { key: 'mediaPosts',      label: 'Bài đăng truyền thông',      placeholder: '0', icon: '📣', hint: 'Số bài đăng MXH về chiến dịch' },
];

const emptyForm = () => Object.fromEntries(FIELDS.map(f => [f.key, '']));

const MyReport = () => {
  const [form, setForm] = useState(emptyForm());
  const [extra, setExtra] = useState({ issues: '', proposals: '', evidenceLinks: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [existingReport, setExistingReport] = useState(null);

  const agencyName = (() => {
    try { return JSON.parse(localStorage.getItem('agency'))?.name || 'Đơn vị của bạn'; }
    catch { return 'Đơn vị của bạn'; }
  })();

  const today = new Date();
  const todayStr = today.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = today.getHours();
  const isReportTime = hour >= 18 && hour < 20;

  useEffect(() => {
    const fetchExisting = async () => {
      setFetching(true);
      try {
        const res = await api.get('/campaign/report');
        if (res.data) {
          setExistingReport(res.data);
          // Pre-fill form với data hiện tại
          const filled = {};
          FIELDS.forEach(f => { filled[f.key] = String(res.data[f.key] || 0); });
          setForm(filled);
          setExtra({
            issues: res.data.issues || '',
            proposals: res.data.proposals || '',
            evidenceLinks: res.data.evidenceLinks || ''
          });
        }
      } catch { /* No report yet */ }
      setFetching(false);
    };
    fetchExisting();
  }, []);

  const handleChange = (key, val) => {
    if (!/^\d*$/.test(val)) return;
    setForm(f => ({ ...f, [key]: val }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {};
      FIELDS.forEach(f => { body[f.key] = Number(form[f.key]) || 0; });
      Object.assign(body, extra);
      await api.post('/campaign/report', body);
      toast.success('✅ Gửi báo cáo thành công! Cảm ơn bạn đã báo cáo đúng hạn.');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Loader2 size={32} className="spin" />
        <p style={{ marginTop: 12, color: 'var(--tx-3)' }}>Đang kiểm tra báo cáo...</p>
      </div>
    );
  }

  return (
    <div className="animate-up">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={24} color="var(--primary)" />
            Báo cáo chiến dịch hằng ngày
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.9rem' }}>
            {agencyName} — {todayStr}
          </p>
        </div>
      </div>

      {/* Thông báo giờ nộp */}
      <div style={{
        background: isReportTime ? '#D1FAE5' : '#FEF3C7',
        border: `1px solid ${isReportTime ? '#10B981' : '#F59E0B'}`,
        borderRadius: 12, padding: '12px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        {isReportTime
          ? <CheckCircle size={20} color="#10B981" />
          : <Clock size={20} color="#F59E0B" />
        }
        <div>
          <div style={{ fontWeight: 700, color: isReportTime ? '#059669' : '#D97706', fontSize: '.9rem' }}>
            {isReportTime ? '✅ Hệ thống đang mở cổng báo cáo (18:00 – 20:00)' : '⏰ Cổng báo cáo mở từ 18:00 đến 20:00 hằng ngày'}
          </div>
          <div style={{ fontSize: '.82rem', color: 'var(--tx-3)', marginTop: 2 }}>
            Hệ thống cho phép nộp báo cáo một lần mỗi ngày. {existingReport ? 'Bạn đã nộp báo cáo hôm nay.' : 'Bạn chưa nộp báo cáo hôm nay.'}
          </div>
        </div>
      </div>

      {(submitted || existingReport) ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={36} color="#10B981" />
          </div>
          <h3 style={{ color: '#059669', marginBottom: 8 }}>Đã nộp báo cáo hôm nay!</h3>
          <p style={{ color: 'var(--tx-3)', marginBottom: 24 }}>
            Báo cáo của {agencyName} đã được ghi nhận. Cổng báo cáo tiếp theo mở vào 18:00 ngày mai.
          </p>
          {existingReport && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, maxWidth: 700, margin: '0 auto', textAlign: 'left' }}>
              {FIELDS.slice(0, 8).map(f => (
                <div key={f.key} style={{ background: 'var(--surface-1)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: '1.1rem' }}>{f.icon}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{existingReport[f.key] || 0}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--tx-3)' }}>{f.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Phụ lục 2 — Số liệu chỉ tiêu */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
              <Info size={18} /> Phụ lục 2 — Số liệu chỉ tiêu
            </h4>
            <p style={{ color: 'var(--tx-3)', fontSize: '.85rem', marginBottom: 20 }}>
              Điền số liệu lũy kế từ đầu chiến dịch đến <strong>hôm nay</strong> (không phải chỉ trong ngày).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{f.icon}</span> {f.label}
                    {(f.key === 'smartwebCount' || f.key === 'websitesCreated') && (
                      <span style={{ background: '#1a3a6b', color: 'white', fontSize: '.65rem', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>MỚI</span>
                    )}
                  </label>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    value={form[f.key]}
                    onChange={e => handleChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="form-input"
                    title={f.hint}
                  />
                  <div style={{ fontSize: '.73rem', color: 'var(--tx-3)', marginTop: 3 }}>{f.hint}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Khó khăn & Đề xuất */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>📝 Khó khăn & Đề xuất</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Khó khăn vướng mắc</label>
                <textarea value={extra.issues} onChange={e => setExtra(x => ({ ...x, issues: e.target.value }))}
                  className="form-input" rows={3} placeholder="Mô tả các khó khăn trong ngày..." />
              </div>
              <div>
                <label className="form-label">Đề xuất, kiến nghị</label>
                <textarea value={extra.proposals} onChange={e => setExtra(x => ({ ...x, proposals: e.target.value }))}
                  className="form-input" rows={3} placeholder="Đề xuất hỗ trợ, giải pháp..." />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="form-label">Link minh chứng (ảnh, video, bài đăng MXH...)</label>
              <input value={extra.evidenceLinks} onChange={e => setExtra(x => ({ ...x, evidenceLinks: e.target.value }))}
                className="form-input" placeholder="https://drive.google.com/... hoặc https://fb.com/..." />
            </div>
          </div>

          <button type="submit" disabled={loading || !isReportTime} style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: (!isReportTime) ? 'var(--border)' : loading ? 'var(--tx-3)' : 'linear-gradient(135deg, #1a3a6b, #0ea5e9)',
            color: 'white', fontWeight: 700, fontSize: '1.05rem',
            cursor: (!isReportTime || loading) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}>
            {loading ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
            {loading ? 'Đang gửi báo cáo...'
              : !isReportTime ? '⏰ Chưa đến giờ báo cáo (18:00 – 20:00)'
              : '📤 Nộp báo cáo chiến dịch hôm nay'}
          </button>
        </form>
      )}
    </div>
  );
};

export default MyReport;
