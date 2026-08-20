import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  Map, Users, Hammer, Heart, ArrowRight, Calendar,
  CheckCircle, ShieldCheck, Search, MessageCircle,
  FileText, ChevronRight, Star, Globe, Phone, Mail,
  Download, BookOpen, Sparkles, FolderDown, FileDown, Bot, Layers,
  ExternalLink, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';

import imgTnv1 from '../assets/anhtnv/1786950558107_3758955030588213305_3758955030588213305_e1234173d3ee1ca25eed820610715d72.jpg';
import imgTnv2 from '../assets/anhtnv/1786950558137_3758955030588213305_3758955030588213305_918a0743d1ea9cfa4d6df33bde0b5710.jpg';
import imgTnv3 from '../assets/anhtnv/1786950558152_3758955030588213305_3758955030588213305_162780b94639efb2778239795a097b00.jpg';
import imgTnv4 from '../assets/anhtnv/1786950558164_3758955030588213305_3758955030588213305_14d1c29b70d3565300901c07e6ab5dea.jpg';
import imgTnv5 from '../assets/anhtnv/1786950558175_3758955030588213305_3758955030588213305_56dcb88f9f8f81d00013f14631ba9514.jpg';

const TNV_IMAGES = [imgTnv1, imgTnv2, imgTnv3, imgTnv4, imgTnv5];
const getNewsImg = (item, idx = 0) => {
  if (item?.imageUrl && !item.imageUrl.includes('unsplash.com')) return item.imageUrl;
  return TNV_IMAGES[idx % TNV_IMAGES.length];
};

const CENTER = [12.6667, 108.0383]; // TP Buôn Ma Thuột - Trung tâm tỉnh Đắk Lắk mới (2025)

// ===== TỌA ĐỘ GPS CẤP XÃ - Tỉnh Đắk Lắk (sau sáp nhập Đắk Lắk + Phú Yên 01/07/2025) =====
// Nguồn: Tọa độ trung tâm địa lý từng xã/phường, cập nhật theo Nghị quyết 202/2025/QH15
const COMMUNE_COORDS = {
  // ======= ĐẮK LẮK CŨ (68 xã/phường) =======
  // TP Buôn Ma Thuột (6 đơn vị)
  'Phường Buôn Ma Thuột':  [12.6756, 108.0500],
  'Phường Tân An':         [12.6900, 108.0550],
  'Phường Tân Lập':        [12.6780, 108.0280],
  'Phường Thành Nhất':     [12.6620, 108.0350],
  'Phường Ea Kao':         [12.6250, 108.0700],
  'Xã Hòa Phú':           [12.7100, 108.0200],

  // TX Buôn Hồ (3 đơn vị)
  'Phường Buôn Hồ':        [12.9220, 108.2680],
  'Phường Cư Bao':         [12.9450, 108.2800],
  'Xã Ea Drông':           [12.9600, 108.2450],

  // Huyện Ea Súp (7 đơn vị)
  'Xã Ea Súp':             [13.0580, 107.9450],
  'Xã Ea Rốk':             [13.1350, 107.9800],
  'Xã Ea Bung':            [13.2200, 108.0100],
  'Xã Ia Rvê':             [13.0200, 107.7950],
  'Xã Ia Lốp':             [13.1100, 107.7500],
  'Xã Ea Wer':             [13.2150, 107.8800],
  'Xã Ea Nuôl':            [12.9500, 107.9200],

  // Huyện Buôn Đôn (1 đơn vị)
  'Xã Buôn Đôn':           [12.8350, 107.8400],

  // Huyện Cư M'gar (6 đơn vị)
  'Xã Ea Kiết':            [12.9000, 108.0000],
  "Xã Ea M'Droh":          [12.8650, 108.0450],
  'Xã Quảng Phú':          [12.8500, 108.1100],
  'Xã Cuôr Đăng':          [12.8200, 108.1500],
  "Xã Cư M'gar":           [12.8900, 108.1800],
  'Xã Ea Tul':             [12.8100, 108.0700],

  // Huyện Krông Búk (3 đơn vị)
  'Xã Pơng Drang':         [12.9550, 108.1700],
  'Xã Krông Búk':          [12.9800, 108.1400],
  'Xã Cư Pơng':            [12.9100, 108.1950],

  // Huyện Ea H'leo (5 đơn vị)
  'Xã Ea Khal':            [13.1400, 108.1200],
  'Xã Ea Drăng':           [13.1950, 108.1800],
  'Xã Ea Wy':              [13.2500, 108.1500],
  "Xã Ea H'Leo":           [13.2200, 108.1600],
  'Xã Ea Hiao':            [13.1800, 108.2200],

  // Huyện Krông Năng (4 đơn vị)
  'Xã Krông Năng':         [12.9650, 108.4200],
  'Xã Dliê Ya':            [12.9900, 108.3900],
  'Xã Tam Giang':          [13.0200, 108.4500],
  'Xã Phú Xuân':           [13.0450, 108.4800],

  // Huyện Krông Pắc (6 đơn vị)
  'Xã Krông Pắc':          [12.6500, 108.2830],
  'Xã Ea Knuếc':           [12.6200, 108.2400],
  'Xã Tân Tiến':           [12.6800, 108.3100],
  'Xã Ea Phê':             [12.7100, 108.3300],
  'Xã Ea Kly':             [12.6600, 108.3500],
  'Xã Vụ Bổn':             [12.6350, 108.3200],

  // Huyện Ea Kar (5 đơn vị)
  'Xã Ea Kar':             [12.8000, 108.5330],
  'Xã Ea Ô':               [12.7700, 108.4900],
  'Xã Ea Knốp':            [12.8300, 108.5700],
  'Xã Cư Yang':            [12.8600, 108.5200],
  'Xã Ea Păl':             [12.7400, 108.5700],

  // Huyện M'Đrắk (6 đơn vị)
  "Xã M'Drắk":             [12.7500, 108.8000],
  'Xã Ea Riêng':           [12.7200, 108.7600],
  "Xã Cư M'ta":            [12.7800, 108.7200],
  'Xã Krông Á':            [12.8100, 108.8300],
  'Xã Cư Prao':            [12.7000, 108.8600],
  'Xã Ea Trang':           [12.6800, 108.7000],

  // Huyện Krông Bông (5 đơn vị)
  'Xã Hòa Sơn':            [12.5200, 108.4000],
  'Xã Dang Kang':          [12.4600, 108.4500],
  'Xã Krông Bông':         [12.4350, 108.3830],
  'Xã Yang Mao':           [12.3900, 108.4200],
  'Xã Cư Pui':             [12.5500, 108.3200],

  // Huyện Lắk (4 đơn vị)
  'Xã Liên Sơn Lắk':      [12.3500, 108.2100],
  'Xã Đắk Liêng':         [12.3100, 108.1500],
  'Xã Nam Ka':             [12.2800, 108.1800],
  'Xã Đắk Phơi':          [12.2400, 108.2500],

  // Huyện Krông Ana (7 đơn vị)
  'Xã Krông Nô':           [12.4600, 107.9800],
  'Xã Ea Ning':            [12.5200, 108.0700],
  'Xã Dray Bhăng':         [12.5500, 108.1100],
  'Xã Ea Ktur':            [12.5100, 108.1400],
  'Xã Krông Ana':          [12.5000, 108.0330],
  'Xã Dur Kmăl':           [12.4800, 108.0900],
  'Xã Ea Na':              [12.4400, 108.0600],

  // ======= PHÚ YÊN CŨ (34 đơn vị) - Địa phận phía đông tỉnh Đắk Lắk mới =======
  // TP Tuy Hòa (4 đơn vị)
  'Đoàn phường Tuy Hòa':  [13.0925, 109.3125],
  'Đoàn phường Phú Yên':  [13.0870, 109.3000],
  'Đoàn phường Bình Kiến': [13.0600, 109.2950],
  'Đoàn phường Xuân Đài': [13.1150, 109.3300],

  // TX Sông Cầu (4 đơn vị)
  'Đoàn phường Sông Cầu': [13.4480, 109.2180],
  'Đoàn xã Xuân Thọ':     [13.4100, 109.1900],
  'Đoàn xã Xuân Cảnh':    [13.4650, 109.2400],
  'Đoàn xã Xuân Lộc':     [13.3800, 109.2000],

  // Huyện Đông Hòa (3 đơn vị)
  'Đoàn phường Đông Hòa': [12.9800, 109.3600],
  'Đoàn phường Hòa Hiệp': [12.9500, 109.3300],
  'Đoàn xã Hòa Xuân':     [12.9200, 109.2900],

  // Huyện Tuy An (5 đơn vị)
  'Đoàn xã Tuy An Bắc':   [13.3500, 109.2100],
  'Đoàn xã Tuy An Đông':  [13.3200, 109.2450],
  'Đoàn xã Ô Loan':       [13.3100, 109.2700],
  'Đoàn xã Tuy An Nam':   [13.2800, 109.2200],
  'Đoàn xã Tuy An Tây':   [13.2600, 109.1800],

  // Huyện Phú Hòa (2 đơn vị)
  'Đoàn xã Phú Hòa 1':    [13.0650, 109.1600],
  'Đoàn xã Phú Hòa 2':    [13.0400, 109.1400],

  // Huyện Tây Hòa (4 đơn vị)
  'Đoàn xã Hòa Thịnh':    [13.0300, 109.0600],
  'Đoàn xã Hòa Mỹ':       [13.0100, 109.0300],
  'Đoàn xã Tây Hòa':      [13.0000, 109.0000],
  'Đoàn xã Sơn Thành':    [13.0500, 108.9700],

  // Huyện Sơn Hòa (4 đơn vị)
  'Đoàn xã Sơn Hòa':      [13.0450, 108.7200],
  'Đoàn xã Vân Hòa':      [13.0200, 108.7600],
  'Đoàn xã Tây Sơn':      [12.9900, 108.7000],
  'Đoàn xã Suối Trai':    [13.0700, 108.6800],

  // Huyện Sông Hinh (4 đơn vị)
  'Đoàn xã Ea Ly':         [13.0000, 108.8800],
  'Đoàn xã Ea Bá':         [12.9700, 108.9200],
  'Đoàn xã Đức Bình':      [13.0300, 108.9600],
  'Đoàn xã Sông Hinh':     [13.0600, 108.9000],

  // Huyện Đồng Xuân (4 đơn vị)
  'Đoàn xã Xuân Lãnh':    [13.1800, 109.0200],
  'Đoàn xã Phú Mỡ':       [13.2100, 108.9800],
  'Đoàn xã Xuân Phước':   [13.2400, 109.0500],
  'Đoàn xã Đồng Xuân':    [13.2200, 109.0800],
};

// Fallback: tọa độ vùng khi không khớp tên xã chính xác
const DISTRICT_COORDS = {
  'TP Buôn Ma Thuột': [12.6675, 108.0380],
  'TX Buôn Hồ':       [12.9220, 108.2680],
  "Huyện Ea H'leo":   [13.2000, 108.1800],
  'Huyện Krông Búk':  [12.9500, 108.1600],
  'Huyện Krông Năng': [12.9800, 108.4200],
  "Huyện Cư M'gar":   [12.8600, 108.1100],
  'Huyện Ea Súp':     [13.0800, 107.9000],
  'Huyện Buôn Đôn':   [12.8350, 107.8400],
  'Huyện Krông Pắc':  [12.6500, 108.2800],
  'Huyện Ea Kar':     [12.8000, 108.5300],
  "Huyện M'Đrắk":     [12.7500, 108.8000],
  'Huyện Krông Bông': [12.4350, 108.3800],
  'Huyện Lắk':        [12.3300, 108.1800],
  'Huyện Krông Ana':  [12.5000, 108.0300],
  'Huyện Cư Kuin':    [12.5800, 108.1500],
  'TP Tuy Hòa':       [13.0925, 109.3125],
  'TX Sông Cầu':      [13.4500, 109.2200],
  'Huyện Đông Hòa':   [12.9500, 109.3500],
  'Huyện Tây Hòa':    [13.0000, 109.0000],
  'Huyện Phú Hòa':    [13.0500, 109.1600],
  'Huyện Sơn Hòa':    [13.0450, 108.7200],
  'Huyện Sông Hinh':  [13.0300, 108.9000],
  'Huyện Đồng Xuân':  [13.2200, 109.0800],
  'Huyện Tuy An':     [13.3000, 109.2500],
};

function getPos(team) {
  const commune = team.location?.commune || team.name || '';

  // Ưu tiên 1: tra tọa độ chính xác theo tên xã
  if (COMMUNE_COORDS[commune]) {
    const base = COMMUNE_COORDS[commune];
    const str = (team._id || team.name || '') + commune;
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
    const offX = ((Math.abs(hash) % 100) / 100 - 0.5) * 0.025;
    const offY = (((Math.abs(hash * 31)) % 100) / 100 - 0.5) * 0.025;
    return [base[0] + offX, base[1] + offY];
  }

  // Ưu tiên 2: tra tọa độ theo district
  let d = team.location?.district || '';
  if (!DISTRICT_COORDS[d]) {
    const c = commune;
    if (c.includes('Buôn Ma Thuột') || c.includes('Tân An') || c.includes('Tân Lập') || c.includes('Ea Kao') || c.includes('Thành Nhất')) d = 'TP Buôn Ma Thuột';
    else if (c.includes('Buôn Hồ') || c.includes('Cư Bao')) d = 'TX Buôn Hồ';
    else if (c.includes("Cư M'gar") || c.includes('Quảng Phú') || c.includes('Cuôr Đăng')) d = "Huyện Cư M'gar";
    else if (c.includes('Krông Pắc') || c.includes('Ea Kly')) d = 'Huyện Krông Pắc';
    else if (c.includes("Ea H'leo") || c.includes('Ea Drăng') || c.includes('Ea Hiao')) d = "Huyện Ea H'leo";
    else if (c.includes('Krông Búk') || c.includes('Pơng Drang') || c.includes('Cư Pơng')) d = 'Huyện Krông Búk';
    else if (c.includes('Krông Năng') || c.includes('Dliê Ya') || c.includes('Tam Giang')) d = 'Huyện Krông Năng';
    else if (c.includes('Ea Kar') || c.includes('Ea Knốp') || c.includes('Cư Yang')) d = 'Huyện Ea Kar';
    else if (c.includes("M'Đrắk") || c.includes("M'Drắk") || c.includes('Cư Prao')) d = "Huyện M'Đrắk";
    else if (c.includes('Krông Bông') || c.includes('Yang Mao') || c.includes('Dang Kang')) d = 'Huyện Krông Bông';
    else if (c.includes('Lắk') || c.includes('Liên Sơn') || c.includes('Nam Ka')) d = 'Huyện Lắk';
    else if (c.includes('Buôn Đôn')) d = 'Huyện Buôn Đôn';
    else if (c.includes('Ea Súp') || c.includes('Ia Rvê') || c.includes('Ia Lốp') || c.includes('Ea Bung')) d = 'Huyện Ea Súp';
    else if (c.includes('Krông Ana') || c.includes('Ea Ktur') || c.includes('Dray Bhăng') || c.includes('Ea Na')) d = 'Huyện Krông Ana';
    else if (c.includes('Cư Kuin') || c.includes('Ea Ning')) d = 'Huyện Cư Kuin';
    // Phú Yên
    else if (c.includes('Tuy Hòa') || c.includes('Bình Kiến') || c.includes('Xuân Đài') || c.includes('Phú Yên') || c.includes('Phú Lâm')) d = 'TP Tuy Hòa';
    else if (c.includes('Sông Cầu') || c.includes('Xuân Cảnh') || c.includes('Xuân Thọ') || c.includes('Xuân Lộc')) d = 'TX Sông Cầu';
    else if (c.includes('Đông Hòa') || c.includes('Hòa Hiệp') || c.includes('Hòa Xuân')) d = 'Huyện Đông Hòa';
    else if (c.includes('Tây Hòa') || c.includes('Hòa Thịnh') || c.includes('Hòa Mỹ') || c.includes('Sơn Thành')) d = 'Huyện Tây Hòa';
    else if (c.includes('Phú Hòa 1') || c.includes('Phú Hòa 2')) d = 'Huyện Phú Hòa';
    else if (c.includes('Sơn Hòa') || c.includes('Vân Hòa') || c.includes('Tây Sơn') || c.includes('Suối Trai')) d = 'Huyện Sơn Hòa';
    else if (c.includes('Sông Hinh') || c.includes('Ea Ly') || c.includes('Ea Bá') || c.includes('Đức Bình')) d = 'Huyện Sông Hinh';
    else if (c.includes('Đồng Xuân') || c.includes('Xuân Lãnh') || c.includes('Phú Mỡ') || c.includes('Xuân Phước')) d = 'Huyện Đồng Xuân';
    else if (c.includes('Tuy An') || c.includes('Ô Loan')) d = 'Huyện Tuy An';
    else d = 'TP Buôn Ma Thuột';
  }

  const base = DISTRICT_COORDS[d] || CENTER;
  const str = (team._id || team.name || '') + (team.location?.commune || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const offX = ((Math.abs(hash) % 100) / 100 - 0.5) * 0.08;
  const offY = (((Math.abs(hash * 31)) % 100) / 100 - 0.5) * 0.08;
  return [base[0] + offX, base[1] + offY];
}

// Tạo Icon Lá Cờ Đỏ Sao Vàng / Cờ Đội hình Thanh niên số
function createFlagIcon(hasEvidence = false) {
  const flagColor = hasEvidence ? '#DC2626' : '#EA580C';
  return L.divIcon({
    className: 'custom-leaflet-flag',
    html: `
      <div style="position: relative; width: 36px; height: 40px; cursor: pointer; transform-origin: bottom left; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));" class="flag-wrapper">
        <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Cột cờ kim loại -->
          <rect x="5.5" y="3" width="3.2" height="35" rx="1.6" fill="#334155" stroke="#0F172A" stroke-width="0.5"/>
          <!-- Quả cầu vàng đỉnh cột cờ -->
          <circle cx="7.1" cy="3.5" r="2.8" fill="#F59E0B" stroke="#B45309" stroke-width="0.5"/>
          
          <!-- Lá cờ đỏ tung bay uốn lượn 3D -->
          <path d="M8.7 4 C14.5 1.5, 20.5 7, 29.5 4 C31.5 3.5, 31.5 17.5, 29.5 17.5 C20.5 20.5, 14.5 15, 8.7 18 Z" 
                fill="${flagColor}" 
                stroke="#991B1B" 
                stroke-width="0.8"/>
          
          <!-- Ngôi sao vàng 5 cánh tỏa sáng -->
          <polygon points="19,6 19.9,8.4 22.4,8.4 20.4,9.9 21.2,12.3 19,10.8 16.8,12.3 17.6,9.9 15.6,8.4 18.1,8.4" fill="#FDE047" stroke="#CA8A04" stroke-width="0.3"/>
        </svg>
        <!-- Chân bóng 3D -->
        <div style="position: absolute; bottom: 0; left: 3px; width: 8px; height: 3px; background: rgba(15,23,42,0.45); border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [36, 40],
    iconAnchor: [7.1, 38],
    popupAnchor: [12, -34]
  });
}

// Dịch vụ công nhanh
const QUICK_SERVICES = [
  { icon: '📝', title: 'Thủ tục hành chính', desc: 'Hỏi AI về giấy tờ, hồ sơ cần thiết', query: 'Tôi cần tư vấn về thủ tục hành chính' },
  { icon: '⚖️', title: 'Tư vấn pháp luật', desc: 'Tra cứu quy định, pháp lý địa phương', query: 'Tôi cần tư vấn pháp luật' },
  { icon: '🆘', title: 'Gửi yêu cầu hỗ trợ', desc: 'Gửi yêu cầu để xã cử đoàn viên hỗ trợ', link: '/ho-tro' },
  { icon: '🌱', title: 'Tình nguyện viên', desc: 'Tham gia chiến dịch Mùa Hè Xanh', query: 'Làm thế nào để tham gia chiến dịch tình nguyện?' },
  { icon: '🏥', title: 'Y tế cộng đồng', desc: 'Thông tin y tế, sức khỏe tại địa bàn', query: 'Thông tin y tế cộng đồng tại Đắk Lắk' },
  { icon: '🏗️', title: 'Công trình thanh niên', desc: 'Theo dõi tiến độ các dự án', query: 'Các công trình thanh niên đang triển khai?' },
];

// Danh mục tài liệu tham khảo chính thức
const DOC_CATEGORIES = [
  { id: 'ALL', label: '🌟 Tất cả tài liệu' },
  { id: 'HUONG_DAN', label: '📘 Cẩm nang 11 Chỉ tiêu' },
  { id: 'VAN_BAN', label: '📜 Văn bản Chỉ đạo' },
  { id: 'CONG_NGHE', label: '🤖 AI & Kỹ năng số' },
  { id: 'TRUYEN_THONG', label: '🎨 Nhận diện & Media' },
];

const REFERENCE_DOCUMENTS = [
  {
    id: 1,
    title: 'Sổ tay Hướng dẫn 11 Chỉ tiêu Chiến dịch 44 ngày đêm Chuyển đổi số 2026',
    categoryType: 'HUONG_DAN',
    categoryName: 'Cẩm nang Hướng dẫn',
    fileType: 'PDF',
    size: '4.2 MB',
    agency: 'Ban Chỉ đạo CĐS Tỉnh',
    date: '17/08/2026',
    desc: 'Cẩm nang chi tiết từng bước triển khai 11 chỉ tiêu số hóa: tiếp cận kỹ năng số, kích hoạt VNeID mức 2, DVC trực tuyến, thanh toán QR và lập Đội hình Thanh niên số.',
    color: '#DC2626',
    bg: '#FEF2F2',
    badge: 'Tài liệu Trọng tâm'
  },
  {
    id: 2,
    title: 'Kế hoạch số 44/KH-UBND: Phát động Chiến dịch 44 ngày đêm Thanh niên Đắk Lắk tiên phong CĐS',
    categoryType: 'VAN_BAN',
    categoryName: 'Văn bản Chỉ đạo',
    fileType: 'PDF',
    size: '1.8 MB',
    agency: 'UBND Tỉnh Đắk Lắk',
    date: '15/08/2026',
    desc: 'Văn bản chỉ đạo chính thức của UBND tỉnh ban hành về mục tiêu, lộ trình, phân công nhiệm vụ cho các sở ban ngành và UBND 102 xã/phường/thị trấn.',
    color: '#DC2626',
    bg: '#FEF2F2',
    badge: 'Văn bản Tỉnh'
  },
  {
    id: 3,
    title: 'Giáo trình Tập huấn Trí tuệ Nhân tạo (AI) cho Cán bộ Đoàn & Cơ sở năm 2026',
    categoryType: 'CONG_NGHE',
    categoryName: 'AI & Kỹ năng số',
    fileType: 'DOCX',
    size: '2.5 MB',
    agency: 'Tổ Công nghệ số Cộng đồng',
    date: '16/08/2026',
    desc: 'Tài liệu thực hành các công cụ AI: tự động hóa báo cáo, soạn thảo văn bản, thiết kế infographic truyền thông và giải đáp công dân trực tuyến 24/7.',
    color: '#2563EB',
    bg: '#EFF6FF',
    badge: 'Ứng dụng AI'
  },
  {
    id: 4,
    title: 'Hướng dẫn Kích hoạt VNeID Mức 2 & Nộp hồ sơ Dịch vụ công Quốc gia Toàn trình',
    categoryType: 'HUONG_DAN',
    categoryName: 'Dân sinh & DVC',
    fileType: 'PDF',
    size: '3.1 MB',
    agency: 'Công an Tỉnh & Tỉnh Đoàn',
    date: '12/08/2026',
    desc: 'Bộ infographic và hướng dẫn người dân tự tích hợp CCCD gắn chip, thẻ BHYT, GPLX và tra cứu thông tin hành chính trên điện thoại thông minh.',
    color: '#16A34A',
    bg: '#F0FDF4',
    badge: 'Phổ cập Dân sinh'
  },
  {
    id: 5,
    title: 'Bộ Nhận diện Thương hiệu & Ấn phẩm Truyền thông Chiến dịch 44 ngày đêm',
    categoryType: 'TRUYEN_THONG',
    categoryName: 'Nhận diện & Media',
    fileType: 'ZIP',
    size: '15.4 MB',
    agency: 'Ban Tuyên giáo Tỉnh Đoàn',
    date: '14/08/2026',
    desc: 'Trọn bộ File thiết kế gốc Logo, Banner sân khấu ra quân, Standee tuyên truyền, Khung Avatar Facebook và mẫu bài viết truyền thông chiến dịch.',
    color: '#D97706',
    bg: '#FEF3C7',
    badge: 'Ấn phẩm số'
  },
  {
    id: 6,
    title: 'Sổ tay 5 Bước Đăng ký & Vận hành Website AI.VN SmartWeb cho Tiểu thương, HTX',
    categoryType: 'CONG_NGHE',
    categoryName: 'Kinh tế số & OCOP',
    fileType: 'PDF',
    size: '2.0 MB',
    agency: 'Trung tâm Hỗ trợ Khởi nghiệp',
    date: '10/08/2026',
    desc: 'Cẩm nang tạo gian hàng số, nhận tài trợ tên miền .VN miễn phí, đưa nông sản OCOP lên bản đồ số và tích hợp thanh toán mã QR tự động.',
    color: '#9333EA',
    bg: '#FAF5FF',
    badge: 'Kinh tế số'
  }
];

const Home = () => {
  const [teams, setTeams] = useState([]);
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState({ total: 0, volunteers: 0, projects: 0, value: 0, beneficiaries: 0 });
  const [swStats, setSwStats] = useState({ total: 0, active: 0 });
  const [search, setSearch] = useState('');
  const [docCategory, setDocCategory] = useState('ALL');
  const mapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/teams?status=APPROVED').then(r => {
      setTeams(r.data);
      const s = r.data.reduce((acc, t) => ({
        total: acc.total + 1,
        volunteers: acc.volunteers + (t.statistics?.volunteersCount || 0),
        projects: acc.projects + (t.statistics?.projectsCount || 0),
        value: acc.value + (t.statistics?.estimatedValue || 0),
        beneficiaries: acc.beneficiaries + (t.statistics?.beneficiaries || 0),
      }), { total: 0, volunteers: 0, projects: 0, value: 0, beneficiaries: 0 });
      setStats(s);
    }).catch(() => { });
    api.get('/news').then(r => setNews(r.data.slice(0, 3))).catch(() => { });
    api.get('/smartweb/public-stats').then(r => setSwStats(r.data)).catch(() => { });
  }, []);

  const handleQuickService = (query) => {
    // Trigger chatbot
    const event = new CustomEvent('openChatbot', { detail: { query } });
    window.dispatchEvent(event);
  };

  const handleDownloadDoc = (doc) => {
    toast.success(`📥 Đang tải xuống "${doc.title}"...`);
  };

  const handleAskAiAboutDoc = (doc) => {
    handleQuickService(`Tóm tắt nội dung chính và hướng dẫn thực hiện theo tài liệu: "${doc.title}"`);
  };

  const filteredTeams = teams.filter(t =>
    !search ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.location?.district?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDocs = REFERENCE_DOCUMENTS.filter(d =>
    docCategory === 'ALL' || d.categoryType === docCategory
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          HERO — Chính quyền số dành cho người dân
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-hero">
        <div className="container">
          <div className="ctz-hero-grid">
            {/* Left: Call to Action */}
            <div className="ctz-hero-left">
              <div className="ctz-hero-badge">
                <ShieldCheck size={14} />
                <span>Cổng thông tin chính quyền số Đắk Lắk 2026</span>
              </div>
              <h1 className="ctz-hero-h1">
                Chính quyền số<br />
                <span className="ctz-hero-accent">phục vụ người dân</span>
              </h1>
              <p className="ctz-hero-sub">
                Chiến dịch chuyển đổi số, sổ tay quản lý văn bản, tra cứu thủ tục hành chính và kết nối với AI Trợ lý 24/7 — mọi thứ bạn cần đều ở đây.
              </p>
              <div className="ctz-hero-actions">
                <button onClick={() => handleQuickService('Xin chào, tôi cần hỗ trợ!')} className="btn btn-white btn-lg">
                  <MessageCircle size={18} /> Hỏi AI Trợ lý ngay
                </button>
                <Link to="/doi-hinh" className="btn btn-outline-white btn-lg">
                  Xem Bản đồ đội hình
                </Link>
              </div>
            </div>

            {/* Right: Glassmorphic Stats Grid */}
            <div className="ctz-hero-right">
              <div className="ctz-stat-grid">
                {[
                  { val: stats.total, suf: '', lbl: 'Đội hình hoạt động', icon: Map },
                  { val: stats.volunteers, suf: '+', lbl: 'Tình nguyện viên', icon: Users },
                  { val: stats.projects, suf: '', lbl: 'Công trình hoàn thành', icon: Hammer },
                  { val: stats.beneficiaries, suf: '+', lbl: 'Người được hỗ trợ', icon: Heart },
                ].map((s, i) => (
                  <div key={i} className="ctz-stat-box">
                    <s.icon size={26} className="ctz-stat-icon" />
                    <div className="ctz-stat-val">
                      {typeof s.val === 'number' ? s.val.toLocaleString('vi-VN') : s.val}{s.suf}
                    </div>
                    <div className="ctz-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          DỊCH VỤ NHANH — Quick Services
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-services">
        <div className="container">
          <div className="ctz-services-header">
            <div>
              <span className="section-label">Dịch vụ công trực tuyến</span>
              <h2 className="section-title" style={{ marginTop: 8, textAlign: 'left' }}>Bạn cần hỗ trợ gì?</h2>
            </div>
            <p className="ctz-services-sub">AI Trợ lý sẽ tư vấn ngay lập tức — không cần chờ đợi, không cần đến trực tiếp.</p>
          </div>
          <div className="ctz-services-grid">
            {QUICK_SERVICES.map((s, i) => (
              <button key={i} className="ctz-service-card anim" style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => s.link ? navigate(s.link) : handleQuickService(s.query)}>
                <div className="ctz-service-icon">{s.icon}</div>
                <div>
                  <div className="ctz-service-title">{s.title}</div>
                  <div className="ctz-service-desc">{s.desc}</div>
                </div>
                <ChevronRight size={16} className="ctz-service-arrow" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BẢN ĐỒ SỐ — Map Section
      ══════════════════════════════════════════════════════ */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="ctz-map-wrap">
            <div className="ctz-map-header">
              <div>
                <span className="section-label">Theo dõi trực tuyến</span>
                <h2 className="section-title" style={{ marginTop: 8 }}>Bản đồ số Đắk Lắk</h2>
                <p style={{ color: 'var(--tx-3)', marginTop: 6, fontSize: '.92rem' }}>
                  {stats.total} đội hình đang hoạt động — Click vào điểm để xem thông tin chi tiết
                </p>
              </div>
              {/* Search */}
              <div className="ctz-map-search">
                <Search size={16} />
                <input
                  placeholder="Tìm huyện, đội hình..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <MapContainer center={CENTER} zoom={9} scrollWheelZoom={true}
              style={{ height: 520, borderRadius: 16, boxShadow: '0 8px 30px rgba(15,23,42,.1)' }}>
              <TileLayer
                attribution='&copy; CartoDB'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              {filteredTeams.map(t => (
                <Marker 
                  key={t._id} 
                  position={getPos(t)} 
                  icon={createFlagIcon(!!t.evidenceLinks)}
                >
                  <Popup>
                    <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", minWidth: 260, padding: '4px 2px' }}>
                      {/* Tiêu đề Đội hình / Xã */}
                      <div style={{ fontWeight: 800, fontSize: '.98rem', color: '#1E3A8A', marginBottom: 6, lineHeight: 1.3 }}>
                        {t.name}
                      </div>
                      
                      <div style={{ fontSize: '.8rem', color: '#475569', marginBottom: 4 }}>
                        🏫 <strong>{t.schoolOrUnit || 'Đoàn cơ sở'}</strong>
                      </div>
                      
                      <div style={{ fontSize: '.78rem', color: '#64748B', marginBottom: 8 }}>
                        📍 {t.location?.commune || 'Xã/Phường'}, {t.location?.district || 'Đắk Lắk'}
                      </div>

                      {t.reporterName && (
                        <div style={{ fontSize: '.75rem', color: '#1E40AF', background: '#EFF6FF', padding: '4px 8px', borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                          👤 Cán bộ nộp: {t.reporterName}
                        </div>
                      )}

                      {/* Số liệu 4 chỉ tiêu nổi bật */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
                        marginBottom: 10, background: '#F8FAFC', padding: 8, borderRadius: 8,
                        border: '1px solid #E2E8F0', fontSize: '.75rem'
                      }}>
                        <div>💻 KNS: <strong style={{ color: '#0284C7' }}>{(t.kpiSummary?.digitalSkills || t.statistics?.beneficiaries || 0).toLocaleString('vi-VN')}</strong></div>
                        <div>🪪 VNeID: <strong style={{ color: '#16A34A' }}>{(t.kpiSummary?.vneidSupport || 0).toLocaleString('vi-VN')}</strong></div>
                        <div>🏛️ DVC: <strong style={{ color: '#7C3AED' }}>{(t.kpiSummary?.publicServices || 0).toLocaleString('vi-VN')}</strong></div>
                        <div>📱 QR: <strong style={{ color: '#D97706' }}>{(t.kpiSummary?.qrSupport || 0).toLocaleString('vi-VN')}</strong></div>
                      </div>

                      {/* NÚT MỞ LINK MINH CHỨNG GOOGLE DRIVE / HÌNH ẢNH */}
                      {t.evidenceLinks ? (
                        <a 
                          href={t.evidenceLinks} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '8px 12px', background: '#1D4ED8', color: '#FFFFFF',
                            borderRadius: 8, fontWeight: 700, fontSize: '.78rem', textDecoration: 'none',
                            boxShadow: '0 2px 6px rgba(29, 78, 216, 0.3)', transition: 'background .2s'
                          }}
                        >
                          <ExternalLink size={13} /> 🔗 Mở Link Minh chứng (Drive / Ảnh)
                        </a>
                      ) : (
                        <div style={{ fontSize: '.72rem', color: '#94A3B8', textAlign: 'center', fontStyle: 'italic', padding: '3px 0' }}>
                          Chưa đính kèm link minh chứng
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Link to="/doi-hinh" className="btn btn-outline">
                Xem tất cả đội hình dạng danh sách <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BIỂU TƯỢNG ĐẮk LẮk — Landmark Showcase
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-landmarks-section">
        <div className="container">
          <div className="ctz-landmarks-header">
            <div>
              <span className="section-label">Bản sắc vùng đất Tây Nguyên</span>
              <h2 className="section-title" style={{ marginTop: 8 }}>Biểu tượng ĐẮk LẮk</h2>
              <p style={{ color: 'var(--tx-3)', marginTop: 8, fontSize: '.95rem', maxWidth: 520, lineHeight: 1.7 }}>
                Mảnh đất ĐẮk LẮk — nơi hội tụ những giá trị lịch sử và vẻ đẹp thiên nhiên không nơi nào có được.
              </p>
            </div>
          </div>
          <div className="ctz-landmarks-grid">
            <div className="ctz-landmark-card">
              <div className="ctz-landmark-img-wrap">
                <img src="/landmark1.jpg" alt="Tượng đài Chiến thắng Buôn Ma Thuột" />
                <div className="ctz-landmark-overlay">
                  <div className="ctz-landmark-tag">Biểu tượng lịch sử</div>
                </div>
              </div>
              <div className="ctz-landmark-info">
                <h3>Tượng đài Chiến thắng Buôn Ma Thuột</h3>
                <p>Biểu tượng hào hùng của chiến thắng Buôn Ma Thuột năm 1975 — điểm khởi đầu của Đại thắng mùa Xuân, giải phóng miền Nam, thống nhất đất nước.</p>
              </div>
            </div>
            <div className="ctz-landmark-card">
              <div className="ctz-landmark-img-wrap">
                <img src="/landmark2.jpg" alt="Tháp Nghinh Phong" />
                <div className="ctz-landmark-overlay">
                  <div className="ctz-landmark-tag">Công trình văn hóa</div>
                </div>
              </div>
              <div className="ctz-landmark-info">
                <h3>Tháp Nghinh Phong</h3>
                <p>Công trình kiến trúc độc đáo của Tây Nguyên — biểu tượng của sự phát triển văn hóa và du lịch tại điểm cuối dòng chảy của vùng đất Tây Nguyên huyền thoại.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          AI CHATBOT BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-ai-banner">
        <div className="container">
          <div className="ctz-ai-inner">
            <div className="ctz-ai-left">
              <div className="ctz-ai-robot">🤖</div>
              <div>
                <h3>AI Trợ lý ảo Đắk Lắk</h3>
                <p>Giải đáp mọi thắc mắc về thủ tục hành chính, pháp luật và chiến dịch tình nguyện — hoàn toàn miễn phí, hoạt động 24/7.</p>
              </div>
            </div>
            <div className="ctz-ai-chips">
              {['Thủ tục đăng ký hộ khẩu?', 'Tôi muốn tham gia tình nguyện', 'Quy định đất đai Đắk Lắk?'].map(q => (
                <button key={q} className="ctz-ai-chip" onClick={() => handleQuickService(q)}>
                  {q} →
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SMARTWEB SHOWCASE
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-section" style={{ background: 'var(--surface-0)', padding: '80px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', color: '#1D4ED8', padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: '.85rem', marginBottom: 20 }}>
                <Globe size={16} /> Chiến dịch 44 ngày đêm
              </div>
              <h2 style={{ fontSize: '2.4rem', color: '#0F172A', marginBottom: 20, lineHeight: 1.2 }}>
                Mỗi tiểu thương <br/><span style={{ color: '#1D4ED8' }}>một Website .VN</span>
              </h2>
              <p style={{ color: 'var(--tx-2)', fontSize: '1.1rem', marginBottom: 30, lineHeight: 1.6 }}>
                Hỗ trợ 100% chi phí đăng ký tên miền .VN và xây dựng website bán hàng chuẩn thương mại điện tử cho các hộ kinh doanh, tiểu thương trên địa bàn tỉnh Đắk Lắk.
              </p>
              
              <div style={{ display: 'flex', gap: 24, marginBottom: 36 }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{swStats.total}+</div>
                  <div style={{ fontSize: '.9rem', color: 'var(--tx-3)', fontWeight: 600, marginTop: 4 }}>Tiểu thương đăng ký</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{swStats.active}+</div>
                  <div style={{ fontSize: '.9rem', color: 'var(--tx-3)', fontWeight: 600, marginTop: 4 }}>Website hoạt động</div>
                </div>
              </div>

              <Link to="/dang-ky-website" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', fontSize: '1.05rem' }}>
                Đăng ký Website miễn phí <ArrowRight size={18} />
              </Link>
            </div>
            
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, background: '#1D4ED820', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
              <div style={{ position: 'absolute', bottom: -20, left: -20, width: 200, height: 200, background: '#10B98120', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
              
              <div style={{ background: 'white', borderRadius: 24, padding: 32, boxShadow: 'var(--sh-xl)', position: 'relative', zIndex: 1, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: 16, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-2)' }}>
                  <div style={{ textAlign: 'center', color: 'var(--tx-4)' }}>
                    <Globe size={48} style={{ opacity: 0.5, margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 600 }}>SmartWeb Demo Preview</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TIN TỨC
      ══════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════
          TIN TỨC & HOẠT ĐỘNG CHUYỂN ĐỔI SỐ
      ══════════════════════════════════════════════════════ */}
      {news.length > 0 && (
        <section className="section" style={{ background: 'var(--bg)', padding: '70px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <span className="section-label">Truyền thông & Hoạt động</span>
                <h2 className="section-title" style={{ marginTop: 8 }}>Tin tức Chiến dịch Chuyển đổi số</h2>
                <p style={{ color: 'var(--tx-3)', marginTop: 6, fontSize: '.95rem' }}>
                  Cập nhật các hoạt động, mô hình số hóa nổi bật từ 102 xã, phường tỉnh Đắk Lắk
                </p>
              </div>
              <Link to="/tin-tuc" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Tất cả tin tức <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid-3">
              {news.slice(0, 3).map((n, i) => (
                <Link to="/tin-tuc" key={n._id || i} className="news-card anim" style={{ animationDelay: `${i * 80}ms`, textDecoration: 'none', color: 'inherit' }}>
                  <div className="news-card-thumb-wrap">
                    <img 
                      src={getNewsImg(n, i)} 
                      alt={n.title}
                      onError={(e) => { e.target.src = TNV_IMAGES[0]; }}
                    />
                    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                      <span className="news-category-tag" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        {n.category || 'Chiến dịch 44 ngày'}
                      </span>
                    </div>
                  </div>
                  <div className="news-card-body">
                    <div className="news-date">
                      <Calendar size={12} />
                      {new Date(n.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    <h3 className="news-title" style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>
                      {n.title}
                    </h3>
                    <p className="news-excerpt" style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.55 }}>
                      {n.summary || n.content}
                    </p>
                    <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Chi tiết</span>
                      <span style={{ color: '#1D4ED8', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Đọc thêm <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TÀI LIỆU & CẨM NANG THAM KHẢO CHUYỂN ĐỔI SỐ
      ══════════════════════════════════════════════════════ */}
      <section className="ctz-docs-section">
        <div className="container">
          <div className="ctz-docs-header">
            <div>
              <span className="section-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FolderDown size={14} /> Tài nguyên & Văn bản biểu mẫu
              </span>
              <h2 className="section-title" style={{ marginTop: 8 }}>
                Tài liệu & Cẩm nang Tham khảo
              </h2>
              <p style={{ color: 'var(--tx-3)', marginTop: 6, fontSize: '.95rem', maxWidth: 640 }}>
                Tổng hợp văn bản chỉ đạo, cẩm nang 11 chỉ tiêu, giáo trình AI, tài liệu tập huấn và bộ nhận diện truyền thông phục vụ cơ sở.
              </p>
            </div>
            <Link to="/dashboard/eoffice/shared-drive" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FileDown size={16} /> Kho dữ liệu số đầy đủ <ArrowRight size={15} />
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="ctz-docs-filter-wrap">
            {DOC_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`ctz-doc-filter-btn ${docCategory === cat.id ? 'active' : ''}`}
                onClick={() => setDocCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Documents Grid */}
          <div className="ctz-docs-grid">
            {filteredDocs.map((doc, idx) => (
              <div key={doc.id || idx} className="ctz-doc-card anim" style={{ animationDelay: `${idx * 60}ms` }}>
                <div>
                  <div className="ctz-doc-top">
                    <div className="ctz-doc-icon-box" style={{ background: doc.bg, color: doc.color }}>
                      {doc.fileType}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: doc.bg,
                          color: doc.color
                        }}>
                          {doc.categoryName}
                        </span>
                        {doc.badge && (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#D97706',
                            background: '#FEF3C7',
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            ★ {doc.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="ctz-doc-title">
                        {doc.title}
                      </h3>
                    </div>
                  </div>

                  <p className="ctz-doc-desc">
                    {doc.desc}
                  </p>
                </div>

                <div>
                  <div className="ctz-doc-meta">
                    <span>🏢 {doc.agency}</span>
                    <span>•</span>
                    <span>📅 {doc.date}</span>
                    <span>•</span>
                    <span>💾 {doc.size}</span>
                  </div>

                  <div className="ctz-doc-actions">
                    <button
                      className="ctz-doc-btn-download"
                      onClick={() => handleDownloadDoc(doc)}
                    >
                      <Download size={15} /> Tải tài liệu ({doc.fileType})
                    </button>
                    <button
                      className="ctz-doc-btn-ai"
                      onClick={() => handleAskAiAboutDoc(doc)}
                      title="Hỏi AI tóm tắt nội dung tài liệu này"
                    >
                      <Bot size={15} color="#1D4ED8" /> Hỏi AI
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA — Đăng ký tài khoản
      ══════════════════════════════════════════════════════ */}
      {!localStorage.getItem('token') && (
        <section className="ctz-cta">
          <div className="container">
            <div className="ctz-cta-inner">
              <div>
                <h3>Tạo tài khoản Citizen miễn phí</h3>
                <p>Đăng ký để nhận thông báo cập nhật chiến dịch, lưu câu hỏi AI và kết nối với cộng đồng tình nguyện Đắk Lắk.</p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg">Đăng ký miễn phí</Link>
                <Link to="/login" className="btn btn-outline btn-lg">Đăng nhập</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Home;
