import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'https://api.dainam.site/gov';
export const BASE_URL = API_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Tự động gắn token vào header nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động xử lý Refresh Token khi gặp lỗi 401 (Hết hạn Token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('token', res.data.token);

        // Cập nhật lại header và gửi lại request gốc
        originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
        return api(originalRequest);
      } catch (err) {
        // Refresh token cũng hết hạn -> Bắt đăng nhập lại
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
