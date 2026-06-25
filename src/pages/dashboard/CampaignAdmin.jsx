import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { PieChart, Download, FileSpreadsheet, Map, CheckCircle } from 'lucide-react';

const CampaignAdmin = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

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

  useEffect(() => {
    fetchReports();
  }, [filterDate]);

  return (
    <div className="animate-up" style={{ padding: '20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Map size={24} color="var(--primary)" /> Dữ liệu Chiến dịch 44 ngày
          </h2>
          <p>Xem báo cáo tiến độ từ các đơn vị cấp xã</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input 
            type="date" 
            className="form-input" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <button className="btn btn-outline" onClick={() => toast.info('Đang xuất Excel...')}><FileSpreadsheet size={16} /> Xuất Excel</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx-3)' }}>Đang tải dữ liệu...</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx-3)' }}>
            Chưa có đơn vị nào nộp báo cáo cho ngày này.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  <th>Đơn vị báo cáo</th>
                  <th>Người nộp</th>
                  <th>Số Đội hình</th>
                  <th>Tình nguyện viên</th>
                  <th>Kỹ năng số</th>
                  <th>VNeID</th>
                  <th>DVC Trực tuyến</th>
                  <th>Thanh toán QR</th>
                  <th>Khó khăn / Kiến nghị</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r._id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-up">
                    <td style={{ fontWeight: 600 }}>{r.agencyId?.name || 'Không rõ'}</td>
                    <td>{r.reporterId?.username || 'Không rõ'}</td>
                    <td style={{ textAlign: 'center' }}>{r.activeTeams}</td>
                    <td style={{ textAlign: 'center' }}>{r.volunteers}</td>
                    <td style={{ textAlign: 'center' }}>{r.digitalSkills}</td>
                    <td style={{ textAlign: 'center' }}>{r.vneidSupport}</td>
                    <td style={{ textAlign: 'center' }}>{r.publicServices}</td>
                    <td style={{ textAlign: 'center' }}>{r.qrSupport}</td>
                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.issues ? `Khó khăn: ${r.issues}` : ''} 
                      {r.proposals ? ` Kiến nghị: ${r.proposals}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignAdmin;
