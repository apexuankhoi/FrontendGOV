import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import {
  Send, CheckCircle, Loader2, ClipboardList,
  AlertCircle, Clock, Info, Globe, Smartphone, Landmark,
  ShieldCheck, ShoppingCart, Award, Sparkles, ExternalLink, HelpCircle
} from 'lucide-react';

// 11 CHỈ TIÊU CHÍNH THỨC CỦA CHIẾN DỊCH (THEO VĂN BẢN HƯỚNG DẪN)
const CORE_CRITERIA = [
  {
    index: 1,
    key: 'digitalSkills',
    label: '1. Tiếp cận kỹ năng số cộng đồng',
    shortLabel: 'Tiếp cận KN số',
    targetHint: 'Toàn tỉnh: 100.000 lượt (trực tiếp ≥ 50.000)',
    placeholder: '0',
    unit: 'lượt người',
    icon: '💻',
    color: '#0284C7',
    bg: '#E0F2FE',
    desc: 'Hỗ trợ, tuyên truyền cho người dân tiếp cận kỹ năng số, smartphone, DV số'
  },
  {
    index: 2,
    key: 'vneidSupport',
    label: '2. Kích hoạt VNeID mức 2 & tiện ích',
    shortLabel: 'VNeID mức 2',
    targetHint: 'Toàn tỉnh: 50.000 lượt',
    placeholder: '0',
    unit: 'lượt người',
    icon: '🪪',
    color: '#16A34A',
    bg: '#DCFCE7',
    desc: 'Đăng ký, kích hoạt, sử dụng tài khoản định danh VNeID mức 2 và tiện ích số'
  },
  {
    index: 3,
    key: 'publicServices',
    label: '3. Hỗ trợ Dịch vụ công trực tuyến',
    shortLabel: 'DVC trực tuyến',
    targetHint: 'Toàn tỉnh: 30.000 lượt',
    placeholder: '0',
    unit: 'lượt / hồ sơ',
    icon: '🏛️',
    color: '#7C3AED',
    bg: '#EDE9FE',
    desc: 'Hỗ trợ người dân tạo tài khoản, nộp và tra cứu hồ sơ thủ tục hành chính trực tuyến'
  },
  {
    index: 4,
    key: 'qrSupport',
    label: '4. Hộ KD / tiểu thương dùng QR',
    shortLabel: 'Thanh toán QR',
    targetHint: 'Toàn tỉnh: 10.000 hộ',
    placeholder: '0',
    unit: 'hộ kinh doanh',
    icon: '📱',
    color: '#D97706',
    bg: '#FEF3C7',
    desc: 'Tạo mã QR thanh toán không tiền mặt, công cụ bán hàng số cho tiểu thương'
  },
  {
    index: 5,
    key: 'activeTeams',
    label: '5. Đội hình "Thanh niên số"',
    shortLabel: 'Đội hình TN số',
    targetHint: 'Toàn tỉnh: 102 đội hình (100% xã ≥ 1)',
    placeholder: '0',
    unit: 'đội hình',
    icon: '🏃',
    color: '#2563EB',
    bg: '#DBEAFE',
    desc: 'Thành lập và duy trì đội hình Thanh niên số ra quân hoạt động tại xã/phường'
  },
  {
    index: 6,
    key: 'trainingClasses',
    label: '6. Lớp / Điểm tập huấn kỹ năng số',
    shortLabel: 'Lớp/Điểm HD',
    targetHint: 'Toàn tỉnh: 500 lớp/điểm',
    placeholder: '0',
    unit: 'lớp / điểm',
    icon: '📚',
    color: '#0D9488',
    bg: '#CCFBF1',
    desc: 'Tổ chức các lớp tập huấn, điểm cố định/lưu động hướng dẫn kỹ năng số cộng đồng'
  },
  {
    index: 7,
    key: 'digitalModels',
    label: '7. Mô hình điểm Chuyển đổi số',
    shortLabel: 'Mô hình điểm CĐS',
    targetHint: 'Toàn tỉnh: 102 mô hình (chợ số, tuyến phố KDTM...)',
    placeholder: '0',
    unit: 'mô hình',
    icon: '🏪',
    color: '#E11D48',
    bg: '#FFE4E6',
    desc: 'Chợ số, tuyến phố không tiền mặt, thôn/buôn số, KDC an toàn số, điểm DVC'
  },
  {
    index: 8,
    key: 'digitalProducts',
    label: '8. Số hóa sản phẩm OCOP / địa phương',
    shortLabel: 'Sản phẩm số hóa',
    targetHint: 'Toàn tỉnh: 1.000 sản phẩm',
    placeholder: '0',
    unit: 'sản phẩm',
    icon: '🛒',
    color: '#EA580C',
    bg: '#FFEDD5',
    desc: 'Quảng bá, đưa lên sàn TMĐT, MXH các sản phẩm OCOP, nông sản địa phương'
  },
  {
    index: 9,
    key: 'youthTrained',
    label: '9. Đoàn viên tập huấn AI & an toàn số',
    shortLabel: 'ĐVTN học AI',
    targetHint: 'Toàn tỉnh: 20.000 đoàn viên',
    placeholder: '0',
    unit: 'đoàn viên',
    icon: '🤖',
    color: '#4F46E5',
    bg: '#EEF2FF',
    desc: 'Tập huấn trí tuệ nhân tạo (AI), kỹ năng số và an toàn thông tin cho ĐVTN'
  },
  {
    index: 10,
    key: 'youthProjects',
    label: '10. Công trình thanh niên CĐS',
    shortLabel: 'Công trình CĐS',
    targetHint: 'Toàn tỉnh: 102 công trình (100% cơ sở Đoàn ≥ 1)',
    placeholder: '0',
    unit: 'công trình',
    icon: '⚡',
    color: '#9333EA',
    bg: '#FAF5FF',
    desc: '100% Đoàn cấp xã/phường hoàn thành ít nhất 01 công trình thanh niên chuyển đổi số'
  },
  {
    index: 11,
    key: 'smartwebCount',
    label: '11. Xây dựng website AI.VN SmartWeb',
    shortLabel: 'Web SmartWeb',
    targetHint: 'Toàn tỉnh: 102 website (AI.VN SmartWeb / CĐS)',
    placeholder: '0',
    unit: 'website',
    icon: '🌐',
    color: '#1E40AF',
    bg: '#EFF6FF',
    desc: 'Tạo website thông qua nền tảng AI.VN SmartWeb cho HKD, HTX, thanh niên khởi nghiệp'
  }
];

// CHỈ TIÊU PHỤ TRỢ BỔ SUNG
const AUX_FIELDS = [
  { key: 'volunteers', label: 'Tình nguyện viên tham gia', placeholder: '0', unit: 'lượt người', icon: '👥', hint: 'Lượt đoàn viên, thanh niên ra quân' },
  { key: 'safetyCampaigns', label: 'Chiến dịch an toàn số', placeholder: '0', unit: 'buổi', icon: '🛡️', hint: 'Tuyên truyền phòng chống lừa đảo trực tuyến' },
  { key: 'mediaPosts', label: 'Bài đăng truyền thông', placeholder: '0', unit: 'tin bài', icon: '📣', hint: 'Tin bài, video clip trên mạng xã hội' },
];

const ALL_FIELDS = [...CORE_CRITERIA, ...AUX_FIELDS];
const emptyForm = () => Object.fromEntries(ALL_FIELDS.map(f => [f.key, '']));

const MyReport = () => {
  const [form, setForm] = useState(emptyForm());
  const [extra, setExtra] = useState({ issues: '', proposals: '', evidenceLinks: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const agencyName = (() => {
    try { return JSON.parse(localStorage.getItem('agency'))?.name || 'Đơn vị của bạn'; }
    catch { return 'Đơn vị của bạn'; }
  })();

  const today = new Date();
  const todayStr = today.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentMinutes = today.getHours() * 60 + today.getMinutes();
  const isReportTime = currentMinutes >= 13 * 60 && currentMinutes <= 18 * 60 + 30; // 13:00 – 18:30 hằng ngày

  useEffect(() => {
    const fetchExisting = async () => {
      setFetching(true);
      try {
        const res = await api.get('/campaign/report');
        if (res.data) {
          setExistingReport(res.data);
          const filled = {};
          ALL_FIELDS.forEach(f => { filled[f.key] = String(res.data[f.key] || 0); });
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
      ALL_FIELDS.forEach(f => { body[f.key] = Number(form[f.key]) || 0; });
      Object.assign(body, extra);
      await api.post('/campaign/report', body);
      toast.success('✅ Lưu & Cập nhật báo cáo 11 chỉ tiêu thành công! Số liệu đã được đồng bộ lên Tỉnh.');
      setSubmitted(true);
      setExistingReport(body);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Loader2 size={36} className="spin" style={{ color: 'var(--primary)' }} />
        <p style={{ marginTop: 14, color: 'var(--tx-3)', fontWeight: 500 }}>Đang kiểm tra dữ liệu báo cáo...</p>
      </div>
    );
  }

  return (
    <div className="animate-up" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <ClipboardList size={26} color="var(--primary)" />
            Báo cáo 11 Chỉ tiêu Chiến dịch CĐS
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.92rem', marginTop: 4 }}>
            {agencyName} — {todayStr}
          </p>
        </div>
      </div>

      {/* Thông báo giờ nộp & hướng dẫn */}
      <div style={{
        background: isReportTime ? '#D1FAE5' : '#FEF3C7',
        border: `1px solid ${isReportTime ? '#10B981' : '#F59E0B'}`,
        borderRadius: 14, padding: '14px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'
      }}>
        {isReportTime
          ? <CheckCircle size={24} color="#10B981" style={{ flexShrink: 0 }} />
          : <Clock size={24} color="#F59E0B" style={{ flexShrink: 0 }} />
        }
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontWeight: 700, color: isReportTime ? '#059669' : '#D97706', fontSize: '.95rem' }}>
            {isReportTime ? '✅ Cổng tiếp nhận & chỉnh sửa đang MỞ (13:00 – 18:30 hằng ngày)' : '⏰ Cổng báo cáo mở từ 13:00 đến 18:30 hằng ngày (Hạn chót: 18:30)'}
          </div>
          <div style={{ fontSize: '.84rem', color: 'var(--tx-2)', marginTop: 3, lineHeight: 1.4 }}>
            Nhập số liệu lũy kế 11 tiêu chí trực tiếp lên app. {existingReport ? 'Đơn vị có thể chỉnh sửa lại số liệu đến 18:30.' : 'Vui lòng hoàn thành trước 18h30.'}
          </div>
        </div>
      </div>

      {(submitted || existingReport) && !isEditing ? (
        <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={36} color="#10B981" />
          </div>
          <h3 style={{ color: '#059669', marginBottom: 8, fontSize: '1.3rem' }}>Đã hoàn thành nộp báo cáo 11 chỉ tiêu hôm nay!</h3>
          <p style={{ color: 'var(--tx-3)', marginBottom: 20, fontSize: '.92rem' }}>
            Báo cáo của <strong>{agencyName}</strong> đã được ghi nhận và đồng bộ lên trung tâm chỉ huy số cấp Tỉnh.
          </p>

          {/* Nút cho phép chỉnh sửa nếu đang trong khung giờ 13:00 - 18:30 */}
          {isReportTime ? (
            <div style={{ marginBottom: 24 }}>
              <button 
                type="button" 
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontWeight: 700, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                ✏️ Chỉnh sửa / Bổ sung số liệu (Hạn chót 18:30)
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: 20, fontSize: '.84rem', color: '#92400E', background: '#FEF3C7', padding: '8px 16px', borderRadius: 8, display: 'inline-block' }}>
              ⏰ Đã hết khung giờ chỉnh sửa hôm nay (Hạn chót là 18:30). Cổng báo cáo sẽ mở lại lúc 13:00 ngày mai.
            </div>
          )}

          {existingReport && (
            <div>
              <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 14, textAlign: 'left' }}>
                📊 KẾT QUẢ 11 CHỈ TIÊU ĐÃ NỘP:
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12,
                textAlign: 'left'
              }}>
                {CORE_CRITERIA.map(c => (
                  <div key={c.key} style={{
                    background: c.bg,
                    borderRadius: 12,
                    padding: '12px 16px',
                    border: `1px solid ${c.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.3rem' }}>{c.icon}</span>
                      <div>
                        <div style={{ fontSize: '.78rem', color: 'var(--tx-2)', fontWeight: 600 }}>{c.label}</div>
                        <div style={{ fontSize: '.7rem', color: 'var(--tx-3)' }}>{c.unit}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.color }}>
                      {(existingReport[c.key] || 0).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Phụ trợ */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                marginTop: 14,
                textAlign: 'left'
              }}>
                {AUX_FIELDS.map(f => (
                  <div key={f.key} style={{ background: 'var(--surface-1)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '.75rem', color: 'var(--tx-3)' }}>{f.icon} {f.label}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                      {(existingReport[f.key] || 0).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>

              {(existingReport.issues || existingReport.proposals || existingReport.evidenceLinks) && (
                <div style={{ marginTop: 20, textAlign: 'left', background: 'var(--surface-0)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                  {existingReport.issues && <div style={{ fontSize: '.85rem', marginBottom: 6 }}>🔴 <strong>Khó khăn:</strong> {existingReport.issues}</div>}
                  {existingReport.proposals && <div style={{ fontSize: '.85rem', marginBottom: 6 }}>💡 <strong>Đề xuất:</strong> {existingReport.proposals}</div>}
                  {existingReport.evidenceLinks && (
                    <div style={{ fontSize: '.85rem' }}>
                      🔗 <strong>Minh chứng:</strong> <a href={existingReport.evidenceLinks} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{existingReport.evidenceLinks}</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* BANNER KHI ĐANG CHỈNH SỬA */}
          {existingReport && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 18px', borderRadius: 12, marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: '.88rem', color: '#1E40AF', fontWeight: 600 }}>
                ✏️ Bạn đang ở chế độ <strong>Chỉnh sửa số liệu báo cáo đã nộp hôm nay</strong> (Cập nhật hợp lệ trước 18:30)
              </div>
              <button type="button" onClick={() => setIsEditing(false)} className="btn btn-ghost btn-sm" style={{ color: '#64748B', fontWeight: 600 }}>
                Hủy chỉnh sửa
              </button>
            </div>
          )}

          {/* KHUNG NHẬP 11 CHỈ TIÊU CHÍNH THỨC */}
          <div className="card" style={{ marginBottom: 20, borderTop: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color="var(--primary)" /> 11 CHỈ TIÊU CHIẾN DỊCH CHUYỂN ĐỔI SỐ
                </h3>
                <p style={{ color: 'var(--tx-3)', fontSize: '.86rem', marginTop: 4 }}>
                  Nhập số liệu <strong>lũy kế</strong> từ ngày đầu ra quân đến hôm nay. Điền số <strong>0</strong> nếu chưa triển khai.
                </p>
              </div>
              <span style={{
                background: 'var(--primary)', color: 'white', fontSize: '.75rem',
                padding: '4px 12px', borderRadius: 20, fontWeight: 700
              }}>
                11 TIÊU CHÍ CHÍNH THỨC
              </span>
            </div>

            {/* LƯỚI 11 CHỈ TIÊU - RESPONSIVE CHO PC & MOBILE */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16
            }}>
              {CORE_CRITERIA.map((c) => {
                return (
                  <div 
                    key={c.key} 
                    style={{
                      background: 'var(--surface-0)',
                      border: `1.5px solid ${form[c.key] && Number(form[c.key]) > 0 ? c.color : 'var(--border)'}`,
                      borderRadius: 14,
                      padding: 16,
                      transition: 'all .2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Tiêu đề chỉ tiêu */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 32, height: 32, borderRadius: 8, background: c.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0
                          }}>
                            {c.icon}
                          </span>
                          <div>
                            <span style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--tx-1)' }}>
                              {c.label}
                            </span>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: c.bg, color: c.color, flexShrink: 0
                        }}>
                          #{c.index}
                        </span>
                      </div>

                      {/* Mô tả giải thích */}
                      <p style={{ fontSize: '.78rem', color: 'var(--tx-3)', margin: '0 0 12px', lineHeight: 1.4 }}>
                        {c.desc}
                      </p>
                    </div>

                    {/* Ô nhập liệu và đơn vị */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={form[c.key]}
                          onChange={e => handleChange(c.key, e.target.value)}
                          placeholder="0"
                          className="form-input"
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            color: c.color,
                            padding: '10px 14px',
                            borderRadius: 10
                          }}
                        />
                        <span style={{ fontSize: '.8rem', color: 'var(--tx-2)', fontWeight: 600, minWidth: 70, textAlign: 'right' }}>
                          {c.unit}
                        </span>
                      </div>

                      <div style={{ fontSize: '.7rem', color: 'var(--tx-3)', marginTop: 6, fontStyle: 'italic' }}>
                        🎯 {c.targetHint}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SỐ LIỆU BỔ TRỢ */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 14, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
              <Award size={18} color="var(--amber-600)" /> Số liệu Bổ trợ & Hoạt động thực tế
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 14
            }}>
              {AUX_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.86rem', fontWeight: 600 }}>
                    <span>{f.icon}</span> {f.label}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={form[f.key]}
                      onChange={e => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="form-input"
                      style={{ fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '.78rem', color: 'var(--tx-3)', minWidth: 60 }}>{f.unit}</span>
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--tx-3)', marginTop: 3 }}>{f.hint}</div>
                </div>
              ))}
            </div>
          </div>

          {/* KHÓ KHĂN, ĐỀ XUẤT & MINH CHỨNG */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 14, color: 'var(--primary-dark)', fontSize: '1.05rem' }}>
              📝 Minh chứng, Khó khăn & Đề xuất
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div>
                <label className="form-label">Khó khăn, vướng mắc trong ngày</label>
                <textarea
                  value={extra.issues}
                  onChange={e => setExtra(x => ({ ...x, issues: e.target.value }))}
                  className="form-input"
                  rows={3}
                  placeholder="Mô tả khó khăn về địa bàn, người dân, hạ tầng mạng, thiết bị..."
                />
              </div>
              <div>
                <label className="form-label">Đề xuất, kiến nghị gửi Tỉnh Đoàn</label>
                <textarea
                  value={extra.proposals}
                  onChange={e => setExtra(x => ({ ...x, proposals: e.target.value }))}
                  className="form-input"
                  rows={3}
                  placeholder="Đề xuất hỗ trợ tài liệu, tập huấn, nhân lực hỗ trợ..."
                />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="form-label">Link thư mục minh chứng (Google Drive / Bài viết Facebook / Báo đài)</label>
              <input
                value={extra.evidenceLinks}
                onChange={e => setExtra(x => ({ ...x, evidenceLinks: e.target.value }))}
                className="form-input"
                placeholder="https://drive.google.com/drive/folders/... hoặc https://facebook.com/..."
              />
              <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 4 }}>
                Đính kèm link Google Drive chứa hình ảnh, video ra quân thực tế của xã/phường để Tỉnh nghiệm thu.
              </div>
            </div>
          </div>

          {/* NÚT NỘP / CẬP NHẬT BÁO CÁO */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {existingReport && isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-outline"
                style={{ padding: '16px 28px', borderRadius: 14, fontWeight: 700 }}
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !isReportTime}
              style={{
                flex: 1,
                minWidth: 260,
                padding: '16px 24px',
                borderRadius: 14,
                border: 'none',
                background: (!isReportTime) ? 'var(--border)' : loading ? 'var(--tx-3)' : 'linear-gradient(135deg, #1a3a6b 0%, #0ea5e9 100%)',
                color: 'white',
                fontWeight: 800,
                fontSize: '1.08rem',
                cursor: (!isReportTime || loading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: isReportTime ? '0 4px 14px rgba(14, 165, 233, 0.4)' : 'none',
                transition: 'all .3s ease'
              }}
            >
              {loading ? <Loader2 size={22} className="spin" /> : <Send size={22} />}
              {loading ? 'Đang lưu báo cáo 11 chỉ tiêu...'
                : !isReportTime ? '⏰ Cổng mở từ 13:00 đến 18:30 hằng ngày'
                : existingReport ? '💾 LƯU & CẬP NHẬT BÁO CÁO (TRƯỚC 18:30)'
                : '📤 NỘP BÁO CÁO 11 CHỈ TIÊU CHIẾN DỊCH HÔM NAY'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MyReport;
