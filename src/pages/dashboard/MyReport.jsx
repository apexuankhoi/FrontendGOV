import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import {
  Send, CheckCircle, Loader2, ClipboardList,
  AlertCircle, Clock, Info, Globe, Smartphone, Landmark,
  ShieldCheck, ShoppingCart, Award, Sparkles, ExternalLink, HelpCircle,
  Calendar, History, ChevronLeft, ChevronRight, Eye, RefreshCw, FileText
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
  const [activeTab, setActiveTab] = useState('FORM'); // 'FORM' | 'HISTORY'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [form, setForm] = useState(emptyForm());
  const [extra, setExtra] = useState({ issues: '', proposals: '', evidenceLinks: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [existingReport, setExistingReport] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Lịch sử báo cáo tất cả các ngày
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Cấu hình khung giờ báo cáo động từ Super Admin
  const [config, setConfig] = useState({ 
    openTime: '13:00', 
    closeTime: '18:30', 
    editDeadline: '19:00', 
    alwaysOpen: false, 
    customNotice: '', 
    isOpenNow: true, 
    canEditNow: true 
  });

  const agencyName = (() => {
    try { return JSON.parse(localStorage.getItem('agency'))?.name || 'Đơn vị của bạn'; }
    catch { return 'Đơn vị của bạn'; }
  })();

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Kiểm tra giờ nộp mới hôm nay
  const isReportTime = (() => {
    if (config.alwaysOpen) return true;
    if (!isToday) return false; // Không nộp mới cho ngày cũ
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = (config.openTime || '13:00').split(':').map(Number);
    const [ch, cm] = (config.closeTime || '18:30').split(':').map(Number);
    const openMin = (isNaN(oh) ? 13 : oh) * 60 + (isNaN(om) ? 0 : om);
    const closeMin = (isNaN(ch) ? 18 : ch) * 60 + (isNaN(cm) ? 30 : cm);
    return curMin >= openMin && curMin <= closeMin;
  })();

  // Kiểm tra giờ chỉnh sửa hôm nay
  const isEditTime = (() => {
    if (config.alwaysOpen) return true;
    if (!isToday) return false; // Ngày cũ là chế độ xem lại (Read-only)
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = (config.openTime || '13:00').split(':').map(Number);
    const [eh, em] = (config.editDeadline || config.closeTime || '19:00').split(':').map(Number);
    const openMin = (isNaN(oh) ? 13 : oh) * 60 + (isNaN(om) ? 0 : om);
    const editMin = (isNaN(eh) ? 19 : eh) * 60 + (isNaN(em) ? 0 : em);
    return curMin >= openMin && curMin <= editMin;
  })();

  // Tải báo cáo của ngày được chọn
  const fetchReportByDate = async (dateStr) => {
    setFetching(true);
    setSubmitted(false);
    setIsEditing(false);
    try {
      const [repRes, cfgRes] = await Promise.allSettled([
        api.get('/campaign/report', { params: { date: dateStr } }),
        api.get('/campaign/config')
      ]);

      if (cfgRes.status === 'fulfilled' && cfgRes.value.data) {
        setConfig(cfgRes.value.data);
      }

      if (repRes.status === 'fulfilled' && repRes.value.data) {
        const data = repRes.value.data;
        setExistingReport(data);
        const filled = {};
        ALL_FIELDS.forEach(f => { filled[f.key] = String(data[f.key] || 0); });
        setForm(filled);
        setExtra({
          issues: data.issues || '',
          proposals: data.proposals || '',
          evidenceLinks: data.evidenceLinks || ''
        });
      } else {
        // Chưa có báo cáo ngày này
        setExistingReport(null);
        setForm(emptyForm());
        setExtra({ issues: '', proposals: '', evidenceLinks: '' });
      }
    } catch {
      setExistingReport(null);
      setForm(emptyForm());
    }
    setFetching(false);
  };

  // Tải danh sách lịch sử tất cả các ngày đã nộp
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/campaign/my-history');
      setHistoryList(res.data || []);
    } catch {
      toast.error('Lỗi tải lịch sử báo cáo');
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchReportByDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab]);

  // Đổi ngày nhanh
  const handleShiftDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const newDateStr = current.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  const handleChange = (key, val) => {
    if (!/^\d*$/.test(val)) return;
    setForm(f => ({ ...f, [key]: val }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // 1. Kiểm tra BẮT BUỘC có Link minh chứng
    const cleanLinks = (extra.evidenceLinks || '').trim();
    if (!cleanLinks) {
      toast.error('⚠️ BẮT BUỘC: Bạn phải đính kèm Link minh chứng (Google Drive, ảnh, bài viết) trước khi nộp báo cáo!');
      return;
    }

    setLoading(true);
    try {
      const body = {
        reportDate: selectedDate,
        ...Object.fromEntries(ALL_FIELDS.map(f => [f.key, Number(form[f.key]) || 0])),
        issues: extra.issues,
        proposals: extra.proposals,
        evidenceLinks: cleanLinks
      };

      await api.post('/campaign/report', body);
      toast.success(`✅ Đã lưu báo cáo ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')} thành công!`);
      setSubmitted(true);
      setIsEditing(false);
      fetchReportByDate(selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi báo cáo');
    }
    setLoading(false);
  };

  return (
    <div className="animate-up" style={{ paddingBottom: 40 }}>
      {/* Header Banner */}
      <div className="page-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, color: 'var(--primary-dark, #065f46)' }}>
            <ClipboardList size={26} color="var(--primary)" />
            Báo cáo 11 Chỉ tiêu Chiến dịch CĐS
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.92rem', marginTop: 4 }}>
            🏛️ <strong>{agencyName}</strong> — Theo dõi & Xem lại số liệu theo ngày
          </p>
        </div>

        {/* Tab switch Buttons */}
        <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
          <button
            className={`btn btn-sm ${activeTab === 'FORM' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 14px', fontSize: '.85rem', fontWeight: 600 }}
            onClick={() => setActiveTab('FORM')}
          >
            <Calendar size={15} style={{ marginRight: 6 }} /> Báo cáo theo ngày
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'HISTORY' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 14px', fontSize: '.85rem', fontWeight: 600 }}
            onClick={() => setActiveTab('HISTORY')}
          >
            <History size={15} style={{ marginRight: 6 }} /> 📜 Lịch sử các ngày đã nộp ({historyList.length > 0 ? historyList.length : 'Xem'})
          </button>
        </div>
      </div>

      {/* ===== TAB 1: BÁO CÁO & XEM LẠI THEO NGÀY ===== */}
      {activeTab === 'FORM' && (
        <>
          {/* THANH ĐIỀU HƯỚNG CHỌN NGÀY THÔNG MINH */}
          <div className="card" style={{
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: '#fff',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--tx-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={18} color="var(--primary)" /> Ngày báo cáo:
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleShiftDate(-1)}
                  title="Xem ngày hôm trước"
                  style={{ padding: '4px 8px' }}
                >
                  <ChevronLeft size={16} /> Hôm trước
                </button>

                <input
                  type="date"
                  className="form-input"
                  style={{ height: 36, width: 'auto', fontWeight: 700, fontSize: '.9rem', color: 'var(--primary)' }}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleShiftDate(1)}
                  disabled={isToday}
                  title="Xem ngày hôm sau"
                  style={{ padding: '4px 8px' }}
                >
                  Hôm sau <ChevronRight size={16} />
                </button>
              </div>

              {!isToday && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  style={{ fontSize: '.8rem', padding: '4px 10px' }}
                >
                  ⚡ Về Hôm nay
                </button>
              )}
            </div>

            <div>
              {existingReport ? (
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: '.82rem',
                  fontWeight: 700,
                  background: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <CheckCircle size={14} /> Đã có báo cáo ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
                </span>
              ) : (
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: '.82rem',
                  fontWeight: 600,
                  background: '#FEF3C7',
                  color: '#B45309',
                  border: '1px solid #FDE68A',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  ⚠️ Chưa nộp báo cáo cho ngày này
                </span>
              )}
            </div>
          </div>

          {/* BANNER THÔNG BÁO CHẾ ĐỘ XEM LẠI NGÀY TRƯỚC HOẶC KHUNG GIỜ */}
          {!isToday ? (
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #3B82F6',
              borderRadius: 14,
              padding: '14px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <Eye size={24} color="#2563EB" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#1D4ED8', fontSize: '.95rem' }}>
                  📜 Đang ở chế độ xem lại số liệu ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
                </div>
                <div style={{ fontSize: '.84rem', color: '#475569', marginTop: 2 }}>
                  {existingReport 
                    ? `Dưới đây là toàn bộ số liệu 11 chỉ tiêu và link minh chứng đơn vị bạn đã nộp trong ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}.`
                    : `Ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')} đơn vị chưa gửi báo cáo lên hệ thống.`}
                </div>
              </div>
            </div>
          ) : (
            /* Banner Khung giờ nộp & chỉnh sửa cho Ngày Hôm Nay */
            <div style={{
              background: isReportTime ? '#ECFDF5' : (isEditTime ? '#EFF6FF' : '#FFFBEB'),
              border: `1px solid ${isReportTime ? '#10B981' : (isEditTime ? '#3B82F6' : '#F59E0B')}`,
              borderRadius: 14, padding: '14px 20px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'
            }}>
              {isReportTime
                ? <CheckCircle size={24} color="#10B981" style={{ flexShrink: 0 }} />
                : (isEditTime ? <Clock size={24} color="#2563EB" style={{ flexShrink: 0 }} /> : <Clock size={24} color="#F59E0B" style={{ flexShrink: 0 }} />)
              }
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontWeight: 700, color: isReportTime ? '#059669' : (isEditTime ? '#1D4ED8' : '#D97706'), fontSize: '.95rem' }}>
                  {config.alwaysOpen
                    ? '🟢 Cổng tiếp nhận & chỉnh sửa đang MỞ 24/7 (Không giới hạn giờ)'
                    : (isReportTime 
                        ? `✅ Cổng nộp báo cáo hôm nay đang MỞ (${config.openTime || '13:00'} – ${config.closeTime || '18:30'}) • Hạn chót sửa: ${config.editDeadline || config.closeTime || '19:00'}`
                        : (isEditTime 
                            ? `⏳ Đã đóng nộp mới nhưng ĐANG TRONG HẠN CHỈNH SỬA (Đến ${config.editDeadline || config.closeTime || '19:00'})`
                            : `⏰ Cổng đóng. Giờ mở nộp: ${config.openTime || '13:00'} – ${config.closeTime || '18:30'} (Hạn sửa: ${config.editDeadline || config.closeTime || '19:00'})`
                          )
                      )
                  }
                </div>
                <div style={{ fontSize: '.84rem', color: 'var(--tx-2)', marginTop: 3, lineHeight: 1.4 }}>
                  Nhập số liệu lũy kế 11 tiêu chí trực tiếp lên hệ thống. {existingReport ? `Đơn vị có thể chỉnh sửa lại số liệu đến ${config.alwaysOpen ? 'bất kỳ lúc nào' : (config.editDeadline || config.closeTime || '19:00')}.` : `Vui lòng hoàn thành trước ${config.alwaysOpen ? 'cuối ngày' : config.closeTime || '18:30'}.`}
                  {config.customNotice && (
                    <span style={{ display: 'block', color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>
                      📢 Lưu ý từ Tỉnh: {config.customNotice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {fetching ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Loader2 size={36} className="spin" style={{ color: 'var(--primary)' }} />
              <p style={{ marginTop: 14, color: 'var(--tx-3)', fontWeight: 500 }}>Đang tải dữ liệu báo cáo...</p>
            </div>
          ) : (existingReport && !isEditing) ? (
            /* ===== GIAO DIỆN XEM KẾT QUẢ ĐÃ NỘP ===== */
            <div className="card" style={{ padding: '28px 24px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                  <h3 style={{ color: '#059669', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={22} color="#10B981" />
                    Số liệu báo cáo ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
                  </h3>
                  <p style={{ color: 'var(--tx-3)', margin: '4px 0 0', fontSize: '.85rem' }}>
                    Đã đồng bộ lên Trung tâm chỉ huy số cấp Tỉnh • Cập nhật lúc: {existingReport.updatedAt ? new Date(existingReport.updatedAt).toLocaleString('vi-VN') : ''}
                  </p>
                </div>

                {isToday && isEditTime && (
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', fontWeight: 700, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    ✏️ Chỉnh sửa số liệu hôm nay
                  </button>
                )}
              </div>

              {/* Grid 11 Chỉ tiêu */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 14,
                marginBottom: 24
              }}>
                {CORE_CRITERIA.map(c => (
                  <div key={c.key} style={{
                    background: c.bg,
                    border: `1px solid ${c.color}30`,
                    borderRadius: 12,
                    padding: '14px 16px'
                  }}>
                    <div style={{ fontSize: '.78rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{c.icon}</span> {c.label}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color, marginTop: 6 }}>
                      {Number(existingReport[c.key] || 0).toLocaleString('vi-VN')}
                      <span style={{ fontSize: '.8rem', fontWeight: 500, color: '#64748b', marginLeft: 6 }}>{c.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Phụ trợ & Minh chứng */}
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 10, color: 'var(--tx-1)' }}>
                  📎 Minh chứng & Thông tin bổ trợ:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: '.85rem' }}>
                  <div>👥 <strong>Tình nguyện viên:</strong> {Number(existingReport.volunteers || 0).toLocaleString('vi-VN')} lượt</div>
                  <div>🛡️ <strong>Chiến dịch an toàn:</strong> {Number(existingReport.safetyCampaigns || 0).toLocaleString('vi-VN')} buổi</div>
                  <div>📣 <strong>Bài truyền thông:</strong> {Number(existingReport.mediaPosts || 0).toLocaleString('vi-VN')} tin/bài</div>
                </div>

                {existingReport.evidenceLinks && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: '.84rem', color: '#1e40af', marginBottom: 4 }}>🔗 Link minh chứng:</div>
                    <a
                      href={existingReport.evidenceLinks}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#2563eb', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.88rem', fontWeight: 600 }}
                    >
                      <ExternalLink size={15} /> {existingReport.evidenceLinks}
                    </a>
                  </div>
                )}

                {existingReport.issues && (
                  <div style={{ marginTop: 10, fontSize: '.84rem', color: '#dc2626' }}>
                    ⚠️ <strong>Khó khăn, vướng mắc:</strong> {existingReport.issues}
                  </div>
                )}

                {existingReport.proposals && (
                  <div style={{ marginTop: 6, fontSize: '.84rem', color: '#059669' }}>
                    💡 <strong>Đề xuất, kiến nghị:</strong> {existingReport.proposals}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ===== FORM NHẬP / CHỈNH SỬA BÁO CÁO ===== */
            <form onSubmit={handleSubmit} className="card" style={{ padding: 24, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--tx-1)' }}>
                    📝 {existingReport ? `Chỉnh sửa báo cáo ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}` : `Nhập báo cáo ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}`}
                  </h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--tx-3)', fontSize: '.85rem' }}>
                    Điền các số liệu thực tế đã triển khai (đơn vị tính theo từng chỉ tiêu)
                  </p>
                </div>
                {isEditing && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}>
                    ✕ Hủy sửa
                  </button>
                )}
              </div>

              {/* Grid 11 Chỉ tiêu Input */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
                marginBottom: 24
              }}>
                {CORE_CRITERIA.map(c => (
                  <div key={c.key} className="form-group" style={{
                    background: '#f8fafc',
                    padding: 14,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0'
                  }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '.85rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{c.icon}</span> {c.label}
                    </label>
                    <div style={{ position: 'relative', marginTop: 6 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingRight: 70, fontWeight: 700, fontSize: '1rem', color: c.color }}
                        value={form[c.key]}
                        onChange={e => handleChange(c.key, e.target.value)}
                        placeholder="0"
                      />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '.75rem', color: '#64748b' }}>
                        {c.unit}
                      </span>
                    </div>
                    <div style={{ fontSize: '.72rem', color: '#64748b', marginTop: 4 }}>
                      {c.desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* Phụ trợ */}
              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '.92rem', color: '#1e293b' }}>👥 Số liệu bổ trợ khác</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {AUX_FIELDS.map(f => (
                    <div key={f.key} className="form-group">
                      <label className="form-label" style={{ fontSize: '.8rem', fontWeight: 600 }}>{f.icon} {f.label}</label>
                      <input
                        type="text"
                        className="form-input"
                        value={form[f.key]}
                        onChange={e => handleChange(f.key, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Link minh chứng BẮT BUỘC */}
              <div className="form-group" style={{ background: '#eff6ff', padding: 16, borderRadius: 12, border: '1px solid #bfdbfe', marginBottom: 20 }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔗 Link minh chứng hoạt động (Google Drive / Hình ảnh / Bài đăng) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ background: '#fff', marginTop: 6 }}
                  placeholder="https://drive.google.com/... hoặc https://facebook.com/..."
                  value={extra.evidenceLinks}
                  onChange={e => setExtra({ ...extra, evidenceLinks: e.target.value })}
                />
                <div style={{ fontSize: '.75rem', color: '#3b82f6', marginTop: 4 }}>
                  ⚠️ BẮT BUỘC: Đính kèm link folder ảnh ra quân, link tài liệu hoặc link tin bài của xã để Tỉnh thẩm định.
                </div>
              </div>

              {/* Khó khăn & Đề xuất */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '.85rem' }}>⚠️ Khó khăn, vướng mắc (nếu có)</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Những khó khăn tại địa bàn cơ sở..."
                    value={extra.issues}
                    onChange={e => setExtra({ ...extra, issues: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '.85rem' }}>💡 Đề xuất, kiến nghị với Tỉnh Đoàn</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Kiến nghị hỗ trợ vật phẩm, kỹ thuật, tài liệu..."
                    value={extra.proposals}
                    onChange={e => setExtra({ ...extra, proposals: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ padding: '10px 28px', fontWeight: 700, borderRadius: 10, fontSize: '.95rem' }}
                >
                  {loading ? 'Đang gửi...' : '📤 Gửi báo cáo lên Tỉnh'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* ===== TAB 2: LỊCH SỬ BÁO CÁO CỦA ĐƠN VỊ ===== */}
      {activeTab === 'HISTORY' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#fff', border: '1px solid var(--border)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--tx-1)' }}>
                📜 Toàn bộ Lịch sử các ngày đã nộp báo cáo
              </h3>
              <p style={{ margin: '3px 0 0', color: 'var(--tx-3)', fontSize: '.82rem' }}>
                Đơn vị: <strong>{agencyName}</strong> — Tổng cộng <strong>{historyList.length}</strong> ngày đã nộp
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchHistory} title="Làm mới">
              <RefreshCw size={15} />
            </button>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
              <p style={{ marginTop: 10, color: '#64748b' }}>Đang tải lịch sử báo cáo...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="empty-state" style={{ padding: 50 }}>
              <div className="empty-state-icon">📂</div>
              <h4>Đơn vị chưa có lịch sử báo cáo nào</h4>
              <p style={{ color: '#64748b' }}>Chuyển sang tab "Báo cáo theo ngày" để nộp báo cáo đầu tiên.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '12px 14px', width: 50, textAlign: 'center' }}>STT</th>
                    <th style={{ padding: '12px 16px', minWidth: 140 }}>Ngày báo cáo</th>
                    <th style={{ padding: '12px 16px', minWidth: 120 }}>Kỹ năng số</th>
                    <th style={{ padding: '12px 16px', minWidth: 110 }}>VNeID</th>
                    <th style={{ padding: '12px 16px', minWidth: 110 }}>DVC TT</th>
                    <th style={{ padding: '12px 16px', minWidth: 100 }}>QR Hộ KD</th>
                    <th style={{ padding: '12px 16px', minWidth: 100 }}>Web TMĐT</th>
                    <th style={{ padding: '12px 16px', minWidth: 150 }}>Minh chứng</th>
                    <th style={{ padding: '12px 16px', minWidth: 150 }}>Thời gian nộp</th>
                    <th style={{ padding: '12px 16px', width: 100, textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((item, idx) => {
                    const dStr = item.reportDate ? new Date(item.reportDate).toISOString().split('T')[0] : '';
                    return (
                      <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#94a3b8' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>
                          📅 {item.reportDate ? new Date(item.reportDate).toLocaleDateString('vi-VN') : 'Không rõ'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#0284C7', fontWeight: 600 }}>
                          {(item.digitalSkills || 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#16A34A', fontWeight: 600 }}>
                          {(item.vneidSupport || 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#7C3AED', fontWeight: 600 }}>
                          {(item.publicServices || 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#D97706', fontWeight: 600 }}>
                          {(item.qrSupport || 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1E40AF', fontWeight: 600 }}>
                          {(item.smartwebCount || 0).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {item.evidenceLinks ? (
                            <a href={item.evidenceLinks} target="_blank" rel="noreferrer" style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '.8rem' }}>
                              <ExternalLink size={13} /> Xem link
                            </a>
                          ) : <span style={{ color: '#94a3b8' }}>Không có</span>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '.8rem', color: '#64748b' }}>
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleString('vi-VN') : ''}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            style={{ padding: '4px 10px', fontSize: '.78rem' }}
                            onClick={() => {
                              if (dStr) setSelectedDate(dStr);
                              setActiveTab('FORM');
                            }}
                          >
                            <Eye size={13} style={{ marginRight: 4 }} /> Xem lại
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyReport;
