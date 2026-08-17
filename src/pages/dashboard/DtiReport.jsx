import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingUp, RefreshCw, Loader2, Globe, Smartphone,
  Building, QrCode, FileSpreadsheet, Target, Award, Zap,
  Sparkles, Layers
} from 'lucide-react';
import ExcelJS from 'exceljs';

// 11 CHỈ TIÊU TOÀN TỈNH (THEO QUYẾT ĐỊNH CHIẾN DỊCH)
const DTI_TARGETS = {
  digitalSkills:   100000, // 1. Lượt người dân tiếp cận kỹ năng số
  vneid:           50000,  // 2. Kích hoạt VNeID mức 2
  publicServices:  30000,  // 3. Hỗ trợ DVC trực tuyến
  qr:              10000,  // 4. Hộ KD/tiểu thương dùng QR
  activeTeams:     102,    // 5. Đội hình Thanh niên số (100% xã >= 1)
  trainingClasses: 500,    // 6. Lớp/điểm tập huấn KNS
  digitalModels:   102,    // 7. Mô hình điểm CĐS cấp xã/phường
  digitalProducts: 1000,   // 8. Sản phẩm OCOP/địa phương số hóa
  youthTrained:    20000,  // 9. Đoàn viên tập huấn AI & an toàn số
  youthProjects:   102,    // 10. Công trình thanh niên CĐS (100% xã >= 1)
  smartweb:        102,    // 11. Website AI.VN SmartWeb cho HKD/HTX
};

const DTI_GROUPS = [
  {
    key: 'digitalSkillsPillar',
    label: 'Kỹ năng số & Đào tạo AI',
    color: '#0EA5E9',
    icon: Smartphone,
    items: ['digitalSkills', 'youthTrained', 'trainingClasses']
  },
  {
    key: 'publicServicePillar',
    label: 'Chính quyền số & DVC',
    color: '#10B981',
    icon: Building,
    items: ['vneid', 'publicServices', 'activeTeams']
  },
  {
    key: 'digitalEconomyPillar',
    label: 'Kinh tế số & SmartWeb',
    color: '#F59E0B',
    icon: QrCode,
    items: ['qr', 'digitalProducts', 'smartweb']
  },
  {
    key: 'infrastructurePillar',
    label: 'Mô hình & Công trình CĐS',
    color: '#9333EA',
    icon: Zap,
    items: ['digitalModels', 'youthProjects']
  }
];

const FIELD_LABELS = {
  digitalSkills:   { index: 1, label: '1. Tiếp cận Kỹ năng số', unit: 'lượt', icon: '💻' },
  vneid:           { index: 2, label: '2. Kích hoạt VNeID mức 2', unit: 'lượt', icon: '🪪' },
  publicServices:  { index: 3, label: '3. DVC Trực tuyến', unit: 'hồ sơ', icon: '🏛️' },
  qr:              { index: 4, label: '4. Hộ KD dùng QR', unit: 'hộ', icon: '📱' },
  activeTeams:     { index: 5, label: '5. Đội hình TN số', unit: 'đội hình', icon: '🏃' },
  trainingClasses: { index: 6, label: '6. Lớp/Điểm tập huấn KNS', unit: 'lớp/điểm', icon: '📚' },
  digitalModels:   { index: 7, label: '7. Mô hình điểm CĐS', unit: 'mô hình', icon: '🏪' },
  digitalProducts: { index: 8, label: '8. SP OCOP/Địa phương', unit: 'SP', icon: '🛒' },
  youthTrained:    { index: 9, label: '9. ĐVTN tập huấn AI', unit: 'đoàn viên', icon: '🤖' },
  youthProjects:   { index: 10, label: '10. Công trình TN CĐS', unit: 'công trình', icon: '⚡' },
  smartweb:        { index: 11, label: '11. Website SmartWeb', unit: 'website', icon: '🌐' },
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
    <div style={{ background: 'white', borderRadius: 16, padding: 18, border: `2px solid ${color}20`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: color }} />
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ fontSize: '1.4rem' }}>{icon}</div>
          <span style={{ background: status.bg, color: status.color, padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 700 }}>{status.text}</span>
        </div>
        <div style={{ fontSize: '.84rem', color: 'var(--tx-2)', marginBottom: 2, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: '1.65rem', fontWeight: 900, color, marginBottom: 2 }}>{actual.toLocaleString('vi-VN')}</div>
        <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginBottom: 12 }}>Mục tiêu: {target.toLocaleString('vi-VN')} {unit}</div>
      </div>
      <div>
        <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 1s ease', boxShadow: `0 0 8px ${color}60` }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: '.75rem', color, fontWeight: 700, marginTop: 4 }}>{pct}%</div>
      </div>
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
      const swTotal = swRes.data?.total || 0;
      setData({
        ...dtiRes.data,
        smartweb: Math.max(dtiRes.data?.smartwebCount || 0, swTotal),
        smartwebRegistrations: swTotal,
        smartwebActive: swRes.data?.active || 0
      });
    } catch {
      toast.error('Lỗi tải dữ liệu DTI');
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  // Xuất Excel báo cáo DTI 11 chỉ tiêu
  const handleExportExcel = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('DTI 11 Chi Tieu 2026');
      ws.mergeCells('A1:G1');
      const titleCell = ws.getCell('A1');
      titleCell.value = 'BÁO CÁO ĐÁNH GIÁ 11 CHỈ TIÊU CHUYỂN ĐỔI SỐ — CHIẾN DỊCH 44 NGÀY ĐÊM 2026';
      titleCell.style = { font: { bold: true, size: 14, color: { argb: 'FF1a3a6b' } }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } } };
      ws.getRow(1).height = 40;

      ws.addRow([]);
      const headerRow = ws.addRow(['STT', 'Chỉ tiêu chuyển đổi số', 'Đơn vị', 'Thực tế lũy kế', 'Mục tiêu tỉnh', 'Đạt (%)', 'Đánh giá']);
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a6b' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      ws.getRow(3).height = 30;

      ws.columns = [
        { key: 'stt', width: 8 },
        { key: 'label', width: 40 },
        { key: 'unit', width: 14 },
        { key: 'actual', width: 18 },
        { key: 'target', width: 18 },
        { key: 'pct', width: 14 },
        { key: 'status', width: 18 },
      ];

      const rows = Object.entries(FIELD_LABELS).map(([key, info]) => {
        const actual = key === 'smartweb' ? (data.smartweb || 0) : (data[key] || 0);
        const target = DTI_TARGETS[key] || 0;
        const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
        return {
          stt: info.index,
          label: `${info.icon} ${info.label}`,
          unit: info.unit,
          actual,
          target,
          pct: `${pct}%`,
          status: pct >= 100 ? '✅ Hoàn thành' : pct >= 75 ? '⚠️ Sắp đạt' : '❌ Cần nỗ lực',
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

      ws.addRow([]);
      const dateRow = ws.addRow([`Xuất ngày: ${new Date().toLocaleDateString('vi-VN')} — Hệ thống Quản trị Webgov Đắk Lắk`]);
      dateRow.getCell(1).font = { italic: true, color: { argb: 'FF94A3B8' } };

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DTI_11_Chi_Tieu_DakLak_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('✅ Xuất báo cáo DTI 11 chỉ tiêu Excel thành công!');
    } catch (err) {
      toast.error('Lỗi xuất Excel: ' + err.message);
    }
    setExporting(false);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <Loader2 size={36} className="spin" style={{ color: 'var(--primary)' }} />
      <p style={{ marginTop: 14, color: 'var(--tx-3)', fontWeight: 500 }}>Đang tổng hợp số liệu 11 chỉ tiêu DTI...</p>
    </div>
  );

  // Tính toán radar data theo 4 trụ cột
  const radarData = DTI_GROUPS.map(g => {
    const groupTotal = g.items.reduce((sum, key) => {
      const actual = key === 'smartweb' ? (data?.smartweb || 0) : (data?.[key] || 0);
      const target = DTI_TARGETS[key] || 1;
      return sum + Math.min(100, (actual / target) * 100);
    }, 0);
    return { subject: g.label, A: Math.round(groupTotal / g.items.length), fullMark: 100 };
  });

  // Tổng điểm DTI trung bình trên 11 chỉ tiêu
  const allPcts = Object.entries(FIELD_LABELS).map(([key]) => {
    const actual = key === 'smartweb' ? (data?.smartweb || 0) : (data?.[key] || 0);
    const target = DTI_TARGETS[key] || 1;
    return Math.min(100, (actual / target) * 100);
  });
  const overallScore = Math.round(allPcts.reduce((s, p) => s + p, 0) / allPcts.length);

  // Bar chart data
  const barData = Object.entries(FIELD_LABELS).map(([key, info]) => {
    const actual = key === 'smartweb' ? (data?.smartweb || 0) : (data?.[key] || 0);
    const target = DTI_TARGETS[key] || 0;
    return {
      name: info.icon + ' ' + info.label.substring(0, 18),
      'Thực tế': actual,
      'Chỉ tiêu': target,
      pct: target > 0 ? Math.round((actual / target) * 100) : 0
    };
  });

  return (
    <div className="animate-up" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <TrendingUp size={26} color="var(--primary)" />
            Báo cáo Đánh giá 11 Chỉ tiêu DTI Toàn tỉnh
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.9rem', marginTop: 4 }}>
            Theo dõi tiến độ thực hiện 11 tiêu chí chuyển đổi số Chiến dịch 44 ngày đêm 2026
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={fetch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} /> Làm mới
          </button>
          <button className="btn btn-primary" onClick={handleExportExcel} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {exporting ? <Loader2 size={16} className="spin" /> : <FileSpreadsheet size={16} />}
            {exporting ? 'Đang xuất...' : 'Xuất Excel 11 Chỉ tiêu'}
          </button>
        </div>
      </div>

      {/* Overall Score Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a6b 0%, #0ea5e9 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 26,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, color: 'white'
      }}>
        <div>
          <div style={{ fontSize: '.85rem', opacity: 0.8, fontWeight: 700, marginBottom: 6 }}>
            🏆 ĐIỂM TIẾN ĐỘ 11 CHỈ TIÊU DTI TỔNG HỢP
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div style={{ fontSize: '3.8rem', fontWeight: 900, lineHeight: 1 }}>{overallScore}</div>
            <div style={{ fontSize: '1.4rem', opacity: 0.75 }}>/100%</div>
          </div>
          <div style={{ fontSize: '.88rem', opacity: 0.9, marginTop: 8 }}>
            {overallScore >= 80 ? '🎉 Xuất sắc — Toàn tỉnh đang hoàn thành vượt tiến độ!' :
             overallScore >= 50 ? '📈 Khá — Các đơn vị đang đẩy mạnh hoàn thành mục tiêu!' :
             '💪 Cần đôn đốc 102 xã/phường tăng tốc hoàn thành đủ 11 chỉ tiêu.'}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { label: 'Số xã đã báo cáo', val: data?.reportCount || 0, icon: '📋' },
            { label: 'Tình nguyện viên', val: (data?.volunteers || 0).toLocaleString('vi-VN'), icon: '👥' },
            { label: 'Đội hình TN số', val: data?.activeTeams || 0, icon: '🏃' },
            { label: 'Công trình CĐS', val: data?.youthProjects || 0, icon: '⚡' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', padding: '10px 16px', borderRadius: 12, backdropFilter: 'blur(5px)' }}>
              <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{s.val}</div>
              <div style={{ fontSize: '.72rem', opacity: 0.85 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Group filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'Tất cả 11 Chỉ tiêu', color: '#1a3a6b' }, ...DTI_GROUPS].map(g => (
          <button key={g.key} onClick={() => setActiveGroup(g.key)} style={{
            padding: '8px 18px', borderRadius: 20, border: '2px solid',
            borderColor: activeGroup === g.key ? g.color : 'var(--border)',
            background: activeGroup === g.key ? g.color : 'white',
            color: activeGroup === g.key ? 'white' : 'var(--tx-2)',
            fontWeight: 700, cursor: 'pointer', transition: 'all .15s', fontSize: '.84rem'
          }}>
            {g.label}
          </button>
        ))}
      </div>

      {/* KPI Score Cards grid for all 11 criteria */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16, marginBottom: 28 }}>
        {Object.entries(FIELD_LABELS).filter(([key]) => {
          if (activeGroup === 'all') return true;
          const group = DTI_GROUPS.find(g => g.key === activeGroup);
          return group?.items.includes(key);
        }).map(([key, info]) => {
          const actual = key === 'smartweb' ? (data?.smartweb || 0) : (data?.[key] || 0);
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Radar chart */}
        <div className="card">
          <h4 style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} color="#9333EA" /> Đánh giá DTI theo 4 Trụ cột CĐS
          </h4>
          <ResponsiveContainer width="100%" height={290}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" style={{ fontSize: '.78rem', fontWeight: 600 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar name="Tiến độ %" dataKey="A" stroke="#1a3a6b" fill="#1a3a6b" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip formatter={(v) => [`${v}%`, 'Đạt được']} contentStyle={{ borderRadius: 10, fontFamily: 'inherit', fontSize: '.85rem' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart actual vs target */}
        <div className="card">
          <h4 style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} color="#F59E0B" /> Tiến độ Thực tế vs Chỉ tiêu Tỉnh
          </h4>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={barData.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" axisLine={false} tickLine={false} style={{ fontSize: '.72rem' }} />
              <YAxis type="category" dataKey="name" width={135} axisLine={false} tickLine={false} style={{ fontSize: '.72rem' }} />
              <Tooltip contentStyle={{ borderRadius: 10, fontFamily: 'inherit', fontSize: '.82rem' }} formatter={(v) => [v.toLocaleString('vi-VN')]} />
              <Bar dataKey="Thực tế" fill="#1a3a6b" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Chỉ tiêu" fill="#E2E8F0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 Trụ Cột Detail Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
        {DTI_GROUPS.map(g => {
          const GIcon = g.icon;
          const groupItems = g.items.map(key => {
            const actual = key === 'smartweb' ? (data?.smartweb || 0) : (data?.[key] || 0);
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
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: g.color }}>{avgPct}%</div>
              </div>
              {groupItems.map(item => (
                <div key={item.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 3 }}>
                    <span style={{ color: 'var(--tx-2)', fontWeight: 600 }}>{item.icon} {item.label}</span>
                    <span style={{ fontWeight: 700, color: g.color }}>{item.actual.toLocaleString('vi-VN')}/{item.target.toLocaleString('vi-VN')}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: g.color, borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DtiReport;
