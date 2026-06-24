import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Activity, Clock } from 'lucide-react';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activity-log').then(res => {
      setLogs(res.data.logs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="animate-up">
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Activity size={24} /> Nhật ký hoạt động</h2>
        <p>Ghi nhận mọi thao tác trong hệ thống AI eOffice</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><h4>Đang tải...</h4></div>
        ) : logs.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📝</div><h4>Chưa có nhật ký nào</h4></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {logs.map(log => (
              <div key={log._id} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx-2)' }}>
                  <Clock size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.9rem', marginBottom: 4 }}>
                    <strong style={{ color: 'var(--brand-blue)' }}>{log.user?.username || 'Hệ thống'}</strong> đã thực hiện <strong className="badge badge-info">{log.action}</strong>
                  </div>
                  <div style={{ fontSize: '.85rem', color: 'var(--tx-1)', fontWeight: 500 }}>
                    Đối tượng: {log.target}
                  </div>
                  {log.details && (
                    <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 4 }}>
                      Chi tiết: {log.details}
                    </div>
                  )}
                  <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 8 }}>
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
