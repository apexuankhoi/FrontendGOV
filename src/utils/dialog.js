import Swal from 'sweetalert2';
import './dialog.css';

/**
 * Cấu hình base cho SweetAlert2 theo theme Gov Đắk Lắk
 */
const baseSwalConfig = {
  customClass: {
    popup: 'gov-dialog-popup',
    backdrop: 'gov-dialog-backdrop',
    title: 'gov-dialog-title',
    htmlContainer: 'gov-dialog-content',
    actions: 'gov-dialog-actions',
    confirmButton: 'gov-dialog-confirm-btn',
    cancelButton: 'gov-dialog-cancel-btn',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'gov-dialog-show'
  },
  hideClass: {
    popup: 'gov-dialog-hide'
  },
  reverseButtons: true,
  focusConfirm: true,
};

/**
 * Hiển thị hộp thoại thông báo (Alert Dialog)
 */
export const showAlert = (message, options = {}) => {
  const {
    title = 'Thông báo',
    icon = 'info',
    confirmText = 'Đã hiểu',
  } = typeof options === 'string' ? { title: options } : options;

  return Swal.fire({
    ...baseSwalConfig,
    title,
    html: message,
    icon,
    confirmButtonText: confirmText,
    showCancelButton: false,
  });
};

/**
 * Hiển thị hộp thoại báo lỗi (Error Dialog)
 */
export const showError = (message, title = 'Có lỗi xảy ra') => {
  return Swal.fire({
    ...baseSwalConfig,
    title,
    html: message,
    icon: 'error',
    confirmButtonText: 'Đóng',
    showCancelButton: false,
  });
};

/**
 * Hiển thị hộp thoại thành công (Success Dialog)
 */
export const showSuccess = (message, title = 'Thành công') => {
  return Swal.fire({
    ...baseSwalConfig,
    title,
    html: message,
    icon: 'success',
    confirmButtonText: 'Tuyệt vời',
    showCancelButton: false,
  });
};

/**
 * Hiển thị hộp thoại cảnh báo (Warning Dialog)
 */
export const showWarning = (message, title = 'Cảnh báo') => {
  return Swal.fire({
    ...baseSwalConfig,
    title,
    html: message,
    icon: 'warning',
    confirmButtonText: 'Đã hiểu',
    showCancelButton: false,
  });
};

/**
 * Hiển thị hộp thoại xác nhận (Confirm Dialog) - Trả về Promise<boolean>
 * @param {string} message 
 * @param {object} options { title, confirmText, cancelText, isDanger }
 * @returns {Promise<boolean>}
 */
export const showConfirm = async (message, options = {}) => {
  const {
    title = 'Xác nhận thao tác',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    isDanger = false,
    icon = 'warning'
  } = options;

  const customClass = { ...baseSwalConfig.customClass };
  if (isDanger) {
    customClass.confirmButton = 'gov-dialog-confirm-btn gov-dialog-danger-btn';
  }

  const result = await Swal.fire({
    ...baseSwalConfig,
    customClass,
    title,
    html: message,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });

  return result.isConfirmed;
};

/**
 * Khởi tạo ghi đè window.alert để không bao giờ hiện dialog "says" mặc định của trình duyệt
 */
export const initGlobalDialog = () => {
  if (typeof window !== 'undefined') {
    window.alert = (msg) => {
      // Tự động nhận diện lỗi hay thông báo thường
      const isError = /lỗi|thất bại|failed|error|sai|không thể/i.test(String(msg));
      if (isError) {
        showError(String(msg), 'Thông báo lỗi');
      } else {
        showAlert(String(msg), { title: 'Thông báo hệ thống' });
      }
    };
  }
};

export default {
  alert: showAlert,
  error: showError,
  success: showSuccess,
  warning: showWarning,
  confirm: showConfirm,
  initGlobalDialog,
};
