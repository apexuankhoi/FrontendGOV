import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  LayoutDashboard, Map, FileText, Users, LogOut,
  Globe, Menu, X, ChevronRight, UserCircle, Settings, Bot,
  FileInput, FileOutput, CheckSquare, Activity, Briefcase, Bell, Zap, Database, Heart, 
  BarChart3, ClipboardList, QrCode, Target, Sparkles, Folder, ChevronsUpDown, ShieldCheck,
  Monitor, Wifi, Clock, Eye, Shield
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
const ROLE_COLOR = {
  SENIOR_ADMIN:   '#DC2626',
  PROVINCE_ADMIN: '#2563EB',
  COMMUNE_ADMIN:  '#059669',
  ADMIN:          '#7C3AED',
  CITIZEN:        '#64748B',
};

const PAGE_LABEL = (p) => {
  if (!p || p === '/') return '🏠 Trang chủ';
  if (p.includes('campaigns'))       return '📊 Tiến độ 102 Xã';
  if (p.includes('my-report'))       return '📝 Báo cáo 11 chỉ tiêu';
  if (p.includes('dti-report'))      return '📈 Báo cáo DTI';
  if (p.includes('map'))             return '🗺️ Đội hình bản đồ';
  if (p.includes('qr-manager'))      return '📱 QR Điểm hỗ trợ';
  if (p.includes('smartweb'))        return '🌐 SmartWeb';
  if (p.includes('ai-center'))       return '🤖 Trung tâm AI';
  if (p.includes('eoffice/report'))  return '🧀 Báo cáo AI';
  if (p.includes('incoming'))        return '📥 Văn bản đến';
  if (p.includes('outgoing'))        return '📤 Văn bản đi';
  if (p.includes('tasks'))           return '✅ Công việc';
  if (p.includes('drive'))           return '🗄️ Kho dữ liệu';
  if (p.includes('agencies-monitor'))return '🏢 Quản lý tuyến dưới';
  if (p.includes('support-report'))  return '📊 Thống kê hỗ trợ';
  if (p.includes('support'))         return '❤️ Yêu cầu hỗ trợ';
  if (p.includes('news'))            return '📰 Tin tức';
  if (p.includes('users'))           return '👥 Quản lý TK';
  if (p.includes('profile'))         return '👤 Hồ sơ cá nhân';
  if (p.includes('eoffice'))         return '💼 Dashboard eOffice';
  if (p.includes('dashboard'))       return '📌 Dashboard Tổng quan';
  return '💻 ' + p.split('/').pop();
};

const formatDuration = (isoStr) => {
  if (!isoStr) return '-';
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60)    return `${diff}s`;
  if (diff < 3600)  return `${Math.floor(diff/60)}ph`;
  return `${Math.floor(diff/3600)}h ${Math.floor((diff%3600)/60)}ph`;
};

const DashboardLayout = () => {
  const [open, setOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState({ unreadCount: 0, items: [] });
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [onlineList, setOnlineList] = useState([]);
  const [showMonitor, setShowMonitor] = useState(false);
  const [tick, setTick] = useState(0); // for live duration update
  const socketRef = useRef(null);
  
  // Quản lý trạng thái đóng/mở của các nhóm danh mục
  const [expandedGroups, setExpandedGroups] = useState({
    campaign: true,
    eoffice: true,
    ai: false,
    support: false,
    news: false,
    system: false
  });

  const notifRef = useRef(null);
  const monitorRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role     = localStorage.getItem('role') || '';
  const username = localStorage.getItem('username') || 'Người dùng';
  const userId   = localStorage.getItem('userId') || '';

  const fetchNotifications = () => {
    api.get('/notifications/summary')
       .then(res => setNotifications(res.data))
       .catch(() => {});
  };

  // Live timer tick every 10s to update session durations
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchNotifications();

    const socket = io(API_URL);
    socketRef.current = socket;

    // Emit user identity
    socket.emit('userLogin', {
      userId,
      username,
      role,
      currentPage: window.location.pathname,
    });

    socket.on('onlineUsers', (count) => setOnlineUsers(count));
    socket.on('onlineUsersList', (list) => setOnlineList(list));
    
    socket.on('newNotification', () => { fetchNotifications(); });

    socket.on('newSupportRequest', (data) => {
      fetchNotifications();
      try {
        toast.info(
          `🆘 Yêu cầu hỗ trợ mới từ "${data.senderName}" — ${data.category || 'Khác'} — Gửi đến ${data.agencyName || 'xã'}`,
          { autoClose: 8000, position: 'top-right' }
        );
      } catch(e) {}
      window.dispatchEvent(new CustomEvent('newSupportRequest', { detail: data }));
    });

    socket.on('supportRequestUpdated', (data) => {
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('supportRequestUpdated', { detail: data }));
    });

    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  // Emit pageChange khi navigate
  useEffect(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('pageChange', { page: pathname });
    }
  }, [pathname]);

  // Tự động mở danh mục tương ứng khi người dùng truy cập trang con
  useEffect(() => {
    if (
      pathname.startsWith('/dashboard/campaigns') || 
      pathname.startsWith('/dashboard/my-report') || 
      pathname.startsWith('/dashboard/dti-report') || 
      pathname.startsWith('/dashboard/map') || 
      pathname.startsWith('/dashboard/smartweb') || 
      pathname.startsWith('/dashboard/qr-manager')
    ) {
      setExpandedGroups(prev => ({ ...prev, campaign: true }));
    } else if (
      pathname.startsWith('/dashboard/eoffice/incoming') || 
      pathname.startsWith('/dashboard/eoffice/outgoing') || 
      pathname.startsWith('/dashboard/eoffice/tasks') || 
      pathname.startsWith('/dashboard/eoffice/drive') || 
      pathname.startsWith('/dashboard/eoffice/agencies-monitor') || 
      pathname === '/dashboard/eoffice'
    ) {
      setExpandedGroups(prev => ({ ...prev, eoffice: true }));
    } else if (
      pathname.startsWith('/dashboard/eoffice/ai-center') || 
      pathname.startsWith('/dashboard/eoffice/report')
    ) {
      setExpandedGroups(prev => ({ ...prev, ai: true }));
    } else if (
      pathname.startsWith('/dashboard/support-requests') || 
      pathname.startsWith('/dashboard/support-report')
    ) {
      setExpandedGroups(prev => ({ ...prev, support: true }));
    } else if (pathname.startsWith('/dashboard/news')) {
      setExpandedGroups(prev => ({ ...prev, news: true }));
    } else if (pathname.startsWith('/dashboard/users') || pathname.startsWith('/dashboard/profile')) {
      setExpandedGroups(prev => ({ ...prev, system: true }));
    }
  }, [pathname]);

  // Đóng monitor khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (monitorRef.current && !monitorRef.current.contains(e.target)) setShowMonitor(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = () => { localStorage.clear(); navigate('/login'); };
  const can = (...roles) => roles.includes(role);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const toggleAllGroups = () => {
    const allOpen = Object.values(expandedGroups).every(v => v);
    setExpandedGroups({
      campaign: !allOpen,
      eoffice: !allOpen,
      ai: !allOpen,
      support: !allOpen,
      news: !allOpen,
      system: !allOpen
    });
  };

  const SLink = ({ to, icon: Icon, label, exact }) => {
    const isActive = exact ? pathname === to : (pathname === to || (to !== '/dashboard' && pathname.startsWith(to)));
    return (
      <Link to={to} className={`sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
        <Icon size={16}/><span>{label}</span>
        {isActive && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: .6 }}/>}
      </Link>
    );
  };

  // Accordion Group Component
  const NavGroup = ({ id, label, icon: Icon, children, badgeCount }) => {
    const isOpen = !!expandedGroups[id];
    
    // Kiểm tra xem nhóm này có chứa route hiện tại không
    const hasActiveChild = React.Children.toArray(children).some(child => {
      if (!child || !child.props) return false;
      const to = child.props.to;
      return pathname === to || (to !== '/dashboard' && pathname.startsWith(to));
    });

    return (
      <div className="sidebar-group">
        <button 
          type="button"
          className={`sidebar-group-btn ${hasActiveChild ? 'has-active' : ''}`}
          onClick={() => toggleGroup(id)}
        >
          <div className="sidebar-group-btn-left">
            <Icon size={17} />
            <span>{label}</span>
          </div>
          <div className="sidebar-group-btn-right">
            {badgeCount && <span className="sidebar-group-count">{badgeCount}</span>}
            <ChevronRight size={14} className={`sidebar-group-chevron ${isOpen ? 'open' : ''}`} />
          </div>
        </button>
        {isOpen && (
          <div className="sidebar-submenu">
            {children}
          </div>
        )}
      </div>
    );
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) setOpen(false);
  };

  return (
    <div className="admin-shell" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Overlay */}
      <div className={`overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)}/>

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 0 14px' }}>
          <img src="/logo.png" alt="Webgov Logo" style={{ height: 46, width: 46, objectFit: 'contain', marginBottom: 6 }} />
          <span className="t1" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Webgov</span>
          <span className="t2" style={{ opacity: 0.75, fontSize: '0.78rem', fontWeight: 600 }}>
            {(() => { 
              if (role === 'SENIOR_ADMIN' || role === 'ADMIN') return 'Tỉnh Đắk Lắk';
              try { return JSON.parse(localStorage.getItem('agency'))?.name || 'Tỉnh Đắk Lắk'; } catch { return 'Tỉnh Đắk Lắk'; } 
            })()}
          </span>
        </div>

        {/* Quick Collapse/Expand Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px 2px' }}>
          <span className="sidebar-sec" style={{ padding: 0 }}>Menu Chức năng</span>
          <button 
            onClick={toggleAllGroups} 
            title="Đóng / Mở tất cả danh mục"
            style={{ background: 'none', border: 'none', color: 'var(--tx-3)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}
          >
            <ChevronsUpDown size={12} /> Thu gọn
          </button>
        </div>

        <nav className="sidebar-body">
          {/* 1. TỔNG QUAN */}
          <SLink to="/dashboard" icon={LayoutDashboard} label="Dashboard Tổng quan" exact />

          {/* 2. CHIẾN DỊCH 44 NGÀY ĐÊM (CĐS ĐẮK LẮK) */}
          <NavGroup id="campaign" label="Chiến dịch 44 ngày" icon={Target}>
            {can('COMMUNE_ADMIN') && (
              <SLink to="/dashboard/my-report" icon={ClipboardList} label="📋 Báo cáo 11 chỉ tiêu"/>
            )}
            {can('PROVINCE_ADMIN', 'ADMIN', 'SENIOR_ADMIN') && (
              <>
                <SLink to="/dashboard/campaigns" icon={CheckSquare} label="Tiến độ 102 Xã/Phường"/>
                <SLink to="/dashboard/dti-report" icon={Target} label="Báo cáo Tổng kết DTI"/>
                {can('ADMIN', 'SENIOR_ADMIN') && <SLink to="/dashboard/map" icon={Map} label="Quản lý Đội hình"/>}
                <SLink to="/dashboard/qr-manager" icon={QrCode} label="QR Điểm Hỗ trợ"/>
              </>
            )}
            <SLink to="/dashboard/smartweb" icon={Globe} label={can('COMMUNE_ADMIN') ? "SmartWeb Xã tôi" : "SmartWeb Tiểu thương"}/>
          </NavGroup>

          {/* 3. VĂN PHÒNG ĐIỆN TỬ (AI E-OFFICE) */}
          {can('PROVINCE_ADMIN', 'COMMUNE_ADMIN', 'ADMIN', 'SENIOR_ADMIN') && (
            <NavGroup id="eoffice" label="Văn phòng eOffice" icon={Briefcase}>
              <SLink to="/dashboard/eoffice" icon={Briefcase} label="Dashboard eOffice" exact />
              <SLink to="/dashboard/eoffice/incoming" icon={FileInput} label="Văn bản đến"/>
              <SLink to="/dashboard/eoffice/outgoing" icon={FileOutput} label="Văn bản đi"/>
              <SLink to="/dashboard/eoffice/tasks" icon={CheckSquare} label="Quản lý Công việc"/>
              <SLink to="/dashboard/eoffice/drive" icon={Database} label="Kho Dữ liệu chung"/>
              {can('PROVINCE_ADMIN', 'ADMIN', 'SENIOR_ADMIN') && (
                <SLink to="/dashboard/eoffice/agencies-monitor" icon={Activity} label="Quản lý Tuyến dưới"/>
              )}
            </NavGroup>
          )}

          {/* 4. TRUNG TÂM TRÍ TUỆ NHÂN TẠO (AI) */}
          {can('PROVINCE_ADMIN', 'COMMUNE_ADMIN', 'ADMIN', 'SENIOR_ADMIN') && (
            <NavGroup id="ai" label="Trung tâm AI" icon={Sparkles}>
              <SLink to="/dashboard/eoffice/ai-center" icon={Zap} label="Trợ lý & Công cụ AI"/>
              <SLink to="/dashboard/eoffice/report" icon={Bot} label="Báo cáo tự động AI"/>
            </NavGroup>
          )}

          {/* 5. DÂN SINH & YÊU CẦU HỖ TRỢ */}
          <NavGroup id="support" label="Dân sinh & Hỗ trợ" icon={Heart}>
            <SLink to="/dashboard/support-requests" icon={Heart} label="Yêu cầu hỗ trợ"/>
            {can('PROVINCE_ADMIN', 'ADMIN', 'SENIOR_ADMIN') && (
              <SLink to="/dashboard/support-report" icon={BarChart3} label="Thống kê Báo cáo"/>
            )}
          </NavGroup>

          {/* 6. TRUYỀN THÔNG & TIN TỨC */}
          {can('PROVINCE_ADMIN', 'ADMIN', 'SENIOR_ADMIN') && (
            <NavGroup id="news" label="Truyền thông" icon={FileText}>
              <SLink to="/dashboard/news" icon={FileText} label="Quản lý Tin tức"/>
            </NavGroup>
          )}

          {/* 7. HỆ THỐNG & CÁ NHÂN */}
          <NavGroup id="system" label="Cài đặt & Cá nhân" icon={Settings}>
            {can('SENIOR_ADMIN') && (
              <SLink to="/dashboard/users" icon={Users} label="Quản lý Tài khoản"/>
            )}
            <SLink to="/dashboard/profile" icon={UserCircle} label="Hồ sơ cá nhân"/>
          </NavGroup>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{username.charAt(0).toUpperCase()}</div>
            <div>
              <span className="sidebar-user-name">{username}</span>
              <span className="sidebar-user-role">{ROLE_LABEL[role] || role}</span>
            </div>
          </div>
          <Link to="/" className="sidebar-link" onClick={() => setOpen(false)}>
            <Globe size={16}/><span>Về trang Public</span>
          </Link>
          <button className="sidebar-link" style={{ border: 'none', background: 'none', width: '100%', color: 'var(--danger)', cursor: 'pointer' }} onClick={logout}>
            <LogOut size={16}/><span>Đăng xuất</span>
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
            {/* Online Badge - clickable for SENIOR_ADMIN */}
            <div ref={monitorRef} style={{ position: 'relative' }}>
              <button
                onClick={() => role === 'SENIOR_ADMIN' ? setShowMonitor(m => !m) : null}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.85rem', color: 'var(--tx-2)',
                  background: showMonitor ? 'var(--primary)' : 'var(--surface-2)',
                  color: showMonitor ? 'white' : 'var(--tx-2)',
                  padding: '6px 12px', borderRadius: 20, border: 'none',
                  cursor: role === 'SENIOR_ADMIN' ? 'pointer' : 'default',
                  transition: 'all .2s', fontWeight: 600,
                }}
                title={role === 'SENIOR_ADMIN' ? 'Xem bảng hoạt động thành viên' : ''}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E', flexShrink: 0 }} />
                {onlineUsers} Online
                {role === 'SENIOR_ADMIN' && <Eye size={13} style={{ marginLeft: 2, opacity: .8 }} />}
              </button>

              {/* Monitor Dropdown Panel */}
              {showMonitor && role === 'SENIOR_ADMIN' && (
                <div className="animate-up" style={{
                  position: 'fixed', top: 56, right: 16,
                  width: 520, maxWidth: 'calc(100vw - 32px)',
                  maxHeight: '80vh', overflowY: 'auto',
                  background: '#0F172A', color: '#E2E8F0',
                  borderRadius: 16, border: '1px solid #1E3A5F',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  zIndex: 9990,
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #1E3A5F',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #1E3A5F, #0F172A)',
                    borderRadius: '16px 16px 0 0',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={18} color="#60A5FA" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#F1F5F9' }}>🛡️ Bảng Hoạt Động Thành Viên</div>
                        <div style={{ fontSize: '.75rem', color: '#94A3B8', marginTop: 1 }}>Realtime · Chỉ Super Admin thấy</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid #22C55E', borderRadius: 20, padding: '3px 10px', fontSize: '.78rem', color: '#22C55E', fontWeight: 700 }}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, background: '#22C55E', borderRadius: '50%', marginRight: 5, boxShadow: '0 0 6px #22C55E' }} />
                        {onlineUsers} đang online
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '12px 0' }}>
                    {onlineList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '28px 0', color: '#64748B' }}>
                        <Wifi size={28} style={{ opacity: .4, display: 'block', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '.85rem' }}>Chưa có phiên nào được xác định</div>
                        <div style={{ fontSize: '.75rem', marginTop: 4, opacity: .7 }}>Trang sẽ tự cập nhật khi có user kết nối</div>
                      </div>
                    ) : onlineList.map((u, idx) => (
                      <div key={u.socketId} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 20px',
                        borderBottom: idx < onlineList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        transition: 'background .15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: ROLE_COLOR[u.role] || '#475569',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '.9rem', color: 'white', flexShrink: 0,
                          boxShadow: `0 0 10px ${ROLE_COLOR[u.role] || '#475569'}55`,
                        }}>
                          {(u.username || '?').charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '.88rem' }}>{u.username || 'Ẩn danh'}</span>
                            <span style={{
                              fontSize: '.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                              background: `${ROLE_COLOR[u.role] || '#475569'}25`,
                              color: ROLE_COLOR[u.role] || '#94A3B8',
                              border: `1px solid ${ROLE_COLOR[u.role] || '#475569'}40`,
                            }}>
                              {ROLE_LABEL[u.role] || u.role}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.76rem', color: '#94A3B8' }}>
                              <Eye size={11} />
                              <span style={{ color: '#60A5FA', fontWeight: 600 }}>{PAGE_LABEL(u.currentPage)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.76rem', color: '#94A3B8' }}>
                              <Clock size={11} />
                              Login: {u.loginTime ? new Date(u.loginTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.76rem', color: '#94A3B8' }}>
                              <Wifi size={11} />
                              {formatDuration(u.loginTime)} phiên
                            </div>
                          </div>

                          <div style={{ marginTop: 4, fontSize: '.7rem', color: '#475569', fontFamily: 'monospace' }}>
                            IP: {u.ip || 'N/A'} &nbsp;·&nbsp; SessionID: {u.socketId?.slice(-8)}
                          </div>
                        </div>

                        {/* Online dot */}
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E', flexShrink: 0, marginTop: 14 }} />
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{
                    padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '.72rem', color: '#475569', display: 'flex', justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.2)', borderRadius: '0 0 16px 16px',
                  }}>
                    <span>🔄 Tự cập nhật realtime qua WebSocket</span>
                    <span>📍 {new Date().toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>
              )}
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
                          to={n.type === 'task' ? '/dashboard/eoffice/tasks' : n.type === 'support' ? '/dashboard/support-requests' : '/dashboard/eoffice/incoming'}
                          className="notif-item"
                          onClick={() => setShowNotif(false)}
                        >
                          <div className={`notif-icon ${n.type}`}>
                            {n.type === 'task' ? <CheckSquare size={14}/> : n.type === 'support' ? <Heart size={14}/> : <FileInput size={14}/>}
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
