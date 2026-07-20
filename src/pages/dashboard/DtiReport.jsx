import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, Legend
} from 'recharts';
import {
  TrendingUp, Download, RefreshCw, Loader2, Globe, Smartphone,
  Shield, BookOpen, Building, QrCode, Users, FileSpreadsheet,
  CheckCircle, Target, Award, Zap
} from 'lucide-react';
import ExcelJS from 'exceljs';

// Chỉ tiêu toàn tỉnh (từ Phụ lục 1 của chiến dịch)
const DTI_TARGETS = {
  digitalSkills:   102 * 900,   // 91,800
  vneid:           102 * 500,   // 51,000
  publicServices:  102 * 300,   // 30,600
  qr:              102 * 90,    // 9,180
  smartweb:        102 * 20,    // 2,040
  youthTrained:    102 * 200,   // 20,400
  trainingClasses: 102 * 5,     // 510
  digitalProducts: 102 * 10,    // 1,020
  mediaPosts:      102 * 3,     // 306
  safetyCampaigns: 102 * 1,     // 102
};

const DTI_GROUPS = [
  {
    key: 'digitalTransformation',
    label: 'Kỹ năng số',
    color: '#0EA5E9',
    icon: Smartphone,
    items: ['digitalSkills', 'youthTrained', 'trainingClasses']
  },
  {
    key: 'publicService',
    label: 'Dịch vụ công',
    color: '#10B981',
    icon: Building,
    items: ['vneid', 'publicServices']
  },
  {
    key: 'digitalEconomy',
    label: 'Kinh tế số',
    color: '#F59E0B',
    icon: QrCode,
    items: ['qr', 'digitalProducts', 'smartweb']
  },
  {
    key: 'communication',
    label: 'Truyền thông số',
    color: '#9333EA',
    icon: Globe,
    items: ['mediaPosts', 'safetyCampaigns']
  }
];

const FIELD_LABELS = {
  digitalSkills:   { label: 'Lượt HT Kỹ năng số', unit: 'lượt', icon: '💻' },
  vneid:           { label: 'Lượt HT VNeID',       unit: 'lượt', icon: '🪪' },
  publicServices:  { label: 'DVC Trực tuyến',       unit: 'hồ sơ', icon: '🏛️' },
  qr:              { label: 'Hộ KD thanh toán QR', unit: 'hộ',   icon: '📱' },
  smartweb:        { label: 'Đăng ký SmartWeb',     unit: 'cơ sở', icon: '🌐' },
  youthTrained:    { label: 'Thanh niên học AI',    unit: 'người', icon: '🤖' },
  trainingClasses: { label: 'Lớp/điểm tập huấn',   unit: 'lớp',  icon: '📚' },
  digitalProducts: { label: 'Sản phẩm số địa phương', unit: 'SP', icon: '🛒' },
  mediaPosts:      { label: 'Tin bài truyền thông', unit: 'bài',  icon: '📣' },
  safetyCampaigns: { label: 'Chiến dịch an toàn số', unit: 'buổi', icon: '🛡️' },
};

// KPI Score Card component
const ScoreCard = ({ label, actual, target, color, icon, unit }) => {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  const getStatus = () => {
    if (pct >= 100) return { text: 'Đạt', bg: '#D1FAE5', color: '#059669' };
    if (pct >= 75)  return { text: 'Sắp đạt', bg: '#FEF3C7', color: '#D97706' };
    return { text: 'Cần nỗ lực', bg: '#FEE2E2', color: '#DC2626' };
  };
  const status = getStatus();
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: `2px solid ${color}20`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: '1.3rem' }}>{icon}</div>
        <span style={{ background: status.bg, color: status.color, padding: '3px 10px', borderRadius: 20, fontSize: '.75rem', fontWeight: 700 }}>{status.text}</span>
      </div>
      <div style={{ fontSize: '.82rem', color: 'var(--tx-3)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.7rem', fontWeight: 900, color, marginBottom: 2 }}>{actual.toLocaleString()}</div>
      <div style={{ fontSize: '.78rem', color: 'var(--tx-3)', marginBottom: 12 }}>Mục tiêu: {target.toLocaleString()} {unit}</div>
      <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 1s ease', boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: '.75rem', color, fontWeight: 700, marginTop: 4 }}>{pct}%</div>
    </div>
  );
};

const DtiReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeGroup, setActiveGroup] = useState('all');

  const fetch = async () => {
    setLoading(true);
    try {
      const [dtiRes, swRes] = await Promise.all([
        api.get('/campaign/dti-summary'),
        api.get('/smartweb/public-stats'),
      ]);
      setData({ ...dtiRes.data, smartweb: swRes.data?.total || 0, smartwebActive: swRes.data?.active || 0 });
    } catch {
      toast.error('Lỗi tải dữ liệu DTI');
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  // Xuất Excel báo cáo DTI
  const handleExportExcel = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('DTI Report 2026');
      ws.mergeCells('A1:G1');
      const titleCell = ws.getCell('A1');
      titleCell.value = 'BÁO CÁO TỔNG KẾT CHIẾN DỊCH 44 NGÀY ĐÊMCHUYỂN ĐỔI SỐ TỈNH ĐẮK LẮK 2026';
      titleCell.style = { font: { bold: true, size: 14, color: { argb: 'FF1a3a6b' } }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } } };
      ws.getRow(1).height = 40;

      ws.addRow([]);
      const headerRow = ws.addRow(['Chỉ tiêu', 'Đơn vị', 'Thực tế', 'Mục tiêu', 'Đạt (%)', 'Trạng thái', 'Ghi chú']);
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a6b' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      ws.getRow(3).height = 30;

      ws.columns = [
        { key: 'label', width: 35 },
        { key: 'unit', width: 12 },
        { key: 'actual', width: 15 },
        { key: 'target', width: 15 },
        { key: 'pct', width: 12 },
        { key: 'status', width: 15 },
        { key: 'note', width: 25 },
      ];

      const rows = Object.entries(FIELD_LABELS).map(([key, info]) => {
        const actual = key === 'smartweb' ? (data.smartwebRegistrations || 0) : (data[key] || data[key.replace(/([A-Z])/g, v => v.toLowerCase())] || 0);
        const target = DTI_TARGETS[key] || 0;
        const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
        return {
          label: `${info.icon} ${info.label}`,
          unit: info.unit,
          actual,
          target,
          pct: `${pct}%`,
          status: pct >= 100 ? '✅ Đạt' : pct >= 75 ? '⚠️ Sắp đạt' : '❌ Cần nỗ lực',
          note: ''
        };
      });

      rows.forEach((row, i) => {
        const r = ws.addRow(Object.values(row));
        if (i % 2 === 1) {
          r.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFF' } };
          });
        }
        r.alignment = { vertical: 'middle' };
      });

      // Footer
      ws.addRow([]);
      const dateRow = ws.addRow([`Xuất ngày: ${new Date().toLocaleDateString('vi-VN')} — Hệ thống Webgov Đắk Lắk`]);
      dateRow.getCell(1).font = { italic: true, color: { argb: 'FF94A3B8' } };

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DTI_Report_DakLak_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('✅ Xuất báo cáo DTI Excel thành công!');
    } catch (err) {
      toast.error('Lỗi xuất Excel: ' + err.message);
    }
    setExporting(false);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <Loader2 size={36} className="spin" />
      <p style={{ marginTop: 12, color: 'var(--tx-3)' }}>Đang tổng hợp số liệu DTI...</p>
    </div>
  );

  // Tính toán radar data
  const radarData = DTI_GROUPS.map(g => {
    const groupTotal = g.items.reduce((sum, key) => {
      const actual = key === 'smartweb' ? (data?.smartwebRegistrations || 0) : (data?.[key] || 0);
      const target = DTI_TARGETS[key] || 1;
      return sum + Math.min(100, (actual / target) * 100);
    }, 0);
    return { subject: g.label, A: Math.round(groupTotal / g.items.length), fullMark: 100 };
  });

  // Tổng điểm DTI
  const overallScore = Math.round(radarData.reduce((s, r) => s + r.A, 0) / radarData.length);

  // Bar chart data — so sánh actual vs target
  const barData = Object.entries(FIELD_LABELS).map(([key, info]) => {
    const actual = key === 'smartweb' ? (data?.smartwebRegistrations || 0) : (data?.[key] || 0);
    const target = DTI_TARGETS[key] || 0;
    return {
      name: info.icon + ' ' + info.label.substring(0, 18),
      'Thực tế': actual,
      'Chỉ tiêu': target,
      pct: target > 0 ? Math.round((actual / target) * 100) : 0
    };
  });

  return (
    <div className="animate-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={24} color="var(--primary)" /> Báo cáo Tổng kết DTI
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.9rem' }}>
            Chỉ số Chuyển đổi số Tỉnh Đắk Lắk — Chiến dịch 44 ngày đêm 2026
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={fetch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} /> Làm mới
          </button>
          <button className="btn btn-primary" onClick={handleExportExcel} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {exporting ? <Loader2 size={16} className="spin" /> : <FileSpreadsheet size={16} />}
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>

      {/* Overall Score Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a6b 0%, #0ea5e9 100%)',
        borderRadius: 20, padding: '28px 36px', marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, color: 'white'
      }}>
        <div>
          <div style={{ fontSize: '.85rem', opacity: 0.8, fontWeight: 600, marginBottom: 8 }}>🏆 CHỈ SỐ DTI TỔNG HỢP</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1 }}>{overallScore}</div>
            <div style={{ fontSize: '1.5rem', opacity: 0.7 }}>/100</div>
          </div>
          <div style={{ fontSize: '.9rem', opacity: 0.85, marginTop: 8 }}>
            {overallScore >= 80 ? '🎉 Xuất sắc — Đắk Lắk đang dẫn đầu!' :
             overallScore >= 60 ? '📈 Tốt — Tiếp tục phấn đấu!' :
             '💪 Cần nỗ lực hơn trong những ngày còn lại'}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            { label: 'Số xã báo cáo', val: data?.reportCount || 0, icon: '📋' },
            { label: 'Tình nguyện viên', val: (data?.volunteers || 0).toLocaleString(), icon: '👥' },
            { label: 'SmartWeb đăng ký', val: data?.smartwebRegistrations || 0, icon: '🌐' },
            { label: 'Website Active', val: data?.smartwebActive || 0, icon: '🚀' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 12 }}>
              <div style={{ fontSize: '1.1rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{s.val}</div>
              <div style={{ fontSize: '.72rem', opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Group filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'Tất cả', color: '#1a3a6b' }, ...DTI_GROUPS].map(g => (
          <button key={g.key} onClick={() => setActiveGroup(g.key)} style={{
            padding: '8px 18px', borderRadius: 20, border: '2px solid',
            borderColor: activeGroup === g.key ? g.color : 'var(--border)',
            background: activeGroup === g.key ? g.color : 'transparent',
            color: activeGroup === g.key ? 'white' : 'var(--tx-2)',
            fontWeight: 700, cursor: 'pointer', transition: 'all .15s', fontSize: '.85rem'
          }}>
            {g.label}
          </button>
        ))}
      </div>

      {/* KPI Score Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {Object.entries(FIELD_LABELS).filter(([key]) => {
          if (activeGroup === 'all') return true;
          const group = DTI_GROUPS.find(g => g.key === activeGroup);
          return group?.items.includes(key);
        }).map(([key, info]) => {
          const actual = key === 'smartweb' ? (data?.smartwebRegistrations || 0) : (data?.[key] || 0);
          return (
            <ScoreCard
              key={key}
              label={info.label}
              actual={actual}
              target={DTI_TARGETS[key] || 0}
              color={DTI_GROUPS.find(g => g.items.includes(key))?.color || '#1a3a6b'}
              icon={info.icon}
              unit={info.unit}
            />
          );
        })}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Radar chart */}
        <div className="card">
          <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color="#9333EA" /> Biểu đồ DTI theo Nhóm
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" style={{ fontSize: '.8rem' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar name="Đạt được %" dataKey="A" stroke="#1a3a6b" fill="#1a3a6b" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip formatter={(v) => [`${v}%`, 'Mức đạt']} contentStyle={{ borderRadius: 10, fontFamily: 'inherit', fontSize: '.85rem' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart actual vs target */}
        <div className="card">
          <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} color="#F59E0B" /> Thực tế vs Chỉ tiêu
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" axisLine={false} tickLine={false} style={{ fontSize: '.72rem' }} />
              <YAxis type="category" dataKey="name" width={130} axisLine={false} tickLine={false} style={{ fontSize: '.72rem' }} />
              <Tooltip contentStyle={{ borderRadius: 10, fontFamily: 'inherit', fontSize: '.82rem' }} formatter={(v) => [v.toLocaleString()]} />
              <Bar dataKey="Thực tế" fill="#1a3a6b" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Chỉ tiêu" fill="#E2E8F0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nhóm DTI detail cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
        {DTI_GROUPS.map(g => {
          const GIcon = g.icon;
          const groupItems = g.items.map(key => {
            const actual = key === 'smartweb' ? (data?.smartwebRegistrations || 0) : (data?.[key] || 0);
            const target = DTI_TARGETS[key] || 1;
            const pct = Math.min(100, Math.round((actual / target) * 100));
            return { key, ...FIELD_LABELS[key], actual, target, pct };
          });
          const avgPct = Math.round(groupItems.reduce((s, i) => s + i.pct, 0) / groupItems.length);
          return (
            <div key={g.key} className="card animate-up" style={{ borderTop: `4px solid ${g.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: g.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GIcon size={20} color={g.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#1a3a6b', fontSize: '.95rem' }}>{g.label}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--tx-3)' }}>{g.items.length} chỉ tiêu</div>
                  </div>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: g.color }}>{avgPct}%</div>
              </div>
              {groupItems.map(item => (
                <div key={item.key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 3 }}>
                    <span style={{ color: 'var(--tx-2)' }}>{item.icon} {item.label}</span>
                    <span style={{ fontWeight: 700, color: g.color }}>{item.actual.toLocaleString()}/{item.target.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: g.color, borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DtiReport;
