import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { 
  Map, FileSpreadsheet, RefreshCw, Loader2, TrendingUp, Globe, 
  Sparkles, Award, CheckCircle2, ChevronRight, Filter
} from 'lucide-react';

const CampaignAdmin = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => { fetchReports(); }, [filterDate]);

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
    </div>
  );
};

export default CampaignAdmin;
