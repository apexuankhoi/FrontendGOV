import React, { useState } from 'react';
import { 
  X, BookOpen, FileInput, FileOutput, Send, Bot, CheckCircle2, 
  ArrowRight, Clock, Users, Building2, Sparkles, AlertCircle, HelpCircle,
  CheckSquare, Shield, Layers, FileText, ChevronRight
} from 'lucide-react';

const EofficeGuideModal = ({ isOpen, onClose, defaultTab = 'outgoing' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16
    }}>
      <div style={{
        maxWidth: 860, width: '100%', maxHeight: '90vh',
        background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)', color: '#0F172A',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: '#1D4ED8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: '0 4px 10px rgba(29, 78, 216, 0.3)'
            }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1E3A8A' }}>
                Cẩm nang Hướng dẫn Văn phòng Điện tử eOffice
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '.84rem', color: '#64748B' }}>
                Quy trình gửi văn bản đi liên thông và tiếp nhận, xử lý văn bản đến
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: '#64748B', transition: 'background .2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex', gap: 8, padding: '12px 24px', background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0', overflowX: 'auto'
        }}>
          {[
            { id: 'outgoing', label: '📤 Quy trình Gửi Văn bản Đi', icon: FileOutput },
            { id: 'incoming', label: '📥 Quy trình Xử lý Văn bản Đến', icon: FileInput },
            { id: 'workflow', label: '🔄 Sơ đồ Liên thông Tỉnh - Xã', icon: Layers },
            { id: 'faq',      label: '💡 Mẹo nhanh & FAQ', icon: HelpCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                borderRadius: 10, border: 'none', fontSize: '.88rem', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s',
                background: activeTab === tab.id ? '#1D4ED8' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : '#64748B',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(29, 78, 216, 0.25)' : 'none'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: GỬI VĂN BẢN ĐI */}
          {activeTab === 'outgoing' && (
            <div>
              <div style={{
                background: '#EFF6FF', padding: '14px 18px', borderRadius: 12,
                border: '1px solid #BFDBFE', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12
              }}>
                <Sparkles size={22} color="#1D4ED8" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '.88rem', color: '#1E40AF', lineHeight: 1.45 }}>
                  <strong>Văn bản đi</strong> dùng khi đơn vị bạn ban hành công văn, thông báo, quyết định và cần <strong>gửi liên thông</strong> sang Tỉnh hoặc các Xã/Phường khác trực tiếp trên hệ thống mà không cần gửi bản giấy.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  {
                    step: '1',
                    title: 'Bấm nút "+ Tạo văn bản đi"',
                    desc: 'Tại menu "Văn bản đi", bấm nút màu xanh "+ Tạo văn bản đi" ở góc phải màn hình để mở form soạn thảo.',
                    color: '#2563EB', bg: '#EFF6FF'
                  },
                  {
                    step: '2',
                    title: 'Nhập thông tin hoặc Dùng AI Soạn thảo',
                    desc: 'Điền Số/Ký hiệu (ví dụ: 12/UBND-VP), Ngày ban hành, Trích yếu nội dung. Bạn có thể bấm nút "✨ AI Soạn thảo" để AI tự động tạo trích yếu và nội dung chuẩn hành chính theo Nghị định 30.',
                    color: '#7C3AED', bg: '#F5F3FF'
                  },
                  {
                    step: '3',
                    title: 'Đính kèm tệp văn bản (PDF / Word / Ảnh scan)',
                    desc: 'Tải lên tệp văn bản chính thức đã có chữ ký / con dấu (khuyên dùng định dạng .PDF để các đơn vị nhận dễ xem và AI hỗ trợ đọc nhanh).',
                    color: '#059669', bg: '#ECFDF5'
                  },
                  {
                    step: '4',
                    title: 'Chọn cơ quan nhận liên thông (Rất quan trọng!)',
                    desc: 'Tại mục "Gửi liên thông đến cơ quan", bạn có thể tích chọn đích danh từng Xã/Phường, hoặc bấm các nút tiện ích: "🏛️ Chọn Cấp Tỉnh", "🏘️ Chọn tất cả Xã/Phường (102 Xã)", "🌐 Toàn bộ cơ quan".',
                    color: '#D97706', bg: '#FFFBEB'
                  },
                  {
                    step: '5',
                    title: 'Hoàn tất & Phát hành liên thông',
                    desc: 'Bấm "Lưu & Phát hành văn bản". Hệ thống sẽ tự động chuyển văn bản này thành "Văn bản đến" trong hộp thư của tất cả các đơn vị bạn đã chọn kèm thông báo Realtime.',
                    color: '#0284C7', bg: '#F0F9FF'
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14,
                    background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, background: item.bg, color: item.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem',
                      flexShrink: 0, border: `1px solid ${item.color}40`
                    }}>
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#1E293B', marginBottom: 3 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '.85rem', color: '#475569', lineHeight: 1.45 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: XỬ LÝ VĂN BẢN ĐẾN */}
          {activeTab === 'incoming' && (
            <div>
              <div style={{
                background: '#ECFDF5', padding: '14px 18px', borderRadius: 12,
                border: '1px solid #A7F3D0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12
              }}>
                <CheckCircle2 size={22} color="#059669" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '.88rem', color: '#065F46', lineHeight: 1.45 }}>
                  <strong>Văn bản đến</strong> quản lý toàn bộ công văn nhận được từ Tỉnh hoặc Xã khác chuyển tới. Hệ thống tích hợp <strong>AI OCR</strong> tự động trích xuất thông tin và <strong>AI Giao việc</strong> tự động phân công cán bộ xử lý đúng hạn.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  {
                    step: '1',
                    title: 'Nhận văn bản tự động hoặc Nhập thủ công',
                    desc: '• Nhận tự động: Khi cấp Tỉnh hoặc Xã khác gửi liên thông, văn bản tự nhảy vào danh sách kèm chuông báo.\n• Nhập văn bản ngoài: Bấm "+ Tiếp nhận VB Đến" để nhập công văn giấy nhận từ bên ngoài.',
                    color: '#059669', bg: '#ECFDF5'
                  },
                  {
                    step: '2',
                    title: 'Dùng "🤖 AI Đọc VB" để bóc tách thông tin',
                    desc: 'Bấm biểu tượng Robot "AI Đọc VB" trên hàng văn bản. AI sẽ quét tệp PDF/ảnh, tự trích xuất: Số hiệu, Người ký, Trích yếu, Mức độ khẩn và Tóm tắt 3 ý chính cần làm.',
                    color: '#2563EB', bg: '#EFF6FF'
                  },
                  {
                    step: '3',
                    title: 'Giao việc xử lý (Tự động hoặc Thủ công)',
                    desc: 'Bấm "Tạo công việc từ văn bản". AI sẽ tự phân tích và đề xuất danh sách đầu việc, người thực hiện và hạn hoàn thành (Deadline). Cán bộ phụ trách sẽ nhận thông báo công việc.',
                    color: '#7C3AED', bg: '#F5F3FF'
                  },
                  {
                    step: '4',
                    title: 'Theo dõi Hạn xử lý & Trả lời',
                    desc: 'Cán bộ xử lý công việc và cập nhật trạng thái "Đang xử lý" -> "Hoàn thành". Nếu cần phúc đáp, bấm "Soạn VB trả lời" để liên kết trực tiếp với văn bản đến ban đầu.',
                    color: '#D97706', bg: '#FFFBEB'
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14,
                    background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, background: item.bg, color: item.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem',
                      flexShrink: 0, border: `1px solid ${item.color}40`
                    }}>
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#1E293B', marginBottom: 3 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '.85rem', color: '#475569', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SƠ ĐỒ LIÊN THÔNG */}
          {activeTab === 'workflow' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h4 style={{ margin: 0, color: '#1E3A8A', fontSize: '1.05rem', fontWeight: 800 }}>
                  Mô hình Luân chuyển Văn bản Liên thông Đa cấp
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '.82rem', color: '#64748B' }}>
                  Dòng chảy dữ liệu thông suốt giữa UBND Tỉnh, Sở Ban Ngành và 102 Xã/Phường
                </p>
              </div>

              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16,
                padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20
              }}>
                {/* Node 1: Soạn VB Đi */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14, background: '#FFFFFF',
                  padding: '14px 18px', borderRadius: 12, border: '1.5px solid #3B82F6', boxShadow: '0 2px 6px rgba(59, 130, 246, 0.1)'
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
                    <FileOutput size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#1E40AF', fontSize: '.92rem' }}>1. Cơ quan Phát hành (Tỉnh hoặc Xã)</div>
                    <div style={{ fontSize: '.8rem', color: '#64748B' }}>Soạn văn bản đi ➔ Đính kèm File ký số ➔ Chọn danh sách cơ quan nhận liên thông</div>
                  </div>
                  <span style={{ fontSize: '.75rem', fontWeight: 700, background: '#DBEAFE', color: '#1E40AF', padding: '4px 10px', borderRadius: 20 }}>
                    VĂN BẢN ĐI
                  </span>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#3B82F6', fontWeight: 700, fontSize: '.82rem' }}>
                  <span>Truyền tin Realtime (Socket.IO + Database Sync)</span>
                  <ArrowRight size={18} />
                </div>

                {/* Node 2: Tự động đến */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14, background: '#FFFFFF',
                  padding: '14px 18px', borderRadius: 12, border: '1.5px solid #10B981', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <FileInput size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#065F46', fontSize: '.92rem' }}>2. Các Cơ quan Tiếp nhận (102 Xã/Phường)</div>
                    <div style={{ fontSize: '.8rem', color: '#64748B' }}>Tự động nhận thành "Văn bản đến" ➔ AI phân tích nội dung ➔ Giao cán bộ xử lý</div>
                  </div>
                  <span style={{ fontSize: '.75rem', fontWeight: 700, background: '#D1FAE5', color: '#059669', padding: '4px 10px', borderRadius: 20 }}>
                    VĂN BẢN ĐẾN
                  </span>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#7C3AED', fontWeight: 700, fontSize: '.82rem' }}>
                  <span>Tự động phân rã nhiệm vụ & Theo dõi Deadline</span>
                  <ArrowRight size={18} />
                </div>

                {/* Node 3: Xử lý & Báo cáo */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14, background: '#FFFFFF',
                  padding: '14px 18px', borderRadius: 12, border: '1.5px solid #8B5CF6', boxShadow: '0 2px 6px rgba(139, 92, 246, 0.1)'
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                    <CheckSquare size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#5B21B6', fontSize: '.92rem' }}>3. Quản lý Công việc & Báo cáo Kết quả</div>
                    <div style={{ fontSize: '.8rem', color: '#64748B' }}>Thực hiện công việc ➔ Báo cáo tiến độ ➔ Phát hành văn bản phúc đáp liên thông ngược lại</div>
                  </div>
                  <span style={{ fontSize: '.75rem', fontWeight: 700, background: '#EDE9FE', color: '#6D28D9', padding: '4px 10px', borderRadius: 20 }}>
                    HOÀN TẤT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FAQ & MẸO NHANH */}
          {activeTab === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  q: '❓ Làm sao để gửi 1 văn bản đi cho toàn bộ 102 Xã/Phường cùng lúc?',
                  a: 'Khi tạo Văn bản đi (hoặc bấm nút "Chuyển liên thông" ở danh sách), tại mục chọn đơn vị nhận, bạn chỉ cần bấm nút "🏘️ Chọn tất cả Xã/Phường (102 Xã)". Hệ thống sẽ tự động đánh dấu toàn bộ 102 xã và phát hành đồng loạt chỉ với 1 cú nhấp chuột.'
                },
                {
                  q: '❓ AI hỗ trợ đọc được những định dạng tệp nào?',
                  a: 'AI của hệ thống đọc và bóc tách rất tốt các tệp: .PDF (cả bản điện tử lẫn bản scan hình ảnh), tệp Word (.DOCX) và ảnh chụp công văn (.JPG, .PNG). AI sẽ trích xuất số hiệu, người ký, trích yếu và hạn xử lý tự động.'
                },
                {
                  q: '❓ Cán bộ Xã xử lý văn bản đến như thế nào khi nhận được?',
                  a: 'Vào trang "Văn bản đến" ➔ Bấm "Xem chi tiết" để đọc nội dung và tải tệp ➔ Bấm "Tạo công việc" để giao cho công chức chuyên môn kèm hạn xử lý ➔ Sau khi xong việc, chuyển trạng thái sang "Hoàn thành".'
                },
                {
                  q: '❓ Văn bản quá hạn thì hệ thống xử lý ra sao?',
                  a: 'Mỗi ngày vào lúc 7:00 sáng, hệ thống tự động quét hạn xử lý của tất cả văn bản. Nếu văn bản sắp hết hạn (còn 1-2 ngày) hoặc quá hạn, hệ thống sẽ tự động gửi email cảnh báo và hiện cảnh báo đỏ trên Dashboard.'
                }
              ].map((item, idx) => (
                <div key={idx} style={{
                  padding: '16px 18px', borderRadius: 14, background: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '.92rem', color: '#1E3A8A', marginBottom: 6 }}>
                    {item.q}
                  </div>
                  <div style={{ fontSize: '.85rem', color: '#334155', lineHeight: 1.5 }}>
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
        }}>
          <div style={{ fontSize: '.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={14} color="#059669" /> Tuân thủ quy chuẩn văn bản điện tử hành chính
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 10, fontWeight: 700 }}
          >
            Đã hiểu quy trình
          </button>
        </div>
      </div>
    </div>
  );
};

export default EofficeGuideModal;
