import { API_URL } from '../lib/api';

export const getFileUrl = (path, fileName) => {
  if (!path) return '#';
  if (path.startsWith('http')) {
    if (fileName && path.includes('res.cloudinary.com') && path.includes('/upload/')) {
      // Inject fl_attachment để tải về với đúng tên file gốc
      const parts = path.split('/upload/');
      if (parts.length === 2) {
        // Tên file phải được encode an toàn trên URL
        const safeName = encodeURIComponent(fileName);
        return `${parts[0]}/upload/fl_attachment:${safeName}/${parts[1]}`;
      }
    }
    return path;
  }
  // Fallback cho local uploads (đã chuẩn hóa trong backend)
  const cleanPath = path.replace(/\\/g, '/');
  // API_URL có thể là https://api.dainam.site/gov/api, ta cần bỏ /api đi
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}/${cleanPath}`;
};
