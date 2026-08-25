import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { todayVN, toVNDateStr, formatDateVN } from '../../utils/dateVN';
import { 
  Map, FileSpreadsheet, RefreshCw, Loader2, TrendingUp, Globe, 
  Sparkles, Award, CheckCircle2, ChevronRight, Filter,
  Clock, Settings, X, Save, CheckCircle, AlertCircle, Zap, Moon, Trash2,
  Eye, LayoutGrid, Table as TableIcon, ExternalLink, MessageSquare,
  Building2, Search, Check, SlidersHorizontal, Download, Link, Edit3
} from 'lucide-react';

const CampaignAdmin = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filterDate, setFilterDate] = useState(todayVN());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('TABLE');
  const [selectedReport, setSelectedReport] = useState(null);
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOpts, setExportOpts] = useState({
    filterStatus: 'reported',
    includeEvidence: true,
    includeDifficulties: true,
    includeProposals: true,
    dateMode: 'day',     // 'day' | 'range' | 'all'
    startDate: todayVN(),
    endDate: todayVN(),
  });

  // Gán đơn vị xã/phường cho báo cáo (Dành cho Super Admin)
  const [agenciesList, setAgenciesList] = useState([]);
  const [assignModal, setAssignModal] = useState({ open: false, report: null, selectedAgencyId: '', searchAgency: '' });
  const [assigning, setAssigning] = useState(false);

  // Modal chỉnh sửa số liệu 11 chỉ tiêu (Dành cho Quản trị viên Tỉnh)
  const [editModal, setEditModal] = useState({
    open: false,
    report: null,
    formData: {}
  });
  const [savingEdit, setSavingEdit] = useState(false);

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

  const fetchAgencies = async () => {
    try {
      const res = await api.get('/agencies/public');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAgenciesList(res.data);
      } else {
        const res2 = await api.get('/agencies');
        if (Array.isArray(res2.data)) setAgenciesList(res2.data);
      }
    } catch {
      try {
        const res2 = await api.get('/agencies');
        if (Array.isArray(res2.data)) setAgenciesList(res2.data);
      } catch {}
    }
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
    fetchAgencies();
  }, [filterDate]);

  // Mở modal chỉnh sửa số liệu báo cáo
  const handleOpenEditModal = (report) => {
    setEditModal({
      open: true,
      report,
      formData: {
        digitalSkills: report.digitalSkills || 0,
        vneidSupport: report.vneidSupport || 0,
        publicServices: report.publicServices || 0,
        qrSupport: report.qrSupport || 0,
        activeTeams: report.activeTeams || 0,
        trainingClasses: report.trainingClasses || 0,
        digitalModels: report.digitalModels || 0,
        digitalProducts: report.digitalProducts || 0,
        youthTrained: report.youthTrained || 0,
        youthProjects: report.youthProjects || 0,
        smartwebCount: report.smartwebCount || 0,
        volunteers: report.volunteers || 0,
        safetyCampaigns: report.safetyCampaigns || 0,
        mediaPosts: report.mediaPosts || 0,
        evidenceLinks: report.evidenceLinks || '',
        issues: report.issues || '',
        proposals: report.proposals || '',
        reporterName: report.reporterName || report.reporterId?.username || ''
      }
    });
  };

  // Lưu chỉnh sửa số liệu từ Quản trị viên
  const handleSaveEditReport = async (e) => {
    if (e) e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await api.put(`/campaign/report/${editModal.report._id}`, editModal.formData);
      toast.success(res.data.message || '✅ Đã cập nhật số liệu báo cáo thành công!');
      const updated = res.data.report || { ...editModal.report, ...editModal.formData };

      // Cập nhật state danh sách ngay lập tức
      setReports(prev => prev.map(r => r._id === editModal.report._id ? updated : r));
      if (selectedReport?._id === editModal.report._id) {
        setSelectedReport(updated);
      }
      setEditModal({ open: false, report: null, formData: {} });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật số liệu báo cáo');
    } finally {
      setSavingEdit(false);
    }
  };

  // Mở modal gán đơn vị
  const handleOpenAssignModal = (report) => {
    setAssignModal({
      open: true,
      report,
      selectedAgencyId: report.agencyId?._id || '',
      searchAgency: ''
    });
  };

  // Lưu gán đơn vị cho báo cáo
  const handleSaveAssignAgency = async (e) => {
    if (e) e.preventDefault();
    if (!assignModal.selectedAgencyId) {
      toast.warning('Vui lòng chọn 1 đơn vị xã/phường để gán.');
      return;
    }
    setAssigning(true);
    try {
      const res = await api.put(`/campaign/report/${assignModal.report._id}/agency`, {
        agencyId: assignModal.selectedAgencyId
      });
      toast.success(res.data.message || '✅ Đã gán đơn vị thành công!');
      
      const chosenAgency = agenciesList.find(a => a._id === assignModal.selectedAgencyId);
      const updated = res.data.report || { ...assignModal.report, agencyId: chosenAgency };

      // Cập nhật state danh sách ngay lập tức
      setReports(prev => prev.map(r => r._id === assignModal.report._id ? updated : r));
      if (selectedReport?._id === assignModal.report._id) {
        setSelectedReport(updated);
      }
      setAssignModal({ open: false, report: null, selectedAgencyId: '', searchAgency: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi gán đơn vị cho báo cáo');
    } finally {
      setAssigning(false);
    }
  };

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

  // Xuất Excel — gọi backend với các tùy chọn
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = {
        filterStatus: exportOpts.filterStatus,
        includeEvidence: String(exportOpts.includeEvidence),
        includeDifficulties: String(exportOpts.includeDifficulties),
        includeProposals: String(exportOpts.includeProposals),
      };
      if (exportOpts.dateMode === 'day') params.date = filterDate;
      else if (exportOpts.dateMode === 'range') { params.startDate = exportOpts.startDate; params.endDate = exportOpts.endDate; }
      // 'all' → không truyền date

      const res = await api.get('/campaign/export-excel', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao_cao_chien_dich_${exportOpts.dateMode === 'day' ? filterDate : exportOpts.dateMode === 'range' ? `${exportOpts.startDate}_${exportOpts.endDate}` : 'tat_ca'}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('✅ Xuất Excel thành công!');
      setShowExportModal(false);
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
            onClick={() => setShowExportModal(true)} 
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <SlidersHorizontal size={14} />
            Xuất Excel
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
                  const reporterName = r.reporterName
                    || r.reporterId?.username || r.reporterId?.email
                    || (r.agencyId?.name ? `Cán bộ Đoàn ${r.agencyId.name}` : 'Không rõ');
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
                        <div style={{ fontWeight: 800, color: 'var(--tx-1)', fontSize: '.86rem', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <span>{agencyName}</span>
                          {isOrphan && (
                            <span title="Chưa liên kết Đơn vị" style={{ color: '#DC2626', fontSize: '.68rem', background: '#FEE2E2', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                              ⚠️ Chưa gán
                            </span>
                          )}
                          {canConfig && (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(r)}
                              style={{
                                border: '1px solid #93C5FD',
                                background: isOrphan ? '#EFF6FF' : '#F8FAFC',
                                color: '#1D4ED8',
                                fontSize: '.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 5,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                              title="Gán hoặc đổi đơn vị xã/phường cho báo cáo này"
                            >
                              <Building2 size={10} /> {isOrphan ? 'Gán ĐV' : 'Đổi'}
                            </button>
                          )}
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
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(r)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 6px', color: '#0284C7', background: '#E0F2FE', borderRadius: 6 }}
                                title="Chỉnh sửa 11 chỉ tiêu & số liệu báo cáo"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(r)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 6px', color: '#1D4ED8', background: '#EFF6FF', borderRadius: 6 }}
                                title="Gán hoặc đổi đơn vị xã cho báo cáo này"
                              >
                                <Building2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(r._id, agencyName)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 6px', color: '#DC2626', background: '#FEE2E2', borderRadius: 6 }}
                                title="Xóa bản ghi này"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
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
              const reporterName = r.reporterName
                || r.reporterId?.username || r.reporterId?.email
                || (r.agencyId?.name ? `Cán bộ Đoàn ${r.agencyId.name}` : 'Không rõ');
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
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--tx-1)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>{agencyName}</span>
                          {isOrphan && <span style={{ color: '#DC2626', fontSize: '.72rem', background: '#FEE2E2', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>⚠️ Chưa gán</span>}
                        </div>
                        <div style={{ fontSize: '.76rem', color: 'var(--tx-3)', marginTop: 2 }}>
                          👤 {reporterName} {r.updatedAt && `• ${new Date(r.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                      </div>

                      {canConfig && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(r)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#1D4ED8', background: '#EFF6FF', padding: '4px 6px', borderRadius: 6 }}
                            title="Gán / Đổi đơn vị"
                          >
                            <Building2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(r._id, agencyName)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#DC2626', background: '#FEE2E2', padding: '4px 6px', borderRadius: 6 }}
                            title="Xóa báo cáo này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
                        🔗 Link <ExternalLink size={11} />
                      </a>
                    )}
                    {canConfig && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(r)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '.76rem', borderColor: '#7DD3FC', color: '#0369A1', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                          title="Chỉnh sửa 11 chỉ tiêu"
                        >
                          <Edit3 size={12} /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(r)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '.76rem', borderColor: '#93C5FD', color: '#1D4ED8', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                          title="Gán hoặc đổi đơn vị"
                        >
                          <Building2 size={12} /> {isOrphan ? 'Gán ĐV' : 'Đổi ĐV'}
                        </button>
                      </>
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
                  👤 Người nộp: <strong>{selectedReport.reporterId?.username || selectedReport.reporterName || 'Ẩn danh'}</strong> • {formatDateVN(selectedReport.reportDate)}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {canConfig && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const rep = selectedReport;
                      setSelectedReport(null);
                      handleOpenEditModal(rep);
                    }}
                    className="btn btn-primary"
                    style={{ background: '#0284C7', borderColor: '#0284C7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Edit3 size={15} /> Chỉnh sửa số liệu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rep = selectedReport;
                      handleOpenAssignModal(rep);
                    }}
                    className="btn btn-outline"
                    style={{ borderColor: '#3B82F6', color: '#1D4ED8', background: '#EFF6FF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Building2 size={15} /> Gán / Đổi Đơn vị
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteReport(selectedReport._id, selectedReport.agencyId?.name)}
                    className="btn btn-outline"
                    style={{ borderColor: '#DC2626', color: '#DC2626', background: '#FEE2E2', fontWeight: 700 }}
                  >
                    <Trash2 size={15} /> Xóa báo cáo
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="btn btn-outline"
                style={{ padding: '8px 20px', fontWeight: 700 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GÁN / ĐỔI ĐƠN VỊ XÃ (SUPER ADMIN) */}
      {assignModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: 16
        }}>
          <div className="animate-up" style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: 24,
            maxWidth: 520, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-dark)', fontWeight: 800 }}>
                    🏢 Gán Đơn vị cho Báo cáo
                  </h3>
                  <div style={{ fontSize: '.78rem', color: 'var(--tx-3)', marginTop: 2 }}>
                    Người nộp: <strong>{assignModal.report?.reporterId?.username || assignModal.report?.reporterName || 'Chưa rõ'}</strong> • {formatDateVN(assignModal.report?.reportDate || filterDate)}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setAssignModal({ open: false, report: null, selectedAgencyId: '', searchAgency: '' })}
                style={{ border: 'none', background: 'var(--bg-main)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search filter input */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
              <input 
                type="text"
                className="form-input"
                placeholder="Tìm nhanh xã/phường (gõ tên xã...)"
                value={assignModal.searchAgency}
                onChange={e => setAssignModal(m => ({ ...m, searchAgency: e.target.value }))}
                style={{ width: '100%', paddingLeft: 36, height: 40, borderRadius: 10 }}
                autoFocus
              />
            </div>

            {/* List of 102 communes */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 340, border: '1px solid var(--border)', borderRadius: 12, padding: 6, background: 'var(--bg-main)' }}>
              {agenciesList
                .filter(a => !assignModal.searchAgency || a.name.toLowerCase().includes(assignModal.searchAgency.toLowerCase()))
                .map(a => {
                  const isSelected = assignModal.selectedAgencyId === a._id;
                  return (
                    <div 
                      key={a._id}
                      onClick={() => setAssignModal(m => ({ ...m, selectedAgencyId: a._id }))}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                        background: isSelected ? '#EFF6FF' : 'var(--bg-card)',
                        border: isSelected ? '1.5px solid #2563EB' : '1px solid transparent',
                        transition: 'all .15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={16} color={isSelected ? '#2563EB' : '#94A3B8'} />
                        <div>
                          <div style={{ fontWeight: isSelected ? 800 : 600, fontSize: '.86rem', color: isSelected ? '#1E40AF' : 'var(--tx-1)' }}>
                            {a.name}
                          </div>
                          {a.district && (
                            <div style={{ fontSize: '.72rem', color: 'var(--tx-3)' }}>
                              {a.district}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check size={18} color="#2563EB" style={{ strokeWidth: 3 }} />}
                    </div>
                  );
                })}
              {agenciesList.filter(a => !assignModal.searchAgency || a.name.toLowerCase().includes(assignModal.searchAgency.toLowerCase())).length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--tx-3)', fontSize: '.85rem' }}>
                  Không tìm thấy đơn vị phù hợp
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setAssignModal({ open: false, report: null, selectedAgencyId: '', searchAgency: '' })}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={assigning || !assignModal.selectedAgencyId}
                onClick={handleSaveAssignAgency}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', fontWeight: 700 }}
              >
                {assigning ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                {assigning ? 'Đang lưu...' : 'Xác nhận Gán'}
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

              {/* ── Mở cổng nộp muộn cho ngày cụ thể ───────────────────── */}
              <div style={{
                background: '#FFF7ED', border: '1.5px solid #FB923C',
                borderRadius: 12, padding: '16px 20px', marginTop: 8
              }}>
                <div style={{ fontWeight: 700, color: '#C2410C', marginBottom: 10, fontSize: '0.95rem' }}>
                  📅 Mở cổng nộp báo cáo muộn cho ngày cụ thể
                </div>
                <div style={{ fontSize: '0.85rem', color: '#7C3AED', marginBottom: 12 }}>
                  Chọn một ngày trong quá khứ để cho phép các xã nộp/cập nhật báo cáo của ngày đó (bất kể giờ hiện tại). Xóa trắng để tắt.
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    className="form-input"
                    value={config.allowLateDate || ''}
                    max={todayVN()}
                    onChange={e => setConfig(c => ({ ...c, allowLateDate: e.target.value || null }))}
                    style={{ maxWidth: 200, borderColor: '#FB923C' }}
                  />
                  {config.allowLateDate && (
                    <button
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, allowLateDate: null }))}
                      style={{
                        background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5',
                        borderRadius: 8, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem'
                      }}
                    >
                      ✕ Tắt nộp muộn
                    </button>
                  )}
                  <span style={{ fontSize: '0.8rem', color: '#92400E' }}>
                    {config.allowLateDate
                      ? `✅ Đang mở cho ngày ${new Date(config.allowLateDate).toLocaleDateString('vi-VN')}`
                      : '⬜ Không có ngày nộp muộn'}
                  </span>
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
      )}{/* end config modal */}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL XUẤT EXCEL — TÙY CHỌN NÂNG CAO                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showExportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 18, padding: 28,
            width: '100%', maxWidth: 520,
            boxShadow: '0 28px 70px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileSpreadsheet size={20} color="#059669" /> Tùy chọn Xuất Excel
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: '#6B7280' }}>
                  Chọn nội dung và phạm vi muốn xuất ra file Excel
                </p>
              </div>
              <button onClick={() => setShowExportModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={20} />
              </button>
            </div>

            {/* ── 1. Phạm vi ngày ── */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: '#1E3A8A', marginBottom: 10, fontSize: '0.9rem' }}>
                📅 Phạm vi thời gian
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'day', label: 'Theo ngày đang xem' },
                  { key: 'range', label: 'Khoảng ngày' },
                  { key: 'all', label: 'Tất cả dữ liệu' },
                ].map(opt => (
                  <button key={opt.key} type="button"
                    onClick={() => setExportOpts(o => ({ ...o, dateMode: opt.key }))}
                    style={{
                      padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
                      borderColor: exportOpts.dateMode === opt.key ? '#2563EB' : '#D1D5DB',
                      background: exportOpts.dateMode === opt.key ? '#EFF6FF' : '#fff',
                      color: exportOpts.dateMode === opt.key ? '#1D4ED8' : '#374151',
                      fontWeight: exportOpts.dateMode === opt.key ? 700 : 400,
                      cursor: 'pointer', fontSize: '0.83rem'
                    }}>{opt.label}</button>
                ))}
              </div>
              {exportOpts.dateMode === 'day' && (
                <div style={{ marginTop: 10, fontSize: '0.83rem', color: '#374151' }}>
                  Ngày: <strong>{filterDate}</strong> (ngày đang lọc trên màn hình)
                </div>
              )}
              {exportOpts.dateMode === 'range' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                  <input type="date" className="form-input" value={exportOpts.startDate}
                    onChange={e => setExportOpts(o => ({ ...o, startDate: e.target.value }))}
                    style={{ flex: 1, height: 36 }} />
                  <span style={{ color: '#6B7280' }}>→</span>
                  <input type="date" className="form-input" value={exportOpts.endDate}
                    onChange={e => setExportOpts(o => ({ ...o, endDate: e.target.value }))}
                    style={{ flex: 1, height: 36 }} />
                </div>
              )}
              {exportOpts.dateMode === 'all' && (
                <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                  ✅ Xuất toàn bộ dữ liệu chiến dịch
                </div>
              )}
            </div>

            {/* ── 2. Lọc trạng thái báo cáo ── */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: '#1E3A8A', marginBottom: 10, fontSize: '0.9rem' }}>
                🗂️ Loại đơn vị xuất ra
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'reported', label: '✅ Đã báo cáo', color: '#059669' },
                  { key: 'not_reported', label: '❌ Chưa báo cáo', color: '#DC2626' },
                  { key: 'all', label: '📋 Tất cả (2 sheet)', color: '#7C3AED' },
                ].map(opt => (
                  <button key={opt.key} type="button"
                    onClick={() => setExportOpts(o => ({ ...o, filterStatus: opt.key }))}
                    style={{
                      padding: '7px 14px', borderRadius: 20, border: '1.5px solid',
                      borderColor: exportOpts.filterStatus === opt.key ? opt.color : '#D1D5DB',
                      background: exportOpts.filterStatus === opt.key ? `${opt.color}15` : '#fff',
                      color: exportOpts.filterStatus === opt.key ? opt.color : '#374151',
                      fontWeight: exportOpts.filterStatus === opt.key ? 700 : 400,
                      cursor: 'pointer', fontSize: '0.83rem'
                    }}>{opt.label}</button>
                ))}
              </div>
              {exportOpts.filterStatus === 'all' && (
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#7C3AED' }}>
                  Sheet 1: Đã báo cáo &nbsp;|&nbsp; Sheet 2: Chưa báo cáo
                </div>
              )}
            </div>

            {/* ── 3. Cột bổ sung ── */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#1E3A8A', marginBottom: 12, fontSize: '0.9rem' }}>
                📊 Cột nội dung thêm vào Excel
              </div>
              {[
                { key: 'includeEvidence', label: '🔗 Link Minh chứng', sub: 'Link Google Drive, hình ảnh ra quân' },
                { key: 'includeDifficulties', label: '⚠️ Khó khăn', sub: 'Nội dung khó khăn đơn vị ghi nhận' },
                { key: 'includeProposals', label: '💡 Đề xuất / Kiến nghị', sub: 'Đề xuất của đơn vị gửi lên Tỉnh' },
              ].map(opt => (
                <label key={opt.key} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: exportOpts[opt.key] ? '#EFF6FF' : '#fff',
                  border: '1px solid', borderColor: exportOpts[opt.key] ? '#93C5FD' : '#E5E7EB',
                  marginBottom: 6
                }}>
                  <input type="checkbox" checked={exportOpts[opt.key]}
                    onChange={e => setExportOpts(o => ({ ...o, [opt.key]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#2563EB' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1E293B' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.77rem', color: '#6B7280' }}>{opt.sub}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Preview */}
            <div style={{
              background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10,
              padding: '10px 14px', marginBottom: 18, fontSize: '0.83rem', color: '#166534'
            }}>
              <strong>📁 File sẽ tải:</strong> {
                exportOpts.filterStatus === 'all' ? '2 sheet (Đã BC + Chưa BC)' :
                exportOpts.filterStatus === 'reported' ? '1 sheet (Đã báo cáo)' : '1 sheet (Chưa báo cáo)'
              } &nbsp;·&nbsp;
              {[
                exportOpts.includeEvidence && 'Link MC',
                exportOpts.includeDifficulties && 'Khó khăn',
                exportOpts.includeProposals && 'Đề xuất',
              ].filter(Boolean).join(', ') || 'Chỉ số liệu'}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowExportModal(false)}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExportExcel}
                disabled={exporting}
                style={{ background: '#059669', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {exporting ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                {exporting ? 'Đang xuất...' : 'Tải về Excel'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL CHỈNH SỬA SỐ LIỆU 11 CHỈ TIÊU (ADMIN EDIT MODAL) */}
      {editModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: 16
        }}>
          <div className="animate-up" style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: '20px 24px',
            maxWidth: 780, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            border: '1px solid var(--border)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                  <Edit3 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-dark)', fontWeight: 800 }}>
                    ✏️ Chỉnh sửa Báo cáo 11 Chỉ tiêu
                  </h3>
                  <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 2 }}>
                    Đơn vị: <strong style={{ color: 'var(--primary)' }}>{editModal.report?.agencyId?.name || editModal.report?.reporterId?.locationContext?.commune || 'Xã/Phường'}</strong> • Ngày {formatDateVN(editModal.report?.reportDate || filterDate)}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setEditModal({ open: false, report: null, formData: {} })}
                style={{ border: 'none', background: 'var(--bg-main)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSaveEditReport} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6, marginBottom: 14 }}>
                
                {/* 11 CHỈ TIÊU CHÍNH THỨC */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '.86rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span>🎯</span> 11 CHỈ TIÊU CHÍNH THỨC CỦA CHIẾN DỊCH:
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 10
                  }}>
                    {[
                      { key: 'digitalSkills', label: '1. Tiếp cận kỹ năng số', unit: 'lượt người', icon: '💻', color: '#0284C7' },
                      { key: 'vneidSupport', label: '2. VNeID mức 2 & tiện ích', unit: 'lượt người', icon: '🪪', color: '#16A34A' },
                      { key: 'publicServices', label: '3. Hỗ trợ DVC trực tuyến', unit: 'lượt / hồ sơ', icon: '🏛️', color: '#7C3AED' },
                      { key: 'qrSupport', label: '4. Hộ KD / Tiểu thương QR', unit: 'hộ kinh doanh', icon: '📱', color: '#D97706' },
                      { key: 'activeTeams', label: '5. Đội hình Thanh niên số', unit: 'đội hình', icon: '🏃', color: '#2563EB' },
                      { key: 'trainingClasses', label: '6. Lớp/Điểm tập huấn', unit: 'lớp / điểm', icon: '📚', color: '#0D9488' },
                      { key: 'digitalModels', label: '7. Mô hình điểm CĐS', unit: 'mô hình', icon: '🏪', color: '#E11D48' },
                      { key: 'digitalProducts', label: '8. SP OCOP / Địa phương', unit: 'sản phẩm', icon: '🛒', color: '#EA580C' },
                      { key: 'youthTrained', label: '9. Đoàn viên TN học AI', unit: 'đoàn viên', icon: '🤖', color: '#4F46E5' },
                      { key: 'youthProjects', label: '10. Công trình thanh niên', unit: 'công trình', icon: '⚡', color: '#9333EA' },
                      { key: 'smartwebCount', label: '11. Website SmartWeb', unit: 'website', icon: '🌐', color: '#1E40AF' },
                    ].map(field => (
                      <div 
                        key={field.key} 
                        style={{ 
                          background: 'var(--bg-main)', 
                          padding: '10px 12px', 
                          borderRadius: 10, 
                          border: '1px solid var(--border)' 
                        }}
                      >
                        <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--tx-1)', marginBottom: 4 }}>
                          <span style={{ marginRight: 4 }}>{field.icon}</span> {field.label}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input 
                            type="number"
                            min="0"
                            className="form-input"
                            value={editModal.formData[field.key] ?? 0}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                              setEditModal(m => ({ ...m, formData: { ...m.formData, [field.key]: val } }));
                            }}
                            style={{ flex: 1, padding: '6px 10px', height: 36, fontSize: '.9rem', fontWeight: 800, color: field.color }}
                          />
                          <span style={{ fontSize: '.72rem', color: 'var(--tx-3)', fontWeight: 600, minWidth: 55, textAlign: 'right' }}>
                            {field.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SỐ LIỆU BỔ TRỢ */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '.86rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span>👥</span> SỐ LIỆU BỔ TRỢ KHÁC:
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 10
                  }}>
                    {[
                      { key: 'volunteers', label: 'Tình nguyện viên ra quân', unit: 'lượt ĐVTN', icon: '🤝' },
                      { key: 'safetyCampaigns', label: 'Chiến dịch an toàn số', unit: 'buổi', icon: '🛡️' },
                      { key: 'mediaPosts', label: 'Tin bài truyền thông', unit: 'tin bài', icon: '📢' },
                    ].map(field => (
                      <div 
                        key={field.key} 
                        style={{ 
                          background: 'var(--bg-main)', 
                          padding: '10px 12px', 
                          borderRadius: 10, 
                          border: '1px solid var(--border)' 
                        }}
                      >
                        <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--tx-1)', marginBottom: 4 }}>
                          <span style={{ marginRight: 4 }}>{field.icon}</span> {field.label}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input 
                            type="number"
                            min="0"
                            className="form-input"
                            value={editModal.formData[field.key] ?? 0}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                              setEditModal(m => ({ ...m, formData: { ...m.formData, [field.key]: val } }));
                            }}
                            style={{ flex: 1, padding: '6px 10px', height: 36, fontSize: '.9rem', fontWeight: 800 }}
                          />
                          <span style={{ fontSize: '.72rem', color: 'var(--tx-3)', fontWeight: 600, minWidth: 55, textAlign: 'right' }}>
                            {field.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* THÔNG TIN MINH CHỨNG & VƯỚNG MẮC */}
                <div>
                  <div style={{ fontSize: '.86rem', fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span>📝</span> MINH CHỨNG & THÔNG TIN BỔ SUNG:
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--tx-2)', marginBottom: 3 }}>
                      🔗 Link thư mục minh chứng (Google Drive / Bài viết):
                    </label>
                    <input 
                      type="url"
                      className="form-input"
                      placeholder="https://drive.google.com/..."
                      value={editModal.formData.evidenceLinks || ''}
                      onChange={e => setEditModal(m => ({ ...m, formData: { ...m.formData, evidenceLinks: e.target.value } }))}
                      style={{ width: '100%', padding: '8px 12px', height: 38, fontSize: '.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#991B1B', marginBottom: 3 }}>
                        🔴 Khó khăn, vướng mắc tại địa phương:
                      </label>
                      <textarea 
                        className="form-input"
                        rows="2"
                        placeholder="Ghi nhận các khó khăn..."
                        value={editModal.formData.issues || ''}
                        onChange={e => setEditModal(m => ({ ...m, formData: { ...m.formData, issues: e.target.value } }))}
                        style={{ width: '100%', padding: '8px 10px', fontSize: '.85rem', resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#5B21B6', marginBottom: 3 }}>
                        💡 Đề xuất, kiến nghị gửi Tỉnh Đoàn:
                      </label>
                      <textarea 
                        className="form-input"
                        rows="2"
                        placeholder="Các đề xuất, giải pháp..."
                        value={editModal.formData.proposals || ''}
                        onChange={e => setEditModal(m => ({ ...m, formData: { ...m.formData, proposals: e.target.value } }))}
                        style={{ width: '100%', padding: '8px 10px', fontSize: '.85rem', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--tx-2)', marginBottom: 3 }}>
                      👤 Tên cán bộ nộp / phụ trách báo cáo:
                    </label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Cán bộ Đoàn..."
                      value={editModal.formData.reporterName || ''}
                      onChange={e => setEditModal(m => ({ ...m, formData: { ...m.formData, reporterName: e.target.value } }))}
                      style={{ width: '100%', padding: '6px 10px', height: 36, fontSize: '.85rem' }}
                    />
                  </div>
                </div>

              </div>

              {/* Bottom Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setEditModal({ open: false, report: null, formData: {} })}
                  disabled={savingEdit}
                  style={{ padding: '8px 18px', fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={savingEdit}
                  style={{ background: '#0284C7', border: 'none', padding: '8px 22px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {savingEdit ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                  {savingEdit ? 'Đang lưu...' : 'Lưu cập nhật'}
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
