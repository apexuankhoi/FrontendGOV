import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/api';
import { toast } from 'react-toastify';
import {
  Bot, Calendar, FileText, CheckSquare, AlertTriangle, Clock, Copy, Printer, RefreshCw,
  BarChart3, TrendingUp, XCircle, Upload, FolderOpen, FileInput, Sparkles, BookOpen,
  Layers, Target, ChevronDown
} from 'lucide-react';

// ── Markdown Renderer ──
const MarkdownRender = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.9, color: 'var(--tx-1)' }}>
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

// ── Stat Card ──
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card" style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: '14px 10px', borderTop: `3px solid ${color}` }}>
    <Icon size={20} color={color} style={{ marginBottom: 6 }} />
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--tx-3)', marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: '.7rem', color: 'var(--tx-4)', marginTop: 2 }}>{sub}</div>}
  </div>
);

// ── Deadline Card (bên phải) ──
const DeadlineCard = ({ doc, isOverdue }) => {
  const daysLeft = Math.ceil((new Date(doc.deadline) - new Date()) / (1000*60*60*24));
  return (
    <div style={{
      padding:'10px 14px', borderRadius:'var(--r-md)', marginBottom:8,
      background: isOverdue ? 'rgba(239,68,68,.07)' : 'rgba(234,179,8,.07)',
      border:`1px solid ${isOverdue ? 'rgba(239,68,68,.25)' : 'rgba(234,179,8,.25)'}`,
      display:'flex', gap:10, alignItems:'flex-start'
    }}>
      {isOverdue ? <XCircle size={15} color="var(--danger)" style={{marginTop:2,flexShrink:0}}/>
                 : <Clock size={15} color="#ca8a04" style={{marginTop:2,flexShrink:0}}/>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:'.83rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {doc.documentNumber ? `Số ${doc.documentNumber}` : 'Văn bản'} — {doc.issuingAgency||'?'}
        </div>
        <div style={{fontSize:'.78rem',color:'var(--tx-3)',marginTop:2}}>{(doc.summary||'').slice(0,70)}{doc.summary?.length>70?'...':''}</div>
        <div style={{fontSize:'.76rem',marginTop:4,fontWeight:600,color:isOverdue?'var(--danger)':'#ca8a04'}}>
          {isOverdue ? `Quá hạn ${Math.abs(daysLeft)} ngày` : `Còn ${daysLeft} ngày`} — {new Date(doc.deadline).toLocaleDateString('vi-VN')}
        </div>
      </div>
    </div>
  );
};

// ── Tab button ──
const TabBtn = ({ active, icon: Icon, label, onClick, color }) => (
  <button
    className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', whiteSpace: 'nowrap' }}
  >
    <Icon size={16} color={active ? '#fff' : color || 'var(--tx-2)'} />
    {label}
  </button>
);

// ══════════════════════════════════════════════════════════════
// COMPONENT CHÍNH: AI BÁO CÁO 2.0
// ══════════════════════════════════════════════════════════════
const AiReport = () => {
  const today    = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
  const todayStr = today.toISOString().slice(0,10);

  // ── State chung ──
  const [activeMode, setActiveMode] = useState('outline');
  const [from, setFrom]       = useState(firstDay);
  const [to,   setTo]         = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [report,  setReport]  = useState('');
  const [stats,   setStats]   = useState(null);
  const [meta, setMeta]       = useState(null);
  const [userRequest, setUserRequest] = useState('');
  const [keywords, setKeywords] = useState('');
  const reportRef = useRef(null);

  // ── Tài nguyên (Đề cương, Báo cáo mẫu) ──
  const [resources, setResources] = useState({ templates: [], outlines: [] });
  const [loadingRes, setLoadingRes] = useState(true);
  const [selectedOutline, setSelectedOutline] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState([]);

  // ── Deadline ──
  const [deadlines, setDeadlines]           = useState({alerts:[],overdue:[],total:0});
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);

  // ── Upload file trực tiếp ──
  const outlineUploadRef = useRef(null);
  const templateUploadRef = useRef(null);
  const [uploadingOutline, setUploadingOutline] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  // ── Preset thời gian ──
  const setPreset = (key) => {
    const now = new Date();
    if (key==='thisMonth')  { setFrom(new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10)); setTo(now.toISOString().slice(0,10)); }
    if (key==='lastMonth')  { setFrom(new Date(now.getFullYear(),now.getMonth()-1,1).toISOString().slice(0,10)); setTo(new Date(now.getFullYear(),now.getMonth(),0).toISOString().slice(0,10)); }
    if (key==='6months')    { setFrom(new Date(now.getFullYear(),now.getMonth()-6,1).toISOString().slice(0,10)); setTo(now.toISOString().slice(0,10)); }
    if (key==='thisYear')   { setFrom(`${now.getFullYear()}-01-01`); setTo(now.toISOString().slice(0,10)); }
  };

  // ── Fetch resources ──
  const fetchResources = async () => {
    setLoadingRes(true);
    try {
      const r = await api.get('/documents/ai-report-v2/resources');
      setResources(r.data);
    } catch { /* resources chưa có thư mục thì để rỗng */ }
    setLoadingRes(false);
  };

  // ── Fetch deadlines ──
  const fetchDeadlines = async () => {
    setLoadingDeadlines(true);
    try { const r = await api.get('/documents/ai-deadline-alerts'); setDeadlines(r.data); }
    catch { /* im lặng */ }
    setLoadingDeadlines(false);
  };

  useEffect(() => { fetchResources(); fetchDeadlines(); }, []);

  // ── Upload file vào thư mục Drive ──
  const handleUploadToDrive = async (file, folderName, setUploading) => {
    setUploading(true);
    try {
      // 1. Tìm hoặc tạo thư mục
      let parentId = null;
      try {
        const driveRes = await api.get('/drive', { params: { parentId: null } });
        const folder = driveRes.data.find(f => f.isFolder && f.title.toLowerCase().includes(folderName.toLowerCase()));
        if (folder) {
          parentId = folder._id;
        } else {
          const newFolder = await api.post('/drive/folder', { title: folderName, parentId: null });
          parentId = newFolder.data._id;
        }
      } catch { /* ignore */ }

      // 2. Upload file
      const formData = new FormData();
      formData.append('file', file);
      if (parentId) formData.append('parentId', parentId);
      await api.post('/drive/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Đã tải lên "${file.name}" vào thư mục ${folderName}`);
      fetchResources();
    } catch (err) {
      toast.error('Lỗi tải file lên Drive');
    }
    setUploading(false);
  };

  // ── Toggle chọn template ──
  const toggleTemplate = (id) => {
    setSelectedTemplates(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ── Tạo báo cáo ──
  const handleGenerate = async () => {
    if (!userRequest.trim()) {
      toast.error('Vui lòng nhập yêu cầu báo cáo!');
      return;
    }
    setLoading(true); setReport(''); setStats(null); setMeta(null);
    try {
      const res = await api.post('/documents/ai-report-v2/generate', {
        mode: activeMode,
        outlineFileId: selectedOutline || undefined,
        templateFileIds: selectedTemplates.length > 0 ? selectedTemplates : undefined,
        from, to,
        userRequest,
        keywords: keywords || undefined,
      });
      setReport(res.data.report);
      setStats(res.data.stats);
      setMeta(res.data.meta);
      toast.success('🤖 AI đã tạo báo cáo thành công!');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo báo cáo');
    }
    setLoading(false);
  };

  const handleCopy = () => { navigator.clipboard.writeText(report); toast.success('Đã sao chép nội dung!'); };
  const handlePrint = () => {
    const w = window.open('','_blank');
    w.document.write(`<html><head><title>Báo cáo công tác</title><style>body{font-family:'Times New Roman',serif;font-size:13px;line-height:1.8;padding:30px;color:#111}h1{font-size:1.3em}h2{font-size:1.1em}li{margin:3px 0}</style></head><body>${reportRef.current?.innerHTML||''}</body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="animate-up">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:14}}>
        <div>
          <h2 style={{display:'flex',alignItems:'center',gap:10}}>
            <Bot size={24} color="var(--brand-blue)"/>AI Báo cáo 2.0
          </h2>
          <p>Tạo báo cáo chuyên nghiệp theo đề cương, báo cáo mẫu, hoặc tổng hợp tự do.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { fetchResources(); fetchDeadlines(); }}>
          <RefreshCw size={14}/> Làm mới
        </button>
      </div>

      {/* ── TABS CHẾ ĐỘ BÁO CÁO ── */}
      <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:10, borderBottom:'1px solid var(--border)', marginBottom:20 }}>
        <TabBtn active={activeMode==='outline'} icon={BookOpen} label="Theo Đề cương" onClick={()=>setActiveMode('outline')} color="var(--primary)" />
        <TabBtn active={activeMode==='template'} icon={FileText} label="Theo Báo cáo mẫu" onClick={()=>setActiveMode('template')} color="#D97706" />
        <TabBtn active={activeMode==='synthesis'} icon={Layers} label="Tổng hợp tự do" onClick={()=>setActiveMode('synthesis')} color="#16A34A" />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 320px',gap:20,alignItems:'start'}}>
        {/* ══ LEFT ══ */}
        <div>

          {/* ── CARD 1: Chọn tài liệu tham chiếu ── */}
          <div className="card" style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <FolderOpen size={18} color="var(--primary)"/>
              <span style={{fontWeight:700,fontSize:'.95rem'}}>
                {activeMode === 'outline' ? '1. Chọn Đề cương' : activeMode === 'template' ? '1. Chọn Báo cáo mẫu' : '1. Tài liệu tham chiếu (tùy chọn)'}
              </span>
            </div>

            {/* ── MODE: ĐỀ CƯƠNG ── */}
            {activeMode === 'outline' && (
              <>
                <p style={{fontSize:'.8rem',color:'var(--tx-3)',marginBottom:12}}>
                  AI sẽ tuân thủ 100% cấu trúc đề cương bạn chọn. Đề cương nằm trong thư mục <strong>02_DE_CUONG</strong> trên Drive.
                </p>
                {resources.outlines.length > 0 ? (
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
                    {resources.outlines.map(f => (
                      <label key={f._id} style={{
                        display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                        borderRadius:'var(--r-md)', cursor:'pointer',
                        border: selectedOutline === f._id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: selectedOutline === f._id ? 'var(--primary-bg)' : 'transparent',
                      }}>
                        <input type="radio" name="outline" checked={selectedOutline === f._id} onChange={() => setSelectedOutline(f._id)} />
                        <FileText size={16} color="var(--primary)" />
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:'.85rem'}}>{f.title}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div style={{textAlign:'center',padding:'20px',color:'var(--tx-4)',fontSize:'.85rem',background:'var(--bg-2)',borderRadius:'var(--r-md)',marginBottom:12}}>
                    Chưa có đề cương nào. Tạo thư mục <strong>02_DE_CUONG</strong> trong Kho Dữ liệu và tải đề cương lên.
                  </div>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => outlineUploadRef.current?.click()} disabled={uploadingOutline}>
                  <Upload size={14}/> {uploadingOutline ? 'Đang tải...' : 'Tải đề cương mới lên'}
                </button>
                <input ref={outlineUploadRef} type="file" accept=".pdf,.doc,.docx" hidden
                  onChange={e => { if (e.target.files[0]) handleUploadToDrive(e.target.files[0], '02_DE_CUONG', setUploadingOutline); e.target.value = ''; }} />
              </>
            )}

            {/* ── MODE: TEMPLATE ── */}
            {activeMode === 'template' && (
              <>
                <p style={{fontSize:'.8rem',color:'var(--tx-3)',marginBottom:12}}>
                  AI sẽ giữ nguyên bố cục, học văn phong từ báo cáo mẫu và cập nhật số liệu mới. Báo cáo mẫu nằm trong thư mục <strong>01_BAO_CAO_MAU</strong>.
                </p>
                {resources.templates.length > 0 ? (
                  <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
                    {resources.templates.map(f => (
                      <label key={f._id} style={{
                        display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                        borderRadius:'var(--r-md)', cursor:'pointer',
                        border: selectedTemplates.includes(f._id) ? '2px solid #D97706' : '1px solid var(--border)',
                        background: selectedTemplates.includes(f._id) ? '#FFFBEB' : 'transparent',
                      }}>
                        <input type="checkbox" checked={selectedTemplates.includes(f._id)} onChange={() => toggleTemplate(f._id)} />
                        <FileText size={16} color="#D97706" />
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:'.85rem'}}>{f.title}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div style={{textAlign:'center',padding:'20px',color:'var(--tx-4)',fontSize:'.85rem',background:'var(--bg-2)',borderRadius:'var(--r-md)',marginBottom:12}}>
                    Chưa có báo cáo mẫu nào. Tạo thư mục <strong>01_BAO_CAO_MAU</strong> trong Kho Dữ liệu và tải báo cáo lên.
                  </div>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => templateUploadRef.current?.click()} disabled={uploadingTemplate}>
                  <Upload size={14}/> {uploadingTemplate ? 'Đang tải...' : 'Tải báo cáo mẫu mới lên'}
                </button>
                <input ref={templateUploadRef} type="file" accept=".pdf,.doc,.docx" hidden
                  onChange={e => { if (e.target.files[0]) handleUploadToDrive(e.target.files[0], '01_BAO_CAO_MAU', setUploadingTemplate); e.target.value = ''; }} />
              </>
            )}

            {/* ── MODE: TỔNG HỢP ── */}
            {activeMode === 'synthesis' && (
              <div style={{background:'var(--bg-2)',borderRadius:'var(--r-md)',padding:16}}>
                <p style={{fontSize:'.85rem',color:'var(--tx-2)',margin:0}}>
                  <Sparkles size={14} style={{verticalAlign:'middle',marginRight:6}} color="#16A34A"/>
                  Chế độ tổng hợp: AI sẽ tự quét toàn bộ kho văn bản, công việc, tìm tài liệu liên quan theo từ khóa và tổng hợp thành báo cáo hoàn chỉnh.
                </p>
              </div>
            )}
          </div>

          {/* ── CARD 2: Khoảng thời gian + Yêu cầu ── */}
          <div className="card" style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <Calendar size={18} color="var(--primary)"/>
              <span style={{fontWeight:700,fontSize:'.95rem'}}>2. Thời gian & Yêu cầu</span>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
              {[{l:'Tháng này',k:'thisMonth'},{l:'Tháng trước',k:'lastMonth'},{l:'6 tháng',k:'6months'},{l:'Năm nay',k:'thisYear'}].map(({l,k})=>(
                <button key={k} className="btn btn-ghost btn-sm" onClick={()=>setPreset(k)} style={{fontSize:'.8rem'}}>{l}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
              <div>
                <label style={{fontSize:'.8rem',fontWeight:600,color:'var(--tx-3)',display:'block',marginBottom:4}}>Từ ngày</label>
                <input type="date" className="form-input" value={from} onChange={e=>setFrom(e.target.value)} style={{width:160}}/>
              </div>
              <div>
                <label style={{fontSize:'.8rem',fontWeight:600,color:'var(--tx-3)',display:'block',marginBottom:4}}>Đến ngày</label>
                <input type="date" className="form-input" value={to} onChange={e=>setTo(e.target.value)} style={{width:160}}/>
              </div>
            </div>

            {/* Từ khóa */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:'.8rem',fontWeight:600,color:'var(--tx-3)',display:'block',marginBottom:4}}>Từ khóa tìm VB liên quan (tùy chọn)</label>
              <input className="form-input" value={keywords} onChange={e=>setKeywords(e.target.value)}
                placeholder="VD: cư trú, VNeID, Đề án 06, PCCC..."
                style={{width:'100%'}} />
            </div>

            {/* Yêu cầu */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:'.8rem',fontWeight:600,color:'var(--tx-3)',display:'block',marginBottom:4}}>
                Yêu cầu báo cáo <span style={{color:'var(--danger)'}}>*</span>
              </label>
              <textarea className="form-input" value={userRequest} onChange={e=>setUserRequest(e.target.value)}
                placeholder='VD: "Lập báo cáo kết quả thực hiện Đề án 06 - 6 tháng đầu năm 2026" hoặc "Báo cáo công tác cư trú tháng 6/2026"'
                rows={3}
                style={{width:'100%',resize:'vertical'}} />
            </div>

            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',justifyContent:'center',padding:'12px 20px'}}>
              {loading ? <><RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/> AI đang phân tích và soạn báo cáo...</>
                       : <><Sparkles size={16}/> 🤖 Tạo báo cáo AI</>}
            </button>
          </div>

          {/* ── Thống kê (sau khi có kết quả) ── */}
          {stats && (
            <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
              <StatCard icon={FileInput} label="Văn bản đến" value={stats.docsIncoming} color="var(--primary)"/>
              <StatCard icon={FileText} label="Văn bản đi" value={stats.docsOutgoing || 0} color="var(--brand-blue)"/>
              <StatCard icon={CheckSquare} label="Hoàn thành" value={stats.tasksDone} color="var(--success)" sub={`/ ${stats.tasksTotal} cv`}/>
              <StatCard icon={TrendingUp} label="Tỷ lệ ht" value={`${stats.tasksTotal?Math.round(stats.tasksDone/stats.tasksTotal*100):0}%`}
                color={stats.tasksOverdue>0?'var(--warning)':'var(--success)'}/>
              {stats.tasksOverdue>0 && <StatCard icon={AlertTriangle} label="Quá hạn" value={stats.tasksOverdue} color="var(--danger)"/>}
            </div>
          )}

          {/* ── Meta info ── */}
          {meta && (
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {meta.hasOutline && <span className="badge badge-info" style={{fontSize:'.75rem'}}>📋 Có đề cương</span>}
              {meta.templateCount > 0 && <span className="badge badge-warning" style={{fontSize:'.75rem'}}>📄 {meta.templateCount} báo cáo mẫu</span>}
              {meta.relatedDocsCount > 0 && <span className="badge badge-success" style={{fontSize:'.75rem'}}>🔗 {meta.relatedDocsCount} VB liên quan</span>}
              <span className="badge" style={{fontSize:'.75rem'}}>📊 Chế độ: {meta.mode === 'outline' ? 'Đề cương' : meta.mode === 'template' ? 'Báo cáo mẫu' : 'Tổng hợp'}</span>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="card" style={{textAlign:'center',padding:'60px 20px',color:'var(--tx-3)'}}>
              <div style={{width:48,height:48,borderRadius:'50%',border:'4px solid var(--border)',borderTopColor:'var(--primary)',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}/>
              <p style={{fontWeight:600}}>🤖 AI đang phân tích đề cương, đọc báo cáo mẫu và soạn báo cáo...</p>
              <p style={{fontSize:'.85rem'}}>Vui lòng chờ khoảng 15–30 giây</p>
            </div>
          )}

          {/* ── Kết quả báo cáo ── */}
          {report && !loading && (
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
                <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:700}}>
                  <BarChart3 size={18} color="var(--primary)"/> Nội dung báo cáo
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-ghost btn-sm" onClick={handleCopy}><Copy size={14}/> Sao chép</button>
                  <button className="btn btn-ghost btn-sm" onClick={handlePrint}><Printer size={14}/> In</button>
                </div>
              </div>
              <div ref={reportRef} style={{background:'#FAFBFF',borderRadius:'var(--r-md)',padding:'20px 24px',border:'1px solid var(--border)'}}>
                <MarkdownRender text={report}/>
              </div>
            </div>
          )}

          {/* ── Placeholder ── */}
          {!report && !loading && (
            <div className="card" style={{textAlign:'center',padding:'60px 20px',color:'var(--tx-4)'}}>
              <Bot size={48} style={{opacity:.3,marginBottom:16}}/>
              <p style={{fontSize:'.95rem'}}>Chọn chế độ báo cáo, nhập yêu cầu và bấm <strong>"🤖 Tạo báo cáo AI"</strong></p>
              <p style={{fontSize:'.85rem'}}>AI sẽ đọc đề cương, học văn phong từ báo cáo mẫu, kết hợp số liệu thực tế để soạn báo cáo chuyên nghiệp.</p>
            </div>
          )}
        </div>

        {/* ══ RIGHT — Deadline alerts ══ */}
        <div>
          <div className="card" style={{position:'sticky',top:80}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <AlertTriangle size={18} color="var(--danger)"/>
              <span style={{fontWeight:700,fontSize:'.95rem'}}>Cảnh báo Hạn xử lý</span>
              {deadlines.total>0 && <span className="badge badge-danger" style={{marginLeft:'auto'}}>{deadlines.total}</span>}
            </div>

            {loadingDeadlines ? (
              <p style={{color:'var(--tx-4)',fontSize:'.85rem',textAlign:'center',padding:'20px 0'}}>Đang tải...</p>
            ) : deadlines.total===0 ? (
              <div style={{textAlign:'center',padding:'24px 0',color:'var(--tx-4)'}}>
                <CheckSquare size={32} style={{opacity:.3,marginBottom:8}}/>
                <p style={{fontSize:'.85rem'}}>Không có văn bản nào sắp hết hạn 🎉</p>
              </div>
            ) : (
              <>
                {deadlines.overdue.length>0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:'.76rem',fontWeight:700,color:'var(--danger)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>
                      🔴 Đã quá hạn ({deadlines.overdue.length})
                    </div>
                    {deadlines.overdue.map(d=><DeadlineCard key={d._id} doc={d} isOverdue/>)}
                  </div>
                )}
                {deadlines.alerts.length>0 && (
                  <div>
                    <div style={{fontSize:'.76rem',fontWeight:700,color:'#ca8a04',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>
                      🟡 Sắp đến hạn ({deadlines.alerts.length})
                    </div>
                    {deadlines.alerts.map(d=><DeadlineCard key={d._id} doc={d} isOverdue={false}/>)}
                  </div>
                )}
              </>
            )}
            <div style={{marginTop:12,padding:'8px 12px',background:'var(--bg-2)',borderRadius:'var(--r-sm)',fontSize:'.75rem',color:'var(--tx-3)'}}>
              💡 Hiển thị văn bản quá hạn và sắp đến hạn trong 3 ngày tới.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(max-width:768px) {
          .ai-report-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AiReport;
