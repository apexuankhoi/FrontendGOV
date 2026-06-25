import { API_URL } from '../lib/api';

export const getFileUrl = (path) => {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  // Fallback cho local uploads (đã chuẩn hóa trong backend)
  const cleanPath = path.replace(/\\/g, '/');
  // API_URL có thể là https://api.dainam.site/gov/api, ta cần bỏ /api đi
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}/${cleanPath}`;
};
