import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { QrCode, Download, Printer, RefreshCw, Loader2, Globe, MapPin, CheckCircle } from 'lucide-react';

// Kiểu in QR
const QR_TYPES = [
  { value: 'smartweb',  label: '🌐 Đăng ký SmartWeb', endpoint: agency => `/smartweb/qr/${agency}`, color: '#1a3a6b', desc: 'QR dẫn tiểu thương đến form đăng ký website' },
  { value: 'support',   label: '🤝 Yêu cầu hỗ trợ',   endpoint: agency => `/support-requests/qr/${agency}`, color: '#10B981', desc: 'QR dẫn người dân đến form gửi yêu cầu hỗ trợ' },
  { value: 'campaign',  label: '📋 Trang Chiến dịch',  endpoint: agency => `/campaign/qr/${agency}`, color: '#F59E0B', desc: 'QR dẫn đến trang thông tin chiến dịch 44 ngày' },
];

const QRManager = () => {
  const [agencies, setAgencies] = useState([]);
  const [selected, setSelected] = useState('all');
  const [qrType, setQrType] = useState('smartweb');
  const [qrResults, setQrResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAgencies, setFetchingAgencies] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    api.get('/agencies/public').then(r => {
      setAgencies(r.data || []);
    }).catch(() => {}).finally(() => setFetchingAgencies(false));
  }, []);

  const generateQRs = async () => {
    setLoading(true);
    setQrResults([]);
    const typeConf = QR_TYPES.find(t => t.value === qrType);
    try {
      let targets = selected === 'all'
        ? agencies.filter(a => a.level === 'COMMUNE')
        : agencies.filter(a => a._id === selected);

      const results = await Promise.all(
        targets.map(async agency => {
          try {
            const res = await api.get(typeConf.endpoint(agency._id));
            return { ...res.data, agencyId: agency._id, agencyName: agency.name, ok: true };
          } catch {
            return { agencyName: agency.name, ok: false };
          }
        })
      );
      setQrResults(results.filter(r => r.ok));
      if (results.some(r => !r.ok)) toast.warning('Một số xã không tạo được QR');
      toast.success(`✅ Đã tạo ${results.filter(r=>r.ok).length} QR code!`);
    } catch {
      toast.error('Lỗi tạo QR code');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (qr, name) => {
    const a = document.createElement('a');
    a.href = qr.qrDataUrl;
    a.download = `qr_${name.replace(/\s/g, '_')}.png`;
    a.click();
  };

  const typeConf = QR_TYPES.find(t => t.value === qrType);

  return (
    <div className="animate-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrCode size={24} color="var(--primary)" /> Quản lý QR Điểm Hỗ trợ
          </h2>
          <p style={{ color: 'var(--tx-3)', fontSize: '.9rem' }}>Tạo và in QR code cho từng điểm hỗ trợ trong chiến dịch</p>
        </div>
        {qrResults.length > 0 && (
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={16} /> In tất cả QR
          </button>
        )}
      </div>

      {/* Config Panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>⚙️ Cấu hình tạo QR</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label className="form-label">Loại QR</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QR_TYPES.map(t => (
                <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, border: `2px solid`, borderColor: qrType === t.value ? t.color : 'var(--border)', background: qrType === t.value ? t.color + '10' : 'transparent', transition: 'all .15s' }}>
                  <input type="radio" name="qrType" value={t.value} checked={qrType === t.value} onChange={() => setQrType(t.value)} style={{ display: 'none' }} />
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${t.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {qrType === t.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: qrType === t.value ? t.color : 'var(--tx-1)' }}>{t.label}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--tx-3)' }}>{t.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Xã/Phường cần in</label>
            {fetchingAgencies ? (
              <div style={{ padding: 12, color: 'var(--tx-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={14} className="spin" /> Đang tải danh sách...
              </div>
            ) : (
              <select value={selected} onChange={e => setSelected(e.target.value)} className="form-input" style={{ marginBottom: 8 }}>
                <option value="all">🏘️ Tất cả các xã/phường ({agencies.filter(a=>a.level==='COMMUNE').length} xã)</option>
                {agencies.filter(a => a.level === 'COMMUNE').map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            )}
            <div style={{ background: '#F0F9FF', borderRadius: 10, padding: '10px 14px', fontSize: '.82rem', color: 'var(--tx-2)' }}>
              💡 Chọn "Tất cả" để tạo QR cho toàn bộ xã/phường, sau đó in một lần và phân phát.
            </div>
          </div>

          <div>
            <button onClick={generateQRs} disabled={loading || fetchingAgencies} className="btn btn-primary"
              style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <Loader2 size={18} className="spin" /> : <QrCode size={18} />}
              {loading ? 'Đang tạo...' : 'Tạo QR Code'}
            </button>
          </div>
        </div>
      </div>

      {/* QR Grid */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Loader2 size={36} className="spin" />
          <p style={{ marginTop: 12, color: 'var(--tx-3)' }}>Đang tạo {selected === 'all' ? agencies.filter(a=>a.level==='COMMUNE').length : 1} QR code...</p>
        </div>
      )}

      {!loading && qrResults.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: 'var(--tx-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} color="#10B981" /> Đã tạo {qrResults.length} QR code — {typeConf?.label}
            </div>
          </div>

          <div ref={printRef} id="qr-print-area" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {qrResults.map((qr, i) => (
              <div key={i} className="card animate-up" style={{
                animationDelay: `${i * 40}ms`,
                textAlign: 'center', padding: 24,
                border: `2px solid ${typeConf?.color || '#1a3a6b'}20`,
                position: 'relative', overflow: 'hidden'
              }}>
                {/* Corner accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: typeConf?.color || '#1a3a6b' }} />

                {/* Header tên xã */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                  <MapPin size={14} color={typeConf?.color || '#1a3a6b'} />
                  <div style={{ fontWeight: 800, fontSize: '.9rem', color: '#1a3a6b', lineHeight: 1.3 }}>{qr.agencyName}</div>
                </div>

                {/* QR Image */}
                <div style={{ padding: 8, border: `3px solid ${typeConf?.color || '#1a3a6b'}30`, borderRadius: 12, display: 'inline-block', marginBottom: 12 }}>
                  <img src={qr.qrDataUrl} alt={qr.agencyName} style={{ width: 140, height: 140, display: 'block', borderRadius: 8 }} />
                </div>

                {/* Label */}
                <div style={{ fontWeight: 700, color: typeConf?.color, fontSize: '.82rem', marginBottom: 4 }}>{typeConf?.label}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--tx-3)', wordBreak: 'break-all', marginBottom: 12, lineHeight: 1.4 }}>{qr.registrationUrl}</div>

                {/* Action */}
                <button onClick={() => handleDownload(qr, qr.agencyName)}
                  className="btn btn-outline" style={{ width: '100%', fontSize: '.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Download size={13} /> Tải xuống
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && qrResults.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--tx-3)' }}>
          <QrCode size={48} style={{ opacity: .2, marginBottom: 16 }} />
          <h3 style={{ color: 'var(--tx-3)', fontWeight: 600 }}>Chưa có QR code nào</h3>
          <p>Chọn loại QR và xã/phường, sau đó nhấn "Tạo QR Code"</p>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #qr-print-area, #qr-print-area * { visibility: visible !important; }
          #qr-print-area { position: absolute; left: 0; top: 0; width: 100%; display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 16px !important; padding: 20px !important; }
          .btn, button { display: none !important; }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default QRManager;
