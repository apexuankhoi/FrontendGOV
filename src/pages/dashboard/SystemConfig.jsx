import React, { useState } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import { Settings, Save, Eye, EyeOff } from 'lucide-react';

const SystemConfig = () => {
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/config/ai-token', { token });
      toast.success('✅ Cập nhật Token AI thành công!');
      setToken('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật Token.');
    }
    setLoading(false);
  };

  return (
    <div className="anim">
      <div className="page-hd">
        <h2>Cấu hình hệ thống</h2>
        <p>Chỉ dành cho Super Admin — Quản lý các cài đặt lõi của nền tảng</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <h4 style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={18} color="var(--primary)"/> Cấu hình Github AI Model Token
        </h4>
        <p style={{ fontSize: '.85rem', color: 'var(--tx-3)', marginBottom: 20, lineHeight: 1.6 }}>
          Token này được lưu trữ bảo mật tại Backend và không bao giờ lộ ra phía Client. Token được dùng để kết nối với Github AI Model phục vụ Chatbot Trợ lý ảo.
        </p>

        <form onSubmit={save}>
          <div className="form-group">
            <label className="form-label">Github AI Token mới <span className="req">*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                className="form-input"
                required
                placeholder="github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={e => setToken(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)' }}>
                {show ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={15}/> {loading ? 'Đang lưu...' : 'Lưu Token AI'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SystemConfig;
