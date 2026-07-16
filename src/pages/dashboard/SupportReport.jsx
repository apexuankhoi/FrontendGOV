import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  BarChart3, TrendingUp, Users, Clock, Heart, CheckCircle,
  AlertTriangle, Loader2, RefreshCw, MapPin, Star, FileText,
  ArrowUp, ArrowDown, Minus, PieChart
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
  'NEW': { label: 'Mới gửi', color: '#6366F1' },
  'RECEIVED': { label: 'Đã tiếp nhận', color: '#0EA5E9' },
  'IN_PROGRESS': { label: 'Đang xử lý', color: '#F59E0B' },
  'RESOLVED': { label: 'Đã hỗ trợ', color: '#10B981' },
  'REJECTED': { label: 'Từ chối', color: '#EF4444' },
};

const URGENCY_MAP = {
  'LOW': { label: 'Bình thường', color: '#10B981' },
  'MEDIUM': { label: 'Cần sớm', color: '#F59E0B' },
  'HIGH': { label: 'Gấp', color: '#F97316' },
  'CRITICAL': { label: 'Khẩn cấp', color: '#DC2626' },
};

const SupportReport = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/support-requests/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading || !stats) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--tx-3)' }}>
        <Loader2 size={32} className="spin" />
        <p style={{ marginTop: 12 }}>Đang tải dữ liệu báo cáo...</p>
      </div>
    );
  }

  const { byStatus, byCategory, byUrgency, recentByDay, topAgencies, reportSummary, resolutionRate } = stats;
  const maxDayCount = Math.max(...(recentByDay || []).map(d => d.count), 1);

  return (
    <div>
      {/* ═══════════ PAGE HEADER ═══════════ */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--tx-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={22} style={{ color: 'var(--primary)' }} />
            Báo cáo Tổng hợp Hỗ trợ
          </h1>
          <p style={{ color: 'var(--tx-3)', fontSize: '.88rem', marginTop: 4 }}>
            Tổng hợp tình hình tiếp nhận và xử lý yêu cầu hỗ trợ bà con toàn tỉnh
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchStats}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* ═══════════ TOP STATS ═══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Tổng yêu cầu', val: stats.total, icon: FileText, color: '#6366F1', bg: '#EEF2FF' },
          { label: 'Tỷ lệ xử lý', val: `${resolutionRate}%`, icon: TrendingUp, color: '#10B981', bg: '#D1FAE5' },
          { label: 'Đoàn viên đã cử', val: reportSummary.totalVolunteers, icon: Users, color: '#0EA5E9', bg: '#E0F2FE' },
          { label: 'Người được hỗ trợ', val: reportSummary.totalBeneficiaries, icon: Heart, color: '#EC4899', bg: '#FCE7F3' },
          { label: 'Giờ làm việc', val: reportSummary.totalHours, icon: Clock, color: '#F59E0B', bg: '#FEF3C7' },
          { label: 'Đánh giá TB', val: reportSummary.avgSatisfaction ? `${reportSummary.avgSatisfaction.toFixed(1)}/5` : '—', icon: Star, color: '#EAB308', bg: '#FEF9C3' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 14, padding: '20px 18px',
            boxShadow: '0 2px 10px rgba(0,0,0,.04)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--tx-3)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ═══════════ CHARTS ROW ═══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
        {/* Biểu đồ theo trạng thái */}
        <div className="sr-report-card">
          <h3 className="sr-report-title"><PieChart size={16} /> Theo trạng thái</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {Object.entries(STATUS_MAP).map(([key, val]) => {
              const count = byStatus[key] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--tx-2)' }}>{val.label}</span>
                    <span style={{ fontWeight: 700, color: val.color }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: val.color, borderRadius: 4, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Biểu đồ theo phân loại */}
        <div className="sr-report-card">
          <h3 className="sr-report-title"><BarChart3 size={16} /> Theo phân loại</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {Object.entries(CATEGORY_MAP).map(([key, val]) => {
              const count = byCategory[key] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--tx-2)' }}>{val.icon} {val.label}</span>
                    <span style={{ fontWeight: 700, color: val.color }}>{count}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: val.color, borderRadius: 4, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════ SECOND ROW ═══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
        {/* Biểu đồ cột theo ngày */}
        <div className="sr-report-card">
          <h3 className="sr-report-title"><TrendingUp size={16} /> Xu hướng 14 ngày gần nhất</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 18, height: 140 }}>
            {(recentByDay || []).reverse().map((d, i) => {
              const h = Math.max((d.count / maxDayCount) * 120, 8);
              const dayLabel = d._id.split('-').slice(1).join('/');
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--primary)' }}>{d.count}</span>
                  <div style={{
                    width: '100%', height: h, borderRadius: '6px 6px 2px 2px',
                    background: `linear-gradient(to top, var(--primary), #60A5FA)`,
                    transition: 'height .5s ease',
                    minHeight: 4
                  }} />
                  <span style={{ fontSize: '.6rem', color: 'var(--tx-3)', writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: 30 }}>{dayLabel}</span>
                </div>
              );
            })}
          </div>
          {(!recentByDay || recentByDay.length === 0) && (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--tx-3)', fontSize: '.85rem' }}>Chưa có dữ liệu</div>
          )}
        </div>

        {/* Mức độ khẩn cấp */}
        <div className="sr-report-card">
          <h3 className="sr-report-title"><AlertTriangle size={16} /> Theo mức độ khẩn cấp</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {Object.entries(URGENCY_MAP).map(([key, val]) => {
              const count = byUrgency[key] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: val.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--tx-2)', flex: 1 }}>{val.label}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: val.color, minWidth: 40, textAlign: 'right' }}>{count}</span>
                  <span style={{ fontSize: '.72rem', color: 'var(--tx-3)', minWidth: 40, textAlign: 'right' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════ TOP AGENCIES TABLE ═══════════ */}
      <div className="sr-report-card" style={{ marginBottom: 24 }}>
        <h3 className="sr-report-title"><MapPin size={16} /> Top Xã/Phường có nhiều yêu cầu nhất</h3>
        {topAgencies && topAgencies.length > 0 ? (
          <div style={{ marginTop: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, color: 'var(--tx-2)' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, color: 'var(--tx-2)' }}>Xã/Phường</th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 700, color: 'var(--tx-2)' }}>Tổng YC</th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 700, color: 'var(--tx-2)' }}>Đã xử lý</th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 700, color: 'var(--tx-2)' }}>Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {topAgencies.map((a, i) => {
                  const rate = a.count > 0 ? Math.round((a.resolved / a.count) * 100) : 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: '50%', display: 'inline-flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700,
                          background: i < 3 ? 'var(--primary)' : 'var(--surface-2)',
                          color: i < 3 ? '#fff' : 'var(--tx-3)'
                        }}>{i + 1}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>{a.count}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#10B981' }}>{a.resolved}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600,
                          background: rate >= 80 ? '#D1FAE5' : rate >= 50 ? '#FEF3C7' : '#FEE2E2',
                          color: rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444'
                        }}>{rate}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--tx-3)', fontSize: '.85rem' }}>Chưa có dữ liệu</div>
        )}
      </div>

      {/* ═══════════ REPORT SUMMARY ═══════════ */}
      <div className="sr-report-card">
        <h3 className="sr-report-title"><FileText size={16} /> Tổng hợp Báo cáo từ các Xã</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginTop: 16 }}>
          {[
            { label: 'Số lượt hỗ trợ', val: reportSummary.reportCount, icon: '✅' },
            { label: 'Đoàn viên đã cử', val: reportSummary.totalVolunteers, icon: '👥' },
            { label: 'Tổng giờ làm việc', val: reportSummary.totalHours, icon: '⏱️' },
            { label: 'Người được hỗ trợ', val: reportSummary.totalBeneficiaries, icon: '❤️' },
            { label: 'Đánh giá trung bình', val: reportSummary.avgSatisfaction ? `${reportSummary.avgSatisfaction.toFixed(1)} ⭐` : '—', icon: '⭐' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'var(--surface-2)', borderRadius: 12, padding: '16px 14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--tx-1)' }}>{item.val}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportReport;
