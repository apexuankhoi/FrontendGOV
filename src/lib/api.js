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
// và 403 (Token cũ chưa có agencyId → tự login lại để lấy token mới)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── Xử lý 401 (token hết hạn hoặc server restart hoặc zombie token) ──────
    if (error.response?.status === 401 && !originalRequest._retry) {
      const code = error.response?.data?.code;

      // Zombie token (user bị xóa) hoặc server restart → về login ngay
      if (code === 'SERVER_RESTARTED' || code === 'USER_NOT_FOUND') {
        localStorage.clear();
        const msg = code === 'USER_NOT_FOUND'
          ? '⚠️ Tài khoản không còn tồn tại. Vui lòng đăng ký lại hoặc liên hệ Admin.'
          : '🔄 Hệ thống vừa được cập nhật. Vui lòng đăng nhập lại.';
        sessionStorage.setItem('loginNotice', msg);
        window.location.href = '/login';
        return Promise.reject(error);
      }


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

    // ── Xử lý 403 (Token cũ thiếu agencyId) → Tự login lại để lấy token mới ─
    if (error.response?.status === 403
      && !originalRequest._agencyRetry
      && error.response?.data?.message?.includes('liên kết')) {
      originalRequest._agencyRetry = true;
      try {
        const savedEmail = localStorage.getItem('email');
        const savedPass = localStorage.getItem('_p'); // nếu lưu tạm
        if (savedEmail && savedPass) {
          const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
            email: savedEmail,
            password: atob(savedPass)
          });
          if (loginRes.data.token) {
            localStorage.setItem('token', loginRes.data.token);
            if (loginRes.data.refreshToken) localStorage.setItem('refreshToken', loginRes.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${loginRes.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (retryErr) {
        // Không thể tự đăng nhập lại → báo lỗi thông thường
      }
    }

    return Promise.reject(error);
  }
);

export default api;
