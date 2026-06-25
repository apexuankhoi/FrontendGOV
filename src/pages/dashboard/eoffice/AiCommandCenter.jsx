import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { toast } from 'react-toastify';
import { Bot, Search, FileText, CheckSquare, AlertTriangle, Users, BarChart3, Send, FileDown, RefreshCw, Zap, Shield, TrendingUp } from 'lucide-react';

const MarkdownRender = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.8, color: 'var(--tx-1)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('# '))   return <h1 key={i} style={{ fontSize: '1.2rem', fontWeight: 800, margin: '16px 0 8px', color: 'var(--primary-dark)' }}>{line.slice(2)}</h1>;
        if (line.startsWith('## '))  return <h2 key={i} style={{ fontSize: '1.05rem', fontWeight: 700, margin: '14px 0 6px', color: 'var(--primary)' }}>{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '.95rem', fontWeight: 700, margin: '10px 0 5px' }}>{line.slice(4)}</h3>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: 20, marginBottom: 3, fontSize: '.85rem' }}>{line.slice(2)}</li>;
        if (/^\d+\.\s/.test(line)) return <li key={i} style={{ marginLeft: 20, marginBottom: 3, fontSize: '.85rem' }}>{line.replace(/^\d+\.\s/, '')}</li>;
        if (line.startsWith('|')) return <pre key={i} style={{ margin: 0, fontSize: '.8rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{line}</pre>;
        if (!line.trim()) return <br key={i} />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return <p key={i} style={{ margin: '2px 0', fontSize: '.85rem' }}>{parts.map((p,j) => j%2===1 ? <strong key={j}>{p}</strong> : p)}</p>;
      })}
    </div>
  );
};

const RATING_COLOR = { 'Xuat sac': '#22c55e', 'Tot': '#3b82f6', 'Kha': '#f59e0b', 'Can cai thien': '#ef4444' };

const AiCommandCenter = () => {
  const [activeTab, setActiveTab] = useState('query');
  
  // NLP Query
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  
  // Proofread
  const [docs, setDocs] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [proofResult, setProofResult] = useState('');
  const [proofLoading, setProofLoading] = useState(false);
  
  // Synthesis
  const [selectedIds, setSelectedIds] = useState([]);
  const [synthResult, setSynthResult] = useState(null);
  const [synthLoading, setSynthLoading] = useState(false);
  
  // KPI
  const [kpiData, setKpiData] = useState([]);
  const [kpiEval, setKpiEval] = useState('');
  const [kpiLoading, setKpiLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);

  // Cross Agency
  const [crossResult, setCrossResult] = useState('');
  const [crossLoading, setCrossLoading] = useState(false);

  const role = localStorage.getItem('role') || '';
  const isAdmin = ['ADMIN', 'SENIOR_ADMIN'].includes(role);

  useEffect(() => {
    api.get('/documents', { params: { limit: 100 } })
      .then(res => setDocs(Array.isArray(res.data) ? res.data : res.data.documents || []))
      .catch(() => {});
  }, []);

  // === NLP Query ===
  const handleQuery = async () => {
    if (!question.trim()) return;
    setQueryLoading(true); setAnswer('');
    try {
      const res = await api.post('/documents/ai-query', { question });
      setAnswer(res.data.answer);
    } catch (err) { toast.error(err.response?.data?.message || 'Loi tra cuu'); }
    setQueryLoading(false);
  };

  // === Proofread ===
  const handleProofread = async () => {
    if (!selectedDocId) { toast.error('Chon van ban truoc'); return; }
    setProofLoading(true); setProofResult('');
    try {
      const res = await api.post(`/documents/${selectedDocId}/ai-proofread`);
      setProofResult(res.data.proofreadResult);
      toast.success('AI da kiem duyet xong!');
    } catch (err) { toast.error(err.response?.data?.message || 'Loi kiem duyet'); }
    setProofLoading(false);
  };

  // === Synthesis ===
  const toggleDocSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const handleSynthesize = async () => {
    if (selectedIds.length < 2) { toast.error('Chon it nhat 2 van ban'); return; }
    setSynthLoading(true); setSynthResult(null);
    try {
      const res = await api.post('/documents/ai-synthesize', { documentIds: selectedIds });
      setSynthResult(res.data);
      toast.success('AI da tong hop xong!');
    } catch (err) { toast.error(err.response?.data?.message || 'Loi tong hop'); }
    setSynthLoading(false);
  };

  // === KPI ===
  const fetchKPI = async () => {
    setKpiLoading(true);
    try {
      const res = await api.get('/documents/ai-kpi');
      setKpiData(res.data);
    } catch (err) { toast.error('Loi tai KPI'); }
    setKpiLoading(false);
  };
  const handleEvalKPI = async () => {
    setEvalLoading(true); setKpiEval('');
    try {
      const res = await api.get('/documents/ai-kpi-evaluate');
      setKpiEval(res.data.evaluation);
    } catch { toast.error('Lỗi đánh giá KPI'); }
    setEvalLoading(false);
  };

  const handleCrossAgencySynth = async () => {
    setCrossLoading(true);
    try {
      const res = await api.get('/documents/ai-cross-agency');
      setCrossResult(res.data.synthesis);
    } catch { toast.error('Lỗi tổng hợp dữ liệu cấp dưới'); }
    setCrossLoading(false);
  };

  return (
    <div className="animate-up">
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Bot size={24} color="var(--brand-blue)" /> Trung tam AI</h2>
        <p>Cong cu AI nang cao: Tra cuu, Kiem duyet, Tong hop, Danh gia KPI</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          <button className={`btn ${activeTab === 'query' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('query')}>
            <MessageSquare size={16}/> Hỏi đáp Dữ liệu
          </button>
          <button className={`btn ${activeTab === 'proofread' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('proofread')}>
            <Search size={16}/> Kiểm duyệt Văn bản
          </button>
          <button className={`btn ${activeTab === 'synthesis' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('synthesis')}>
            <Layers size={16}/> Tổng hợp Nhiều file
          </button>
          <button className={`btn ${activeTab === 'cross' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('cross')}>
            <Globe size={16}/> Thanh tra Xuyên tuyến
          </button>
          {isAdmin && (
            <button className={`btn ${activeTab === 'kpi' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('kpi'); if (kpiData.length === 0) fetchKPI(); }}>
              <BarChart2 size={16}/> Đánh giá KPI
            </button>
          )}
      </div>

      {/* === TAB: TRA CUU AI === */}
      {activeTab === 'query' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Search size={20} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Tra cuu bang tieng Viet tu nhien</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input className="form-input" style={{ flex: 1 }} value={question} onChange={e => setQuestion(e.target.value)}
              placeholder='Vi du: "Bao nhieu van ban qua han thang nay?"' 
              onKeyDown={e => e.key === 'Enter' && handleQuery()} />
            <button className="btn btn-primary" onClick={handleQuery} disabled={queryLoading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {queryLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
              {queryLoading ? 'Dang...' : 'Hoi'}
            </button>
          </div>
          {answer && (
            <div style={{ background: '#FAFBFF', borderRadius: 'var(--r-md)', padding: '16px 20px', border: '1px solid var(--border)' }}>
              <MarkdownRender text={answer} />
            </div>
          )}
          {!answer && !queryLoading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--tx-4)' }}>
              <Bot size={40} style={{ opacity: .3, marginBottom: 10 }} />
              <p style={{ fontSize: '.85rem' }}>Hoi bat cu dieu gi ve du lieu he thong cua ban</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
                {['Bao nhieu VB chua xu ly?', 'Ai bi qua han nhieu nhat?', 'Thong ke VB theo linh vuc'].map(q => (
                  <button key={q} className="btn btn-ghost btn-sm" style={{ fontSize: '.8rem' }} onClick={() => { setQuestion(q); }}>{q}</button>
                ))}
              </div>
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* === TAB: SOI LOI VAN BAN === */}
      {activeTab === 'proofread' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Shield size={20} color="var(--danger)" />
            <span style={{ fontWeight: 700, fontSize: '.95rem' }}>AI Kiem duyet Van ban</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <select className="form-input" style={{ flex: 1, minWidth: 250 }} value={selectedDocId} onChange={e => setSelectedDocId(e.target.value)}>
              <option value="">-- Chon van ban can kiem duyet --</option>
              {docs.filter(d => d.ocrContent).map(d => (
                <option key={d._id} value={d._id}>{d.documentNumber || 'Khong so'} - {(d.summary || '').slice(0, 60)}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleProofread} disabled={proofLoading}>
              {proofLoading ? 'Dang soi...' : 'AI Kiem duyet'}
            </button>
          </div>
          {proofResult && (
            <div style={{ background: '#FFF7ED', borderRadius: 'var(--r-md)', padding: '16px 20px', border: '1px solid #FED7AA' }}>
              <MarkdownRender text={proofResult} />
            </div>
          )}
          {!proofResult && !proofLoading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--tx-4)' }}>
              <Shield size={40} style={{ opacity: .3, marginBottom: 10 }} />
              <p style={{ fontSize: '.85rem' }}>Chon 1 van ban co noi dung OCR de AI kiem tra loi chinh ta, the thuc, so lieu</p>
            </div>
          )}
        </div>
      )}

      {/* === TAB: TONG HOP VAN BAN === */}
      {activeTab === 'synthesis' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={20} color="var(--warning)" />
              <span style={{ fontWeight: 700, fontSize: '.95rem' }}>AI Tong hop nhieu Van ban</span>
            </div>
            {selectedIds.length >= 2 && (
              <button className="btn btn-primary btn-sm" onClick={handleSynthesize} disabled={synthLoading}>
                {synthLoading ? 'Dang tong hop...' : `Tong hop ${selectedIds.length} VB`}
              </button>
            )}
          </div>
          <p style={{ fontSize: '.8rem', color: 'var(--tx-3)', marginBottom: 12 }}>Tick chon it nhat 2 van ban (co OCR) de AI tong hop thanh 1 bao cao</p>
          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
            {docs.filter(d => d.ocrContent).map(d => (
              <label key={d._id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: selectedIds.includes(d._id) ? '#EFF6FF' : 'transparent'
              }}>
                <input type="checkbox" checked={selectedIds.includes(d._id)} onChange={() => toggleDocSelect(d._id)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{d.documentNumber || 'Khong so'} — {d.issuingAgency || ''}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--tx-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.summary || 'Khong co trich yeu'}</div>
                </div>
                <span className={`badge ${d.type === 'INCOMING' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '.7rem' }}>{d.type === 'INCOMING' ? 'Den' : 'Di'}</span>
              </label>
            ))}
          </div>
          {synthResult && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <FileDown size={16} color="var(--success)" />
                <span style={{ fontWeight: 600, fontSize: '.9rem' }}>File tong hop da tao:</span>
              </div>
              <a href={`http://localhost:5000/${synthResult.generatedFile.filePath}`} target="_blank" rel="noreferrer"
                className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FileDown size={14} /> {synthResult.generatedFile.fileName}
              </a>
            </div>
          )}
        </div>
      )}

      {/* === TAB 5: THANH TRA XUYÊN TUYẾN === */}
      {activeTab === 'cross' && (
        <div className="card animate-up" style={{ padding: 30 }}>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={24} color="var(--primary)" /> AI Tổng hợp Báo cáo Toàn Tỉnh
          </h3>
          <p style={{ color: 'var(--tx-2)', marginBottom: 24 }}>Tính năng này dành cho cấp Tỉnh. AI sẽ quét toàn bộ dữ liệu 50 văn bản gần nhất của tất cả các Xã/Phường trực thuộc, phân tích tổng thể và đưa ra cái nhìn bao quát về tình hình xử lý công việc chung.</p>
          
          <button className="btn btn-primary" onClick={handleCrossAgencySynth} disabled={crossLoading}>
            {crossLoading ? '🤖 Đang tổng hợp dữ liệu từ các Xã...' : '🤖 Bắt đầu Tổng hợp Xuyên tuyến'}
          </button>

          {crossResult && (
            <div style={{ marginTop: 24, padding: 24, background: '#F8FAFC', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div className="markdown-body">
                <MarkdownRender text={crossResult} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* === TAB: KPI CAN BO === */}
      {activeTab === 'kpi' && isAdmin && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={20} color="var(--success)" />
                <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Bang KPI Can bo</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={fetchKPI}><RefreshCw size={14} /> Lam moi</button>
                <button className="btn btn-primary btn-sm" onClick={handleEvalKPI} disabled={evalLoading}>
                  {evalLoading ? 'Dang...' : 'AI Danh gia'}
                </button>
              </div>
            </div>

            {kpiLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--tx-4)' }}>Dang tai...</div>
            ) : kpiData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--tx-4)' }}>
                <Users size={40} style={{ opacity: .3, marginBottom: 10 }} />
                <p>Chua co du lieu KPI</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Can bo</th>
                      <th style={{ padding: '8px 12px' }}>Role</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>VB Giao</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>VB Xong</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>VB Qua han</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>CV Tong</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>CV Xong</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Ty le</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Xep loai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiData.map((k, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{k.user.username}</td>
                        <td style={{ padding: '10px 12px' }}><span className="badge">{k.user.role}</span></td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{k.docs.assigned}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--success)' }}>{k.docs.completed}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: k.docs.overdue > 0 ? 'var(--danger)' : 'inherit' }}>{k.docs.overdue}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{k.tasks.total}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--success)' }}>{k.tasks.done}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ background: 'var(--bg-3)', borderRadius: 20, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${k.completionRate}%`, height: '100%', background: k.completionRate >= 75 ? 'var(--success)' : k.completionRate >= 50 ? 'var(--warning)' : 'var(--danger)', transition: 'width .5s' }} />
                          </div>
                          <span style={{ fontSize: '.75rem' }}>{k.completionRate}%</span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '.8rem', color: RATING_COLOR[k.rating] || 'var(--tx-3)' }}>{k.rating}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI Danh gia */}
          {kpiEval && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Bot size={18} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '.95rem' }}>AI Nhan xet & Danh gia</span>
              </div>
              <div style={{ background: '#FAFBFF', borderRadius: 'var(--r-md)', padding: '16px 20px', border: '1px solid var(--border)' }}>
                <MarkdownRender text={kpiEval} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiCommandCenter;
