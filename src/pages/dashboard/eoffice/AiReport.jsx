import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/api';
import { toast } from 'react-toastify';
import { Bot, Calendar, FileText, CheckSquare, AlertTriangle, Clock, Copy, Printer, RefreshCw, BarChart3, TrendingUp, XCircle } from 'lucide-react';

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

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card" style={{ flex: 1, minWidth: 130, textAlign: 'center', padding: '14px 10px', borderTop: `3px solid ${color}` }}>
    <Icon size={20} color={color} style={{ marginBottom: 6 }} />
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--tx-3)', marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: '.7rem', color: 'var(--tx-4)', marginTop: 2 }}>{sub}</div>}
  </div>
);

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

const AiReport = () => {
  const today    = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
  const todayStr = today.toISOString().slice(0,10);

  const [from, setFrom]       = useState(firstDay);
  const [to,   setTo]         = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [report,  setReport]  = useState('');
  const [stats,   setStats]   = useState(null);
  const [deadlines, setDeadlines]           = useState({alerts:[],overdue:[],total:0});
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);
  const reportRef = useRef(null);

  const setPreset = (key) => {
    const now = new Date();
    if (key==='thisMonth')  { setFrom(new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10)); setTo(now.toISOString().slice(0,10)); }
    if (key==='lastMonth')  { setFrom(new Date(now.getFullYear(),now.getMonth()-1,1).toISOString().slice(0,10)); setTo(new Date(now.getFullYear(),now.getMonth(),0).toISOString().slice(0,10)); }
    if (key==='thisYear')   { setFrom(`${now.getFullYear()}-01-01`); setTo(now.toISOString().slice(0,10)); }
  };

  const fetchDeadlines = async () => {
    setLoadingDeadlines(true);
    try { const r = await api.get('/documents/ai-deadline-alerts'); setDeadlines(r.data); }
    catch { toast.error('Lỗi tải cảnh báo deadline'); }
    setLoadingDeadlines(false);
  };

  useEffect(()=>{ fetchDeadlines(); },[]);

  const handleGenerate = async () => {
    if (!from||!to){ toast.error('Chọn khoảng thời gian!'); return; }
    setLoading(true); setReport(''); setStats(null);
    try {
      const res = await api.get('/documents/ai-report', {params:{from,to}});
      setReport(res.data.report);
      setStats(res.data.stats);
      toast.success('🤖 AI đã tạo báo cáo thành công!');
    } catch(err){ toast.error(err.response?.data?.message||'Lỗi tạo báo cáo'); }
    setLoading(false);
  };

  const handleCopy = () => { navigator.clipboard.writeText(report); toast.success('Đã sao chép!'); };
  const handlePrint = () => {
    const w = window.open('','_blank');
    w.document.write(`<html><head><title>Báo cáo công tác</title><style>body{font-family:Arial;font-size:13px;line-height:1.8;padding:30px;color:#111}h1{font-size:1.3em}h2{font-size:1.1em}li{margin:3px 0}</style></head><body>${reportRef.current?.innerHTML||''}</body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="animate-up">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:14}}>
        <div>
          <h2 style={{display:'flex',alignItems:'center',gap:10}}><Bot size={24} color="var(--brand-blue)"/>Báo cáo AI &amp; Nhắc nhở</h2>
          <p>AI tự động tổng hợp dữ liệu và soạn thảo báo cáo công tác</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchDeadlines}><RefreshCw size={14}/> Làm mới</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 320px',gap:20,alignItems:'start'}}>
        {/* LEFT */}
        <div>
          <div className="card" style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <Calendar size={18} color="var(--primary)"/>
              <span style={{fontWeight:700,fontSize:'.95rem'}}>Chọn khoảng thời gian báo cáo</span>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
              {[{l:'Tháng này',k:'thisMonth'},{l:'Tháng trước',k:'lastMonth'},{l:'Năm nay',k:'thisYear'}].map(({l,k})=>(
                <button key={k} className="btn btn-ghost btn-sm" onClick={()=>setPreset(k)} style={{fontSize:'.8rem'}}>{l}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
              <div>
                <label style={{fontSize:'.8rem',fontWeight:600,color:'var(--tx-3)',display:'block',marginBottom:4}}>Từ ngày</label>
                <input type="date" className="form-input" value={from} onChange={e=>setFrom(e.target.value)} style={{width:160}}/>
              </div>
              <div>
                <label style={{fontSize:'.8rem',fontWeight:600,color:'var(--tx-3)',display:'block',marginBottom:4}}>Đến ngày</label>
                <input type="date" className="form-input" value={to} onChange={e=>setTo(e.target.value)} style={{width:160}}/>
              </div>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{display:'flex',alignItems:'center',gap:8}}>
                {loading ? <><RefreshCw size={15} style={{animation:'spin 1s linear infinite'}}/> Đang tạo...</>
                         : <><Bot size={15}/> 🤖 Tạo báo cáo</>}
              </button>
            </div>
          </div>

          {stats && (
            <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
              <StatCard icon={FileText}    label="Văn bản đến" value={stats.docsIncoming} color="var(--primary)"/>
              <StatCard icon={FileText}    label="Văn bản đi"  value={stats.docsOutgoing} color="var(--brand-blue)"/>
              <StatCard icon={CheckSquare} label="Hoàn thành"  value={stats.tasksDone}    color="var(--success)" sub={`/ ${stats.tasksTotal} cv`}/>
              <StatCard icon={TrendingUp}  label="Tỷ lệ ht"    value={`${stats.tasksTotal?Math.round(stats.tasksDone/stats.tasksTotal*100):0}%`}
                color={stats.tasksOverdue>0?'var(--warning)':'var(--success)'}/>
              {stats.tasksOverdue>0 && <StatCard icon={AlertTriangle} label="Quá hạn" value={stats.tasksOverdue} color="var(--danger)"/>}
            </div>
          )}

          {loading && (
            <div className="card" style={{textAlign:'center',padding:'60px 20px',color:'var(--tx-3)'}}>
              <div style={{width:48,height:48,borderRadius:'50%',border:'4px solid var(--border)',borderTopColor:'var(--primary)',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}/>
              <p style={{fontWeight:600}}>🤖 AI đang phân tích dữ liệu và soạn báo cáo...</p>
              <p style={{fontSize:'.85rem'}}>Vui lòng chờ khoảng 10–20 giây</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

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

          {!report && !loading && (
            <div className="card" style={{textAlign:'center',padding:'60px 20px',color:'var(--tx-4)'}}>
              <Bot size={48} style={{opacity:.3,marginBottom:16}}/>
              <p style={{fontSize:'.95rem'}}>Chọn khoảng thời gian và bấm <strong>"🤖 Tạo báo cáo"</strong></p>
              <p style={{fontSize:'.85rem'}}>AI sẽ tổng hợp toàn bộ dữ liệu văn bản, công việc và soạn thảo báo cáo công tác hoàn chỉnh.</p>
            </div>
          )}
        </div>

        {/* RIGHT — Deadline alerts */}
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

      <style>{`@media(max-width:768px){.ai-report-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
};

export default AiReport;
