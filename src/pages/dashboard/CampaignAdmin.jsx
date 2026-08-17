import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { 
  Map, FileSpreadsheet, RefreshCw, Loader2, TrendingUp, Globe, 
  Sparkles, Award, CheckCircle2, ChevronRight, Filter,
  Clock, Settings, X, Save, CheckCircle, AlertCircle
} from 'lucide-react';

const CampaignAdmin = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Cấu hình khung giờ báo cáo
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState({ openTime: '13:00', closeTime: '18:30', alwaysOpen: false, customNotice: '', isOpenNow: true });
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
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
              {config.alwaysOpen ? '🟢 Mở 24/7' : `⏰ Cổng: ${config.openTime || '13:00'} – ${config.closeTime || '18:30'}`}
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
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16
        }}>
          <div className="card" style={{
            maxWidth: 520, width: '100%', padding: 24, borderRadius: 18,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border)',
            background: 'var(--surface-0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.2rem', color: 'var(--primary)' }}>
                <Clock size={22} /> Cấu hình Khung giờ Báo cáo
              </h3>
              <button 
                onClick={() => setShowConfigModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig}>
              {/* Chế độ Always Open */}
              <div style={{
                background: config.alwaysOpen ? '#ECFDF5' : 'var(--surface-1)',
                border: `1.5px solid ${config.alwaysOpen ? '#10B981' : 'var(--border)'}`,
                padding: 16, borderRadius: 12, marginBottom: 20,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', color: config.alwaysOpen ? '#065F46' : 'var(--tx-1)' }}>
                    🟢 Mở cổng 24/7 (Không giới hạn giờ)
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 2 }}>
                    Cho phép các xã nộp và sửa báo cáo mọi lúc (Thích hợp khi chạy kiểm thử hoặc đợt cao điểm)
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

              {/* Cấu hình giờ nếu không bật Always Open */}
              {!config.alwaysOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🕒 Giờ Mở Cổng
                    </label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={config.openTime || '13:00'} 
                      onChange={e => setConfig(c => ({ ...c, openTime: e.target.value }))}
                      required
                      style={{ fontSize: '1.05rem', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 4, display: 'block' }}>
                      Mặc định: 13:00 chiều
                    </span>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⏰ Giờ Đóng / Hạn Sửa
                    </label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={config.closeTime || '18:30'} 
                      onChange={e => setConfig(c => ({ ...c, closeTime: e.target.value }))}
                      required
                      style={{ fontSize: '1.05rem', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 4, display: 'block' }}>
                      Mặc định: 18:30 tối
                    </span>
                  </div>
                </div>
              )}

              {/* Thông báo tùy chỉnh cho các xã */}
              <div style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '.85rem' }}>
                  📢 Thông báo / Ghi chú đặc biệt gửi tới các Xã (Tùy chọn)
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: Hôm nay gia hạn nộp đến 20:00..."
                  value={config.customNotice || ''}
                  onChange={e => setConfig(c => ({ ...c, customNotice: e.target.value }))}
                />
              </div>

              {/* Quy tắc hiệu lực */}
              <div style={{
                background: 'var(--surface-1)', padding: '12px 16px', borderRadius: 10,
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '.85rem', border: '1px solid var(--border)'
              }}>
                <AlertCircle size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                <div style={{ color: 'var(--tx-2)' }}>
                  <strong>Quy tắc hiệu lực:</strong> Các đơn vị cấp Xã chỉ có thể gửi mới và chỉnh sửa số liệu báo cáo trong khoảng thời gian quy định ở trên.
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowConfigModal(false)}
                >
                  Đóng
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingConfig}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
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
