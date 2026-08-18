import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../lib/api';
import {
  Network, Building2, RefreshCw, CheckCircle, XCircle,
  Globe, FileText, CheckSquare, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, Users, QrCode, Search, Filter
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
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'REPORTED' | 'NOT_REPORTED'

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/documents/child-agencies-stats');
      setAgencies(res.data.agencies || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu cấp dưới:', err);
      const msg = err.response?.data?.message || 'Lỗi tải dữ liệu các xã trực thuộc';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // Summary totals
  const reported = agencies.filter(a => a.campaign?.reportedToday).length;
  const notReported = agencies.length - reported;
  const totalSmartWeb = agencies.reduce((s, a) => s + (a.smartweb?.total || 0), 0);
  const totalActive = agencies.reduce((s, a) => s + (a.smartweb?.active || 0), 0);

  // Filtered agencies
  const filteredAgencies = useMemo(() => {
    return agencies.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === 'REPORTED') return a.campaign?.reportedToday;
      if (statusFilter === 'NOT_REPORTED') return !a.campaign?.reportedToday;
      return true;
    });
  }, [agencies, searchTerm, statusFilter]);

  return (
    <div className="animate-up">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <Network size={26} color="var(--primary)" /> Giám sát Tuyến dưới
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--tx-3)', fontSize: '0.9rem' }}>
            Theo dõi tiến độ xử lý văn bản, chiến dịch và SmartWeb của các xã trực thuộc.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={fetchStats} 
          disabled={loading} 
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> {loading ? 'Đang tải...' : 'Cập nhật'}
        </button>
      </div>

      {/* Summary KPI Cards */}
      {agencies.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Tổng đơn vị', val: agencies.length, color: '#1a3a6b', bg: '#EFF6FF', icon: Building2 },
            { label: '✅ Đã BC hôm nay', val: reported, color: '#10B981', bg: '#ECFDF5', icon: CheckCircle },
            { label: '⏳ Chưa báo cáo', val: notReported, color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
            { label: '🌐 SmartWeb ĐK', val: totalSmartWeb, color: '#6366F1', bg: '#EEF2FF', icon: Globe },
            { label: '🚀 Website Active', val: totalActive, color: '#059669', bg: '#F0FDF4', icon: CheckCircle },
          ].map((s, i) => (
            <div key={i} className="stat-card animate-up" style={{ animationDelay: `${i*60}ms`, padding: '14px 18px', borderRadius: 14, background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.val}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={18} color={s.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      {agencies.length > 0 && (
        <div className="card" style={{ marginBottom: 20, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm theo tên Xã / Phường..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36, borderRadius: 10, fontSize: '.88rem', height: 40 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter('ALL')}
              style={{ fontSize: '.82rem', padding: '6px 14px', borderRadius: 20 }}
            >
              Tất cả ({agencies.length})
            </button>
            <button
              className={`btn ${statusFilter === 'REPORTED' ? 'btn-success' : 'btn-outline'}`}
              onClick={() => setStatusFilter('REPORTED')}
              style={{ fontSize: '.82rem', padding: '6px 14px', borderRadius: 20 }}
            >
              Đã nộp BC ({reported})
            </button>
            <button
              className={`btn ${statusFilter === 'NOT_REPORTED' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => setStatusFilter('NOT_REPORTED')}
              style={{ fontSize: '.82rem', padding: '6px 14px', borderRadius: 20 }}
            >
              Chưa nộp BC ({notReported})
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '70px 0', color: 'var(--tx-3)' }}>
          <Loader2 size={36} className="spin" style={{ color: 'var(--primary)' }} />
          <p style={{ marginTop: 14, fontWeight: 600 }}>Đang tải dữ liệu các đơn vị tuyến dưới...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 24px', borderColor: '#FCA5A5', background: '#FEF2F2' }}>
          <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: 14 }} />
          <h3 style={{ color: '#991B1B', margin: '0 0 8px 0' }}>Không thể tải dữ liệu tuyến dưới</h3>
          <p style={{ color: '#B91C1C', maxWidth: 500, margin: '0 auto 20px', fontSize: '.9rem' }}>
            {error}. Vui lòng kiểm tra lại kết nối mạng hoặc phân quyền tài khoản của bạn.
          </p>
          <button className="btn btn-primary" onClick={fetchStats} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      ) : agencies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Building2 size={48} style={{ opacity: .3, marginBottom: 16 }} />
          <h3>Không có cơ quan tuyến dưới</h3>
          <p style={{ color: 'var(--tx-3)' }}>Cơ quan của bạn hiện không quản lý đơn vị cấp dưới nào.</p>
        </div>
      ) : filteredAgencies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Search size={40} style={{ opacity: .3, marginBottom: 12 }} />
          <h4>Không tìm thấy đơn vị phù hợp</h4>
          <p style={{ color: 'var(--tx-3)', fontSize: '.88rem' }}>Không có đơn vị nào khớp với từ khóa "{searchTerm}".</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (ẩn trên màn hình nhỏ) */}
          <div className="card desktop-table-wrapper" style={{ padding: 0, overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border)' }}>
            <table className="table" style={{ width: '100%', minWidth: 1000, margin: 0 }}>
              <thead style={{ background: 'var(--surface-2, #F8FAFC)' }}>
                <tr>
                  <th style={{ padding: '16px 20px', width: '22%' }}>Đơn vị / Xã</th>
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
                {filteredAgencies.map((a) => {
                  const isExp = expanded[a._id];
                  const hasReport = a.campaign?.reportedToday;
                  const ts = a.campaign?.todayStats;
                  return (
                    <React.Fragment key={a._id}>
                      <tr 
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .15s ease' }} 
                        onClick={() => toggle(a._id)}
                        className="agency-row"
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isExp ? <ChevronUp size={14} color="#1a3a6b" /> : <ChevronDown size={14} color="#1a3a6b" />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#1a3a6b', fontSize: '.92rem' }}>{a.name}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 2 }}>
                                Hôm nay: +{a.docs?.incomingToday || 0} VB Đến
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.docs?.totalIncoming || 0}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.docs?.totalOutgoing || 0}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: a.docs?.overdueCount > 0 ? '#EF4444' : '#10B981' }}>
                          {a.docs?.overdueCount || 0}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#10B981' }}>
                          {a.tasks?.tasksDone || 0}/{a.tasks?.tasksTotal || 0}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: a.tasks?.tasksOverdue > 0 ? '#EF4444' : 'inherit' }}>
                          {a.tasks?.tasksOverdue || 0}
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
                            background: (RATING_COLOR[a.rating] || '#1a3a6b') + '1A',
                            color: RATING_COLOR[a.rating] || '#1a3a6b',
                            fontWeight: 700,
                            border: `1px solid ${(RATING_COLOR[a.rating] || '#1a3a6b')}40`,
                            padding: '4px 10px',
                            borderRadius: 8
                          }}>
                            {a.rating}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable: Chi tiết báo cáo chiến dịch hôm nay */}
                      {isExp && (
                        <tr style={{ background: '#F8FAFF' }}>
                          <td colSpan={10} style={{ padding: '16px 24px 20px' }}>
                            <div style={{ fontSize: '.86rem', fontWeight: 700, color: '#1a3a6b', marginBottom: 12 }}>
                              📊 Chi tiết báo cáo chiến dịch 11 chỉ tiêu — {a.name}
                            </div>
                            {hasReport && ts ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                                {[
                                  { icon: '💻', label: '1. Kỹ năng Số', val: ts.digitalSkills },
                                  { icon: '🪪', label: '2. VNeID Cấp 2', val: ts.vneidSupport },
                                  { icon: '🏛️', label: '3. Dịch vụ công', val: ts.publicServices || 0 },
                                  { icon: '📱', label: '4. QR Kinh doanh', val: ts.qrSupport },
                                  { icon: '🏃', label: '5. Đội hình CĐS', val: ts.activeTeams || 0 },
                                  { icon: '📚', label: '6. Lớp tập huấn', val: ts.trainingClasses || 0 },
                                  { icon: '🏪', label: '7. Mô hình CĐS', val: ts.digitalModels || 0 },
                                  { icon: '🛒', label: '8. SP OCOP', val: ts.digitalProducts || 0 },
                                  { icon: '🤖', label: '9. Thanh niên AI', val: ts.youthTrained || 0 },
                                  { icon: '⚡', label: '10. Công trình TN', val: ts.youthProjects || 0 },
                                  { icon: '🌐', label: '11. SmartWeb', val: ts.smartwebCount || 0 },
                                  { icon: '👥', label: 'TNV Tham gia', val: ts.volunteers || 0 },
                                ].map((s, j) => (
                                  <div key={j} style={{ background: 'white', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>{s.icon}</div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1a3a6b' }}>{(s.val || 0).toLocaleString('vi-VN')}</div>
                                    <div style={{ fontSize: '.72rem', color: 'var(--tx-3)', fontWeight: 600 }}>{s.label}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ background: '#FEF2F2', padding: '12px 16px', borderRadius: 8, color: '#DC2626', fontSize: '.88rem', fontWeight: 600 }}>
                                ⚠️ {a.name} chưa nộp báo cáo chiến dịch hôm nay. Cần liên hệ đôn đốc!
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

          {/* Mobile Cards View (hiển thị mượt mà trên điện thoại) */}
          <div className="mobile-cards-view" style={{ display: 'none', flexDirection: 'column', gap: 14 }}>
            {filteredAgencies.map((a) => {
              const isExp = expanded[a._id];
              const hasReport = a.campaign?.reportedToday;
              const ts = a.campaign?.todayStats;
              return (
                <div key={a._id} className="card" style={{ padding: '16px', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#1a3a6b', fontSize: '1.02rem' }}>{a.name}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 2 }}>
                        Điểm: <strong>{a.score}/100</strong> • Xếp loại: <span style={{ color: RATING_COLOR[a.rating] || '#1a3a6b', fontWeight: 700 }}>{a.rating}</span>
                      </div>
                    </div>
                    <span className="badge" style={{
                      background: hasReport ? '#D1FAE5' : '#FEE2E2',
                      color: hasReport ? '#059669' : '#DC2626',
                      fontWeight: 700,
                      fontSize: '.75rem'
                    }}>
                      {hasReport ? '✅ Đã nộp BC' : '⏳ Chưa nộp BC'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: 'var(--surface-2, #F8FAFC)', padding: '10px', borderRadius: 10, textAlign: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: '.7rem', color: 'var(--tx-3)' }}>VB Đến / Đi</div>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#1a3a6b' }}>{a.docs?.totalIncoming || 0} / {a.docs?.totalOutgoing || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '.7rem', color: 'var(--tx-3)' }}>CV Xong</div>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#10B981' }}>{a.tasks?.tasksDone || 0}/{a.tasks?.tasksTotal || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '.7rem', color: 'var(--tx-3)' }}>SmartWeb</div>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#059669' }}>{a.smartweb?.total || 0}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggle(a._id)} 
                    style={{ width: '100%', padding: '8px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontSize: '.8rem', fontWeight: 700, color: '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExp ? 'Thu gọn chi tiết' : 'Xem chi tiết 11 chỉ tiêu'}
                  </button>

                  {isExp && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      {hasReport && ts ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                          {[
                            { label: 'Kỹ năng Số', val: ts.digitalSkills },
                            { label: 'VNeID Cấp 2', val: ts.vneidSupport },
                            { label: 'Dịch vụ công', val: ts.publicServices || 0 },
                            { label: 'QR Kinh doanh', val: ts.qrSupport },
                            { label: 'Đội hình CĐS', val: ts.activeTeams || 0 },
                            { label: 'TNV Tham gia', val: ts.volunteers || 0 },
                          ].map((s, idx) => (
                            <div key={idx} style={{ background: '#fff', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                              <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#1a3a6b' }}>{(s.val || 0).toLocaleString('vi-VN')}</div>
                              <div style={{ fontSize: '.68rem', color: 'var(--tx-3)' }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#DC2626', fontSize: '.82rem', textAlign: 'center' }}>
                          ⚠️ Xã chưa nộp báo cáo chiến dịch hôm nay.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; } 
        @keyframes spin { to { transform: rotate(360deg); } }
        .agency-row:hover { background: #F8FAFC; }
        @media (max-width: 768px) {
          .desktop-table-wrapper { display: none !important; }
          .mobile-cards-view { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default AgenciesMonitor;
