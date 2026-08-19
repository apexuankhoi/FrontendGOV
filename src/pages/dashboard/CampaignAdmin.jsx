import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { 
  Map, FileSpreadsheet, RefreshCw, Loader2, TrendingUp, Globe, 
  Sparkles, Award, CheckCircle2, ChevronRight, Filter,
  Clock, Settings, X, Save, CheckCircle, AlertCircle, Zap, Moon
} from 'lucide-react';

const CampaignAdmin = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Cấu hình khung giờ báo cáo
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState({ 
    openTime: '13:00', 
    closeTime: '18:30', 
    editDeadline: '19:00',
    alwaysOpen: false, 
    customNotice: '', 
    isOpenNow: true,
    canEditNow: true 
  });
  const [savingConfig, setSavingConfig] = useState(false);

  const role = localStorage.getItem('role') || '';
  const canConfig = ['SENIOR_ADMIN', 'ADMIN', 'PROVINCE_ADMIN'].includes(role);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaign/all-reports', { params: { date: filterDate } });
      setReports(res.data || []);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu báo cáo');
    }
    setLoading(false);
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/campaign/config');
      if (res.data) setConfig(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { 
    fetchReports(); 
    fetchConfig();
  }, [filterDate]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.put('/campaign/config', config);
      toast.success(res.data.message || '✅ Đã lưu cấu hình khung giờ thành công!');
      setConfig(prev => ({ ...prev, ...res.data.config }));
      setShowConfigModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật cấu hình');
    } finally {
      setSavingConfig(false);
    }
  };

  // Quick preset helper
  const applyPreset = (preset) => {
    if (preset === 'DEFAULT') {
      setConfig(c => ({ ...c, openTime: '13:00', closeTime: '18:30', editDeadline: '19:00', alwaysOpen: false }));
    } else if (preset === 'EVENING') {
      setConfig(c => ({ ...c, openTime: '13:00', closeTime: '21:00', editDeadline: '22:00', alwaysOpen: false }));
    } else if (preset === '24/7') {
      setConfig(c => ({ ...c, alwaysOpen: true }));
    }
  };

  // Xuất Excel thật — gọi endpoint backend
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get('/campaign/export-excel', {
        params: { date: filterDate },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao_cao_11_chi_tieu_${filterDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('✅ Xuất Excel 11 chỉ tiêu thành công!');
    } catch (err) {
      toast.error('Lỗi xuất Excel: ' + (err.response?.data?.message || err.message));
    } finally {
      setExporting(false);
    }
  };

  // Filter reports
  const filteredReports = reports.filter(r => 
    !searchQuery || 
    r.agencyId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tính tổng 11 chỉ tiêu dựa trên filteredReports
  const totals = filteredReports.reduce((acc, r) => ({
    digitalSkills:   acc.digitalSkills   + (r.digitalSkills || 0),
    vneidSupport:    acc.vneidSupport    + (r.vneidSupport || 0),
    publicServices:  acc.publicServices  + (r.publicServices || 0),
    qrSupport:       acc.qrSupport       + (r.qrSupport || 0),
    activeTeams:     acc.activeTeams     + (r.activeTeams || 0),
    trainingClasses: acc.trainingClasses + (r.trainingClasses || 0),
    digitalModels:   acc.digitalModels   + (r.digitalModels || 0),
    digitalProducts: acc.digitalProducts + (r.digitalProducts || 0),
    youthTrained:    acc.youthTrained    + (r.youthTrained || 0),
    youthProjects:   acc.youthProjects   + (r.youthProjects || 0),
    smartwebCount:   acc.smartwebCount   + (r.smartwebCount || 0),
    volunteers:      acc.volunteers      + (r.volunteers || 0),
  }), {
    digitalSkills: 0, vneidSupport: 0, publicServices: 0, qrSupport: 0,
    activeTeams: 0, trainingClasses: 0, digitalModels: 0, digitalProducts: 0,
    youthTrained: 0, youthProjects: 0, smartwebCount: 0, volunteers: 0
  });

  return (
    <div className="animate-up" style={{ padding: '4px 0', paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: 0 }}>
            <Map size={26} color="var(--primary)" /> Quản lý Báo cáo 11 Chỉ tiêu
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.9rem', marginTop: 4 }}>
            Theo dõi và kiểm duyệt số liệu chuyển đổi số trực tiếp từ 102 đơn vị cấp xã/phường
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {canConfig && (
            <button 
              className="btn btn-outline" 
              onClick={() => setShowConfigModal(true)} 
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#0284C7', color: '#0284C7', background: '#F0F9FF', fontWeight: 700 }}
              title="Cấu hình giờ mở/đóng cổng nộp và chỉnh sửa báo cáo"
            >
              <Settings size={15} /> 
              {config.alwaysOpen ? '🟢 Mở 24/7' : `⏰ Cổng: ${config.openTime || '13:00'} – ${config.closeTime || '18:30'} (Sửa đến ${config.editDeadline || config.closeTime || '19:00'})`}
            </button>
          )}
          <input 
            type="text" 
            className="form-input" 
            placeholder="🔍 Tìm tên xã..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            style={{ width: 170 }} 
          />
          <input 
            type="date" 
            className="form-input" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
          />
          <button className="btn btn-outline" onClick={fetchReports} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} /> Làm mới
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExportExcel} 
            disabled={exporting || filteredReports.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {exporting ? <Loader2 size={16} className="spin" /> : <FileSpreadsheet size={16} />}
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>

      {/* Summary 11 KPI Cards */}
      {filteredReports.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
          gap: 12,
          marginBottom: 20
        }}>
          {[
            { label: 'Đơn vị nộp', value: filteredReports.length, color: 'var(--primary)', icon: '📋' },
            { label: '1. Kỹ năng số', value: totals.digitalSkills.toLocaleString('vi-VN'), color: '#0284C7', icon: '💻' },
            { label: '2. VNeID', value: totals.vneidSupport.toLocaleString('vi-VN'), color: '#16A34A', icon: '🪪' },
            { label: '3. DVC', value: totals.publicServices.toLocaleString('vi-VN'), color: '#7C3AED', icon: '🏛️' },
            { label: '4. QR Thanh toán', value: totals.qrSupport.toLocaleString('vi-VN'), color: '#D97706', icon: '📱' },
            { label: '5. Đội hình TN số', value: totals.activeTeams, color: '#2563EB', icon: '🏃' },
            { label: '6. Lớp tập huấn', value: totals.trainingClasses, color: '#0D9488', icon: '📚' },
            { label: '7. Mô hình CĐS', value: totals.digitalModels, color: '#E11D48', icon: '🏪' },
            { label: '8. SP OCOP', value: totals.digitalProducts, color: '#EA580C', icon: '🛒' },
            { label: '9. TN học AI', value: totals.youthTrained.toLocaleString('vi-VN'), color: '#4F46E5', icon: '🤖' },
            { label: '10. Công trình', value: totals.youthProjects, color: '#9333EA', icon: '⚡' },
            { label: '11. Web SmartWeb', value: totals.smartwebCount, color: '#1E40AF', icon: '🌐' },
          ].map((s, i) => (
            <div key={i} className="stat-card animate-up" style={{ animationDelay: `${i * 30}ms`, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '.74rem', color: 'var(--tx-3)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Table Container */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--tx-3)' }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
            <p style={{ marginTop: 12 }}>Đang tổng hợp báo cáo 11 chỉ tiêu...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state" style={{ padding: 48, textAlign: 'center' }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
            <h4 style={{ color: 'var(--tx-2)', marginBottom: 6 }}>Chưa có đơn vị nào nộp báo cáo</h4>
            <p style={{ color: 'var(--tx-3)', fontSize: '.9rem' }}>
              Không có dữ liệu báo cáo cho ngày <strong>{new Date(filterDate).toLocaleDateString('vi-VN')}</strong>.
            </p>
          </div>
        ) : (
          <div className="table-scroll" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 1550, fontSize: '.84rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ minWidth: 160 }}>Đơn vị cấp xã</th>
                  <th style={{ minWidth: 110 }}>Người nộp</th>
                  <th style={{ textAlign: 'center', background: '#E0F2FE', color: '#0284C7' }}>1. KN Số</th>
                  <th style={{ textAlign: 'center', background: '#DCFCE7', color: '#16A34A' }}>2. VNeID</th>
                  <th style={{ textAlign: 'center', background: '#EDE9FE', color: '#7C3AED' }}>3. DVC</th>
                  <th style={{ textAlign: 'center', background: '#FEF3C7', color: '#D97706' }}>4. QR KD</th>
                  <th style={{ textAlign: 'center', background: '#DBEAFE', color: '#2563EB' }}>5. Đội hình</th>
                  <th style={{ textAlign: 'center', background: '#CCFBF1', color: '#0D9488' }}>6. Lớp TH</th>
                  <th style={{ textAlign: 'center', background: '#FFE4E6', color: '#E11D48' }}>7. Mô hình</th>
                  <th style={{ textAlign: 'center', background: '#FFEDD5', color: '#EA580C' }}>8. SP OCOP</th>
                  <th style={{ textAlign: 'center', background: '#EEF2FF', color: '#4F46E5' }}>9. TN AI</th>
                  <th style={{ textAlign: 'center', background: '#FAF5FF', color: '#9333EA' }}>10. C.Trình</th>
                  <th style={{ textAlign: 'center', background: '#EFF6FF', color: '#1E40AF' }}>11. Web SW</th>
                  <th style={{ textAlign: 'center' }}>TNV</th>
                  <th style={{ minWidth: 200 }}>Khó khăn / Đề xuất / Minh chứng</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r, i) => (
                  <tr key={r._id} className="animate-up" style={{ animationDelay: `${i * 30}ms` }}>
                    <td style={{ fontWeight: 700, color: 'var(--tx-1)' }}>{r.agencyId?.name || 'Không rõ'}</td>
                    <td style={{ fontSize: '.8rem', color: 'var(--tx-3)' }}>{r.reporterId?.username || 'Không rõ'}</td>
                    
                    {/* 11 chỉ tiêu */}
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#0284C7' }}>{(r.digitalSkills || 0).toLocaleString('vi-VN')}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#16A34A' }}>{(r.vneidSupport || 0).toLocaleString('vi-VN')}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#7C3AED' }}>{(r.publicServices || 0).toLocaleString('vi-VN')}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#D97706' }}>{(r.qrSupport || 0).toLocaleString('vi-VN')}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{r.activeTeams || 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#0D9488' }}>{r.trainingClasses || 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#E11D48' }}>{r.digitalModels || 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#EA580C' }}>{r.digitalProducts || 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#4F46E5' }}>{(r.youthTrained || 0).toLocaleString('vi-VN')}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#9333EA' }}>{r.youthProjects || 0}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#1E40AF' }}>{r.smartwebCount || 0}</td>
                    
                    <td style={{ textAlign: 'center', color: 'var(--tx-3)' }}>{(r.volunteers || 0).toLocaleString('vi-VN')}</td>
                    
                    <td style={{ maxWidth: 220, fontSize: '.78rem', color: 'var(--tx-2)' }}>
                      {r.issues && <div style={{ color: '#DC2626' }}>🔴 {r.issues}</div>}
                      {r.proposals && <div style={{ color: '#0284C7', marginTop: 2 }}>💡 {r.proposals}</div>}
                      {r.evidenceLinks && (
                        <div style={{ marginTop: 2 }}>
                          <a href={r.evidenceLinks} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            🔗 Link minh chứng
                          </a>
                        </div>
                      )}
                      {!r.issues && !r.proposals && !r.evidenceLinks && <span style={{ color: 'var(--tx-3)' }}>—</span>}
                    </td>
                  </tr>
                ))}

                {/* Hàng tổng cộng */}
                <tr style={{ background: '#FFF7ED', fontWeight: 800 }}>
                  <td colSpan={2} style={{ color: '#C2410C' }}>TỔNG CỘNG ({filteredReports.length} đơn vị)</td>
                  <td style={{ textAlign: 'center', color: '#0284C7' }}>{totals.digitalSkills.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center', color: '#16A34A' }}>{totals.vneidSupport.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center', color: '#7C3AED' }}>{totals.publicServices.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center', color: '#D97706' }}>{totals.qrSupport.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center', color: '#2563EB' }}>{totals.activeTeams}</td>
                  <td style={{ textAlign: 'center', color: '#0D9488' }}>{totals.trainingClasses}</td>
                  <td style={{ textAlign: 'center', color: '#E11D48' }}>{totals.digitalModels}</td>
                  <td style={{ textAlign: 'center', color: '#EA580C' }}>{totals.digitalProducts}</td>
                  <td style={{ textAlign: 'center', color: '#4F46E5' }}>{totals.youthTrained.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center', color: '#9333EA' }}>{totals.youthProjects}</td>
                  <td style={{ textAlign: 'center', color: '#1E40AF' }}>{totals.smartwebCount}</td>
                  <td style={{ textAlign: 'center' }}>{totals.volunteers.toLocaleString('vi-VN')}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CẤU HÌNH KHUNG GIỜ NỘP & SỬA BÁO CÁO */}
      {showConfigModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div style={{
            maxWidth: 580, width: '100%', padding: '24px 28px', borderRadius: 20,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)', border: '1px solid #E2E8F0',
            background: '#FFFFFF', color: '#0F172A', maxHeight: '92vh', overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={22} color="#1D4ED8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1E3A8A' }}>
                    Cấu hình Khung giờ Báo cáo
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '.8rem', color: '#64748B' }}>
                    Thiết lập giờ mở cổng, giờ đóng và hạn chót chỉnh sửa cho 102 Xã/Phường
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowConfigModal(false)} 
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#64748B', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig}>
              {/* Quick Presets */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>
                  ⚡ Chọn nhanh mẫu cấu hình
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => applyPreset('DEFAULT')}
                    style={{
                      padding: '8px 10px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: (!config.alwaysOpen && config.closeTime === '18:30') ? '#EFF6FF' : '#F8FAFC',
                      borderColor: (!config.alwaysOpen && config.closeTime === '18:30') ? '#3B82F6' : '#E2E8F0',
                      cursor: 'pointer', textAlign: 'left', transition: 'all .2s'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#1E40AF' }}>⚡ Chuẩn chiến dịch</div>
                    <div style={{ fontSize: '.72rem', color: '#64748B', marginTop: 2 }}>13:00 – 18:30 (Sửa 19:00)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('EVENING')}
                    style={{
                      padding: '8px 10px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: (!config.alwaysOpen && config.closeTime === '21:00') ? '#EFF6FF' : '#F8FAFC',
                      borderColor: (!config.alwaysOpen && config.closeTime === '21:00') ? '#3B82F6' : '#E2E8F0',
                      cursor: 'pointer', textAlign: 'left', transition: 'all .2s'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#7C3AED' }}>🌙 Gia hạn đợt tối</div>
                    <div style={{ fontSize: '.72rem', color: '#64748B', marginTop: 2 }}>13:00 – 21:00 (Sửa 22:00)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('24/7')}
                    style={{
                      padding: '8px 10px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: config.alwaysOpen ? '#ECFDF5' : '#F8FAFC',
                      borderColor: config.alwaysOpen ? '#10B981' : '#E2E8F0',
                      cursor: 'pointer', textAlign: 'left', transition: 'all .2s'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#059669' }}>🟢 Mở tự do 24/7</div>
                    <div style={{ fontSize: '.72rem', color: '#64748B', marginTop: 2 }}>Không giới hạn giờ</div>
                  </button>
                </div>
              </div>

              {/* Cấu hình Ngày Bắt đầu & Kết thúc Chiến dịch */}
              <div style={{
                background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '14px 16px', borderRadius: 12, marginBottom: 18
              }}>
                <div style={{ fontSize: '.84rem', fontWeight: 800, color: '#1E3A8A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color="#1D4ED8" /> Thời gian toàn chiến dịch ({config.campaignTotalDays || 44} ngày):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 2 }}>
                      🚀 Ngày bắt đầu
                    </label>
                    <input 
                      type="date"
                      className="form-input"
                      value={config.campaignStartDate || '2026-08-01'}
                      onChange={e => {
                        const s = e.target.value;
                        setConfig(c => {
                          let diff = c.campaignTotalDays;
                          if (s && c.campaignEndDate) {
                            const d = Math.round((new Date(c.campaignEndDate) - new Date(s)) / (1000 * 60 * 60 * 24)) + 1;
                            if (d > 0) diff = d;
                          }
                          return { ...c, campaignStartDate: s, campaignTotalDays: diff };
                        });
                      }}
                      style={{ height: 38, fontWeight: 700, background: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 2 }}>
                      🏁 Ngày kết thúc
                    </label>
                    <input 
                      type="date"
                      className="form-input"
                      value={config.campaignEndDate || '2026-09-13'}
                      onChange={e => {
                        const end = e.target.value;
                        setConfig(c => {
                          let diff = c.campaignTotalDays;
                          if (c.campaignStartDate && end) {
                            const d = Math.round((new Date(end) - new Date(c.campaignStartDate)) / (1000 * 60 * 60 * 24)) + 1;
                            if (d > 0) diff = d;
                          }
                          return { ...c, campaignEndDate: end, campaignTotalDays: diff };
                        });
                      }}
                      style={{ height: 38, fontWeight: 700, background: '#FFFFFF' }}
                    />
                  </div>
                </div>
              </div>

              {/* Chế độ Always Open Switch Card */}
              <div style={{
                background: config.alwaysOpen ? '#ECFDF5' : '#F8FAFC',
                border: `1.5px solid ${config.alwaysOpen ? '#10B981' : '#E2E8F0'}`,
                padding: '14px 16px', borderRadius: 12, marginBottom: 18,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '.92rem', color: config.alwaysOpen ? '#065F46' : '#1E293B' }}>
                    🟢 Chế độ mở cổng 24/7 (Không giới hạn)
                  </div>
                  <div style={{ fontSize: '.78rem', color: '#64748B', marginTop: 2 }}>
                    Bật chế độ này để các xã có thể nộp và sửa báo cáo bất cứ lúc nào trong ngày.
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, flexShrink: 0, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={!!config.alwaysOpen} 
                    onChange={e => setConfig(c => ({ ...c, alwaysOpen: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: config.alwaysOpen ? '#10B981' : '#CBD5E1',
                    borderRadius: 34, transition: '.3s'
                  }}>
                    <span style={{
                      position: 'absolute', content: '""', height: 20, width: 20, left: config.alwaysOpen ? 25 : 3, bottom: 3,
                      backgroundColor: 'white', borderRadius: '50%', transition: '.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
              </div>

              {/* 3 Input Khung giờ chi tiết */}
              <div style={{
                background: config.alwaysOpen ? '#F1F5F9' : '#FFFFFF',
                opacity: config.alwaysOpen ? 0.6 : 1,
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: 16,
                marginBottom: 18,
                pointerEvents: config.alwaysOpen ? 'none' : 'auto'
              }}>
                <div style={{ fontSize: '.84rem', fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color="#2563EB" /> Khung giờ nhận & chỉnh sửa báo cáo:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {/* 1. Giờ mở cổng */}
                  <div>
                    <label style={{ fontWeight: 700, fontSize: '.8rem', color: '#1E293B', display: 'block', marginBottom: 4 }}>
                      🕒 1. Giờ Mở Cổng
                    </label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={config.openTime || '13:00'} 
                      onChange={e => setConfig(c => ({ ...c, openTime: e.target.value }))}
                      required={!config.alwaysOpen}
                      style={{ fontSize: '1rem', fontWeight: 800, textAlign: 'center', width: '100%', height: 42, borderRadius: 8, borderColor: '#CBD5E1', background: '#FFFFFF', color: '#0F172A' }}
                    />
                    <span style={{ fontSize: '.7rem', color: '#64748B', marginTop: 4, display: 'block' }}>
                      Bắt đầu nhận BC
                    </span>
                  </div>

                  {/* 2. Giờ đóng cổng nộp mới */}
                  <div>
                    <label style={{ fontWeight: 700, fontSize: '.8rem', color: '#1E293B', display: 'block', marginBottom: 4 }}>
                      ⏰ 2. Giờ Đóng Cổng
                    </label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={config.closeTime || '18:30'} 
                      onChange={e => setConfig(c => ({ ...c, closeTime: e.target.value }))}
                      required={!config.alwaysOpen}
                      style={{ fontSize: '1rem', fontWeight: 800, textAlign: 'center', width: '100%', height: 42, borderRadius: 8, borderColor: '#CBD5E1', background: '#FFFFFF', color: '#0F172A' }}
                    />
                    <span style={{ fontSize: '.7rem', color: '#64748B', marginTop: 4, display: 'block' }}>
                      Hạn nộp bài mới
                    </span>
                  </div>

                  {/* 3. Hạn chót chỉnh sửa */}
                  <div>
                    <label style={{ fontWeight: 700, fontSize: '.8rem', color: '#B45309', display: 'block', marginBottom: 4 }}>
                      ⏳ 3. Hạn Chỉnh Sửa
                    </label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={config.editDeadline || config.closeTime || '19:00'} 
                      onChange={e => setConfig(c => ({ ...c, editDeadline: e.target.value }))}
                      required={!config.alwaysOpen}
                      style={{ fontSize: '1rem', fontWeight: 800, textAlign: 'center', width: '100%', height: 42, borderRadius: 8, borderColor: '#F59E0B', background: '#FFFBEB', color: '#92400E' }}
                    />
                    <span style={{ fontSize: '.7rem', color: '#D97706', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      Hạn sửa số liệu đã nộp
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông báo tùy chỉnh cho các xã */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 700, fontSize: '.82rem', color: '#334155', display: 'block', marginBottom: 6 }}>
                  📢 Thông báo / Ghi chú đặc biệt gửi tới các Xã (Tùy chọn)
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: Hôm nay gia hạn nộp đến 20:00, hạn sửa đến 21:00..."
                  value={config.customNotice || ''}
                  onChange={e => setConfig(c => ({ ...c, customNotice: e.target.value }))}
                  style={{ width: '100%', height: 42, borderRadius: 10, borderColor: '#CBD5E1', padding: '0 14px', background: '#FFFFFF', color: '#0F172A' }}
                />
              </div>

              {/* Quy tắc hiệu lực Box */}
              <div style={{
                background: '#EFF6FF', padding: '12px 14px', borderRadius: 12,
                marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '.84rem', border: '1px solid #BFDBFE'
              }}>
                <AlertCircle size={18} color="#1D4ED8" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ color: '#1E3A8A', lineHeight: 1.45 }}>
                  <strong>Quy tắc hiệu lực:</strong> {config.alwaysOpen ? (
                    <span>Cổng đang mở tự do 24/7. Các xã có thể nộp mới và cập nhật lại số liệu bất kỳ lúc nào.</span>
                  ) : (
                    <span>
                      Xã được nộp báo cáo mới từ <strong>{config.openTime || '13:00'}</strong> đến <strong>{config.closeTime || '18:30'}</strong>, và được phép chỉnh sửa số liệu đã nộp đến <strong>{config.editDeadline || config.closeTime || '19:00'}</strong>.
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowConfigModal(false)}
                  style={{ padding: '9px 18px', borderRadius: 10, fontWeight: 600 }}
                >
                  Đóng
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingConfig}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 22px', borderRadius: 10, fontWeight: 700, background: '#1D4ED8' }}
                >
                  {savingConfig ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                  {savingConfig ? 'Đang lưu...' : 'Lưu Cấu hình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignAdmin;
