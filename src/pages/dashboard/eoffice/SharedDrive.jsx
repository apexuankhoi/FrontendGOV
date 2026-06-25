import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/api';
import { getFileUrl } from '../../../utils/fileHelper';
import Swal from 'sweetalert2';
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

const SharedDrive = () => {
  const [files, setFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]); // File đang tải lên ngầm
  const [updatingFiles, setUpdatingFiles] = useState([]); // File đang cập nhật phiên bản
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
  const [targetUpdateId, setTargetUpdateId] = useState(null);

  const fetchFiles = async (id = parentId) => {
    setLoading(true);
    try {
      const res = await api.get('/drive', { params: { parentId: id } });
      setFiles(res.data);
    } catch { toast.error('Lỗi tải dữ liệu kho'); }
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, [parentId]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await api.post('/drive/folder', { title: folderName, parentId });
      toast.success('Đã tạo thư mục');
      setFolderName(''); setShowNewFolder(false); fetchFiles();
    } catch { toast.error('Lỗi tạo thư mục'); }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadId = Date.now().toString();
    setUploadingFiles(prev => [...prev, { id: uploadId, name: file.name, progress: 0 }]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (parentId) formData.append('parentId', parentId);
      
      await api.post('/drive/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadingFiles(prev => prev.map(f => f.id === uploadId ? { ...f, progress: percentCompleted } : f));
        }
      });
      toast.success('Đã tải file lên');
      fetchFiles();
    } catch (err) {
      toast.error('Lỗi upload file: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
    }
  };

  const handleUpdateVersion = async (e) => {
    const file = e.target.files[0];
    const updateId = targetUpdateId;
    if (!file || !updateId) return;

    setUpdatingFiles(prev => [...prev, updateId]);
    setTargetUpdateId(null);
    if (updateInputRef.current) updateInputRef.current.value = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('note', 'Cập nhật phiên bản mới');
      await api.post(`/drive/${updateId}/new-version`, formData);
      toast.success('Đã cập nhật phiên bản mới');
      fetchFiles();
    } catch (err) { 
      toast.error('Lỗi cập nhật phiên bản: ' + (err.response?.data?.message || err.message)); 
    } finally {
      setUpdatingFiles(prev => prev.filter(id => id !== updateId));
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Chắc chắn muốn xóa?',
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Có, xóa đi!',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/drive/${id}`);
          toast.success('Đã xóa thành công');
          fetchFiles();
        } catch (error) {
          toast.error(error.response?.data?.message || 'Lỗi khi xóa');
        }
      }
    });
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2>🗂️ Kho Lưu Trữ Dùng Chung</h2>
          <p>Không gian làm việc nhóm của cơ quan (Tạo thư mục, Chia sẻ & Cập nhật phiên bản file)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setShowNewFolder(true)}>
            <Plus size={16} /> Thư mục mới
          </button>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploadingFiles.length > 0}>
            {uploadingFiles.length > 0 ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />} 
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
        ) : files.length === 0 && uploadingFiles.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--tx-4)' }}>
            <FolderOpen size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>Thư mục trống</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {/* Hiển thị các file đang tải lên */}
            {uploadingFiles.map(up => (
              <div key={up.id} style={{ 
                border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16,
                display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-1)',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, height: 4, background: 'var(--primary)', width: `${up.progress}%`, transition: 'width 0.2s' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <File size={32} color="var(--tx-3)" />
                  <RefreshCw size={14} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={up.name}>
                    {up.name}
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--primary)', marginTop: 8 }}>
                    Đang tải lên... {up.progress}%
                  </div>
                </div>
              </div>
            ))}
            
            {/* Danh sách file thật */}
            {files.map(f => (
              <div key={f._id} style={{ 
                border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16,
                display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-1)',
                transition: 'box-shadow .2s', cursor: f.isFolder ? 'pointer' : 'default'
              }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.05)'}
                 onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                 onClick={() => f.isFolder && navigateTo(f)}>
                
                {updatingFiles.includes(f._id) && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-md)' }}>
                    <RefreshCw size={24} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {f.isFolder ? <Folder size={32} color="#FBBF24" fill="#FBBF24" fillOpacity={0.2} /> : getIcon(f.currentFile?.mimeType)}
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    {!f.isFolder && (
                      <>
                        <a href={getFileUrl(f.currentFile?.filePath, f.currentFile?.fileName || f.title)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--primary)' }} title="Tải xuống">
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
                    <a href={getFileUrl(showHistory.currentFile?.filePath)} target="_blank" rel="noreferrer" style={{ fontSize: '.8rem', color: 'var(--primary)' }}>Tải xuống</a>
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
                      <a href={getFileUrl(v.filePath)} target="_blank" rel="noreferrer" style={{ fontSize: '.8rem', color: 'var(--brand-blue)' }}>Tải xuống</a>
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

export default SharedDrive;
