import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Users, Briefcase, Heart, Search } from 'lucide-react';

const PublicTeams = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teams?status=APPROVED')
      .then(res => { setTeams(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.location?.district?.toLowerCase().includes(search.toLowerCase()) ||
    t.schoolOrUnit?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', background: 'var(--surface-0)' }}>
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <span className="section-label">Mùa Hè Xanh 2026</span>
          <h2 className="section-title">Danh sách Đội hình Tình nguyện</h2>
          <p className="section-desc">Các đơn vị đã được phê duyệt và đang hoạt động tại Đắk Lắk</p>
        </div>

        {/* Search */}
        <div style={{ maxWidth: 500, margin: '0 auto 40px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 42 }}
            placeholder="Tìm kiếm theo tên đội hình, huyện, trường..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><h4>Đang tải dữ liệu...</h4></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h4>Không tìm thấy kết quả</h4>
            <p>Thử tìm kiếm với từ khóa khác</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {filtered.map((team, i) => (
              <div key={team._id} className="team-card animate-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="team-card-top">
                  <span className="team-district-badge">{team.location?.district || 'Đắk Lắk'}</span>
                  <span className="badge badge-success">Đang hoạt động</span>
                </div>
                <div>
                  <h3 style={{ marginBottom: 6 }}>{team.name}</h3>
                  <p>🏫 {team.schoolOrUnit}</p>
                  <p style={{ marginTop: 4 }}>📍 {team.location?.commune}, {team.location?.district}</p>
                </div>
                {team.fieldsOfActivity?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {team.fieldsOfActivity.map(f => (
                      <span key={f} className="badge badge-info">{f}</span>
                    ))}
                  </div>
                )}
                <div className="team-stats">
                  <div className="team-stat-item" style={{ color: 'var(--brand-blue)' }}>
                    <Users size={15} /> {team.statistics?.volunteersCount || 0} SV
                  </div>
                  <div className="team-stat-item" style={{ color: 'var(--brand-green)' }}>
                    <Briefcase size={15} /> {team.statistics?.projectsCount || 0} Công trình
                  </div>
                  <div className="team-stat-item" style={{ color: 'var(--danger)' }}>
                    <Heart size={15} /> {team.statistics?.beneficiaries || 0} Người
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicTeams;
