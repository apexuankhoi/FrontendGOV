import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import {
  Heart, Search, Filter, ChevronDown, ChevronRight,
  CheckCircle, Clock, User, Phone, MapPin, FileText,
  AlertTriangle, X, Loader2, Eye, UserPlus, MessageSquare,
  Ban, RefreshCw, TrendingUp, Inbox, ArrowRight
} from 'lucide-react';

const CATEGORY_MAP = {
  'THIEN_TAI': { label: 'Thiên tai', icon: '🌊', color: '#DC2626' },
  'DOI_SONG': { label: 'Đời sống', icon: '🏠', color: '#F59E0B' },
  'Y_TE': { label: 'Y tế', icon: '🏥', color: '#10B981' },
  'GIAO_DUC': { label: 'Giáo dục', icon: '📚', color: '#6366F1' },
  'HA_TANG': { label: 'Hạ tầng', icon: '🏗️', color: '#0EA5E9' },
  'AN_NINH': { label: 'An ninh', icon: '🛡️', color: '#8B5CF6' },
  'KHAC': { label: 'Khác', icon: '📋', color: '#64748B' },
};

const STATUS_MAP = {
  'NEW': { label: 'Mới gửi', color: '#6366F1', bg: '#EEF2FF', icon: '📩' },
  'RECEIVED': { label: 'Đã tiếp nhận', color: '#0EA5E9', bg: '#E0F2FE', icon: '✅' },
  'IN_PROGRESS': { label: 'Đang xử lý', color: '#F59E0B', bg: '#FEF3C7', icon: '⏳' },
  'RESOLVED': { label: 'Đã hỗ trợ', color: '#10B981', bg: '#D1FAE5', icon: '🎉' },
  'REJECTED': { label: 'Từ chối', color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
};

const URGENCY_MAP = {
  'LOW': { label: 'Bình thường', color: '#10B981' },
  'MEDIUM': { label: 'Cần sớm', color: '#F59E0B' },
  'HIGH': { label: 'Gấp', color: '#F97316' },
  'CRITICAL': { label: 'Khẩn cấp', color: '#DC2626' },
};

const SupportRequestsAdmin = () => {
  const [data, setData] = useState({ requests: [], total: 0, stats: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '', search: '', page: 1 });
  const [selected, setSelected] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'assign' | 'resolve' | 'reject'
  const [actionForm, setActionForm] = useState({ assignedTo: '', assignedPhone: '', resolution: '', rejectionReason: '', volunteersCount: '', hoursWorked: '', materialsUsed: '', beneficiariesCount: '', satisfactionRating: 5, reportNotes: '' });
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.category) params.set('category', filter.category);
      if (filter.search) params.set('search', filter.search);
      params.set('page', filter.page);
      params.set('limit', 15);

      const res = await api.get(`/support-requests?${params}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for new support request events
  useEffect(() => {
    // Khi socket emit newSupportRequest, reload data
    const handleNew = () => fetchData();
    window.addEventListener('newSupportRequest', handleNew);
    return () => window.removeEventListener('newSupportRequest', handleNew);
  }, [fetchData]);

  const handleStatusUpdate = async (requestId, newStatus, extraData = {}) => {
    setUpdating(true);
    try {
      await api.put(`/support-requests/${requestId}`, { status: newStatus, ...extraData });
      await fetchData();
      setSelected(null);
      setActionModal(null);
      setActionForm({ assignedTo: '', assignedPhone: '', resolution: '', rejectionReason: '', volunteersCount: '', hoursWorked: '', materialsUsed: '', beneficiariesCount: '', satisfactionRating: 5, reportNotes: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi cập nhật');
    } finally {
      setUpdating(false);
    }
  };

  const stats = data.stats || {};

  return (
    <div>
      {/* ═══════════ PAGE HEADER ═══════════ */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tx-1)' }}>
            <Heart size={22} style={{ color: 'var(--danger)', marginRight: 8 }} />
            Quản lý Yêu cầu Hỗ trợ
          </h1>
          <p style={{ color: 'var(--tx-3)', fontSize: '.88rem', marginTop: 4 }}>
            Tiếp nhận, phân công đoàn viên và theo dõi tiến độ hỗ trợ bà con
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchData}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* ═══════════ STATS CARDS ═══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Tổng yêu cầu', val: stats.totalAll || 0, icon: Inbox, color: '#6366F1', bg: '#EEF2FF' },
          { label: 'Mới gửi', val: stats.totalNew || 0, icon: AlertTriangle, color: '#F59E0B', bg: '#FEF3C7' },
          { label: 'Đang xử lý', val: stats.totalInProgress || 0, icon: Clock, color: '#0EA5E9', bg: '#E0F2FE' },
          { label: 'Đã hỗ trợ', val: stats.totalResolved || 0, icon: CheckCircle, color: '#10B981', bg: '#D1FAE5' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 14, padding: '18px 16px',
            boxShadow: '0 2px 10px rgba(0,0,0,.04)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--tx-3)', fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ FILTER BAR ═══════════ */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center',
        background: '#fff', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', background: '#f8fafc', flex: 1, minWidth: 200 }}>
          <Search size={16} color="var(--tx-3)" style={{ marginRight: 8 }} />
          <input 
            type="text" 
            placeholder="Tìm tên, SĐT hoặc mã..." 
            value={filter.search}
            onChange={e => setFilter(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '.85rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
          value={filter.status}
          onChange={e => setFilter(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.85rem', fontFamily: 'inherit', background: '#fff' }}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>

        <select
          value={filter.category}
          onChange={e => setFilter(prev => ({ ...prev, category: e.target.value, page: 1 }))}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.85rem', fontFamily: 'inherit', background: '#fff' }}
        >
          <option value="">Tất cả loại</option>
          {Object.entries(CATEGORY_MAP).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '.82rem', color: 'var(--tx-3)' }}>
          Tổng: <strong>{data.total}</strong> yêu cầu
        </div>
      </div>

      {/* ═══════════ REQUEST LIST ═══════════ */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--tx-3)' }}>
          <Loader2 size={28} className="spin" />
          <p style={{ marginTop: 10 }}>Đang tải dữ liệu...</p>
        </div>
      ) : data.requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--tx-3)', background: '#fff', borderRadius: 14, border: '1px solid var(--border)' }}>
          <Inbox size={40} style={{ opacity: .3, marginBottom: 10 }} />
          <p>Chưa có yêu cầu hỗ trợ nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.requests.map(req => {
            const st = STATUS_MAP[req.status] || STATUS_MAP.NEW;
            const cat = CATEGORY_MAP[req.category] || CATEGORY_MAP.KHAC;
            const urg = URGENCY_MAP[req.urgency] || URGENCY_MAP.MEDIUM;
            const isSelected = selected?._id === req._id;

            return (
              <div key={req._id}
                style={{
                  background: '#fff', borderRadius: 14, border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  boxShadow: isSelected ? '0 0 0 3px var(--primary-bg)' : '0 2px 8px rgba(0,0,0,.03)',
                  overflow: 'hidden', transition: 'all .2s',
                  cursor: 'pointer'
                }}
                onClick={() => setSelected(isSelected ? null : req)}
              >
                {/* Card Header */}
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {/* Urgency indicator */}
                  <div style={{ width: 5, height: 44, borderRadius: 4, background: urg.color, flexShrink: 0 }} />

                  {/* Category icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: `${cat.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
                  }}>
                    {cat.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--tx-1)' }}>{req.senderName}</span>
                      <span style={{ fontSize: '.72rem', color: 'var(--tx-3)', fontFamily: "'JetBrains Mono', monospace" }}>{req.trackingCode}</span>
                    </div>
                    <p style={{ fontSize: '.82rem', color: 'var(--tx-2)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.content}
                    </p>
                  </div>

                  {/* Status & Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, background: st.bg, color: st.color }}>
                      {st.icon} {st.label}
                    </span>
                    <span style={{ fontSize: '.72rem', color: 'var(--tx-3)' }}>
                      {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <ChevronRight size={14} color="var(--tx-3)" style={{ transition: 'transform .2s', transform: isSelected ? 'rotate(90deg)' : 'none' }} />
                  </div>
                </div>

                {/* Expanded Detail */}
                {isSelected && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)', marginTop: 0, paddingTop: 16, animation: 'fadeUp .2s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
                      <div className="sr-detail-item"><Phone size={14} /> <strong>SĐT:</strong> {req.senderPhone}</div>
                      <div className="sr-detail-item"><MapPin size={14} /> <strong>Xã:</strong> {req.agencyId?.name || '—'}</div>
                      <div className="sr-detail-item"><AlertTriangle size={14} /> <strong>Mức độ:</strong> <span style={{ color: urg.color, fontWeight: 600 }}>{urg.label}</span></div>
                      <div className="sr-detail-item"><FileText size={14} /> <strong>Loại:</strong> {cat.icon} {cat.label}</div>
                      {req.senderAddress && <div className="sr-detail-item"><MapPin size={14} /> <strong>Địa chỉ:</strong> {req.senderAddress}</div>}
                    </div>

                    <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '.88rem', lineHeight: 1.7, color: 'var(--tx-2)' }}>
                      {req.content}
                    </div>

                    {req.assignedTo && (
                      <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: 10, marginBottom: 10, fontSize: '.85rem', color: '#15803D' }}>
                        <UserPlus size={14} style={{ marginRight: 6 }} />
                        Đã phân công cho: <strong>{req.assignedTo}</strong> {req.assignedPhone && `(${req.assignedPhone})`}
                        {req.assignedAt && <span style={{ fontSize: '.75rem', opacity: .7 }}> — {new Date(req.assignedAt).toLocaleString('vi-VN')}</span>}
                      </div>
                    )}

                    {req.resolution && (
                      <div style={{ padding: '10px 14px', background: '#ECFDF5', borderRadius: 10, marginBottom: 10, fontSize: '.85rem', color: '#065F46' }}>
                        <CheckCircle size={14} style={{ marginRight: 6 }} />
                        Kết quả: {req.resolution}
                      </div>
                    )}

                    {/* Hiển thị báo cáo chi tiết nếu có */}
                    {req.report && req.report.volunteersCount > 0 && (
                      <div style={{ padding: '12px 14px', background: '#EFF6FF', borderRadius: 10, marginBottom: 10, fontSize: '.82rem', color: '#1E40AF' }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>📊 Báo cáo chi tiết</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                          <span>👥 ĐV đã cử: <strong>{req.report.volunteersCount}</strong></span>
                          <span>⏱️ Giờ LV: <strong>{req.report.hoursWorked}h</strong></span>
                          <span>❤️ Người được HT: <strong>{req.report.beneficiariesCount}</strong></span>
                          <span>⭐ Đánh giá: <strong>{req.report.satisfactionRating}/5</strong></span>
                        </div>
                        {req.report.materialsUsed && <div style={{ marginTop: 6 }}>🔧 Vật tư: {req.report.materialsUsed}</div>}
                        {req.report.notes && <div style={{ marginTop: 4 }}>📝 {req.report.notes}</div>}
                      </div>
                    )}

                    {/* Action buttons */}
                    {req.status !== 'RESOLVED' && req.status !== 'REJECTED' && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        {req.status === 'NEW' && (
                          <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req._id, 'RECEIVED'); }}>
                            <CheckCircle size={14} /> Tiếp nhận
                          </button>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setActionModal('assign'); setActionForm({ ...actionForm, assignedTo: req.assignedTo || '', assignedPhone: req.assignedPhone || '' }); }}>
                          <UserPlus size={14} /> Phân công
                        </button>
                        <button className="btn btn-sm" style={{ background: '#10B981', color: '#fff', border: 'none' }} onClick={(e) => { e.stopPropagation(); setActionModal('resolve'); }}>
                          <CheckCircle size={14} /> Hoàn thành
                        </button>
                        <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); setActionModal('reject'); }}>
                          <Ban size={14} /> Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ PAGINATION ═══════════ */}
      {data.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p}
              className={`btn btn-sm ${p === filter.page ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(prev => ({ ...prev, page: p }))}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ═══════════ ACTION MODAL ═══════════ */}
      {actionModal && selected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }} onClick={() => setActionModal(null)}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,.2)', animation: 'fadeUp .2s ease'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {actionModal === 'assign' && '👥 Phân công đoàn viên'}
                {actionModal === 'resolve' && '✅ Hoàn thành hỗ trợ'}
                {actionModal === 'reject' && '❌ Từ chối yêu cầu'}
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setActionModal(null)}>
                <X size={18} />
              </button>
            </div>

            {actionModal === 'assign' && (
              <>
                <div className="sr-field" style={{ marginBottom: 12 }}>
                  <label>Tên đoàn viên được phân công</label>
                  <input type="text" placeholder="Nguyễn Văn B" value={actionForm.assignedTo}
                    onChange={e => setActionForm(p => ({ ...p, assignedTo: e.target.value }))} />
                </div>
                <div className="sr-field" style={{ marginBottom: 16 }}>
                  <label>SĐT đoàn viên</label>
                  <input type="tel" placeholder="0987 654 321" value={actionForm.assignedPhone}
                    onChange={e => setActionForm(p => ({ ...p, assignedPhone: e.target.value }))} />
                </div>
                <button className="btn btn-primary w-full" disabled={updating || !actionForm.assignedTo}
                  onClick={() => handleStatusUpdate(selected._id, 'IN_PROGRESS', { assignedTo: actionForm.assignedTo, assignedPhone: actionForm.assignedPhone })}>
                  {updating ? <Loader2 size={16} className="spin" /> : <UserPlus size={16} />} Phân công & Chuyển "Đang xử lý"
                </button>
              </>
            )}

            {actionModal === 'resolve' && (
              <>
                <div className="sr-field" style={{ marginBottom: 12 }}>
                  <label>Kết quả hỗ trợ <span className="required">*</span></label>
                  <textarea rows={3} placeholder="Đã cử đoàn viên xuống hỗ trợ sửa chữa nhà. Hoàn thành ngày..."
                    value={actionForm.resolution}
                    onChange={e => setActionForm(p => ({ ...p, resolution: e.target.value }))} />
                </div>

                <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--tx-1)', marginBottom: 12 }}>📊 Báo cáo chi tiết</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="sr-field" style={{ marginBottom: 0 }}>
                      <label>Số đoàn viên đã cử</label>
                      <input type="number" min="0" placeholder="3" value={actionForm.volunteersCount}
                        onChange={e => setActionForm(p => ({ ...p, volunteersCount: e.target.value }))} />
                    </div>
                    <div className="sr-field" style={{ marginBottom: 0 }}>
                      <label>Số giờ làm việc</label>
                      <input type="number" min="0" placeholder="8" value={actionForm.hoursWorked}
                        onChange={e => setActionForm(p => ({ ...p, hoursWorked: e.target.value }))} />
                    </div>
                    <div className="sr-field" style={{ marginBottom: 0 }}>
                      <label>Số người được hỗ trợ</label>
                      <input type="number" min="0" placeholder="5" value={actionForm.beneficiariesCount}
                        onChange={e => setActionForm(p => ({ ...p, beneficiariesCount: e.target.value }))} />
                    </div>
                    <div className="sr-field" style={{ marginBottom: 0 }}>
                      <label>Đánh giá (1-5 ⭐)</label>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        {[1,2,3,4,5].map(star => (
                          <button key={star} type="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', opacity: star <= actionForm.satisfactionRating ? 1 : 0.25, transition: 'opacity .15s' }}
                            onClick={() => setActionForm(p => ({ ...p, satisfactionRating: star }))}>
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="sr-field" style={{ marginBottom: 0, marginTop: 10 }}>
                    <label>Vật tư đã sử dụng</label>
                    <input type="text" placeholder="Xi măng, cát, sắt..." value={actionForm.materialsUsed}
                      onChange={e => setActionForm(p => ({ ...p, materialsUsed: e.target.value }))} />
                  </div>
                  <div className="sr-field" style={{ marginBottom: 0, marginTop: 10 }}>
                    <label>Ghi chú thêm</label>
                    <input type="text" placeholder="Ghi chú bổ sung..." value={actionForm.reportNotes}
                      onChange={e => setActionForm(p => ({ ...p, reportNotes: e.target.value }))} />
                  </div>
                </div>

                <button className="btn w-full" style={{ background: '#10B981', color: '#fff', border: 'none' }} disabled={updating || !actionForm.resolution}
                  onClick={() => handleStatusUpdate(selected._id, 'RESOLVED', {
                    resolution: actionForm.resolution,
                    report: {
                      volunteersCount: parseInt(actionForm.volunteersCount) || 0,
                      hoursWorked: parseInt(actionForm.hoursWorked) || 0,
                      materialsUsed: actionForm.materialsUsed,
                      beneficiariesCount: parseInt(actionForm.beneficiariesCount) || 0,
                      satisfactionRating: actionForm.satisfactionRating,
                      notes: actionForm.reportNotes,
                    }
                  })}>
                  {updating ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />} Xác nhận đã hỗ trợ xong
                </button>
              </>
            )}

            {actionModal === 'reject' && (
              <>
                <div className="sr-field" style={{ marginBottom: 16 }}>
                  <label>Lý do từ chối</label>
                  <textarea rows={3} placeholder="Nội dung không hợp lệ, không thuộc địa bàn..."
                    value={actionForm.rejectionReason}
                    onChange={e => setActionForm(p => ({ ...p, rejectionReason: e.target.value }))} />
                </div>
                <button className="btn w-full" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }} disabled={updating || !actionForm.rejectionReason}
                  onClick={() => handleStatusUpdate(selected._id, 'REJECTED', { rejectionReason: actionForm.rejectionReason })}>
                  {updating ? <Loader2 size={16} className="spin" /> : <Ban size={16} />} Từ chối yêu cầu
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportRequestsAdmin;
