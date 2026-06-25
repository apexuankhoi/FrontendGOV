import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Network, Building2, FileText, CheckSquare, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const AgenciesMonitor = () => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents/child-agencies-stats');
      setAgencies(res.data.agencies || []);
    } catch (err) {
      toast.error('Lỗi tải dữ liệu các xã trực thuộc');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const RATING_COLOR = {
    'Xuất sắc': 'var(--success)',
    'Tốt': 'var(--primary)',
    'Khá': 'var(--warning)',
    'Cần cải thiện': 'var(--danger)'
  };

  return (
    <div className="animate-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Network size={24} color="var(--primary)" /> Giám sát Tuyến dưới
          </h2>
          <p>Quan sát tiến độ xử lý văn bản, công việc của tất cả các xã trực thuộc.</p>
        </div>
        <button className="btn btn-primary" onClick={fetchStats} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Cập nhật
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--tx-3)' }}>Đang tải dữ liệu...</div>
      ) : agencies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--tx-4)' }}>
          <Building2 size={48} style={{ opacity: .3, marginBottom: 16 }} />
          <h3>Không có cơ quan tuyến dưới</h3>
          <p>Cơ quan của bạn hiện không quản lý đơn vị cấp dưới nào.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: 900 }}>
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <th style={{ padding: '16px 20px' }}>Đơn vị / Xã</th>
                <th style={{ textAlign: 'center' }}>Văn bản Đến</th>
                <th style={{ textAlign: 'center' }}>Văn bản Đi</th>
                <th style={{ textAlign: 'center' }}>VB Quá hạn</th>
                <th style={{ textAlign: 'center' }}>Công việc Xong</th>
                <th style={{ textAlign: 'center' }}>CV Quá hạn</th>
                <th style={{ textAlign: 'center' }}>Điểm</th>
                <th style={{ textAlign: 'right', paddingRight: 20 }}>Xếp loại</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((a, i) => (
                <tr key={a._id} style={{ borderBottom: i === agencies.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '1rem' }}>{a.name}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 4 }}>
                      Hôm nay: +{a.docs.incomingToday} Đến, +{a.docs.outgoingToday} Đi
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.docs.totalIncoming}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.docs.totalOutgoing}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: a.docs.overdueCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {a.docs.overdueCount}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--success)' }}>
                    {a.tasks.tasksDone} / {a.tasks.tasksTotal}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: a.tasks.tasksOverdue > 0 ? 'var(--danger)' : 'inherit' }}>
                    {a.tasks.tasksOverdue}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{a.score}/100</td>
                  <td style={{ textAlign: 'right', paddingRight: 20 }}>
                    <span className="badge" style={{ background: RATING_COLOR[a.rating] + '1A', color: RATING_COLOR[a.rating], fontWeight: 700, border: `1px solid ${RATING_COLOR[a.rating]}40` }}>
                      {a.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AgenciesMonitor;
