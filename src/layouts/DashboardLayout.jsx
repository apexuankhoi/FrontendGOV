import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, FileText, Users, LogOut,
  Globe, Menu, X, ChevronRight, UserCircle, Settings, Bot,
  FileInput, FileOutput, CheckSquare, Activity, Briefcase, Bell, Zap, Database
} from 'lucide-react';
import api, { API_URL } from '../lib/api';
import { io } from 'socket.io-client';

const ROLE_LABEL = {
  SENIOR_ADMIN:   'Super Admin',
  PROVINCE_ADMIN: 'Cán bộ Tỉnh',
  COMMUNE_ADMIN:  'Cán bộ Xã',
  ADMIN:          'Admin Content',
  CITIZEN:        'Người dân',
};

const DashboardLayout = () => {
  const [open, setOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState({ unreadCount: 0, items: [] });
  const [onlineUsers, setOnlineUsers] = useState(1);
  const notifRef = useRef(null);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role     = localStorage.getItem('role') || '';
  const username = localStorage.getItem('username') || 'Người dùng';

  const fetchNotifications = () => {
    api.get('/notifications/summary')
       .then(res => setNotifications(res.data))
       .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();

    // Kết nối Socket.IO
    const socket = io(API_URL);
    socket.on('onlineUsers', (count) => setOnlineUsers(count));
    
    // Lắng nghe sự kiện có thông báo mới (ví dụ từ backend gửi xuống)
    socket.on('newNotification', () => {
      fetchNotifications();
    });

    // Polling dự phòng (30s)
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = () => { localStorage.clear(); navigate('/login'); };
  const can    = (...roles) => roles.includes(role);
  const SLink = ({ to, icon: Icon, label, exact }) => {
    const isActive = exact ? pathname === to : (pathname === to || (to !== '/dashboard' && pathname.startsWith(to)));
    return (
      <Link to={to} className={`sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
        <Icon size={17}/><span>{label}</span>
        {isActive && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: .4 }}/>}
      </Link>
    );
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) setOpen(false); // Vuốt trái để đóng
  };

  return (
    <div className="admin-shell" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Overlay */}
      <div className={`overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)}/>

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 16px' }}>
          <img src="/logo.png" alt="Webgov Logo" style={{ height: 50, width: 50, objectFit: 'contain', marginBottom: 8 }} />
          <span className="t1" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Webgov</span>
          <span className="t2" style={{ opacity: 0.7, fontSize: '0.8rem', fontWeight: 600 }}>
            {(() => { try { return JSON.parse(localStorage.getItem('agency'))?.name || 'Tỉnh Đắk Lắk'; } catch { return 'Tỉnh Đắk Lắk'; } })()}
          </span>
        </div>

        <nav className="sidebar-body">
          <div className="sidebar-sec">Tổng quan</div>
          <SLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" exact />

          <div className="sidebar-sec">Chiến dịch</div>
          <SLink to="/dashboard/map" icon={Map} label="Quản lý Đội hình" />

          {can('ADMIN','SENIOR_ADMIN') && (<>
            <div className="sidebar-sec">Nội dung</div>
            <SLink to="/dashboard/news" icon={FileText} label="Quản lý Tin tức"/>
          </>)}

          {/* AI EOFFICE chỉ dành cho Cán bộ Tỉnh và Cán bộ Xã */}
          {can('PROVINCE_ADMIN', 'COMMUNE_ADMIN') && (<>
            <div className="sidebar-sec">AI EOFFICE</div>
            <SLink to="/dashboard/eoffice" icon={Briefcase} label="Dashboard eOffice" exact />
            <SLink to="/dashboard/eoffice/incoming" icon={FileInput} label="Văn bản đến"/>
            <SLink to="/dashboard/eoffice/outgoing" icon={FileOutput} label="Văn bản đi"/>
            <SLink to="/dashboard/eoffice/tasks" icon={CheckSquare} label="Quản lý Công việc"/>
            <SLink to="/dashboard/eoffice/drive" icon={Database} label="Kho Dữ liệu chung"/>
            <SLink to="/dashboard/eoffice/ai-center" icon={Zap} label="Trung tâm AI"/>
            <SLink to="/dashboard/eoffice/report" icon={Bot} label="Báo cáo AI"/>
          </>)}

          {can('SENIOR_ADMIN') && (<>
            <div className="sidebar-sec">Hệ thống</div>
            <SLink to="/dashboard/users"  icon={Users}    label="Quản lý Tài khoản"/>
          </>)}

          <div className="sidebar-sec">Cá nhân</div>
          <SLink to="/dashboard/profile" icon={UserCircle} label="Hồ sơ cá nhân"/>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{username.charAt(0).toUpperCase()}</div>
            <div>
              <span className="sidebar-user-name">{username}</span>
              <span className="sidebar-user-role">{ROLE_LABEL[role] || role}</span>
            </div>
          </div>
          <Link to="/" className="sidebar-link" onClick={() => setOpen(false)}>
            <Globe size={17}/><span>Về trang Public</span>
          </Link>
          <button className="sidebar-link" style={{ border: 'none', background: 'none', width: '100%', color: 'var(--danger)', cursor: 'pointer' }} onClick={logout}>
            <LogOut size={17}/><span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="sidebar-toggle" onClick={() => setOpen(o => !o)}>
              {open ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <span style={{ fontSize: '.9rem', color: 'var(--tx-3)' }}>
              Xin chào, <strong style={{ color: 'var(--tx-1)' }}>{username}</strong>
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* User Online Status (SYNC-03) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--tx-2)', background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 5px var(--success)' }} />
              {onlineUsers} Online
            </div>

            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="notif-btn" onClick={() => setShowNotif(!showNotif)}>
                <Bell size={18} />
                {notifications.unreadCount > 0 && <span className="notif-badge">{notifications.unreadCount}</span>}
              </button>
              
              {showNotif && (
                <div className="notif-dropdown animate-up">
                  <div className="notif-header">
                    <h4>Thông báo mới</h4>
                  </div>
                  <div className="notif-body">
                    {notifications.items.length === 0 ? (
                      <div className="empty-state" style={{ padding: '20px 0' }}><p>Không có thông báo nào</p></div>
                    ) : (
                      notifications.items.map(n => (
                        <Link 
                          key={n.id} 
                          to={n.type === 'task' ? '/dashboard/eoffice/tasks' : '/dashboard/eoffice/incoming'}
                          className="notif-item"
                          onClick={() => setShowNotif(false)}
                        >
                          <div className={`notif-icon ${n.type}`}>
                            {n.type === 'task' ? <CheckSquare size={14}/> : <FileInput size={14}/>}
                          </div>
                          <div>
                            <div className="notif-title">{n.title}</div>
                            <div className="notif-desc">{n.message}</div>
                            <div className="notif-time">{new Date(n.date).toLocaleString('vi-VN')}</div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className={`badge badge-dot badge-info`}>{ROLE_LABEL[role] || role}</span>
          </div>
        </div>

        <div className="admin-page">
          <Outlet/>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
