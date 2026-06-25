import { API_URL } from '../lib/api';

export const getFileUrl = (path, fileName) => {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  // Fallback cho local uploads (đã chuẩn hóa trong backend)
  const cleanPath = path.replace(/\\/g, '/');
  // API_URL có thể là https://api.dainam.site/gov/api, ta cần bỏ /api đi
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}/${cleanPath}`;
};

export const downloadFile = async (url, fileName) => {
  if (!url) return;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error('Lỗi tải file bằng fetch (CORS/Network), chuyển sang mở tab mới:', err);
    window.open(url, '_blank');
  }
};
