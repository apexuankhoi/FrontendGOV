import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { Map, FileSpreadsheet, RefreshCw, Loader2, TrendingUp, Globe } from 'lucide-react';

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
      setReports(res.data);
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
      a.download = `bao_cao_chien_dich_${filterDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('✅ Xuất Excel thành công!');
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

  // Tính tổng dựa trên filteredReports
  const totals = filteredReports.reduce((acc, r) => ({
    activeTeams:     acc.activeTeams     + (r.activeTeams || 0),
    volunteers:      acc.volunteers      + (r.volunteers || 0),
    digitalSkills:   acc.digitalSkills   + (r.digitalSkills || 0),
    vneidSupport:    acc.vneidSupport    + (r.vneidSupport || 0),
    publicServices:  acc.publicServices  + (r.publicServices || 0),
    qrSupport:       acc.qrSupport       + (r.qrSupport || 0),
    smartwebCount:   acc.smartwebCount   + (r.smartwebCount || 0),
    websitesCreated: acc.websitesCreated + (r.websitesCreated || 0),
  }), { activeTeams: 0, volunteers: 0, digitalSkills: 0, vneidSupport: 0, publicServices: 0, qrSupport: 0, smartwebCount: 0, websitesCreated: 0 });

  return (
    <div className="animate-up" style={{ padding: '4px 0' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Map size={24} color="var(--primary)" /> Báo cáo chiến dịch 44 ngày
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.9rem' }}>Xem báo cáo tiến độ từ các đơn vị cấp xã</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" className="form-input" placeholder="🔍 Tìm tên xã..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: 160 }} />
          <input type="date" className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          <button className="btn btn-outline" onClick={fetchReports} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} /> Làm mới
          </button>
          <button className="btn btn-primary" onClick={handleExportExcel} disabled={exporting || filteredReports.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {exporting ? <Loader2 size={16} className="spin" /> : <FileSpreadsheet size={16} />}
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>

      {/* Summary KPI */}
      {filteredReports.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Đơn vị báo cáo', value: filteredReports.length, color: 'var(--primary)', icon: '📋' },
            { label: 'Tình nguyện viên', value: totals.volunteers.toLocaleString(), color: '#7C3AED', icon: '👥' },
            { label: 'Kỹ năng số', value: totals.digitalSkills.toLocaleString(), color: '#0EA5E9', icon: '💻' },
            { label: 'VNeID', value: totals.vneidSupport.toLocaleString(), color: '#059669', icon: '🪪' },
            { label: 'QR Thanh toán', value: totals.qrSupport.toLocaleString(), color: '#D97706', icon: '📱' },
            { label: 'SmartWeb ĐK', value: totals.smartwebCount.toLocaleString(), color: '#1a3a6b', icon: '🌐' },
            { label: 'Website Active', value: totals.websitesCreated.toLocaleString(), color: '#10B981', icon: '🚀' },
            { label: 'DVC Trực tuyến', value: totals.publicServices.toLocaleString(), color: '#6366F1', icon: '🏛️' },
          ].map((s, i) => (
            <div key={i} className="stat-card animate-up" style={{ animationDelay: `${i * 50}ms`, padding: '12px 16px' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--tx-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--tx-3)' }}>
            <Loader2 size={28} className="spin" />
            <p style={{ marginTop: 12 }}>Đang tải dữ liệu...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>Chưa có đơn vị nào nộp báo cáo cho ngày <strong>{new Date(filterDate).toLocaleDateString('vi-VN')}</strong></p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>Đơn vị báo cáo</th>
                  <th>Người nộp</th>
                  <th style={{ textAlign: 'center' }}>Đội hình</th>
                  <th style={{ textAlign: 'center' }}>TNV</th>
                  <th style={{ textAlign: 'center' }}>KN Số</th>
                  <th style={{ textAlign: 'center' }}>VNeID</th>
                  <th style={{ textAlign: 'center' }}>DVC</th>
                  <th style={{ textAlign: 'center' }}>QR</th>
                  <th style={{ textAlign: 'center', color: '#1a3a6b', background: '#EEF2FF' }}>🌐 SmartWeb</th>
                  <th style={{ textAlign: 'center', color: '#059669', background: '#F0FDF4' }}>✅ Website</th>
                  <th>Khó khăn / Kiến nghị</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r, i) => (
                  <tr key={r._id} className="animate-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <td style={{ fontWeight: 600 }}>{r.agencyId?.name || 'Không rõ'}</td>
                    <td style={{ fontSize: '.85rem', color: 'var(--tx-3)' }}>{r.reporterId?.username || 'Không rõ'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.activeTeams}</td>
                    <td style={{ textAlign: 'center' }}>{r.volunteers}</td>
                    <td style={{ textAlign: 'center' }}>{r.digitalSkills}</td>
                    <td style={{ textAlign: 'center' }}>{r.vneidSupport}</td>
                    <td style={{ textAlign: 'center' }}>{r.publicServices}</td>
                    <td style={{ textAlign: 'center' }}>{r.qrSupport}</td>
                    <td style={{ textAlign: 'center', background: '#EEF2FF', fontWeight: 700, color: '#1a3a6b' }}>{r.smartwebCount || 0}</td>
                    <td style={{ textAlign: 'center', background: '#F0FDF4', fontWeight: 700, color: '#059669' }}>{r.websitesCreated || 0}</td>
                    <td style={{ maxWidth: 220, fontSize: '.82rem', color: 'var(--tx-3)' }}>
                      {r.issues ? <span>🔴 {r.issues}</span> : ''}
                      {r.proposals ? <span> 💡 {r.proposals}</span> : ''}
                      {!r.issues && !r.proposals ? '—' : ''}
                    </td>
                  </tr>
                ))}
                {/* Hàng tổng cộng */}
                <tr style={{ background: '#FFF3E0', fontWeight: 700 }}>
                  <td colSpan={2} style={{ fontWeight: 800, color: '#D97706' }}>TỔNG CỘNG ({filteredReports.length} đơn vị)</td>
                  <td style={{ textAlign: 'center', color: 'var(--primary)' }}>{totals.activeTeams}</td>
                  <td style={{ textAlign: 'center' }}>{totals.volunteers.toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>{totals.digitalSkills.toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>{totals.vneidSupport.toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>{totals.publicServices.toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>{totals.qrSupport.toLocaleString()}</td>
                  <td style={{ textAlign: 'center', background: '#DBEAFE', color: '#1a3a6b' }}>{totals.smartwebCount.toLocaleString()}</td>
                  <td style={{ textAlign: 'center', background: '#DCFCE7', color: '#059669' }}>{totals.websitesCreated.toLocaleString()}</td>
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
