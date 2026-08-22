import React, { useEffect, useState } from 'react';
import api, { BASE_URL } from '../../../lib/api';
import { toast } from 'react-toastify';
import {
  CheckSquare, Plus, RefreshCw, Trash2, Calendar, User, Search, Clock,
  CheckCircle, MessageCircle, Paperclip, ChevronDown, ChevronRight,
  Share2, BarChart2, Users, AlertTriangle, TrendingUp, ArrowRight, X,
  LayoutList, LayoutGrid, ShieldCheck, Building2, Briefcase, FileText,
  Clock3, Eye, Filter
} from 'lucide-react';
import Swal from 'sweetalert2';
import AiChatPanel from '../../../components/AiChatPanel';

// ===== CONSTANTS =====
const STATUSES = ['Chưa thực hiện', 'Đang thực hiện', 'Chờ duyệt', 'Hoàn thành', 'Quá hạn', 'Hủy'];
const PRIORITIES = ['Thường', 'Cao', 'Khẩn', 'Thượng khẩn'];

const DEPARTMENTS = [
  'Ban Phong trào',
  'Ban Tuyên giáo',
  'Ban Tổ chức - Kiểm tra',
  'Văn phòng',
  'Ban TTN - Trường học',
  'Cơ quan Tỉnh Đoàn',
  'Khác'
];

const STATUS_CONFIG = {
  'Chưa thực hiện': { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  'Đang thực hiện': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Chờ duyệt': { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  'Hoàn thành': { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  'Quá hạn': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  'Hủy': { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' }
};

const DEADLINE_COLORS = {
  green: { label: 'Còn hạn', color: '#10b981', bg: '#ecfdf5' },
  yellow: { label: 'Sắp đến hạn (≤5 ngày)', color: '#f59e0b', bg: '#fffbeb' },
  red: { label: 'Quá hạn', color: '#ef4444', bg: '#fef2f2' },
  gray: { label: 'Chưa có hạn', color: '#9ca3af', bg: '#f9fafb' }
};

const PRIORITY_CONFIG = {
  'Thường': { color: '#6b7280', bg: '#f3f4f6' },
  'Cao': { color: '#f59e0b', bg: '#fef3c7' },
  'Khẩn': { color: '#ea580c', bg: '#ffedd5' },
  'Thượng khẩn': { color: '#dc2626', bg: '#fee2e2' }
};

// ===== DEADLINE BADGE =====
const DeadlineBadge = ({ deadline, deadlineColor, status }) => {
  if (!deadline) return <span style={{ color: '#9ca3af', fontSize: '.75rem' }}>Không thời hạn</span>;
  const d = new Date(deadline);
  const now = new Date();
  const daysLeft = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  
  let color = '#10b981';
  let text = `${d.toLocaleDateString('vi-VN')}`;
  let subText = '';

  if (status === 'Hoàn thành') {
    color = '#10b981';
    subText = '(Đã xong)';
  } else if (daysLeft < 0) {
    color = '#ef4444';
    subText = `(Trễ ${Math.abs(daysLeft)} ngày)`;
  } else if (daysLeft === 0) {
    color = '#ef4444';
    subText = '(Hôm nay)';
  } else if (daysLeft <= 5) {
    color = '#f59e0b';
    subText = `(Còn ${daysLeft} ngày)`;
  } else {
    color = '#10b981';
    subText = `(Còn ${daysLeft} ngày)`;
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, background: `${color}15`, border: `1px solid ${color}30` }}>
      <Calendar size={13} color={color} />
      <span style={{ color, fontWeight: 700, fontSize: '.8rem' }}>{text}</span>
      <span style={{ color, fontSize: '.72rem', fontWeight: 600 }}>{subText}</span>
    </div>
  );
};

// ===== PROGRESS BAR =====
const ProgressBar = ({ value }) => {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  let color = '#3b82f6';
  if (v === 100) color = '#10b981';
  else if (v >= 60) color = '#3b82f6';
  else if (v >= 30) color = '#f59e0b';
  else color = '#ef4444';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: 3, fontWeight: 600, color: 'var(--tx-2)' }}>
        <span>Tiến độ</span>
        <span style={{ color }}>{v}%</span>
      </div>
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${v}%`, background: color, borderRadius: 99, transition: 'width .3s ease' }} />
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const TasksManager = () => {
  const [tasks, setTasks] = useState([]);
  const [staffData, setStaffData] = useState({ deputies: [], provinceStaff: [], communeStaff: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards' | 'dashboard'
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterLeader, setFilterLeader] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Dashboard
  const [dashboard, setDashboard] = useState(null);

  // Modal Create Task
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    inChargeLeader: '', // PBT phụ trách (A. Giang hoặc A. Pas)
    advisoryDepartment: 'Ban Phong trào', // Ban tham mưu chính
    assignedTo: '', // Cán bộ cụ thể (nếu có)
    advisoryOfficerName: '',
    cooperatingUnits: '',
    deadline: '',
    priority: 'Thường',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal Delegate / Ủy quyền
  const [delegateModal, setDelegateModal] = useState(null);
  const [delegateTo, setDelegateTo] = useState('');
  const [delegateNote, setDelegateNote] = useState('');
  const [delegating, setDelegating] = useState(false);

  // Modal Comment / Cập nhật tiến độ
  const [commentModal, setCommentModal] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentProgress, setCommentProgress] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Modal Detail Task
  const [detailTask, setDetailTask] = useState(null);

  // AI Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);

  const role = localStorage.getItem('role') || '';
  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('token');
      return token ? JSON.parse(atob(token.split('.')[1])).userId : null;
    } catch {
      return null;
    }
  })();
  
  const isAdmin = ['ADMIN', 'SENIOR_ADMIN', 'PROVINCE_ADMIN'].includes(role);
  const isSenior = ['SENIOR_ADMIN', 'PROVINCE_ADMIN'].includes(role);

  // ===== DATA FETCHING =====
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterLeader) params.inChargeLeader = filterLeader;
      if (filterDept) params.department = filterDept;
      
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch {
      toast.error('Lỗi tải danh sách công việc');
    }
    setLoading(false);
  };

  const fetchStaff = async () => {
    try {
      // Chỉ lấy cán bộ cấp tỉnh và thường trực
      const res = await api.get('/users/staff', { params: { scope: 'province' } });
      setStaffData(res.data);
    } catch {
      // fallback
      try {
        const res = await api.get('/users');
        const all = res.data || [];
        setStaffData({
          all,
          deputies: all.filter(u => u.position === 'PHO_BI_THU' || u.role === 'PROVINCE_ADMIN'),
          provinceStaff: all.filter(u => ['ADMIN', 'PROVINCE_ADMIN', 'SENIOR_ADMIN'].includes(u.role) && u.position !== 'BI_THU'),
          communeStaff: []
        });
      } catch {}
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/tasks/dashboard');
      setDashboard(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      fetchStaff();
      fetchDashboard();
    }
  }, [search, filterStatus, filterLeader, filterDept]);

  // ===== HANDLERS =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tên nội dung hoạt động / công việc');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/tasks', {
        ...form,
        inChargeLeader: form.inChargeLeader || undefined,
        assignedTo: form.assignedTo || undefined,
        deadline: form.deadline || undefined
      });
      toast.success('✅ Đã tạo nội dung hoạt động & chỉ đạo thành công!');
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        inChargeLeader: '',
        advisoryDepartment: 'Ban Phong trào',
        assignedTo: '',
        advisoryOfficerName: '',
        cooperatingUnits: '',
        deadline: '',
        priority: 'Thường',
        notes: ''
      });
      fetchTasks();
      if (isAdmin) fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo công việc');
    }
    setSubmitting(false);
  };

  const handleDelegate = async () => {
    if (!delegateTo) {
      toast.error('Vui lòng chọn người / ban được ủy quyền');
      return;
    }
    setDelegating(true);
    try {
      await api.post(`/tasks/${delegateModal._id}/delegate`, { delegateTo, note: delegateNote });
      toast.success('✅ Ủy quyền thực hiện thành công!');
      setDelegateModal(null);
      setDelegateTo('');
      setDelegateNote('');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi ủy quyền');
    }
    setDelegating(false);
  };

  const handleComment = async () => {
    if (!commentText.trim()) {
      toast.error('Vui lòng nhập nội dung cập nhật tiến độ');
      return;
    }
    setCommenting(true);
    try {
      await api.post(`/tasks/${commentModal._id}/comment`, {
        content: commentText,
        progressUpdate: commentProgress !== '' ? Number(commentProgress) : undefined
      });
      toast.success('✅ Đã cập nhật tiến độ công việc!');
      setCommentModal(null);
      setCommentText('');
      setCommentProgress('');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật');
    }
    setCommenting(false);
  };

  const handleApprove = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Duyệt hoàn thành?',
      text: 'Xác nhận công việc / hoạt động này đã hoàn thành xuất sắc?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý duyệt',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#10b981'
    });
    if (!isConfirmed) return;
    try {
      await api.post(`/tasks/${id}/approve`);
      toast.success('✅ Đã duyệt hoàn thành công việc!');
      fetchTasks();
      if (isAdmin) fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi duyệt');
    }
  };

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Xóa công việc này?',
      text: 'Thao tác này không thể hoàn tác.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Đã xóa công việc');
      fetchTasks();
      if (isAdmin) fetchDashboard();
    } catch {
      toast.error('Lỗi xóa công việc');
    }
  };

  const openCommentModal = (task, initialProgress = '', initialStatus = '') => {
    setCommentModal(task);
    setCommentProgress(initialProgress !== '' ? String(task.progress) : '');
    setCommentText(initialStatus === 'Đang thực hiện' ? 'Bắt đầu triển khai hoạt động.' : '');
  };

  // Stats calculation
  const stats = {
    total: tasks.length,
    overdue: tasks.filter(t => t.status === 'Quá hạn').length,
    inProgress: tasks.filter(t => t.status === 'Đang thực hiện').length,
    pending: tasks.filter(t => t.status === 'Chờ duyệt').length,
    done: tasks.filter(t => t.status === 'Hoàn thành').length
  };

  return (
    <div className="animate-up" style={{ paddingBottom: 40 }}>
      {/* HEADER BANNER */}
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        background: 'linear-gradient(135deg, rgba(0, 168, 107, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
        padding: '20px 24px',
        borderRadius: 16,
        border: '1px solid rgba(0, 168, 107, 0.2)',
        marginBottom: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.4rem' }}>🏛️</span>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark, #065f46)' }}>
              Bảng Điều Hành & Giao Việc Thường Trực Tỉnh Đoàn
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--tx-2)', fontSize: '.9rem' }}>
            👑 <strong>Bí thư Tỉnh Đoàn</strong> ➔ 👔 <strong>Phó Bí thư phụ trách</strong> ➔ 🏢 <strong>Các Ban Chuyên Môn</strong> ➔ 👤 <strong>Cán bộ Cơ quan</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { fetchTasks(); if (isAdmin) fetchDashboard(); }} title="Làm mới">
            <RefreshCw size={16} />
          </button>

          {/* Switch View Buttons */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-2, #f3f4f6)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: '.8rem' }}
              onClick={() => setViewMode('table')}
              title="Bảng điều hành"
            >
              <LayoutList size={15} style={{ marginRight: 4 }} /> Bảng
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: '.8rem' }}
              onClick={() => setViewMode('cards')}
              title="Dạng thẻ"
            >
              <LayoutGrid size={15} style={{ marginRight: 4 }} /> Thẻ
            </button>
            {isAdmin && (
              <button
                className={`btn btn-sm ${viewMode === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '.8rem' }}
                onClick={() => setViewMode('dashboard')}
                title="Báo cáo phân tích"
              >
                <BarChart2 size={15} style={{ marginRight: 4 }} /> Thống kê
              </button>
            )}
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} style={{ boxShadow: '0 4px 12px rgba(0,168,107,.25)' }}>
            <Plus size={16} style={{ marginRight: 4 }} /> Giao việc / Tạo hoạt động
          </button>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 20
      }}>
        <div style={{ background: '#fff', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: '.78rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span>📋</span> Tổng hoạt động
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', marginTop: 4 }}>{stats.total}</div>
        </div>

        <div style={{ background: '#fff', padding: '14px 18px', borderRadius: 12, border: '1px solid #fee2e2', borderLeft: '4px solid #ef4444', boxShadow: '0 1px 3px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: '.78rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span>🔴</span> Quá hạn
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: 4 }}>{stats.overdue}</div>
        </div>

        <div style={{ background: '#fff', padding: '14px 18px', borderRadius: 12, border: '1px solid #fef3c7', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: '.78rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span>🔵</span> Đang triển khai
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>{stats.inProgress}</div>
        </div>

        <div style={{ background: '#fff', padding: '14px 18px', borderRadius: 12, border: '1px solid #ede9fe', borderLeft: '4px solid #8b5cf6', boxShadow: '0 1px 3px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: '.78rem', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span>🟣</span> Chờ duyệt
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6', marginTop: 4 }}>{stats.pending}</div>
        </div>

        <div style={{ background: '#fff', padding: '14px 18px', borderRadius: 12, border: '1px solid #d1fae5', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,.03)' }}>
          <div style={{ fontSize: '.78rem', color: '#047857', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span>🟢</span> Đã hoàn thành
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>{stats.done}</div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', background: '#fff' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36, height: 38, fontSize: '.88rem' }}
            placeholder="Tìm theo tên hoạt động, ban tham mưu, cán bộ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Lọc theo Lãnh đạo phụ trách */}
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 190, height: 38, fontSize: '.85rem' }}
          value={filterLeader}
          onChange={e => setFilterLeader(e.target.value)}
        >
          <option value="">👔 Tất cả Lãnh đạo phụ trách</option>
          {staffData.deputies?.map(u => (
            <option key={u._id} value={u._id}>
              {u.username} ({u.positionLabel || 'Phó Bí thư'})
            </option>
          ))}
        </select>

        {/* Lọc theo Ban chuyên môn */}
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 180, height: 38, fontSize: '.85rem' }}
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
        >
          <option value="">🏢 Tất cả Ban chuyên môn</option>
          {DEPARTMENTS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Lọc theo Trạng thái */}
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 150, height: 38, fontSize: '.85rem' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {(search || filterLeader || filterDept || filterStatus) && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: '#ef4444', fontSize: '.8rem' }}
            onClick={() => { setSearch(''); setFilterLeader(''); setFilterDept(''); setFilterStatus(''); }}
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* ===== VIEW 1: BẢNG ĐIỀU HÀNH THƯỜNG TRỰC (TABLE VIEW) ===== */}
      {viewMode === 'table' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#fff', border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="empty-state" style={{ padding: 40 }}><div className="empty-state-icon">⏳</div><h4>Đang tải dữ liệu...</h4></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">📂</div>
              <h4>Chưa có hoạt động nào được giao</h4>
              <p style={{ color: '#6b7280' }}>Bấm nút "+ Giao việc / Tạo hoạt động" để khởi tạo hoạt động đầu tiên.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '12px 14px', width: 50, textAlign: 'center' }}>STT</th>
                    <th style={{ padding: '12px 16px', minWidth: 260 }}>Nội dung hoạt động / Công việc</th>
                    <th style={{ padding: '12px 16px', minWidth: 170 }}>Lãnh đạo phụ trách</th>
                    <th style={{ padding: '12px 16px', minWidth: 180 }}>Ban / Cán bộ tham mưu chính</th>
                    <th style={{ padding: '12px 16px', minWidth: 150 }}>Thời hạn (Deadline)</th>
                    <th style={{ padding: '12px 16px', minWidth: 140 }}>Tiến độ</th>
                    <th style={{ padding: '12px 16px', width: 110, textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, idx) => {
                    const stConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG['Chưa thực hiện'];
                    const isOwner = task.assignedBy?._id === currentUserId || task.assignedBy === currentUserId;
                    const isAssigned = task.assignedTo?._id === currentUserId || task.assignedTo === currentUserId;
                    const canApprove = (isOwner || isSenior) && task.status === 'Chờ duyệt';

                    return (
                      <tr
                        key={task._id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background .15s',
                          background: task.status === 'Quá hạn' ? 'rgba(254, 242, 242, 0.4)' : '#fff'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = task.status === 'Quá hạn' ? 'rgba(254, 242, 242, 0.4)' : '#fff'}
                      >
                        {/* STT */}
                        <td style={{ padding: '14px', textAlign: 'center', fontWeight: 700, color: '#94a3b8' }}>
                          {idx + 1}
                        </td>

                        {/* Tên hoạt động & Căn cứ */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '.7rem',
                              fontWeight: 700,
                              background: PRIORITY_CONFIG[task.priority]?.bg || '#f3f4f6',
                              color: PRIORITY_CONFIG[task.priority]?.color || '#4b5563'
                            }}>
                              {task.priority || 'Thường'}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: '.72rem',
                              fontWeight: 700,
                              background: stConfig.bg,
                              color: stConfig.color,
                              border: `1px solid ${stConfig.border}`
                            }}>
                              {task.status}
                            </span>
                          </div>

                          <div
                            style={{ fontWeight: 700, color: '#0f172a', fontSize: '.92rem', cursor: 'pointer', lineHeight: 1.4 }}
                            onClick={() => setDetailTask(task)}
                          >
                            {task.title}
                          </div>

                          {task.description && (
                            <div style={{ color: '#64748b', fontSize: '.78rem', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {task.description}
                            </div>
                          )}

                          {task.cooperatingUnits && (
                            <div style={{ color: '#3b82f6', fontSize: '.74rem', marginTop: 4 }}>
                              🤝 Phối hợp: <em>{task.cooperatingUnits}</em>
                            </div>
                          )}
                        </td>

                        {/* Lãnh đạo phụ trách */}
                        <td style={{ padding: '14px 16px' }}>
                          {task.inChargeLeader ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: '#dbeafe', color: '#1d4ed8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.75rem'
                              }}>
                                {task.inChargeLeader.username?.charAt(0) || 'P'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '.84rem' }}>
                                  {task.inChargeLeader.username}
                                </div>
                                <div style={{ fontSize: '.72rem', color: '#64748b' }}>
                                  {task.inChargeLeader.positionLabel || 'Phó Bí thư Tỉnh Đoàn'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '.8rem', color: '#059669', fontWeight: 600 }}>
                              👑 Bí thư chỉ đạo trực tiếp
                            </div>
                          )}
                        </td>

                        {/* Ban / Cán bộ tham mưu chính */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#334155', fontSize: '.84rem' }}>
                            <Building2 size={14} color="#64748b" />
                            <span>{task.advisoryDepartment || 'Ban Phong trào'}</span>
                          </div>
                          {task.assignedTo ? (
                            <div style={{ fontSize: '.76rem', color: '#64748b', marginLeft: 20, marginTop: 2 }}>
                              👤 {task.assignedTo.username} {task.assignedTo.positionLabel ? `(${task.assignedTo.positionLabel})` : ''}
                            </div>
                          ) : task.advisoryOfficerName ? (
                            <div style={{ fontSize: '.76rem', color: '#64748b', marginLeft: 20, marginTop: 2 }}>
                              👤 {task.advisoryOfficerName}
                            </div>
                          ) : null}
                        </td>

                        {/* Thời hạn (Deadline) */}
                        <td style={{ padding: '14px 16px' }}>
                          <DeadlineBadge
                            deadline={task.deadline}
                            deadlineColor={task.deadlineColor}
                            status={task.status}
                          />
                        </td>

                        {/* Tiến độ */}
                        <td style={{ padding: '14px 16px' }}>
                          <ProgressBar value={task.progress} />
                        </td>

                        {/* Thao tác */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                            {canApprove && (
                              <button
                                className="btn btn-sm btn-success"
                                style={{ padding: '4px 8px', fontSize: '.75rem' }}
                                onClick={() => handleApprove(task._id)}
                                title="Duyệt hoàn thành"
                              >
                                <CheckCircle size={13} />
                              </button>
                            )}

                            <button
                              className="btn btn-sm btn-primary"
                              style={{ padding: '4px 8px', fontSize: '.75rem' }}
                              onClick={() => openCommentModal(task)}
                              title="Cập nhật tiến độ & Báo cáo"
                            >
                              <TrendingUp size={13} />
                            </button>

                            <button
                              className="btn btn-sm btn-ghost"
                              style={{ padding: '4px 6px', color: '#3b82f6' }}
                              onClick={() => { setChatTarget(task); setChatOpen(true); }}
                              title="Hỏi Trợ lý AI về công việc này"
                            >
                              <MessageCircle size={14} />
                            </button>

                            {isAdmin && (
                              <button
                                className="btn btn-sm btn-ghost"
                                style={{ padding: '4px 6px', color: '#ef4444' }}
                                onClick={() => handleDelete(task._id)}
                                title="Xóa công việc"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== VIEW 2: DẠNG THẺ (CARD VIEW) ===== */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {tasks.map(task => {
            const stConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG['Chưa thực hiện'];
            return (
              <div
                key={task._id}
                className="card"
                style={{
                  padding: 18,
                  borderLeft: `4px solid ${stConfig.color}`,
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: '.72rem', fontWeight: 700,
                      background: stConfig.bg, color: stConfig.color
                    }}>
                      {task.status}
                    </span>
                    <span style={{ fontSize: '.75rem', color: '#6b7280' }}>
                      {PRIORITY_CONFIG[task.priority]?.label || task.priority}
                    </span>
                  </div>

                  <h4
                    style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer', lineHeight: 1.4 }}
                    onClick={() => setDetailTask(task)}
                  >
                    {task.title}
                  </h4>

                  {task.description && (
                    <p style={{ fontSize: '.82rem', color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                      {task.description.length > 110 ? task.description.slice(0, 110) + '...' : task.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '.8rem', color: '#475569', background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                    <div>👔 <strong>Phụ trách:</strong> {task.inChargeLeader?.username || 'Bí thư chỉ đạo trực tiếp'}</div>
                    <div>🏢 <strong>Tham mưu:</strong> {task.advisoryDepartment || 'Ban Phong trào'} {task.assignedTo ? `(${task.assignedTo.username})` : ''}</div>
                    {task.cooperatingUnits && <div>🤝 <strong>Phối hợp:</strong> {task.cooperatingUnits}</div>}
                    <div>⏱️ <strong>Hạn chót:</strong> <DeadlineBadge deadline={task.deadline} deadlineColor={task.deadlineColor} status={task.status} /></div>
                  </div>
                </div>

                <div>
                  <ProgressBar value={task.progress} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                    <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => openCommentModal(task)}>
                      <TrendingUp size={13} style={{ marginRight: 4 }} /> Cập nhật tiến độ
                    </button>
                    <button className="btn btn-sm btn-ghost" style={{ color: '#3b82f6' }} onClick={() => { setChatTarget(task); setChatOpen(true); }} title="AI">
                      <MessageCircle size={14} />
                    </button>
                    {isAdmin && (
                      <button className="btn btn-sm btn-ghost" style={{ color: '#ef4444' }} onClick={() => handleDelete(task._id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== VIEW 3: THỐNG KÊ DASHBOARD ===== */}
      {viewMode === 'dashboard' && dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Quá hạn */}
          <div className="card" style={{ padding: 20, background: '#fff' }}>
            <h4 style={{ color: '#ef4444', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
              <AlertTriangle size={18} /> Hoạt động Quá hạn ({dashboard.overdueList?.length || 0})
            </h4>
            {dashboard.overdueList?.length === 0 ? (
              <p style={{ color: '#10b981', fontSize: '.88rem', fontWeight: 600 }}>🎉 Không có hoạt động nào bị quá hạn!</p>
            ) : (
              dashboard.overdueList?.map(t => (
                <div key={t._id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '.84rem' }}>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{t.title}</div>
                  <div style={{ color: '#64748b', fontSize: '.76rem', marginTop: 3 }}>
                    → Phụ trách: <strong>{t.inChargeLeader?.username || 'Thường trực'}</strong> | Hạn: <span style={{ color: '#ef4444', fontWeight: 700 }}>{t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sắp đến hạn */}
          <div className="card" style={{ padding: 20, background: '#fff' }}>
            <h4 style={{ color: '#f59e0b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
              <Clock size={18} /> Sắp đến hạn trong 5 ngày tới
            </h4>
            {dashboard.upcomingList?.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '.88rem' }}>Không có hoạt động nào cận hạn.</p>
            ) : (
              dashboard.upcomingList?.map(t => (
                <div key={t._id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '.84rem' }}>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{t.title}</div>
                  <div style={{ color: '#64748b', fontSize: '.76rem', marginTop: 3 }}>
                    → Phụ trách: <strong>{t.inChargeLeader?.username || 'Thường trực'}</strong> | Hạn: <strong style={{ color: '#f59e0b' }}>{new Date(t.deadline).toLocaleDateString('vi-VN')}</strong>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tiến độ theo Ban chuyên môn */}
          <div className="card" style={{ padding: 20, background: '#fff' }}>
            <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', color: '#1e293b' }}>
              <Users size={18} color="#3b82f6" /> Theo dõi theo Cán bộ / Ban chuyên môn
            </h4>
            {dashboard.byAssignee?.filter(a => a.user)?.map(a => (
              <div key={a._id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>{a.user?.username}</span>
                  <div style={{ display: 'flex', gap: 8, fontSize: '.75rem' }}>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{a.overdue} trễ</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{a.completed} xong</span>
                    <span style={{ color: '#64748b' }}>{a.total} tổng</span>
                  </div>
                </div>
                <ProgressBar value={Math.round(a.avgProgress || 0)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== MODAL TẠO HOẠT ĐỘNG / GIAO VIỆC THƯỜNG TRỰC TỈNH ĐOÀN ===== */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8, color: '#065f46' }}>
                  🏛️ Giao việc & Chỉ đạo Thường trực Tỉnh Đoàn
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '.8rem', color: '#64748b' }}>
                  Phân công nhiệm vụ cho Phó Bí thư phụ trách & Các Ban chuyên môn
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Tên hoạt động */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  1. Tên nội dung hoạt động / Công việc chỉ đạo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  className="form-input"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ví dụ: Triển khai chiến dịch 44 ngày đêm, Tổ chức tập huấn AI..."
                />
              </div>

              {/* Lãnh đạo phụ trách (PBT A. Giang hoặc A. Pas) */}
              <div className="form-group" style={{ background: '#eff6ff', padding: 14, borderRadius: 10, border: '1px solid #bfdbfe' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6 }}>
                  👔 2. Lãnh đạo phụ trách trực tiếp (Phó Bí thư Tỉnh Đoàn)
                </label>
                <select
                  className="form-input"
                  value={form.inChargeLeader}
                  onChange={e => setForm({ ...form, inChargeLeader: e.target.value })}
                  style={{ background: '#fff', fontWeight: 600 }}
                >
                  <option value="">-- Chọn Phó Bí thư phụ trách (hoặc Bí thư trực tiếp) --</option>
                  {staffData.deputies?.map(u => (
                    <option key={u._id} value={u._id}>
                      👔 Đ/c {u.username} — {u.positionLabel || 'Phó Bí thư Tỉnh Đoàn'}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '.74rem', color: '#3b82f6', marginTop: 4 }}>
                  💡 Gợi ý: Giao cho Đ/c Nguyễn Thao Giang (mảng Tuyên giáo, Sinh viên) hoặc Đ/c Y Lê Pas Tơr (mảng Phong trào, Thanh niên số, Cơ sở).
                </div>
              </div>

              {/* Ban tham mưu chính & Cán bộ chuyên trách */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    🏢 3. Ban / Phòng ban tham mưu chính <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="form-input"
                    required
                    value={form.advisoryDepartment}
                    onChange={e => setForm({ ...form, advisoryDepartment: e.target.value })}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    👤 4. Cán bộ cơ quan phụ trách chính
                  </label>
                  <select
                    className="form-input"
                    value={form.assignedTo}
                    onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                  >
                    <option value="">-- Chọn Cán bộ cơ quan Tỉnh Đoàn --</option>
                    {staffData.provinceStaff?.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.username} {u.positionLabel ? `— ${u.positionLabel}` : `(${u.role})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Đơn vị phối hợp */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  🤝 5. Đơn vị / Cán bộ phối hợp thực hiện
                </label>
                <input
                  className="form-input"
                  value={form.cooperatingUnits}
                  onChange={e => setForm({ ...form, cooperatingUnits: e.target.value })}
                  placeholder="Ví dụ: Ban Tuyên giáo, Văn phòng, 102 Đoàn xã/phường..."
                />
              </div>

              {/* Hạn chót & Mức độ ưu tiên */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    ⏱️ 6. Hạn hoàn thành (Deadline) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    required
                    value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    ⚡ 7. Mức độ ưu tiên
                  </label>
                  <select
                    className="form-input"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mô tả chi tiết & Yêu cầu chỉ đạo */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  📝 8. Yêu cầu & Nội dung chỉ đạo cụ thể
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Chi tiết chỉ đạo, chỉ tiêu cần đạt, mốc tiến độ trung gian..."
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: '8px 22px' }}>
                  {submitting ? 'Đang giao...' : '📤 Ban hành & Giao việc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL CẬP NHẬT TIẾN ĐỘ & BÁO CÁO ===== */}
      {commentModal && (
        <div className="modal-overlay" onClick={() => setCommentModal(null)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#f8fafc', padding: '16px 20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#3b82f6" /> Báo cáo & Cập nhật tiến độ
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setCommentModal(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '.85rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{commentModal.title}</div>
                <div style={{ color: '#64748b', fontSize: '.78rem', marginTop: 4 }}>
                  Tiến độ hiện tại: <strong>{commentModal.progress}%</strong> ({commentModal.status})
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Tiến độ mới (%):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={100}
                    style={{ width: 90, textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}
                    value={commentProgress}
                    onChange={e => setCommentProgress(e.target.value)}
                    placeholder="0-100"
                  />
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={commentProgress !== '' ? Number(commentProgress) : commentModal.progress} />
                  </div>
                </div>
                {Number(commentProgress) === 100 && (
                  <p style={{ color: '#8b5cf6', fontSize: '.78rem', marginTop: 6, fontWeight: 600 }}>
                    💜 Đạt 100% sẽ chuyển sang trạng thái "Chờ duyệt" để Lãnh đạo xác nhận hoàn thành.
                  </p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Nội dung báo cáo / Kết quả thực hiện <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Ghi rõ các nội dung đã làm được, khó khăn vướng mắc (nếu có)..."
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setCommentModal(null)}>Hủy</button>
                <button className="btn btn-primary" disabled={commenting} onClick={handleComment}>
                  {commenting ? 'Đang lưu...' : '💾 Lưu báo cáo tiến độ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL CHI TIẾT HOẠT ĐỘNG ===== */}
      {detailTask && (
        <div className="modal-overlay" onClick={() => setDetailTask(null)}>
          <div className="modal-content" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#f8fafc', padding: '16px 20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📋 Chi tiết hoạt động</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetailTask(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '1.1rem', color: '#0f172a' }}>{detailTask.title}</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span className="badge badge-info">{detailTask.status}</span>
                <span className="badge">{detailTask.priority}</span>
              </div>

              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, fontSize: '.85rem', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div>👑 <strong>Người chỉ đạo:</strong> {detailTask.assignedBy?.username || 'Bí thư Tỉnh Đoàn'}</div>
                <div>👔 <strong>Lãnh đạo phụ trách:</strong> {detailTask.inChargeLeader?.username || 'Bí thư trực tiếp'}</div>
                <div>🏢 <strong>Ban tham mưu chính:</strong> {detailTask.advisoryDepartment} {detailTask.assignedTo ? `(${detailTask.assignedTo.username})` : ''}</div>
                {detailTask.cooperatingUnits && <div>🤝 <strong>Đơn vị phối hợp:</strong> {detailTask.cooperatingUnits}</div>}
                <div>⏱️ <strong>Hạn hoàn thành:</strong> <DeadlineBadge deadline={detailTask.deadline} deadlineColor={detailTask.deadlineColor} status={detailTask.status} /></div>
              </div>

              {detailTask.description && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 4 }}>Yêu cầu & Nội dung chỉ đạo:</div>
                  <div style={{ fontSize: '.85rem', color: '#475569', lineHeight: 1.6 }}>{detailTask.description}</div>
                </div>
              )}

              {/* Lịch sử báo cáo */}
              {detailTask.comments && detailTask.comments.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 8 }}>Lịch sử báo cáo tiến độ:</div>
                  <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {detailTask.comments.map((c, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: '.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '.72rem' }}>
                          <strong>{c.author?.username || 'Cán bộ'}</strong>
                          <span>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div style={{ marginTop: 3 }}>{c.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => setDetailTask(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      <AiChatPanel
        targetId={chatTarget?._id}
        targetType="task"
        targetTitle={chatTarget?.title || 'Công việc'}
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setChatTarget(null); }}
      />
    </div>
  );
};

export default TasksManager;

