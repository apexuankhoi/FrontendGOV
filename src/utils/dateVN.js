/**
 * dateVN.js - Utility xử lý ngày tháng theo múi giờ Việt Nam (UTC+7)
 *
 * VẤN ĐỀ: new Date().toISOString() luôn trả về UTC
 *   → Tại Việt Nam lúc 00:30 ngày 25/8, toISOString() trả "2026-08-24T17:30:00Z"
 *   → split('T')[0] = "2026-08-24" ❌ (phải là "2026-08-25")
 *
 * GIẢI PHÁP: Dùng các hàm dưới đây thay thế toISOString().split('T')[0]
 */

const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7 = 7 giờ * 60 phút * 60 giây * 1000ms

/**
 * Lấy chuỗi ngày hôm nay theo giờ Việt Nam dạng "YYYY-MM-DD"
 * Thay thế: new Date().toISOString().split('T')[0]
 */
export function todayVN() {
  const now = new Date(Date.now() + VN_OFFSET_MS);
  return now.toISOString().split('T')[0];
}

/**
 * Chuyển một giá trị Date/string sang chuỗi "YYYY-MM-DD" theo giờ Việt Nam
 * Thay thế: new Date(val).toISOString().split('T')[0]
 *
 * Xử lý cả 2 định dạng lưu trong DB:
 *   - Cũ (trước fix): "2026-08-15T17:00:00.000Z" (midnight VN = T17 UTC)
 *   - Mới (sau fix):  "2026-08-16T00:00:00.000Z" (UTC midnight)
 */
export function toVNDateStr(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const vnDate = new Date(d.getTime() + VN_OFFSET_MS);
  return vnDate.toISOString().split('T')[0];
}

/**
 * Format ngày dạng "DD/MM/YYYY" theo giờ Việt Nam
 * Thay thế: new Date(val).toLocaleDateString('vi-VN') — vì toLocaleDateString
 * phụ thuộc vào timezone máy client, dùng hàm này an toàn hơn.
 */
export function formatDateVN(dateVal) {
  const s = toVNDateStr(dateVal);
  if (!s) return 'Không rõ';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Lấy ngày hôm nay dạng "DD/MM/YYYY" theo giờ Việt Nam
 */
export function todayVNFormatted() {
  return formatDateVN(new Date());
}

/**
 * So sánh 1 reportDate (từ DB) với 1 chuỗi YYYY-MM-DD
 * Ví dụ: isDateVN(item.reportDate, '2026-08-25') → true/false
 */
export function isDateVN(dateVal, yyyymmdd) {
  return toVNDateStr(dateVal) === yyyymmdd;
}
