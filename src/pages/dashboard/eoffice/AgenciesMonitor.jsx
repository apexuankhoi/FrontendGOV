import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import {
  Network, Building2, RefreshCw, CheckCircle, XCircle,
  Globe, FileText, CheckSquare, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, Users, QrCode
} from 'lucide-react';
import { toast } from 'react-toastify';

const RATING_COLOR = {
  'Xuất sắc':     '#10B981',
  'Tốt':          '#1a3a6b',
  'Khá':          '#F59E0B',
  'Cần cải thiện':'#EF4444'
};

const AgenciesMonitor = () => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents/child-agencies-stats');
      setAgencies(res.data.agencies || []);
    } catch {
      toast.error('Lỗi tải dữ liệu các xã trực thuộc');
    }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // Summary totals
  const reported = agencies.filter(a => a.campaign?.reportedToday).length;
  const notReported = agencies.length - reported;
  const totalSmartWeb = agencies.reduce((s, a) => s + (a.smartweb?.total || 0), 0);
  const totalActive = agencies.reduce((s, a) => s + (a.smartweb?.active || 0), 0);

  return (
    <div className="animate-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Network size={24} color="var(--primary)" /> Giám sát Tuyến dưới
          </h2>
          <p>Theo dõi tiến độ xử lý văn bản, chiến dịch và SmartWeb của các xã trực thuộc.</p>
        </div>
        <button className="btn btn-primary" onClick={fetchStats} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Cập nhật
        </button>
      </div>

      {/* Summary cards */}
      {agencies.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Tổng đơn vị', val: agencies.length, color: '#1a3a6b', icon: Building2 },
            { label: '✅ Đã BC hôm nay', val: reported, color: '#10B981', icon: CheckCircle },
            { label: '⏳ Chưa báo cáo', val: notReported, color: '#EF4444', icon: XCircle },
            { label: '🌐 SmartWeb ĐK', val: totalSmartWeb, color: '#6366F1', icon: Globe },
            { label: '🚀 Website Active', val: totalActive, color: '#059669', icon: CheckCircle },
          ].map((s, i) => (
            <div key={i} className="stat-card animate-up" style={{ animationDelay: `${i*60}ms`, padding: '12px 16px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tx-3)' }}>
          <Loader2 size={32} className="spin" />
          <p style={{ marginTop: 12 }}>Đang tải dữ liệu...</p>
        </div>
      ) : agencies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Building2 size={48} style={{ opacity: .3, marginBottom: 16 }} />
          <h3>Không có cơ quan tuyến dưới</h3>
          <p style={{ color: 'var(--tx-3)' }}>Cơ quan của bạn hiện không quản lý đơn vị cấp dưới nào.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: 1000 }}>
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <th style={{ padding: '16px 20px', width: '20%' }}>Đơn vị / Xã</th>
                {/* eOffice */}
                <th style={{ textAlign: 'center' }}>VB Đến</th>
                <th style={{ textAlign: 'center' }}>VB Đi</th>
                <th style={{ textAlign: 'center' }}>VB Quá hạn</th>
                <th style={{ textAlign: 'center' }}>CV Xong</th>
                <th style={{ textAlign: 'center' }}>CV Quá hạn</th>
                {/* Chiến dịch */}
                <th style={{ textAlign: 'center', background: '#EEF2FF', color: '#1a3a6b' }}>BC Hôm nay</th>
                {/* SmartWeb */}
                <th style={{ textAlign: 'center', background: '#F0FDF4', color: '#059669' }}>SmartWeb</th>
                {/* Điểm */}
                <th style={{ textAlign: 'center' }}>Điểm</th>
                <th style={{ textAlign: 'right', paddingRight: 20 }}>Xếp loại</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((a, i) => {
                const isExp = expanded[a._id];
                const hasReport = a.campaign?.reportedToday;
                const ts = a.campaign?.todayStats;
                return (
                  <React.Fragment key={a._id}>
                    <tr style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => toggle(a._id)}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isExp ? <ChevronUp size={14} color="var(--tx-3)" /> : <ChevronDown size={14} color="var(--tx-3)" />}
                          <div>
                            <div style={{ fontWeight: 700, color: '#1a3a6b' }}>{a.name}</div>
                            <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 2 }}>
                              Hôm nay: +{a.docs.incomingToday} VB Đến
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.docs.totalIncoming}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.docs.totalOutgoing}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: a.docs.overdueCount > 0 ? '#EF4444' : '#10B981' }}>
                        {a.docs.overdueCount}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#10B981' }}>
                        {a.tasks.tasksDone}/{a.tasks.tasksTotal}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: a.tasks.tasksOverdue > 0 ? '#EF4444' : 'inherit' }}>
                        {a.tasks.tasksOverdue}
                      </td>
                      {/* Báo cáo chiến dịch */}
                      <td style={{ textAlign: 'center', background: '#EEF2FF' }}>
                        {hasReport ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#D1FAE5', color: '#059669', padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: '.8rem' }}>
                            <CheckCircle size={13} /> Đã nộp
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEE2E2', color: '#DC2626', padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: '.8rem' }}>
                            <XCircle size={13} /> Chưa nộp
                          </span>
                        )}
                      </td>
                      {/* SmartWeb */}
                      <td style={{ textAlign: 'center', background: '#F0FDF4' }}>
                        <div style={{ fontWeight: 700, color: '#059669' }}>{a.smartweb?.total || 0}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--tx-3)' }}>{a.smartweb?.active || 0} active</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{a.score}/100</td>
                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <span className="badge" style={{
                          background: RATING_COLOR[a.rating] + '1A',
                          color: RATING_COLOR[a.rating],
                          fontWeight: 700,
                          border: `1px solid ${RATING_COLOR[a.rating]}40`
                        }}>
                          {a.rating}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable: Chi tiết báo cáo chiến dịch hôm nay */}
                    {isExp && (
                      <tr style={{ background: '#F8FAFF' }}>
                        <td colSpan={10} style={{ padding: '12px 24px 16px' }}>
                          <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#1a3a6b', marginBottom: 10 }}>
                            📊 Chi tiết báo cáo chiến dịch hôm nay — {a.name}
                          </div>
                          {hasReport && ts ? (
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                              {[
                                { icon: '👥', label: 'TNV', val: ts.volunteers },
                                { icon: '💻', label: 'KN Số', val: ts.digitalSkills },
                                { icon: '🪪', label: 'VNeID', val: ts.vneidSupport },
                                { icon: '📱', label: 'QR', val: ts.qrSupport },
                                { icon: '🌐', label: 'SmartWeb ĐK', val: ts.smartwebCount || 0 },
                              ].map((s, j) => (
                                <div key={j} style={{ background: 'white', padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', textAlign: 'center', minWidth: 80 }}>
                                  <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a3a6b' }}>{s.val}</div>
                                  <div style={{ fontSize: '.72rem', color: 'var(--tx-3)' }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: '#EF4444', fontSize: '.85rem' }}>
                              ⚠️ {a.name} chưa nộp báo cáo chiến dịch hôm nay. Cần nhắc nhở!
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AgenciesMonitor;
