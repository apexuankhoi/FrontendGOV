import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Plus, RefreshCw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const TeamsList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teams/admin');
      setTeams(res.data);
    } catch { toast.error('Không thể tải dữ liệu đội hình'); }
    setLoading(false);
  };

  const handleApprove = async (id, status) => {
    try {
      await api.put(`/teams/${id}/approve`, { status });
      toast.success(status === 'APPROVED' ? '✅ Đã phê duyệt đội hình!' : '❌ Đã từ chối đội hình!');
      fetchTeams();
    } catch { toast.error('Lỗi phê duyệt hoặc bạn không đủ quyền hạn.'); }
  };

  const handleExportExcel = () => {
    const data = filtered.map((t, index) => ({
      'STT': index + 1,
      'Tên Đội hình': t.name,
      'Đơn vị trực thuộc': t.schoolOrUnit,
      'Địa bàn (Huyện)': t.location?.district,
      'Địa bàn (Xã)': t.location?.commune,
      'Quân số': t.statistics?.volunteersCount || 0,
      'Giá trị làm lợi (Tr)': t.statistics?.estimatedValue || 0,
      'Trạng thái': t.status === 'APPROVED' ? 'Đã duyệt' : t.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_Doi_hinh");
    XLSX.writeFile(wb, "Bao_cao_Doi_hinh_Mua_He_Xanh.xlsx");
  };

  const filtered = filter === 'ALL' ? teams : teams.filter(t => t.status === filter);

  return (
    <div className="animate-up">
      <div className="page-header">
        <div className="action-row">
          <div>
            <h2>Quản lý Đội hình</h2>
            <p>Theo dõi và kiểm duyệt dữ liệu báo cáo từ các Xã</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" style={{ color: '#00A86B', borderColor: '#00A86B' }} onClick={handleExportExcel}>
              <Download size={15} /> Xuất Excel
            </button>
            <button className="btn btn-outline btn-sm" onClick={fetchTeams}>
              <RefreshCw size={15} /> Làm mới
            </button>
            {role === 'COMMUNE_ADMIN' && (
              <Link to="/dashboard/teams/add" className="btn btn-primary btn-sm">
                <Plus size={15} /> Khai báo Đội hình mới
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: `Tất cả (${teams.length})` },
          { key: 'APPROVED', label: `Đã duyệt (${teams.filter(t => t.status === 'APPROVED').length})` },
          { key: 'PENDING', label: `Chờ duyệt (${teams.filter(t => t.status === 'PENDING').length})` },
        ].map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên Đội hình</th>
              <th>Trường / Đơn vị</th>
              <th>Địa bàn (Xã / Huyện)</th>
              <th>Quân số</th>
              <th>Trạng thái</th>
              {(role === 'PROVINCE_ADMIN' || role === 'SENIOR_ADMIN') && <th>Phê duyệt</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h4>Chưa có dữ liệu nào</h4>
                    <p>{role === 'COMMUNE_ADMIN' ? 'Hãy khai báo đội hình đầu tiên!' : 'Dữ liệu sẽ xuất hiện khi có báo cáo từ cấp Xã.'}</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map(t => (
              <tr key={t._id}>
                <td style={{ fontWeight: 600, color: 'var(--brand-blue)' }}>{t.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{t.schoolOrUnit}</td>
                <td>{t.location?.commune}, <span style={{ color: 'var(--text-muted)' }}>{t.location?.district}</span></td>
                <td style={{ fontWeight: 600 }}>{t.statistics?.volunteersCount || 0} SV</td>
                <td>
                  <span className={`badge ${t.status === 'APPROVED' ? 'badge-success' : t.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                    {t.status === 'APPROVED' ? 'ĐÃ DUYỆT' : t.status === 'REJECTED' ? 'TỪ CHỐI' : 'CHỜ DUYỆT'}
                  </span>
                </td>
                {(role === 'PROVINCE_ADMIN' || role === 'SENIOR_ADMIN') && (
                  <td>
                    {t.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm btn-success" onClick={() => handleApprove(t._id, 'APPROVED')} title="Duyệt">
                          <CheckCircle size={15} /> Duyệt
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleApprove(t._id, 'REJECTED')} title="Từ chối">
                          <XCircle size={15} /> Từ chối
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>— Đã xử lý</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamsList;
