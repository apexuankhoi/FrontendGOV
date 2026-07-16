import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LayoutDashboard, LogOut, Settings } from 'lucide-react';

const ADMIN_ROLES = ['COMMUNE_ADMIN', 'PROVINCE_ADMIN', 'ADMIN', 'SENIOR_ADMIN'];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || '';
  const username = localStorage.getItem('username') || 'Người dùng';
  const isAdmin = ADMIN_ROLES.includes(role);
  const isCitizen = token && !isAdmin;

  const isActive = (p) => pathname === p ? 'active' : '';

  const logout = () => {
    localStorage.clear();
    setDropdownOpen(false);
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="pub-nav" style={{ position: 'relative' }}>
      <div className="pub-nav-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Webgov Logo" style={{ height: 40, width: 40, objectFit: 'contain' }} />
          <div className="nav-logo-text" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="t1" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', lineHeight: 1 }}>Webgov</span>
            <span className="t2" style={{ fontSize: '0.8rem', color: 'var(--tx-2)', marginTop: 2, fontWeight: 600 }}>Tỉnh Đắk Lắk</span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav className="nav-center">
          <Link to="/" className={`nav-link ${isActive('/')}`}>Trang chủ</Link>
          <Link to="/chien-dich" className={`nav-link ${isActive('/chien-dich')}`}>Chiến dịch 44 ngày</Link>
          <Link to="/doi-hinh" className={`nav-link ${isActive('/doi-hinh')}`}>Đội hình</Link>
          <Link to="/ho-tro" className={`nav-link ${isActive('/ho-tro')}`}>Yêu cầu hỗ trợ</Link>
          <Link to="/tin-tuc" className={`nav-link ${isActive('/tin-tuc')}`}>Tin tức</Link>
        </nav>

        {/* Desktop right */}
        <div className="nav-right">
          {!token ? (
            /* Chưa đăng nhập */
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Đăng ký</Link>
            </>
          ) : (
            /* Logged in users (Admin + Citizen) → Avatar dropdown */
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--primary-bg)', border: '1.5px solid var(--primary-mid)',
                  borderRadius: 'var(--r-pill)', padding: '7px 14px',
                  cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.85rem' }}>
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--primary-dark)' }}>{username ? username.split(' ').slice(-1)[0] : 'Người dùng'}</span>
                <ChevronDown size={14} color="var(--primary)" style={{ transition: 'transform .2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: '#fff', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-xl)',
                  minWidth: 220, padding: 8, zIndex: 300,
                  animation: 'fadeUp .2s ease',
                }}>
                  <div style={{ padding: '10px 14px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{username || 'Người dùng'}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 2 }}>{isAdmin ? 'Cán bộ quản lý' : 'Người dân'}</div>
                  </div>
                  
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', color: 'var(--tx-2)', fontWeight: 500, fontSize: '.875rem', borderRadius: 8, margin: '4px 0', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <User size={16} /> Thông tin cá nhân
                  </Link>

                  {isAdmin && (
                    <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', color: 'var(--tx-2)', fontWeight: 500, fontSize: '.875rem', borderRadius: 8, margin: '4px 0', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LayoutDashboard size={16} /> Trang quản trị
                    </Link>
                  )}

                  <Link to="/my-drive" onClick={() => setDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', color: 'var(--tx-2)', fontWeight: 500, fontSize: '.875rem', borderRadius: 8, margin: '4px 0', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.22-1.82A2 2 0 0 0 7.53 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg> Kho tài liệu cá nhân
                  </Link>

                  <button onClick={logout}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', color: 'var(--danger)', fontWeight: 500, fontSize: '.875rem', borderRadius: 8, margin: '4px 0', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hamburger for mobile */}
          <button className="nav-hamburger" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`nav-mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <Link to="/" className={`nav-link ${isActive('/')}`} onClick={() => setMobileOpen(false)}>Trang chủ</Link>
        <Link to="/chien-dich" className={`nav-link ${isActive('/chien-dich')}`} onClick={() => setMobileOpen(false)}>Chiến dịch</Link>
        <Link to="/doi-hinh" className={`nav-link ${isActive('/doi-hinh')}`} onClick={() => setMobileOpen(false)}>Đội hình tình nguyện</Link>
        <Link to="/ho-tro" className={`nav-link ${isActive('/ho-tro')}`} onClick={() => setMobileOpen(false)}>Yêu cầu hỗ trợ</Link>
        <Link to="/tin-tuc" className={`nav-link ${isActive('/tin-tuc')}`} onClick={() => setMobileOpen(false)}>Tin tức chiến dịch</Link>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '6px 0' }} />
        {!token ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login" className="btn btn-outline w-full" onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
            <Link to="/register" className="btn btn-primary w-full" onClick={() => setMobileOpen(false)}>Đăng ký</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: '10px 14px', background: 'var(--primary-bg)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{username ? username.charAt(0).toUpperCase() : 'U'}</div>
              <div><div style={{ fontWeight: 700, fontSize: '.875rem' }}>{username || 'Người dùng'}</div><div style={{ fontSize: '.72rem', color: 'var(--tx-3)' }}>{isAdmin ? 'Cán bộ quản lý' : 'Người dân'}</div></div>
            </div>
            <Link to="/profile" className="btn btn-outline w-full" onClick={() => setMobileOpen(false)}>Thông tin cá nhân</Link>
            {isAdmin && <Link to="/dashboard" className="btn btn-outline w-full" onClick={() => setMobileOpen(false)}>Trang quản trị</Link>}
            <Link to="/my-drive" className="btn btn-outline w-full" onClick={() => setMobileOpen(false)}>Kho tài liệu cá nhân</Link>
            <button className="btn btn-outline w-full" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => { logout(); setMobileOpen(false); }}>Đăng xuất</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
