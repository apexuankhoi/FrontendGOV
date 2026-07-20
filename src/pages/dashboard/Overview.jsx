import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts';
import {
  Map, Users, Hammer, Clock, CheckCircle, Printer,
  Globe, QrCode, Smartphone, Shield, TrendingUp, Zap, RefreshCw
} from 'lucide-react';

const COLORS = ['#1a3a6b', '#10B981', '#F59E0B', '#9333EA', '#EF4444'];

// Ngày bắt đầu chiến dịch (điều chỉnh theo thực tế)
const CAMPAIGN_START = new Date('2026-07-01T00:00:00');
const CAMPAIGN_DAYS = 44;
const CAMPAIGN_END = new Date(CAMPAIGN_START.getTime() + CAMPAIGN_DAYS * 24 * 60 * 60 * 1000);

const useCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const diff = CAMPAIGN_END - now;
      if (diff <= 0) return setTimeLeft({ ended: true });
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
};

// Progress bar component
const ProgressBar = ({ value, max, color = '#1a3a6b', label }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: 4 }}>
        <span style={{ color: 'var(--tx-2)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value?.toLocaleString()} <span style={{ color: 'var(--tx-3)', fontWeight: 400 }}>/ {max?.toLocaleString()}</span></span>
      </div>
      <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 4, transition: 'width 1s ease',
          boxShadow: `0 0 8px ${color}60`
        }} />
      </div>
    </div>
  );
};

const Overview = () => {
  const [teams, setTeams] = useState([]);
  const [campaignStats, setCampaignStats] = useState(null);
  const [smartwebStats, setSmartwebStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const countdown = useCountdown();
  const role = localStorage.getItem('role') || '';

  const elapsed = Math.max(1, Math.floor((new Date() - CAMPAIGN_START) / (1000 * 60 * 60 * 24)));
  const campaignProgress = Math.min(100, Math.round((elapsed / CAMPAIGN_DAYS) * 100));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, statsRes, swRes] = await Promise.all([
        api.get('/teams/admin').catch(() => ({ data: [] })),
        api.get('/campaign/stats').catch(() => ({ data: {} })),
        api.get('/smartweb/public-stats').catch(() => ({ data: {} }))
      ]);
      setTeams(teamsRes.data || []);
      setCampaignStats(statsRes.data || {});
      setSmartwebStats(swRes.data || {});
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const approved = teams.filter(t => t.status === 'APPROVED');
  const pending = teams.filter(t => t.status === 'PENDING');
  const totalVolunteers = teams.reduce((s, t) => s + (t.statistics?.volunteersCount || 0), 0);
  const totalProjects = teams.reduce((s, t) => s + (t.statistics?.projectsCount || 0), 0);

  const districtData = {};
  teams.forEach(t => {
    const d = t.location?.district || 'Khác';
    districtData[d] = (districtData[d] || 0) + 1;
  });
  const barData = Object.entries(districtData).map(([name, count]) => ({ name: name.replace('Huyện ', ''), count }));

  const pieData = [
    { name: 'Đã duyệt', value: approved.length },
    { name: 'Chờ duyệt', value: pending.length },
  ].filter(d => d.value > 0);

  // Chỉ tiêu toàn tỉnh (ước tính dựa trên trung bình các nhóm × số xã)
  const TARGET = {
    digitalSkills: 102 * 900,  // ≈91800
    vneid: 102 * 500,          // ≈51000
    qr: 102 * 90,              // ≈9180
    publicServices: 102 * 300, // ≈30600
    smartweb: 102 * 20,        // ≈2040
    activeAgencies: 102,
  };

  const cs = campaignStats || {};
  const sw = smartwebStats || {};

  return (
    <div className="animate-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2>Dashboard Tổng quan</h2>
          <p>Chiến dịch 44 ngày đêm — Thanh niên Đắk Lắk tiên phong chuyển đổi số</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={fetchAll} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} /> Làm mới
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => window.print()}>
            <Printer size={16} /> Xuất Báo cáo
          </button>
        </div>
      </div>

      {/* ════ COUNTDOWN TIMER ════ */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a6b 0%, #0ea5e9 100%)',
        borderRadius: 20, padding: '24px 32px', marginBottom: 24, color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20
      }}>
        <div>
          <div style={{ fontSize: '.85rem', opacity: 0.8, fontWeight: 600, marginBottom: 6 }}>⏳ CHIẾN DỊCH KẾT THÚC SAU</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {countdown.ended ? (
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>🎉 Chiến dịch đã kết thúc!</span>
            ) : (
              ['days', 'hours', 'minutes', 'seconds'].map((unit, i) => (
                <React.Fragment key={unit}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {String(countdown[unit] || 0).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: '.7rem', opacity: 0.75, fontWeight: 600, marginTop: 4, textTransform: 'uppercase' }}>
                      {['Ngày', 'Giờ', 'Phút', 'Giây'][i]}
                    </div>
                  </div>
                  {i < 3 && <div style={{ fontSize: '2rem', opacity: 0.5, fontWeight: 200, marginTop: -8 }}>:</div>}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '.85rem', opacity: 0.8, marginBottom: 8 }}>Tiến độ chiến dịch</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{campaignProgress}%</div>
          <div style={{ width: 200, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${campaignProgress}%`, height: '100%', background: 'white', borderRadius: 3, transition: 'width 1s ease' }} />
          </div>
          <div style={{ fontSize: '.75rem', opacity: 0.7, marginTop: 6 }}>Ngày {elapsed} / {CAMPAIGN_DAYS}</div>
        </div>
      </div>

      {/* ════ KPI STAT CARDS ════ */}
      <div className="overview-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: Map,        val: teams.length,                    label: 'Tổng đội hình',      color: '#1a3a6b' },
          { icon: CheckCircle,val: approved.length,                 label: 'Đã duyệt',           color: '#10B981' },
          { icon: Clock,      val: pending.length,                  label: 'Chờ duyệt',          color: '#F59E0B' },
          { icon: Users,      val: (cs.volunteers||totalVolunteers).toLocaleString(), label: 'Tình nguyện viên', color: '#9333EA' },
          { icon: Smartphone, val: (cs.digitalSkills||0).toLocaleString(), label: 'Lượt HT kỹ năng số', color: '#0EA5E9' },
          { icon: QrCode,     val: (cs.qr||0).toLocaleString(),     label: 'Hộ KD hỗ trợ QR',   color: '#F97316' },
          { icon: Globe,      val: (sw.total||0).toLocaleString(),  label: 'ĐK SmartWeb',        color: '#6366F1' },
          { icon: TrendingUp, val: (cs.activeAgencies||0)+'/'+cs.totalAgencies, label: 'Xã đã báo cáo', color: '#DC2626' },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={22} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ════ TIẾN ĐỘ THỰC TẾ vs CHỈ TIÊU ════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card animate-up delay-2">
          <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#1a3a6b" /> Tiến độ thực tế vs Chỉ tiêu
          </h4>
          <ProgressBar value={cs.digitalSkills||0} max={TARGET.digitalSkills} color="#0EA5E9" label="💻 Kỹ năng số" />
          <ProgressBar value={cs.vneid||0} max={TARGET.vneid} color="#10B981" label="🪪 VNeID" />
          <ProgressBar value={cs.qr||0} max={TARGET.qr} color="#F59E0B" label="📱 QR Thanh toán" />
          <ProgressBar value={cs.publicServices||0} max={TARGET.publicServices} color="#6366F1" label="🏛️ DVC Trực tuyến" />
          <ProgressBar value={sw.total||0} max={TARGET.smartweb} color="#1a3a6b" label="🌐 SmartWeb" />
          <ProgressBar value={cs.activeAgencies||0} max={TARGET.activeAgencies} color="#DC2626" label="🏘️ Xã đã ra quân" />
        </div>

        <div className="card animate-up delay-3">
          <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} color="#6366F1" /> SmartWeb — Trạng thái tiểu thương
          </h4>
          {[
            { label: 'Tổng đăng ký', val: sw.total||0, color: '#6366F1', pct: 100 },
            { label: 'Có tên miền .VN', val: sw.registered||0, color: '#F59E0B', pct: sw.total > 0 ? Math.round(sw.registered/sw.total*100) : 0 },
            { label: 'Website hoạt động', val: sw.active||0, color: '#10B981', pct: sw.total > 0 ? Math.round(sw.active/sw.total*100) : 0 },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                <span style={{ fontSize: '.9rem', color: 'var(--tx-2)' }}>{r.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: '.8rem', color: 'var(--tx-3)' }}>{r.pct}%</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: r.color }}>{r.val.toLocaleString()}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '100%', background: '#6366F130', borderRadius: 4 }} />
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${sw.total > 0 ? sw.registered/sw.total*100 : 0}%`, background: '#F59E0B', borderRadius: 4, transition: 'width 1s' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${sw.total > 0 ? sw.active/sw.total*100 : 0}%`, background: '#10B981', borderRadius: 4, transition: 'width 1s' }} />
          </div>
        </div>
      </div>

      {/* ════ CHARTS ════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card animate-up delay-2">
          <h4 style={{ marginBottom: 20 }}>Phân bố đội hình theo Huyện/Thị</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} dy={8} style={{ fontSize: '0.78rem' }} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'rgba(26,58,107,0.05)' }}
                contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.88rem', boxShadow: 'var(--shadow-lg)' }}
              />
              <Bar dataKey="count" fill="url(#blueGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} name="Số đội hình" />
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a3a6b" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card animate-up delay-3">
          <h4 style={{ marginBottom: 20 }}>Tỉ lệ kiểm duyệt đội hình</h4>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.85rem', fontFamily: 'inherit' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p>Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
