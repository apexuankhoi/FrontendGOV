import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileInput, FileOutput, AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const COLORS = ['#0056D6', '#00A86B', '#DD6B20', '#E53E3E', '#9333EA', '#0891B2'];
const URGENCY_COLORS = { 'Thường': 'badge-info', 'Khẩn': 'badge-warning', 'Thượng khẩn': 'badge-danger', 'Hỏa tốc': 'badge-danger' };

const EofficeDashboard = () => {
  const [docStats, setDocStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [generatingReport, setGeneratingReport] = useState(false);
  const [aiReportContent, setAiReportContent] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/documents/stats'),
      api.get('/tasks/stats'),
      api.get('/tasks/overdue')
    ]).then(([docRes, taskRes, overdueRes]) => {
      setDocStats(docRes.data);
      setTaskStats(taskRes.data);
      setOverdueTasks(overdueRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const generateAiReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await api.get('/documents/ai-report');
      setAiReportContent(res.data.report);
      toast.success('AI đã viết xong báo cáo!');
    } catch (err) {
      toast.error('Lỗi khi tạo báo cáo: ' + (err.response?.data?.message || err.message));
    }
    setGeneratingReport(false);
  };

  if (loading) {
    return <div className="empty-state"><div className="empty-state-icon">⏳</div><h4>Đang tải dữ liệu...</h4></div>;
  }

  // Dữ liệu biểu đồ tháng
  const monthNames = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const monthlyData = {};
  (docStats?.monthlyStats || []).forEach(s => {
    const key = `${monthNames[s._id.month]}/${s._id.year}`;
    if (!monthlyData[key]) monthlyData[key] = { name: key, 'VB Đến': 0, 'VB Đi': 0 };
    if (s._id.type === 'INCOMING') monthlyData[key]['VB Đến'] = s.count;
    else monthlyData[key]['VB Đi'] = s.count;
  });
  const barData = Object.values(monthlyData);

  // Dữ liệu biểu đồ tròn công việc
  const pieData = taskStats ? [
    { name: 'Hoàn thành', value: taskStats.completed },
    { name: 'Đang thực hiện', value: taskStats.inProgress },
    { name: 'Chưa thực hiện', value: taskStats.pending },
    { name: 'Quá hạn', value: taskStats.overdue }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="animate-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>📊 eOffice Dashboard</h2>
          <p>Tổng quan điều hành văn bản & công việc</p>
        </div>
        <button 
          onClick={generateAiReport} 
          disabled={generatingReport}
          className="premium-btn" 
          style={{ width: 'auto', padding: '10px 20px', background: 'var(--brand-blue)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          {generatingReport ? 'Đang viết báo cáo...' : <><Bot size={18} /> AI Viết Báo Cáo Tháng</>}
        </button>
      </div>

      {/* AI Report Modal */}
      {aiReportContent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', borderRadius: '12px 12px 0 0' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-blue)' }}><Bot size={22}/> AI Báo Cáo Tháng</h3>
              <button onClick={() => setAiReportContent('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)' }}>Đóng</button>
            </div>
            <div style={{ padding: 24, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem', color: 'var(--tx-1)' }}>
              {aiReportContent}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { navigator.clipboard.writeText(aiReportContent); toast.success('Đã copy!'); }} className="btn btn-outline">Copy Text</button>
              <button onClick={() => setAiReportContent('')} className="btn btn-primary">Xong</button>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="overview-grid" style={{ marginBottom: 28 }}>
        {[
          { icon: FileInput, val: docStats?.totalIncoming || 0, label: 'Văn bản đến', color: '#0056D6', link: '/dashboard/eoffice/incoming' },
          { icon: FileOutput, val: docStats?.totalOutgoing || 0, label: 'Văn bản đi', color: '#0891B2', link: '/dashboard/eoffice/outgoing' },
          { icon: Clock, val: docStats?.pendingCount || 0, label: 'Chờ xử lý', color: '#DD6B20', link: '/dashboard/eoffice/incoming' },
          { icon: AlertTriangle, val: (taskStats?.overdue || 0) + (docStats?.overdueCount || 0), label: 'Quá hạn', color: '#E53E3E', link: '/dashboard/eoffice/tasks' },
          { icon: CheckCircle, val: `${taskStats?.completionRate || 0}%`, label: 'Tỷ lệ hoàn thành', color: '#00A86B' },
          { icon: Zap, val: docStats?.urgentCount || 0, label: 'Văn bản khẩn', color: '#9333EA' },
        ].map((s, i) => (
          <Link key={i} to={s.link || '#'} className="stat-card animate-up" style={{ animationDelay: `${i * 60}ms`, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={22} color={s.color} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
        <div className="card animate-up delay-2">
          <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--brand-blue)" /> Văn bản theo tháng
          </h4>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={8} style={{ fontSize: '0.78rem' }} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.88rem', boxShadow: 'var(--shadow-lg)' }} />
                <Bar dataKey="VB Đến" fill="#0056D6" radius={[6, 6, 0, 0]} maxBarSize={35} />
                <Bar dataKey="VB Đi" fill="#0891B2" radius={[6, 6, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📊</div><p>Chưa có dữ liệu</p></div>
          )}
        </div>

        <div className="card animate-up delay-3">
          <h4 style={{ marginBottom: 20 }}>Tỉ lệ công việc</h4>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.85rem', fontFamily: 'inherit' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📊</div><p>Chưa có dữ liệu</p></div>
          )}
        </div>
      </div>

      {/* ── Quá hạn & VB Khẩn ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Công việc quá hạn */}
        <div className="card animate-up delay-4">
          <h4 style={{ marginBottom: 16, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} /> Công việc quá hạn ({overdueTasks.length})
          </h4>
          {overdueTasks.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '.88rem', textAlign: 'center', padding: 20 }}>
              ✅ Không có công việc quá hạn
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
              {overdueTasks.slice(0, 8).map(t => (
                <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--danger-bg)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--danger)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--tx-1)' }}>{t.title}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--danger)', marginTop: 2 }}>
                      Hạn: {t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN') : 'N/A'}
                      {t.assignedTo && ` — ${t.assignedTo.username}`}
                    </div>
                  </div>
                  <span className="badge badge-danger" style={{ flexShrink: 0 }}>Quá hạn</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* VB khẩn gần đây */}
        <div className="card animate-up delay-5">
          <h4 style={{ marginBottom: 16, color: '#9333EA', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} /> Văn bản mới nhất
          </h4>
          {(docStats?.recentIncoming || []).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '.88rem', textAlign: 'center', padding: 20 }}>
              Chưa có văn bản nào
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
              {(docStats?.recentIncoming || []).map(d => (
                <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', borderLeft: '3px solid #0056D6' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{d.summary || d.documentNumber || 'Chưa có trích yếu'}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 2 }}>
                      {d.documentNumber && `#${d.documentNumber} — `}
                      {new Date(d.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <span className={`badge ${URGENCY_COLORS[d.urgency] || 'badge-info'}`} style={{ flexShrink: 0 }}>{d.urgency}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EofficeDashboard;
