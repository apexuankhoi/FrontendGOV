import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { toast } from 'react-toastify';
import { CheckSquare, Plus, RefreshCw, Trash2, Calendar, User, Search, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import AiChatPanel from '../../../components/AiChatPanel';

const MarkdownRender = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.8, color: 'var(--tx-1)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('# '))   return <h1 key={i} style={{ fontSize: '1.3rem', fontWeight: 800, margin: '20px 0 10px', color: 'var(--primary-dark)' }}>{line.slice(2)}</h1>;
        if (line.startsWith('## '))  return <h2 key={i} style={{ fontSize: '1.1rem', fontWeight: 700, margin: '16px 0 8px', color: 'var(--primary)' }}>{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '1rem', fontWeight: 700, margin: '12px 0 6px' }}>{line.slice(4)}</h3>;
        if (/^\*\*.*\*\*$/.test(line.trim())) return <p key={i} style={{ fontWeight: 700, margin: '10px 0 4px', color: 'var(--primary-dark)' }}>{line.trim().slice(2,-2)}</p>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: 20, marginBottom: 4 }}>{line.slice(2)}</li>;
        if (/^\d+\.\s/.test(line)) return <li key={i} style={{ marginLeft: 20, marginBottom: 4 }}>{line.replace(/^\d+\.\s/, '')}</li>;
        if (!line.trim()) return <br key={i} />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return <p key={i} style={{ margin: '3px 0' }}>{parts.map((p,j) => j%2===1 ? <strong key={j}>{p}</strong> : p)}</p>;
      })}
    </div>
  );
};

const STATUSES = ['Chưa thực hiện', 'Đang thực hiện', 'Hoàn thành', 'Quá hạn', 'Hủy'];
const PRIORITIES = ['Thấp', 'Trung bình', 'Cao', 'Rất cao'];
const STATUS_BADGE = { 'Chưa thực hiện': 'badge-warning', 'Đang thực hiện': 'badge-info', 'Hoàn thành': 'badge-success', 'Quá hạn': 'badge-danger', 'Hủy': '' };

const TasksManager = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', deadline: '', priority: 'Trung bình' });
  const [submitting, setSubmitting] = useState(false);
  const [aiSolving, setAiSolving] = useState(false);
  const [showAiSolution, setShowAiSolution] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [creatingOutgoing, setCreatingOutgoing] = useState(false);

  const role = localStorage.getItem('role') || '';
  const isAdmin = ['ADMIN', 'SENIOR_ADMIN', 'PROVINCE_ADMIN'].includes(role);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks', { params: { search: search || undefined } });
      setTasks(res.data);
    } catch { toast.error('Lỗi tải danh sách công việc'); }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchTasks();
    if (isAdmin) fetchUsers();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tasks', {
        ...form,
        assignedTo: form.assignedTo || undefined,
        deadline: form.deadline || undefined
      });
      toast.success('Đã giao việc thành công!');
      setShowForm(false);
      setForm({ title: '', description: '', assignedTo: '', deadline: '', priority: 'Trung bình' });
      fetchTasks();
    } catch { toast.error('Lỗi tạo công việc'); }
    setSubmitting(false);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/tasks/${id}`, { status, progress: status === 'Hoàn thành' ? 100 : undefined });
      toast.success('Cập nhật trạng thái thành công');
      fetchTasks();
    } catch { toast.error('Lỗi cập nhật'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa công việc này?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Đã xóa');
      fetchTasks();
    } catch { toast.error('Lỗi xóa'); }
  };

  const handleAiSolve = async (id) => {
    setAiSolving(true);
    try {
      const res = await api.post(`/tasks/${id}/ai-solve`);
      toast.success('AI đã xử lý xong!');
      setShowAiSolution(res.data.task);
      fetchTasks();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi AI xử lý'); }
    setAiSolving(false);
  };

  const handleCreateOutgoingFromAI = async (task) => {
    setCreatingOutgoing(true);
    try {
      await api.post('/documents/ai-create-outgoing', {
        taskId: task._id,
        sourceDocId: task.sourceDocument?._id
      });
      toast.success('Đã tạo Văn bản đi thành công từ bản thảo AI!');
      setShowAiSolution(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi tạo VB đi'); }
    setCreatingOutgoing(false);
  };

  return (
    <div className="animate-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckSquare size={24} color="#00A86B" /> Quản lý công việc</h2>
          <p>Theo dõi và nhắc việc tự động</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchTasks}><RefreshCw size={15}/></button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={15}/> Giao việc mới</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-3)' }} />
          <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Tìm công việc..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Grid công việc */}
      {loading ? (
        <div className="empty-state"><div className="empty-state-icon">⏳</div><h4>Đang tải...</h4></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h4>Không có công việc nào</h4>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {tasks.map(t => (
            <div key={t._id} className="card" style={{ padding: 20, borderLeft: `4px solid ${t.status === 'Quá hạn' ? 'var(--danger)' : t.status === 'Hoàn thành' ? 'var(--success)' : 'var(--brand-blue)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{t.title}</h4>
                <span className={`badge ${STATUS_BADGE[t.status] || ''}`}>{t.status}</span>
              </div>
              <p style={{ fontSize: '.85rem', color: 'var(--tx-2)', marginBottom: 16, minHeight: 40 }}>{t.description || 'Không có mô tả'}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '.8rem', color: 'var(--tx-3)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14}/> Hạn: <strong style={{ color: t.status === 'Quá hạn' ? 'var(--danger)' : 'inherit' }}>{t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN') : 'Không có'}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14}/> Giao cho: <strong>{t.assignedTo?.username || 'Chưa giao'}</strong></div>
                {t.sourceDocument && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-blue)' }}>
                    <CheckSquare size={14}/> Nguồn: VB #{t.sourceDocument.documentNumber}
                  </div>
                )}
                {t.aiGenerated && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)' }}>🤖 Tạo tự động bởi AI</div>
                )}
                {t.aiGeneratedFiles && t.aiGeneratedFiles.length > 0 && (
                  <div style={{ marginTop: 8, padding: 8, background: '#EFF6FF', borderRadius: 'var(--r-sm)', border: '1px solid #BFDBFE' }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--brand-blue)', marginBottom: 4 }}>📎 BẢN THẢO AI ĐÃ SOẠN:</div>
                    {t.aiGeneratedFiles.map((file, idx) => (
                      <a key={idx} href={`http://localhost:5000/${file.filePath}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.8rem', color: 'var(--tx-1)', textDecoration: 'none', marginBottom: 4 }}>
                        <span style={{ fontSize: '1.2rem' }}>{file.fileType === 'xlsx' ? '📊' : '📝'}</span>
                        <span style={{ textDecoration: 'underline' }}>{file.fileName}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 16, flexWrap: 'wrap' }}>
                {t.status !== 'Hoàn thành' && (
                  <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handleUpdateStatus(t._id, 'Hoàn thành')}>
                    <CheckCircle size={14}/> Hoàn thành
                  </button>
                )}
                {t.status === 'Chưa thực hiện' && (
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => handleUpdateStatus(t._id, 'Đang thực hiện')}>
                    <Clock size={14}/> Thực hiện
                  </button>
                )}
                {!t.aiSolution && t.sourceDocument && (
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleAiSolve(t._id)} disabled={aiSolving}>
                    🤖 {aiSolving ? 'Đang...' : 'AI làm hộ'}
                  </button>
                )}
                {t.aiSolution && (
                  <button className="btn btn-info btn-sm" style={{ flex: 1, background: '#EFF6FF', color: 'var(--brand-blue)', borderColor: '#BFDBFE' }} onClick={() => setShowAiSolution(t)}>
                    🤖 Xem KQ AI
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--brand-blue)' }} onClick={() => { setChatTarget(t); setChatOpen(true); }} title="Chat với AI">
                  <MessageCircle size={14}/>
                </button>
                {['ADMIN', 'SENIOR_ADMIN'].includes(role) && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(t._id)}>
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL GIAO VIỆC */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Plus size={20}/> Giao việc mới</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div className="form-group">
                <label className="form-label">Tên công việc *</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Giao cho</label>
                <select className="form-input" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">-- Chọn nhân sự --</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.username} ({u.role})</option>)}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Hạn chót</label>
                  <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mức độ</label>
                  <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>Lưu công việc</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM KẾT QUẢ AI */}
      {showAiSolution && (
        <div className="modal-overlay" onClick={() => setShowAiSolution(null)}>
          <div className="modal-content modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🤖 AI Đã Giải Quyết: {showAiSolution.title}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAiSolution(null)}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div className="markdown-body" style={{ background: '#f8fafc', padding: 20, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <MarkdownRender text={showAiSolution.aiSolution} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                {showAiSolution.aiGeneratedFiles && showAiSolution.aiGeneratedFiles.length > 0 && (
                  <button className="btn btn-success" onClick={() => handleCreateOutgoingFromAI(showAiSolution)} disabled={creatingOutgoing}>
                    {creatingOutgoing ? 'Đang tạo...' : '📤 Tạo VB đi từ File này'}
                  </button>
                )}
                <button className="btn btn-outline" onClick={() => { navigator.clipboard.writeText(showAiSolution.aiSolution); toast.success('Đã copy!'); }}>
                  📋 Copy
                </button>
                <button className="btn btn-primary" onClick={() => setShowAiSolution(null)}>Đóng</button>
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
