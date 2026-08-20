import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { 
  Map, FileSpreadsheet, RefreshCw, Loader2, TrendingUp, Globe, 
  Sparkles, Award, CheckCircle2, ChevronRight, Filter,
  Clock, Settings, X, Save, CheckCircle, AlertCircle, Zap, Moon, Trash2,
  Eye, LayoutGrid, Table as TableIcon, ExternalLink, MessageSquare
} from 'lucide-react';

const CampaignAdmin = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' | 'CARDS'
  const [selectedReport, setSelectedReport] = useState(null); // Detail modal

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

  const handleDeleteReport = async (reportId, agencyName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi báo cáo của "${agencyName || 'đơn vị này'}" không? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      await api.delete(`/campaign/report/${reportId}`);
      toast.success('✅ Đã xóa báo cáo thành công!');
      if (selectedReport?._id === reportId) setSelectedReport(null);
      fetchReports();
    } catch (err) {
      if (err.response?.status === 404) {
        toast.warning('⚠️ Server VPS chưa được deploy/reload code Backend mới (API DELETE /report/:id trả về 404). Đã tạm ẩn bản ghi này khỏi giao diện hiện tại!');
        setReports(prev => prev.filter(r => r._id !== reportId));
        if (selectedReport?._id === reportId) setSelectedReport(null);
      } else {
        toast.error(err.response?.data?.message || 'Lỗi khi xóa báo cáo');
      }
    }
  };

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
  const filteredReports = reports.filter(r => {
    const name = r.agencyId?.name || r.reporterId?.locationContext?.commune || '';
    const reporter = r.reporterId?.username || '';
    return !searchQuery || 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reporter.toLowerCase().includes(searchQuery.toLowerCase());
  });

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

  const KPI_COLS = [
    { key: 'digitalSkills', title: '1. Kỹ năng số', short: '1.KNS', color: '#0284C7', bg: '#E0F2FE' },
    { key: 'vneidSupport', title: '2. VNeID mức 2', short: '2.VNeID', color: '#16A34A', bg: '#DCFCE7' },
    { key: 'publicServices', title: '3. Dịch vụ công', short: '3.DVC', color: '#7C3AED', bg: '#EDE9FE' },
    { key: 'qrSupport', title: '4. QR Thanh toán', short: '4.QR', color: '#D97706', bg: '#FEF3C7' },
    { key: 'activeTeams', title: '5. Đội hình TN', short: '5.Đội', color: '#2563EB', bg: '#DBEAFE' },
    { key: 'trainingClasses', title: '6. Lớp tập huấn', short: '6.Lớp', color: '#0D9488', bg: '#CCFBF1' },
    { key: 'digitalModels', title: '7. Mô hình CĐS', short: '7.MôHình', color: '#E11D48', bg: '#FFE4E6' },
    { key: 'digitalProducts', title: '8. SP OCOP/Địa phương', short: '8.OCOP', color: '#EA580C', bg: '#FFEDD5' },
    { key: 'youthTrained', title: '9. TN tập huấn AI', short: '9.AI', color: '#4F46E5', bg: '#EEF2FF' },
    { key: 'youthProjects', title: '10. Công trình TN', short: '10.CTrình', color: '#9333EA', bg: '#FAF5FF' },
    { key: 'smartwebCount', title: '11. Web SmartWeb', short: '11.Web', color: '#1E40AF', bg: '#EFF6FF' },
    { key: 'volunteers', title: 'Tình nguyện viên', short: 'TNV', color: '#475569', bg: '#F1F5F9' },
  ];

  return (
    <div className="animate-up" style={{ padding: '4px 0', paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: 0, fontSize: '1.4rem' }}>
            <Map size={26} color="var(--primary)" /> Quản lý Báo cáo 11 Chỉ tiêu
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.86rem', marginTop: 3, marginBottom: 0 }}>
            Theo dõi & kiểm duyệt số liệu chuyển đổi số trực tiếp từ các đơn vị cấp xã/phường
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {canConfig && (
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => setShowConfigModal(true)} 
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#0284C7', color: '#0284C7', background: '#F0F9FF', fontWeight: 700 }}
              title="Cấu hình giờ mở/đóng cổng nộp và chỉnh sửa báo cáo"
            >
              <Settings size={14} /> 
              {config.alwaysOpen ? '🟢 24/7' : `⏰ ${config.openTime || '13:00'}–${config.closeTime || '18:30'}`}
            </button>
          )}
          
          {/* Switch View Mode */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
            <button 
              type="button"
              onClick={() => setViewMode('TABLE')}
              style={{
                border: 'none',
                background: viewMode === 'TABLE' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'TABLE' ? '#fff' : 'var(--tx-2)',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: '.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Xem dạng bảng tinh gọn vừa vặn màn hình"
            >
              <TableIcon size={13} /> Bảng
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('CARDS')}
              style={{
                border: 'none',
                background: viewMode === 'CARDS' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'CARDS' ? '#fff' : 'var(--tx-2)',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: '.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Xem dạng thẻ chi tiết"
            >
              <LayoutGrid size={13} /> Thẻ
            </button>
          </div>

          <input 
            type="text" 
            className="form-input" 
            placeholder="🔍 Tìm xã..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            style={{ width: 140, padding: '6px 10px', fontSize: '.84rem' }} 
          />
          <input 
            type="date" 
            className="form-input" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
            style={{ padding: '6px 10px', fontSize: '.84rem' }}
          />
          <button className="btn btn-outline btn-sm" onClick={fetchReports} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleExportExcel} 
            disabled={exporting || filteredReports.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {exporting ? <Loader2 size={14} className="spin" /> : <FileSpreadsheet size={14} />}
            {exporting ? 'Xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>

      {/* Summary 11 KPI Cards (Responsive Bar) */}
      {filteredReports.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 10,
          marginBottom: 16
        }}>
          {[
            { label: 'Đơn vị nộp', value: filteredReports.length, color: 'var(--primary)', icon: '📋' },
            { label: '1. Kỹ năng số', value: totals.digitalSkills.toLocaleString('vi-VN'), color: '#0284C7', icon: '💻' },
            { label: '2. VNeID', value: totals.vneidSupport.toLocaleString('vi-VN'), color: '#16A34A', icon: '🪪' },
            { label: '3. DVC', value: totals.publicServices.toLocaleString('vi-VN'), color: '#7C3AED', icon: '🏛️' },
            { label: '4. QR Thanh toán', value: totals.qrSupport.toLocaleString('vi-VN'), color: '#D97706', icon: '📱' },
            { label: '5. Đội hình', value: totals.activeTeams, color: '#2563EB', icon: '🏃' },
            { label: '6. Lớp tập huấn', value: totals.trainingClasses, color: '#0D9488', icon: '📚' },
            { label: '7. Mô hình CĐS', value: totals.digitalModels, color: '#E11D48', icon: '🏪' },
            { label: '8. SP OCOP', value: totals.digitalProducts, color: '#EA580C', icon: '🛒' },
            { label: '9. TN học AI', value: totals.youthTrained.toLocaleString('vi-VN'), color: '#4F46E5', icon: '🤖' },
            { label: '10. Công trình', value: totals.youthProjects, color: '#9333EA', icon: '⚡' },
            { label: '11. Web SmartWeb', value: totals.smartwebCount, color: '#1E40AF', icon: '🌐' },
          ].map((s, i) => (
            <div key={i} className="stat-card animate-up" style={{ animationDelay: `${i * 20}ms`, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                <span style={{ fontSize: '.7rem', color: 'var(--tx-3)', fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area: Compact Table or Cards */}
      <div className="card" style={{ padding: viewMode === 'TABLE' ? '12px 14px' : '18px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx-3)' }}>
            <Loader2 size={30} className="spin" style={{ color: 'var(--primary)' }} />
            <p style={{ marginTop: 10, fontSize: '.9rem' }}>Đang tổng hợp báo cáo 11 chỉ tiêu...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state" style={{ padding: 36, textAlign: 'center' }}>
            <div className="empty-state-icon" style={{ fontSize: '2.2rem', marginBottom: 8 }}>📋</div>
            <h4 style={{ color: 'var(--tx-2)', marginBottom: 4 }}>Chưa có đơn vị nào nộp báo cáo</h4>
            <p style={{ color: 'var(--tx-3)', fontSize: '.85rem' }}>
              Không có dữ liệu báo cáo cho ngày <strong>{new Date(filterDate).toLocaleDateString('vi-VN')}</strong>.
            </p>
          </div>
        ) : viewMode === 'TABLE' ? (
          /* BẢNG GỌN 100% CHIỀU RỘNG - HOÀN TOÀN KHÔNG CẦN KÉO THANH CUỘN */
          <div style={{ width: '100%', overflowX: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700, color: 'var(--tx-1)', minWidth: 140 }}>
                    Đơn vị / Cán bộ
                  </th>
                  {KPI_COLS.map(c => (
                    <th 
                      key={c.key} 
                      title={c.title} 
                      style={{ textAlign: 'center', padding: '8px 4px', fontWeight: 800, color: c.color, background: c.bg, fontSize: '.74rem', whiteSpace: 'nowrap' }}
                    >
                      {c.short}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: 700, minWidth: 80 }}>Minh chứng</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px', fontWeight: 700, minWidth: 65 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r, i) => {
                  const agencyName = r.agencyId?.name || r.reporterId?.locationContext?.commune || 'Chưa gán đơn vị';
                  const reporterName = r.reporterId?.username || r.reporterId?.email || 'Tài khoản ẩn';
                  const isOrphan = !r.agencyId?.name;

                  return (
                    <tr 
                      key={r._id} 
                      className="animate-up" 
                      style={{ 
                        animationDelay: `${i * 25}ms`, 
                        borderBottom: '1px solid var(--border)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'
                      }}
                    >
                      {/* Đơn vị & Người nộp gom gọn 1 cột */}
                      <td style={{ padding: '8px 8px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--tx-1)', fontSize: '.86rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {agencyName}
                          {isOrphan && <span title="Chưa liên kết Agency" style={{ color: '#DC2626', fontSize: '.7rem' }}>⚠️</span>}
                        </div>
                        <div style={{ fontSize: '.72rem', color: 'var(--tx-3)', marginTop: 1 }}>
                          👤 {reporterName} {r.updatedAt && `• ${new Date(r.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                      </td>

                      {/* 11 chỉ tiêu + TNV gọn gàng */}
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#0284C7' }}>
                        {(r.digitalSkills || 0).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#16A34A' }}>
                        {(r.vneidSupport || 0).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#7C3AED' }}>
                        {(r.publicServices || 0).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#D97706' }}>
                        {(r.qrSupport || 0).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#2563EB' }}>
                        {r.activeTeams || 0}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#0D9488' }}>
                        {r.trainingClasses || 0}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#E11D48' }}>
                        {r.digitalModels || 0}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#EA580C' }}>
                        {r.digitalProducts || 0}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#4F46E5' }}>
                        {(r.youthTrained || 0).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#9333EA' }}>
                        {r.youthProjects || 0}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 800, color: '#1E40AF' }}>
                        {r.smartwebCount || 0}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 2px', fontWeight: 700, color: 'var(--tx-2)' }}>
                        {(r.volunteers || 0).toLocaleString('vi-VN')}
                      </td>

                      {/* Minh chứng */}
                      <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                        {r.evidenceLinks ? (
                          <a 
                            href={r.evidenceLinks} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-outline btn-sm"
                            style={{ 
                              padding: '3px 7px', 
                              fontSize: '.72rem', 
                              borderColor: '#38BDF8', 
                              color: '#0284C7', 
                              background: '#F0F9FF',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                            title="Mở thư mục Google Drive / Minh chứng"
                          >
                            🔗 Link <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--tx-3)', fontSize: '.75rem' }}>—</span>
                        )}
                      </td>

                      {/* Nút xem chi tiết & Nút Xóa */}
                      <td style={{ textAlign: 'center', padding: '8px 4px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedReport(r)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 6px', color: 'var(--primary)', background: 'var(--primary-light)', borderRadius: 6 }}
                            title="Xem chi tiết khó khăn, đề xuất, thông tin đầy đủ"
                          >
                            <Eye size={13} />
                          </button>

                          {canConfig && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(r._id, agencyName)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 6px', color: '#DC2626', background: '#FEE2E2', borderRadius: 6 }}
                              title="Xóa bản ghi này"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Hàng tổng cộng */}
                <tr style={{ background: '#FFF7ED', fontWeight: 800, borderTop: '2px solid #FDBA74' }}>
                  <td style={{ padding: '10px 8px', color: '#C2410C', fontSize: '.84rem' }}>
                    TỔNG ({filteredReports.length} xã)
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#0284C7' }}>{totals.digitalSkills.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#16A34A' }}>{totals.vneidSupport.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#7C3AED' }}>{totals.publicServices.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#D97706' }}>{totals.qrSupport.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#2563EB' }}>{totals.activeTeams}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#0D9488' }}>{totals.trainingClasses}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#E11D48' }}>{totals.digitalModels}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#EA580C' }}>{totals.digitalProducts}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#4F46E5' }}>{totals.youthTrained.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#9333EA' }}>{totals.youthProjects}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: '#1E40AF' }}>{totals.smartwebCount}</td>
                  <td style={{ textAlign: 'center', padding: '10px 2px', color: 'var(--tx-2)' }}>{totals.volunteers.toLocaleString('vi-VN')}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* CHẾ ĐỘ THẺ (CARD VIEW) CHO ĐIỆN THOẠI & MÁY TÍNH */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 14
          }}>
            {filteredReports.map((r, i) => {
              const agencyName = r.agencyId?.name || r.reporterId?.locationContext?.commune || 'Chưa gán đơn vị';
              const reporterName = r.reporterId?.username || r.reporterId?.email || 'Tài khoản ẩn';
              const isOrphan = !r.agencyId?.name;

              return (
                <div 
                  key={r._id} 
                  className="card animate-up" 
                  style={{ 
                    animationDelay: `${i * 30}ms`,
                    padding: 16,
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    background: 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Header Card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--tx-1)' }}>
                          {agencyName} {isOrphan && <span style={{ color: '#DC2626', fontSize: '.75rem' }}>⚠️</span>}
                        </div>
                        <div style={{ fontSize: '.76rem', color: 'var(--tx-3)', marginTop: 2 }}>
                          👤 {reporterName} {r.updatedAt && `• ${new Date(r.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                      </div>

                      {canConfig && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(r._id, agencyName)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#DC2626', background: '#FEE2E2', padding: '4px 6px', borderRadius: 6 }}
                          title="Xóa báo cáo này"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Mini Grid 11 Chỉ tiêu */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 6,
                      background: 'var(--bg-main)',
                      padding: 8,
                      borderRadius: 10,
                      marginBottom: 10
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '.68rem', color: 'var(--tx-3)' }}>1. KN Số</div>
                        <div style={{ fontWeight: 800, color: '#0284C7', fontSize: '.9rem' }}>{(r.digitalSkills || 0).toLocaleString('vi-VN')}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '.68rem', color: 'var(--tx-3)' }}>2. VNeID</div>
                        <div style={{ fontWeight: 800, color: '#16A34A', fontSize: '.9rem' }}>{(r.vneidSupport || 0).toLocaleString('vi-VN')}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '.68rem', color: 'var(--tx-3)' }}>3. DVC</div>
                        <div style={{ fontWeight: 800, color: '#7C3AED', fontSize: '.9rem' }}>{(r.publicServices || 0).toLocaleString('vi-VN')}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '.68rem', color: 'var(--tx-3)' }}>4. QR KD</div>
                        <div style={{ fontWeight: 800, color: '#D97706', fontSize: '.9rem' }}>{(r.qrSupport || 0).toLocaleString('vi-VN')}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '.68rem', color: 'var(--tx-3)' }}>5. Đội hình</div>
                        <div style={{ fontWeight: 800, color: '#2563EB', fontSize: '.9rem' }}>{r.activeTeams || 0}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '.68rem', color: 'var(--tx-3)' }}>9. TN học AI</div>
                        <div style={{ fontWeight: 800, color: '#4F46E5', fontSize: '.9rem' }}>{(r.youthTrained || 0).toLocaleString('vi-VN')}</div>
                      </div>
                    </div>

                    {/* Khó khăn tóm tắt */}
                    {r.issues && (
                      <div style={{ fontSize: '.75rem', color: '#DC2626', marginBottom: 6, lineClamp: 2, overflow: 'hidden' }}>
                        🔴 {r.issues}
                      </div>
                    )}
                  </div>

                  {/* Footer Card: Nút xem & Minh chứng */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    {r.evidenceLinks && (
                      <a 
                        href={r.evidenceLinks} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, textAlign: 'center', fontSize: '.76rem', color: '#0284C7', borderColor: '#38BDF8', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      >
                        🔗 Minh chứng <ExternalLink size={11} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedReport(r)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, fontSize: '.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    >
                      <Eye size={12} /> Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL XEM CHI TIẾT 1 BÁO CÁO (QUICK DETAIL MODAL) */}
      {selectedReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div className="animate-up" style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: 24,
            maxWidth: 620, width: '100%', maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--primary-dark)' }}>
                  📊 Chi tiết Báo cáo: {selectedReport.agencyId?.name || selectedReport.reporterId?.locationContext?.commune || 'Xã/Phường'}
                </h3>
                <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 2 }}>
                  👤 Người nộp: <strong>{selectedReport.reporterId?.username || 'Ẩn danh'}</strong> • {new Date(selectedReport.reportDate).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedReport(null)}
                style={{ border: 'none', background: 'var(--bg-main)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid 11 Chỉ tiêu chi tiết */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 8,
              marginBottom: 16
            }}>
              {KPI_COLS.map(col => (
                <div key={col.key} style={{ background: col.bg, borderRadius: 10, padding: '10px 12px', border: `1px solid ${col.color}30` }}>
                  <div style={{ fontSize: '.72rem', color: col.color, fontWeight: 700 }}>{col.title}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: col.color, marginTop: 2 }}>
                    {(selectedReport[col.key] || 0).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>

            {/* Minh chứng */}
            {selectedReport.evidenceLinks && (
              <div style={{ background: '#F0F9FF', border: '1.5px solid #38BDF8', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: '.82rem', fontWeight: 800, color: '#0369A1', marginBottom: 4 }}>🔗 Thư mục Minh chứng:</div>
                <a 
                  href={selectedReport.evidenceLinks} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#0284C7', fontWeight: 700, wordBreak: 'break-all', fontSize: '.86rem', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {selectedReport.evidenceLinks} <ExternalLink size={13} />
                </a>
              </div>
            )}

            {/* Khó khăn & Đề xuất */}
            {selectedReport.issues && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: '.8rem', fontWeight: 800, color: '#991B1B' }}>🔴 Khó khăn, vướng mắc:</div>
                <div style={{ fontSize: '.84rem', color: '#7F1D1D', marginTop: 2 }}>{selectedReport.issues}</div>
              </div>
            )}

            {selectedReport.proposals && (
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: '.8rem', fontWeight: 800, color: '#5B21B6' }}>💡 Đề xuất, kiến nghị:</div>
                <div style={{ fontSize: '.84rem', color: '#4C1D95', marginTop: 2 }}>{selectedReport.proposals}</div>
              </div>
            )}

            {/* Action buttons in modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              {canConfig && (
                <button
                  type="button"
                  onClick={() => handleDeleteReport(selectedReport._id, selectedReport.agencyId?.name)}
                  className="btn btn-outline"
                  style={{ borderColor: '#DC2626', color: '#DC2626', background: '#FEE2E2', fontWeight: 700 }}
                >
                  <Trash2 size={15} /> Xóa báo cáo này
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontWeight: 700 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẤU HÌNH KHUNG GIỜ NỘP & SỬA BÁO CÁO */}
      {showConfigModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div className="animate-up" style={{
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
