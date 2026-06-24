import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Phone, Mail, Globe } from 'lucide-react';

const MainLayout = () => (
  <>
    <Navbar />
    <Outlet />
    {/* ══════════════════════════════════════════════════════
        FOOTER CHUNG CHO MỌI TRANG PUBLIC
    ══════════════════════════════════════════════════════ */}
    <footer className="ctz-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="name">Webgov Đắk Lắk</span>
            <p style={{ marginBottom: 16 }}>Hệ thống Chính quyền số khu vực Tây Nguyên. Phát triển bởi Tỉnh Đoàn Đắk Lắk.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="tel:02623800000" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.65)', fontSize: '.85rem' }}>
                <Phone size={14}/> 0262 380 0000
              </a>
              <a href="mailto:info@daklak.gov.vn" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.65)', fontSize: '.85rem' }}>
                <Mail size={14}/> info@daklak.gov.vn
              </a>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.65)', fontSize: '.85rem' }}>
                <Globe size={14}/> TP Buôn Ma Thuột, Đắk Lắk
              </span>
            </div>
          </div>
          <div className="footer-col">
            <h5>Người dân</h5>
            <ul>
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/doi-hinh">Đội hình tình nguyện</Link></li>
              <li><Link to="/tin-tuc">Tin tức chiến dịch</Link></li>
              <li><Link to="/register">Đăng ký tài khoản</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Hệ thống</h5>
            <ul>
              <li><Link to="/login">Đăng nhập nội bộ</Link></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Điều khoản sử dụng</a></li>
              <li><a href="#">Liên hệ hỗ trợ</a></li>
            </ul>
          </div>
        </div>
        <hr className="footer-hr" />
        <div className="footer-bottom">
          <span>© 2026 Webgov Đắk Lắk. All rights reserved.</span>
          <span>Powered by Tỉnh Đoàn Đắk Lắk</span>
        </div>
      </div>
    </footer>
  </>
);

export default MainLayout;
