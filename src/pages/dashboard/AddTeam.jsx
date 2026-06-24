import React, { useState } from 'react';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Save } from 'lucide-react';

const FIELD_OPTIONS = [
  'Chuyển đổi số', 'Bảo vệ môi trường', 'Xây dựng nông thôn mới',
  'Đền ơn đáp nghĩa', 'Chăm sóc thiếu nhi', 'Tư vấn pháp luật',
  'Giáo dục', 'Y tế - Sức khoẻ cộng đồng', 'Phòng chống thiên tai',
  'Hỗ trợ người cao tuổi', 'Xây dựng cơ sở hạ tầng', 'Văn hoá - Nghệ thuật',
  'Phát triển kinh tế', 'Nông nghiệp sạch', 'An ninh trật tự', 'Khác'
];

const DISTRICTS = [
  'TP Buôn Ma Thuột', 'Huyện Krông Búk', 'Huyện Ea H\'leo', 'Huyện Krông Năng',
  'Huyện M\'Đrắk', 'Huyện Krông Pắc', 'Huyện Lắk', 'Huyện Cư Kuin',
  'Huyện Ea Kar', 'TX Buôn Hồ', 'Huyện Cư M\'gar'
];

const AddTeam = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', schoolOrUnit: '', district: '', commune: '', locationType: 'Nông thôn',
    volunteersCount: '', projectsCount: '', estimatedValue: '', beneficiaries: '',
    startDate: '', endDate: ''
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const toggleField = (f) => setFields(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.district || !form.commune) { toast.error('Vui lòng nhập đầy đủ thông tin địa bàn.'); return; }
    setLoading(true);
    try {
      await api.post('/teams', {
        name: form.name,
        schoolOrUnit: form.schoolOrUnit,
        fieldsOfActivity: fields,
        location: { province: 'Đắk Lắk', district: form.district, commune: form.commune, type: form.locationType },
        timeframe: { startDate: form.startDate || undefined, endDate: form.endDate || undefined },
        statistics: {
          volunteersCount: Number(form.volunteersCount) || 0,
          projectsCount: Number(form.projectsCount) || 0,
          estimatedValue: Number(form.estimatedValue) || 0,
          beneficiaries: Number(form.beneficiaries) || 0,
        }
      });
      toast.success('🎉 Khai báo đội hình thành công! Đang chờ cấp Tỉnh phê duyệt.');
      navigate('/dashboard/teams');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khai báo. Vui lòng thử lại.');
    }
    setLoading(false);
  };

  return (
    <div className="animate-up">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <button onClick={() => navigate('/dashboard/teams')} className="btn btn-outline btn-sm">
            <ArrowLeft size={15} /> Quay lại
          </button>
        </div>
        <h2>Khai báo Đội hình Tình nguyện</h2>
        <p>Điền đầy đủ thông tin. Sau khi gửi, dữ liệu sẽ được cấp Tỉnh kiểm duyệt trước khi hiển thị.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1 */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 20, color: 'var(--brand-blue)', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            📋 Thông tin cơ bản
          </h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên đội hình <span className="required">*</span></label>
              <input className="form-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Mùa Hè Xanh UIT 2026" />
            </div>
            <div className="form-group">
              <label className="form-label">Trường / Đơn vị trực thuộc <span className="required">*</span></label>
              <input className="form-input" required value={form.schoolOrUnit} onChange={e => set('schoolOrUnit', e.target.value)} placeholder="VD: ĐH Công nghệ Thông tin" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ngày bắt đầu</label>
              <input type="date" className="form-input" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày kết thúc</label>
              <input type="date" className="form-input" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 20, color: 'var(--brand-blue)', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            📍 Địa bàn triển khai
          </h4>
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Tỉnh / Thành phố</label>
              <input className="form-input" disabled value="Đắk Lắk" />
            </div>
            <div className="form-group">
              <label className="form-label">Quận / Huyện <span className="required">*</span></label>
              <select className="form-select form-input" required value={form.district} onChange={e => set('district', e.target.value)}>
                <option value="">-- Chọn Huyện --</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Xã / Phường <span className="required">*</span></label>
              <input className="form-input" required value={form.commune} onChange={e => set('commune', e.target.value)} placeholder="VD: Xã Ea Tu" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Loại hình khu vực</label>
            <div style={{ display: 'flex', gap: 16 }}>
              {['Nông thôn', 'Đô thị'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                  <input type="radio" name="locationType" value={opt} checked={form.locationType === opt} onChange={() => set('locationType', opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 16, color: 'var(--brand-blue)', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            🎯 Lĩnh vực hoạt động ({fields.length} đã chọn)
          </h4>
          <div className="checkbox-grid">
            {FIELD_OPTIONS.map(f => (
              <label key={f} className="checkbox-item">
                <input type="checkbox" checked={fields.includes(f)} onChange={() => toggleField(f)} />
                {f}
              </label>
            ))}
          </div>
        </div>

        {/* Section 4 */}
        <div className="card" style={{ marginBottom: 28 }}>
          <h4 style={{ marginBottom: 20, color: 'var(--brand-blue)', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            📊 Chỉ tiêu Báo cáo
          </h4>
          <div className="form-row-4">
            <div className="form-group">
              <label className="form-label">Quân số (Người)</label>
              <input type="number" className="form-input" min="0" value={form.volunteersCount} onChange={e => set('volunteersCount', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Số công trình</label>
              <input type="number" className="form-input" min="0" value={form.projectsCount} onChange={e => set('projectsCount', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Giá trị làm lợi (Triệu VNĐ)</label>
              <input type="number" className="form-input" min="0" value={form.estimatedValue} onChange={e => set('estimatedValue', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Người được hỗ trợ</label>
              <input type="number" className="form-input" min="0" value={form.beneficiaries} onChange={e => set('beneficiaries', e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            <Save size={18} /> {loading ? 'Đang gửi...' : 'Gửi Khai Báo'}
          </button>
          <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate('/dashboard/teams')}>
            Hủy bỏ
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTeam;
