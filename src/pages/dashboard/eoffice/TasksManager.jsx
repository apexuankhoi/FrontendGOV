import React, { useEffect, useState } from 'react';
import api, { BASE_URL } from '../../../lib/api';
import { toast } from 'react-toastify';
import {
  CheckSquare, Plus, RefreshCw, Trash2, Calendar, User, Search, Clock,
  CheckCircle, MessageCircle, Paperclip, ChevronDown, ChevronRight,
  Share2, BarChart2, Users, AlertTriangle, TrendingUp, ArrowRight, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import AiChatPanel from '../../../components/AiChatPanel';

// ===== CONSTANTS =====
const STATUSES = ['Chưa thực hiện', 'Đang thực hiện', 'Chờ duyệt', 'Hoàn thành', 'Quá hạn', 'Hủy'];
const PRIORITIES = ['Thấp', 'Trung bình', 'Cao', 'Rất cao'];
const POSITION_LABELS = {
  'BI_THU': '👑 Bí thư', 'PHO_BI_THU': '👔 Phó Bí thư',
  'TRUONG_PHONG': '🏢 Trưởng phòng', 'PHO_PHONG': '🏢 Phó phòng', 'CAN_BO': '👤 Cán bộ'
};
const DEPT_LABELS = {
  'TO_CHUC': 'Ban Tổ chức - KT', 'TUYEN_GIAO': 'Ban Tuyên giáo',
  'PHONG_TRAO': 'Ban Phong trào', 'VAN_PHONG': 'Văn phòng', 'KHAC': 'Khác'
};

const STATUS_COLOR = {
  'Chưa thực hiện': '#f59e0b', 'Đang thực hiện': '#3b82f6',
  'Chờ duyệt': '#8b5cf6', 'Hoàn thành': '#10b981', 'Quá hạn': '#ef4444', 'Hủy': '#6b7280'
};
const DEADLINE_COLOR = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444', gray: '#9ca3af' };
const PRIORITY_COLOR = { 'Thấp': '#6b7280', 'Trung bình': '#3b82f6', 'Cao': '#f59e0b', 'Rất cao': '#ef4444' };

// ===== MARKDOWN RENDERER =====
const MarkdownRender = ({ text }) => {
  if (!text) return null;
  return (
    <div style={{ lineHeight: 1.8 }}>
      {text.split('\n').map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '1.2rem', fontWeight: 800, margin: '16px 0 8px' }}>{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '1rem', fontWeight: 700, margin: '12px 0 6px' }}>{line.slice(3)}</h2>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: 20, marginBottom: 4 }}>{line.slice(2)}</li>;
        if (!line.trim()) return <br key={i} />;
        return <p key={i} style={{ margin: '3px 0' }}>{line}</p>;
      })}
    </div>
  );
};

// ===== DEADLINE BADGE =====
const DeadlineBadge = ({ deadline, deadlineColor, status }) => {
  if (!deadline) return <span style={{ color: '#9ca3af', fontSize: '.75rem' }}>Không có hạn</span>;
  const d = new Date(deadline);
  const daysLeft = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  const color = status === 'Hoàn thành' ? '#10b981' : (DEADLINE_COLOR[deadlineColor] || '#9ca3af');
  return (
    <span style={{ color, fontWeight: 600, fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
      <Calendar size={13} />
      {d.toLocaleDateString('vi-VN')}
      {status !== 'Hoàn thành' && daysLeft > 0 && <span style={{ fontWeight: 400, color: '#9ca3af' }}>({daysLeft} ngày)</span>}
      {status !== 'Hoàn thành' && daysLeft <= 0 && <span style={{ color: '#ef4444' }}>(QUÁ HẠN)</span>}
    </span>
  );
};

// ===== PROGRESS BAR =====
const ProgressBar = ({ value }) => (
  <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
    <div style={{
      height: '100%', width: `${value}%`, borderRadius: 3,
      background: value === 100 ? '#10b981' : value > 60 ? '#3b82f6' : value > 30 ? '#f59e0b' : '#ef4444',
      transition: 'width .3s ease'
    }} />
  </div>
);

// ===== TASK CARD =====
const TaskCard = ({ task, role, currentUserId, onDelegate, onComment, onApprove, onDelete, onAiSolve, onChat }) => {
  const [expanded, setExpanded] = useState(false);
  const borderColor = STATUS_COLOR[task.status] || '#9ca3af';
  const isOwner = task.assignedBy?._id === currentUserId || task.assignedBy === currentUserId;
  const isAssigned = task.assignedTo?._id === currentUserId || task.assignedTo === currentUserId;
  const canApprove = isOwner && task.status === 'Chờ duyệt';
  const canDelegate = ['SENIOR_ADMIN', 'PROVINCE_ADMIN', 'ADMIN'].includes(role) && task.status !== 'Hoàn thành';
  const isParent = !task.parentTask;

  return (
    <div style={{
      background: 'var(--card-bg, #fff)', borderRadius: 12, padding: 18,
      border: `1px solid var(--border, #e5e7eb)`, borderLeft: `4px solid ${borderColor}`,
      boxShadow: '0 1px 4px rgba(0,0,0,.05)', transition: 'box-shadow .2s',
      marginLeft: task.delegationLevel ? task.delegationLevel * 16 : 0,
      opacity: task.status === 'Hủy' ? 0.6 : 1
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.05)'}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {task.delegationLevel > 0 && <span style={{ fontSize: '.7rem', background: '#ede9fe', color: '#7c3aed', padding: '2px 6px', borderRadius: 4 }}>↳ Ủy quyền cấp {task.delegationLevel}</span>}
            {task.parentTask && <span style={{ fontSize: '.7rem', color: '#9ca3af' }}>từ task cha</span>}
            <span style={{ fontSize: '.7rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
              {PRIORITY_COLOR[task.priority] && '●'} {task.priority}
            </span>
          </div>
          <h4 style={{ margin: '8px 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--tx-1, #111)' }}>{task.title}</h4>
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap',
          background: `${borderColor}20`, color: borderColor
        }}>{task.status}</span>
      </div>

      {/* Description */}
      {task.description && (
        <p style={{ fontSize: '.83rem', color: 'var(--tx-2, #6b7280)', margin: '8px 0', lineHeight: 1.6 }}>
          {task.description.length > 120 && !expanded ? task.description.slice(0, 120) + '...' : task.description}
          {task.description.length > 120 && (
            <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '.8rem', marginLeft: 4 }}>
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </p>
      )}

      {/* Progress */}
      <div style={{ margin: '10px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: '#6b7280' }}>
          <span>Tiến độ</span><span style={{ fontWeight: 700 }}>{task.progress}%</span>
        </div>
        <ProgressBar value={task.progress} />
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '.8rem', color: 'var(--tx-3, #9ca3af)', margin: '10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <User size={13} />
          <span>Giao: <strong style={{ color: 'var(--tx-1, #111)' }}>{task.assignedBy?.username || '?'}</strong>
            {task.assignedBy?.positionLabel && <span style={{ color: '#6b7280', marginLeft: 4 }}>({task.assignedBy.positionLabel})</span>}
          </span>
        </div>
        {task.assignedTo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ArrowRight size={13} />
            <span>Nhận: <strong style={{ color: 'var(--tx-1, #111)' }}>{task.assignedTo.username}</strong>
              {task.assignedTo.positionLabel && <span style={{ color: '#6b7280', marginLeft: 4 }}>({task.assignedTo.positionLabel})</span>}
            </span>
          </div>
        )}
        <DeadlineBadge deadline={task.deadline} deadlineColor={task.deadlineColor} status={task.status} />
      </div>

      {/* Delegates info */}
      {task.delegatedTo?.length > 0 && (
        <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: '.78rem' }}>
          📤 Đã ủy quyền cho: {task.delegatedTo.map(u => <strong key={u._id}>{u.username}</strong>).reduce((a, b) => [a, ', ', b])}
        </div>
      )}

      {/* Comments summary */}
      {task.comments?.length > 0 && (
        <div style={{ fontSize: '.78rem', color: '#6b7280', marginBottom: 8 }}>
          💬 {task.comments.length} bình luận — Cập nhật mới nhất: "{task.comments[task.comments.length - 1].content.slice(0, 60)}"
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border, #e5e7eb)', paddingTop: 12, flexWrap: 'wrap' }}>
        {canApprove && (
          <button className="btn btn-success btn-sm" onClick={() => onApprove(task._id)}>
            <CheckCircle size={13} /> Duyệt xong
          </button>
        )}
        {isAssigned && task.status === 'Chưa thực hiện' && (
          <button className="btn btn-outline btn-sm" onClick={() => onComment(task, 0, 'Đang thực hiện')}>
            <Clock size={13} /> Bắt đầu
          </button>
        )}
        {isAssigned && !['Hoàn thành', 'Hủy', 'Chờ duyệt'].includes(task.status) && (
          <button className="btn btn-primary btn-sm" onClick={() => onComment(task)}>
            <TrendingUp size={13} /> Cập nhật
          </button>
        )}
        {canDelegate && (
          <button className="btn btn-outline btn-sm" style={{ color: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => onDelegate(task)}>
            <Share2 size={13} /> Ủy quyền
          </button>
        )}
        <button className="btn btn-ghost btn-sm" style={{ color: '#3b82f6' }} onClick={() => onChat(task)} title="AI Chat">
          <MessageCircle size={13} />
        </button>
        {['ADMIN', 'SENIOR_ADMIN', 'PROVINCE_ADMIN'].includes(role) && (
          <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => onDelete(task._id)}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const TasksManager = () => {
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // list | dashboard
  const [dashboard, setDashboard] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', deadline: '', priority: 'Trung bình', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const [delegateModal, setDelegateModal] = useState(null); // task to delegate
  const [delegateTo, setDelegateTo] = useState('');
  const [delegateNote, setDelegateNote] = useState('');
  const [delegating, setDelegating] = useState(false);

  const [commentModal, setCommentModal] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentProgress, setCommentProgress] = useState('');
  const [commenting, setCommenting] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);

  const role = localStorage.getItem('role') || '';
  const currentUserId = (() => { try { return JSON.parse(atob(localStorage.getItem('token').split('.')[1])).userId; } catch { return null; } })();
  const isAdmin = ['ADMIN', 'SENIOR_ADMIN', 'PROVINCE_ADMIN'].includes(role);
  const isSenior = ['SENIOR_ADMIN', 'PROVINCE_ADMIN'].includes(role);

  // ===== DATA FETCHING =====
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch { toast.error('Lỗi tải danh sách công việc'); }
    setLoading(false);
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/users/staff');
      setStaffList(res.data);
    } catch { try { const res = await api.get('/users'); setStaffList(res.data); } catch {} }
  };

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/tasks/dashboard');
      setDashboard(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchTasks();
    if (isAdmin) { fetchStaff(); fetchDashboard(); }
  }, [search, filterStatus]);

  // ===== HANDLERS =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Thiếu tiêu đề công việc'); return; }
    setSubmitting(true);
    try {
      await api.post('/tasks', { ...form, assignedTo: form.assignedTo || undefined, deadline: form.deadline || undefined });
      toast.success('✅ Đã giao việc thành công!');
      setShowForm(false);
      setForm({ title: '', description: '', assignedTo: '', deadline: '', priority: 'Trung bình', notes: '' });
      fetchTasks();
      if (isAdmin) fetchDashboard();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi tạo công việc'); }
    setSubmitting(false);
  };

  const handleDelegate = async () => {
    if (!delegateTo) { toast.error('Chọn người được ủy quyền'); return; }
    setDelegating(true);
    try {
      await api.post(`/tasks/${delegateModal._id}/delegate`, { delegateTo, note: delegateNote });
      toast.success('✅ Ủy quyền thành công!');
      setDelegateModal(null); setDelegateTo(''); setDelegateNote('');
      fetchTasks();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi ủy quyền'); }
    setDelegating(false);
  };

  const handleComment = async () => {
    if (!commentText.trim()) { toast.error('Nhập nội dung cập nhật'); return; }
    setCommenting(true);
    try {
      await api.post(`/tasks/${commentModal._id}/comment`, {
        content: commentText,
        progressUpdate: commentProgress !== '' ? Number(commentProgress) : undefined
      });
      toast.success('✅ Đã cập nhật tiến độ!');
      setCommentModal(null); setCommentText(''); setCommentProgress('');
      fetchTasks();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi cập nhật'); }
    setCommenting(false);
  };

  const handleApprove = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Duyệt hoàn thành?', text: 'Xác nhận công việc này đã hoàn thành?', icon: 'question', showCancelButton: true, confirmButtonText: 'Duyệt', cancelButtonText: 'Hủy', confirmButtonColor: '#10b981' });
    if (!isConfirmed) return;
    try {
      await api.post(`/tasks/${id}/approve`);
      toast.success('✅ Đã duyệt hoàn thành!');
      fetchTasks(); if (isAdmin) fetchDashboard();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi duyệt'); }
  };

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Xóa công việc?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
    if (!isConfirmed) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Đã xóa');
      fetchTasks(); if (isAdmin) fetchDashboard();
    } catch { toast.error('Lỗi xóa'); }
  };

  const openCommentModal = (task, initialProgress = '', initialStatus = '') => {
    setCommentModal(task);
    setCommentProgress(initialProgress !== '' ? String(task.progress) : '');
    setCommentText(initialStatus === 'Đang thực hiện' ? 'Bắt đầu thực hiện công việc.' : '');
  };

  // Group tasks: parent + children
  const parentTasks = tasks.filter(t => !t.parentTask);
  const childTasks = tasks.filter(t => t.parentTask);
  const getChildren = (taskId) => childTasks.filter(t =>
    (t.parentTask?._id || t.parentTask) === taskId
  );

  const filteredParents = parentTasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats summary
  const stats = {
    total: tasks.length,
    overdue: tasks.filter(t => t.status === 'Quá hạn').length,
    done: tasks.filter(t => t.status === 'Hoàn thành').length,
    pending: tasks.filter(t => t.status === 'Chờ duyệt').length
  };

  return (
    <div className="animate-up">
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <CheckSquare size={24} color="#00A86B" /> Hệ thống Giao Việc Phân Cấp
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--tx-3)' }}>Bí thư → Phó Bí thư → Phòng ban → Cán bộ</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { fetchTasks(); if (isAdmin) fetchDashboard(); }}><RefreshCw size={15} /></button>
          {isAdmin && (
            <button className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab(activeTab === 'dashboard' ? 'list' : 'dashboard')}>
              <BarChart2 size={15} /> Dashboard
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Giao việc mới
          </button>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ display: 'flex', gap: 12, margin: '16px 0', flexWrap: 'wrap' }}>
        {[
          { label: 'Tổng', value: stats.total, color: '#3b82f6', icon: '📋' },
          { label: 'Quá hạn', value: stats.overdue, color: '#ef4444', icon: '⚠️' },
          { label: 'Chờ duyệt', value: stats.pending, color: '#8b5cf6', icon: '🔔' },
          { label: 'Hoàn thành', value: stats.done, color: '#10b981', icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 20px', flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: '.75rem', color: '#9ca3af' }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* DASHBOARD VIEW */}
      {activeTab === 'dashboard' && dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Quá hạn */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ color: '#ef4444', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} /> Công việc Quá hạn ({dashboard.overdueList?.length || 0})
            </h4>
            {dashboard.overdueList?.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '.85rem' }}>Không có công việc quá hạn 🎉</p> : (
              dashboard.overdueList?.map(t => (
                <div key={t._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '.82rem' }}>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div style={{ color: '#9ca3af' }}>→ {t.assignedTo?.username || 'Chưa giao'} | {t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN') : ''}</div>
                </div>
              ))
            )}
          </div>
          {/* Sắp đến hạn */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ color: '#f59e0b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} /> Sắp đến hạn (5 ngày tới)
            </h4>
            {dashboard.upcomingList?.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '.85rem' }}>Không có 👍</p> : (
              dashboard.upcomingList?.map(t => (
                <div key={t._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '.82rem' }}>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div style={{ color: '#9ca3af' }}>→ {t.assignedTo?.username || '?'} | Hạn: <strong style={{ color: '#f59e0b' }}>{new Date(t.deadline).toLocaleDateString('vi-VN')}</strong></div>
                </div>
              ))
            )}
          </div>
          {/* Thống kê theo người */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} /> Thống kê theo cán bộ
            </h4>
            {dashboard.byAssignee?.filter(a => a.user)?.map(a => (
              <div key={a._id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{a.user?.username}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#ef4444' }}>{a.overdue} trễ</span>
                    <span style={{ color: '#10b981' }}>{a.completed} xong</span>
                    <span style={{ color: '#6b7280' }}>{a.total} total</span>
                  </div>
                </div>
                <ProgressBar value={Math.round(a.avgProgress || 0)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input className="form-input" style={{ paddingLeft: 32, height: 36 }} placeholder="Tìm công việc..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 'auto', height: 36 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* TASK LIST */}
      {loading ? (
        <div className="empty-state"><div className="empty-state-icon">⏳</div><h4>Đang tải...</h4></div>
      ) : filteredParents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h4>Không có công việc nào</h4>
          <p style={{ color: '#9ca3af' }}>Bấm "Giao việc mới" để tạo công việc đầu tiên</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredParents.map(task => (
            <div key={task._id}>
              <TaskCard
                task={task} role={role} currentUserId={currentUserId}
                onDelegate={t => setDelegateModal(t)}
                onComment={openCommentModal}
                onApprove={handleApprove}
                onDelete={handleDelete}
                onAiSolve={() => {}}
                onChat={t => { setChatTarget(t); setChatOpen(true); }}
              />
              {getChildren(task._id).map(child => (
                <div key={child._id} style={{ marginTop: 8 }}>
                  <TaskCard
                    task={child} role={role} currentUserId={currentUserId}
                    onDelegate={t => setDelegateModal(t)}
                    onComment={openCommentModal}
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                    onAiSolve={() => {}}
                    onChat={t => { setChatTarget(t); setChatOpen(true); }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ===== MODAL GIAO VIỆC MỚI ===== */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Plus size={18} /> Giao việc mới</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tiêu đề công việc *</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nhập tên công việc..." />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả chi tiết</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Nội dung, yêu cầu cụ thể..." />
              </div>
              <div className="form-group">
                <label className="form-label">Giao cho</label>
                <select className="form-input" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">-- Chọn cán bộ nhận việc --</option>
                  {staffList.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.username}
                      {u.positionLabel ? ` — ${u.positionLabel}` : ` (${u.role})`}
                      {u.agencyId?.name ? ` | ${u.agencyId.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Hạn chót</label>
                  <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mức độ ưu tiên</label>
                  <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ghi chú thêm</label>
                <input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Lưu ý, tài liệu tham khảo..." />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang giao...' : '📤 Giao việc'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL ỦY QUYỀN ===== */}
      {delegateModal && (
        <div className="modal-overlay" onClick={() => setDelegateModal(null)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Share2 size={18} /> Ủy quyền công việc</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setDelegateModal(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '.85rem' }}>
                <strong>📋 {delegateModal.title}</strong>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Ủy quyền cho *</label>
                <select className="form-input" value={delegateTo} onChange={e => setDelegateTo(e.target.value)}>
                  <option value="">-- Chọn người nhận --</option>
                  {staffList.filter(u => u._id !== delegateModal.assignedTo?._id && u._id !== delegateModal.assignedTo).map(u => (
                    <option key={u._id} value={u._id}>
                      {u.username}{u.positionLabel ? ` — ${u.positionLabel}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Ghi chú ủy quyền</label>
                <textarea className="form-input" rows={2} value={delegateNote} onChange={e => setDelegateNote(e.target.value)} placeholder="Lý do ủy quyền, yêu cầu cụ thể..." />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setDelegateModal(null)}>Hủy</button>
                <button className="btn btn-primary" style={{ background: '#7c3aed' }} disabled={delegating} onClick={handleDelegate}>
                  {delegating ? 'Đang ủy quyền...' : '📤 Xác nhận ủy quyền'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL CẬP NHẬT TIẾN ĐỘ ===== */}
      {commentModal && (
        <div className="modal-overlay" onClick={() => setCommentModal(null)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><TrendingUp size={18} /> Cập nhật tiến độ</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setCommentModal(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '.85rem' }}>
                <strong>📋 {commentModal.title}</strong>
                <div style={{ color: '#6b7280', marginTop: 4 }}>Tiến độ hiện tại: <strong>{commentModal.progress}%</strong></div>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Tiến độ mới (%) — Để trống nếu không thay đổi</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input className="form-input" type="number" min={0} max={100} value={commentProgress} onChange={e => setCommentProgress(e.target.value)} placeholder="0-100" style={{ width: 100 }} />
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={commentProgress !== '' ? Number(commentProgress) : commentModal.progress} />
                  </div>
                </div>
                {Number(commentProgress) === 100 && (
                  <p style={{ color: '#8b5cf6', fontSize: '.78rem', marginTop: 6 }}>💜 Đặt 100% sẽ chuyển sang "Chờ duyệt" — Người giao việc cần duyệt mới hoàn thành</p>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Nội dung cập nhật *</label>
                <textarea className="form-input" rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Đã làm được gì? Khó khăn gặp phải? Dự kiến hoàn thành..." />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setCommentModal(null)}>Hủy</button>
                <button className="btn btn-primary" disabled={commenting} onClick={handleComment}>
                  {commenting ? 'Đang lưu...' : '💾 Lưu cập nhật'}
                </button>
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
