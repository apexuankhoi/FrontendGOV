import React, { useState, useEffect, useRef } from 'react';
import api, { BASE_URL } from '../lib/api';
import { toast } from 'react-toastify';
import { Folder, File, FileText, FileSpreadsheet, FileImage, Upload, Plus, Trash2, Download, RefreshCw, FolderOpen, ArrowLeft, MoreVertical, Search, History } from 'lucide-react';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getIcon = (mimeType) => {
  if (mimeType?.includes('word')) return <FileText size={24} color="#2563EB" />;
  if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return <FileSpreadsheet size={24} color="#16A34A" />;
  if (mimeType?.includes('image')) return <FileImage size={24} color="#D97706" />;
  if (mimeType?.includes('pdf')) return <FileText size={24} color="#DC2626" />;
  return <File size={24} color="var(--tx-3)" />;
};

const PersonalDrive = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState(null);
  const [path, setPath] = useState([{ id: null, title: 'Thư mục gốc' }]);
  
  // Modals
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [showHistory, setShowHistory] = useState(null);
  
  // Upload
  const fileInputRef = useRef(null);
  const updateInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [targetUpdateId, setTargetUpdateId] = useState(null);

  const fetchFiles = async (id = parentId) => {
    setLoading(true);
    try {
      const res = await api.get('/drive', { params: { parentId: id, isPersonal: true } });
      setFiles(res.data);
    } catch { toast.error('Lỗi tải dữ liệu kho'); }
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, [parentId]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await api.post('/drive/folder', { title: folderName, parentId, isPersonal: true });
      toast.success('Đã tạo thư mục');
      setFolderName(''); setShowNewFolder(false); fetchFiles();
    } catch { toast.error('Lỗi tạo thư mục'); }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (parentId) formData.append('parentId', parentId || '');
      formData.append('isPersonal', 'true');
      await api.post('/drive/upload', formData);
      toast.success('Đã tải file lên');
      fetchFiles();
    } catch { toast.error('Lỗi upload file'); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdateVersion = async (e) => {
    const file = e.target.files[0];
    if (!file || !targetUpdateId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('note', 'Cập nhật phiên bản mới');
      await api.post(`/drive/${targetUpdateId}/new-version`, formData);
      toast.success('Đã cập nhật phiên bản mới');
      fetchFiles();
    } catch { toast.error('Lỗi cập nhật phiên bản'); }
    setUploading(false);
    setTargetUpdateId(null);
    if (updateInputRef.current) updateInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Chắc chắn muốn xóa?')) return;
    try {
      await api.delete(`/drive/${id}`);
      toast.success('Đã xóa');
      fetchFiles();
    } catch { toast.error('Lỗi xóa file'); }
  };

  const navigateTo = (folder) => {
    setParentId(folder._id);
    setPath([...path, { id: folder._id, title: folder.title }]);
  };

  const navigateUp = (idx) => {
    const newPath = path.slice(0, idx + 1);
    setPath(newPath);
    setParentId(newPath[newPath.length - 1].id);
  };

  return (
    <div className="animate-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FolderOpen size={24} color="var(--primary)" /> Kho tài liệu cá nhân</h2>
          <p>Dữ liệu này hoàn toàn riêng tư và không được chia sẻ với người khác</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setShowNewFolder(true)}>
            <Plus size={16} /> Thư mục mới
          </button>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />} 
            Tải file lên
          </button>
          <input type="file" ref={fileInputRef} onChange={handleUploadFile} style={{ display: 'none' }} />
          <input type="file" ref={updateInputRef} onChange={handleUpdateVersion} style={{ display: 'none' }} />
        </div>
      </div>

      <div className="card">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {path.length > 1 && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigateUp(path.length - 2)} style={{ padding: 4 }}>
              <ArrowLeft size={16} />
            </button>
          )}
          {path.map((p, i) => (
            <React.Fragment key={p.id || 'root'}>
              <span onClick={() => navigateUp(i)} style={{ cursor: 'pointer', color: i === path.length - 1 ? 'var(--tx-1)' : 'var(--brand-blue)', fontWeight: i === path.length - 1 ? 600 : 400 }}>
                {p.title}
              </span>
              {i < path.length - 1 && <span style={{ color: 'var(--tx-4)' }}>/</span>}
            </React.Fragment>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx-4)' }}>Đang tải dữ liệu kho...</div>
        ) : files.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--tx-4)' }}>
            <FolderOpen size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>Thư mục trống</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {files.map(f => (
              <div key={f._id} style={{ 
                border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16,
                display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-1)',
                transition: 'box-shadow .2s', cursor: f.isFolder ? 'pointer' : 'default'
              }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.05)'}
                 onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                 onClick={() => f.isFolder && navigateTo(f)}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {f.isFolder ? <Folder size={32} color="#FBBF24" fill="#FBBF24" fillOpacity={0.2} /> : getIcon(f.currentFile?.mimeType)}
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    {!f.isFolder && (
                      <>
                        <a href={`${BASE_URL}/${f.currentFile?.filePath?.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--primary)' }} title="Tải xuống">
                          <Download size={14} />
                        </a>
                        <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--warning)' }} title="Lịch sử phiên bản" onClick={() => setShowHistory(f)}>
                          <History size={14} />
                        </button>
                      </>
                    )}
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--danger)' }} title="Xóa" onClick={() => handleDelete(f._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={f.title}>
                    {f.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--tx-3)', marginTop: 8 }}>
                    <span>{f.isFolder ? 'Thư mục' : formatBytes(f.currentFile?.size)}</span>
                    <span>{new Date(f.updatedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {!f.isFolder && (
                    <div style={{ fontSize: '.7rem', color: 'var(--tx-4)', marginTop: 4 }}>
                      Bởi: {f.uploadedBy?.username || 'Ẩn danh'} • {f.versions?.length > 0 ? `v${f.versions.length + 1}` : 'v1'}
                    </div>
                  )}
                </div>
                
                {!f.isFolder && (
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 'auto', fontSize: '.75rem' }} 
                    onClick={(e) => { e.stopPropagation(); setTargetUpdateId(f._id); updateInputRef.current?.click(); }}>
                    ⬆️ Cập nhật phiên bản mới
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Thư mục mới */}
      {showNewFolder && (
        <div className="modal-overlay" onClick={() => setShowNewFolder(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo Thư mục mới</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewFolder(false)}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <input type="text" className="form-input" placeholder="Tên thư mục" value={folderName} onChange={e => setFolderName(e.target.value)} autoFocus />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-ghost" onClick={() => setShowNewFolder(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleCreateFolder}>Tạo</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lịch sử phiên bản */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🕒 Lịch sử Phiên bản: {showHistory.title}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(null)}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Current */}
                <div style={{ border: '2px solid var(--primary)', borderRadius: 'var(--r-md)', padding: 12, background: '#EFF6FF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Phiên bản hiện tại (v{showHistory.versions?.length + 1 || 1})</span>
                    <a href={`${BASE_URL}/${showHistory.currentFile?.filePath?.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" style={{ fontSize: '.8rem', color: 'var(--primary)' }}>Tải xuống</a>
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--tx-2)' }}>
                    Cập nhật bởi: <strong>{showHistory.uploadedBy?.username}</strong> vào lúc {new Date(showHistory.updatedAt).toLocaleString('vi-VN')}
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginTop: 4 }}>Kích thước: {formatBytes(showHistory.currentFile?.size)}</div>
                </div>

                {/* Old Versions */}
                {[...(showHistory.versions || [])].reverse().map((v, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>Phiên bản v{showHistory.versions.length - i}</span>
                      <a href={`${BASE_URL}/${v.filePath?.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" style={{ fontSize: '.8rem', color: 'var(--brand-blue)' }}>Tải xuống</a>
                    </div>
                    <div style={{ fontSize: '.8rem', color: 'var(--tx-3)' }}>
                      Vào lúc {new Date(v.uploadedAt).toLocaleString('vi-VN')}
                    </div>
                    {v.note && <div style={{ fontSize: '.8rem', marginTop: 4, background: 'var(--bg-2)', padding: '4px 8px', borderRadius: 4 }}>Ghi chú: {v.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
};

export default PersonalDrive;
