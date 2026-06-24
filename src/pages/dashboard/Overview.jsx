import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Map, Users, Hammer, Clock, CheckCircle, Printer } from 'lucide-react';

const COLORS = ['#0056D6', '#00A86B', '#DD6B20', '#9333EA', '#E53E3E'];

const Overview = () => {
  const [teams, setTeams] = useState([]);
  const role = localStorage.getItem('role') || '';

  useEffect(() => {
    api.get('/teams/admin').then(res => setTeams(res.data)).catch(() => {});
  }, []);

  const approved = teams.filter(t => t.status === 'APPROVED');
  const pending = teams.filter(t => t.status === 'PENDING');
  const totalVolunteers = teams.reduce((s, t) => s + (t.statistics?.volunteersCount || 0), 0);
  const totalProjects = teams.reduce((s, t) => s + (t.statistics?.projectsCount || 0), 0);

  // Dữ liệu biểu đồ cột - phân bố theo huyện
  const districtData = {};
  teams.forEach(t => {
    const d = t.location?.district || 'Khác';
    districtData[d] = (districtData[d] || 0) + 1;
  });
  const barData = Object.entries(districtData).map(([name, count]) => ({ name: name.replace('Huyện ', ''), count }));

  // Dữ liệu biểu đồ tròn - trạng thái
  const pieData = [
    { name: 'Đã duyệt', value: approved.length },
    { name: 'Chờ duyệt', value: pending.length },
  ].filter(d => d.value > 0);

  return (
    <div className="animate-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Dashboard Tổng quan</h2>
          <p>Theo dõi tiến độ chiến dịch Mùa Hè Xanh Đắk Lắk 2026</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => window.print()}>
          <Printer size={16} /> Xuất Báo cáo
        </button>
      </div>

      {/* Stat Cards */}
      <div className="overview-grid" style={{ marginBottom: 28 }}>
        {[
          { icon: Map, val: teams.length, label: 'Tổng số đội hình', color: 'var(--brand-blue)' },
          { icon: CheckCircle, val: approved.length, label: 'Đã được duyệt', color: 'var(--brand-green)' },
          { icon: Clock, val: pending.length, label: 'Đang chờ duyệt', color: 'var(--warning)' },
          { icon: Users, val: totalVolunteers.toLocaleString(), label: 'Tình nguyện viên', color: '#9333EA' },
          { icon: Hammer, val: totalProjects, label: 'Công trình thanh niên', color: 'var(--danger)' },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={22} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card animate-up delay-2">
          <h4 style={{ marginBottom: 20 }}>Phân bố đội hình theo Huyện/Thị</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} dy={8} style={{ fontSize: '0.78rem' }} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,86,214,0.05)' }}
                contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.88rem', boxShadow: 'var(--shadow-lg)' }}
              />
              <Bar dataKey="count" fill="var(--brand-blue)" radius={[6, 6, 0, 0]} maxBarSize={40} name="Số đội hình" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card animate-up delay-3">
          <h4 style={{ marginBottom: 20 }}>Tỉ lệ kiểm duyệt</h4>
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
