import React, { useState, useRef } from 'react';
import {
  FileText, Sparkles, Printer, RefreshCw,
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Loader2, Eye, Edit3, BarChart3, Users, Target, Building2,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-toastify';

/* ── helpers ──────────────────────────────────────── */
const pct = (a, b) => (!b ? 0 : Math.round((a / b) * 100));

const LOAI_BC = ['Báo cáo tháng','Báo cáo quý','Báo cáo 6 tháng','Báo cáo năm','Báo cáo đột xuất'];

const mkDefault = () => ({
  donViBaoCao: 'TỈNH ĐOÀN ĐẮK LẮK',
  soHieu: '',
  diaDiem: 'Buôn Ma Thuột',
  ngayBaoCao: new Date().toLocaleDateString('vi-VN'),
  kyBaoCao: `Tháng ${new Date().getMonth()+1}/${new Date().getFullYear()}`,
  loaiBaoCao: 'Báo cáo tháng',
  tongSoXa: 102, soXaDatChiTieu: 0, soXaChuaDat: 0,
  soHoatDong: 0, soThanhVienThamGia: 0,
  soVanBanXuLy: 0, soNhiemVuHoanThanh: 0, soNhiemVuDangThuc: 0, soNhiemVuQuaHan: 0,
  soWebDaDangKy: 0, soWebDaHoatDong: 0, soWebCanHoTro: 0,
  soYeuCauHoTro: 0, soYeuCauDaXuLy: 0, soYeuCauDangXuLy: 0,
  nhungKetQuaDatDuoc: '', hanCheTonTai: '', nguyenNhan: '', deXuatGiaiPhap: '',
  chucDanhNguoiKy: 'BÍ THƯ TỈNH ĐOÀN', tenNguoiKy: '',
});

/* ── fallback nếu AI không phản hồi ──────────────── */
function buildFallback(f, tyLe, tyLeHT) {
  return {
    phan1: `   Thực hiện chương trình công tác ${f.kyBaoCao} và Kế hoạch của Ban Thường vụ ${f.donViBaoCao}, toàn tỉnh đã tập trung chỉ đạo, triển khai đồng bộ các nhiệm vụ chuyển đổi số. Với tinh thần chủ động, sáng tạo, các cấp bộ đoàn đã phối hợp chặt chẽ với chính quyền địa phương tổ chức thực hiện có hiệu quả các chỉ tiêu đề ra.\n\n   Trong kỳ báo cáo, toàn tỉnh đã triển khai Chiến dịch 44 ngày đêm tại ${f.tongSoXa} xã/phường/thị trấn. Kết quả có ${f.soXaDatChiTieu} đơn vị đạt và vượt chỉ tiêu (tỷ lệ ${tyLe}%). Tổng số ${f.soThanhVienThamGia.toLocaleString('vi')} lượt cán bộ, đoàn viên tham gia trực tiếp các hoạt động chiến dịch.\n\n   Hệ thống Văn phòng điện tử eOffice vận hành hiệu quả với ${f.soVanBanXuLy.toLocaleString('vi')} văn bản được xử lý trong kỳ, góp phần hiện đại hóa công tác hành chính, nâng cao hiệu quả quản lý điều hành của các cấp bộ đoàn trên toàn tỉnh.`,
    phan2: `   1. Về Chiến dịch 44 ngày đêm: ${f.donViBaoCao} tổ chức ${f.soHoatDong} hoạt động, thu hút ${f.soThanhVienThamGia.toLocaleString('vi')} lượt đoàn viên thanh niên tham gia. Tỷ lệ hoàn thành đạt ${tyLe}%; còn ${f.soXaChuaDat} đơn vị chưa hoàn thành đang được tập trung đôn đốc, hỗ trợ kịp thời.\n\n   2. Về ứng dụng eOffice: Hệ thống xử lý ${f.soVanBanXuLy.toLocaleString('vi')} văn bản trong kỳ. Nhiệm vụ hoàn thành đúng tiến độ: ${f.soNhiemVuHoanThanh}, đang thực hiện: ${f.soNhiemVuDangThuc}, quá hạn cần xử lý: ${f.soNhiemVuQuaHan}. Tỷ lệ hoàn thành đúng hạn đạt ${pct(f.soNhiemVuHoanThanh, f.soNhiemVuHoanThanh+f.soNhiemVuDangThuc+f.soNhiemVuQuaHan)}%.\n\n   3. Về triển khai SmartWeb: Có ${f.soWebDaDangKy} hộ kinh doanh đăng ký, trong đó ${f.soWebDaHoatDong} website đã kích hoạt và hoạt động ổn định (đạt ${pct(f.soWebDaHoatDong,f.soWebDaDangKy)}%); ${f.soWebCanHoTro} trường hợp cần hỗ trợ kỹ thuật để hoàn thiện.\n\n   4. Về giải quyết yêu cầu hỗ trợ dân sinh: Tiếp nhận ${f.soYeuCauHoTro} yêu cầu, đã giải quyết ${f.soYeuCauDaXuLy} (tỷ lệ ${tyLeHT}%); ${f.soYeuCauDangXuLy} yêu cầu đang trong quá trình xử lý. Không có yêu cầu nào tồn đọng kéo dài quá hạn quy định.`,
    phan3: `   1. Ưu điểm: ${f.donViBaoCao} đã phát huy vai trò nòng cốt trong công tác chuyển đổi số, bám sát chỉ đạo của Tỉnh ủy, UBND tỉnh và Trung ương Đoàn. Đội ngũ cán bộ đoàn các cấp ngày càng được nâng cao năng lực, chủ động triển khai công việc, ứng dụng hiệu quả các công nghệ số. Tỷ lệ hoàn thành chỉ tiêu đạt ${tyLe}% là kết quả đáng ghi nhận.\n\n   2. Hạn chế, tồn tại: Còn ${f.soXaChuaDat} xã/phường chưa đạt chỉ tiêu, tập trung tại địa bàn vùng sâu, vùng xa. Một số cán bộ cơ sở chưa thành thạo các công cụ số, dẫn đến tiến độ triển khai chưa đồng đều. Tỷ lệ nhiệm vụ quá hạn còn ở mức cần tiếp tục quan tâm, đôn đốc.\n\n   3. Nguyên nhân: Địa bàn tỉnh Đắk Lắk rộng, nhiều xã đặc thù vùng đồng bào dân tộc thiểu số; hạ tầng viễn thông tại một số địa phương còn hạn chế. Nguồn lực tài chính và nhân lực chuyên trách chưa đáp ứng đầy đủ so với yêu cầu nhiệm vụ ngày càng cao trong giai đoạn hiện nay.`,
    phan4: `   1. Đối với Ban Thường vụ Trung ương Đoàn: Đề nghị tiếp tục hỗ trợ tài liệu, phần mềm và kinh phí tập huấn để nâng cao năng lực chuyển đổi số cho cán bộ đoàn cơ sở; ưu tiên phân bổ nguồn lực cho các địa phương vùng sâu, vùng xa có điều kiện đặc thù khó khăn.\n\n   2. Đối với UBND tỉnh Đắk Lắk: Đề nghị tạo điều kiện để ${f.donViBaoCao} tham gia trực tiếp vào các chương trình chuyển đổi số cấp tỉnh; quan tâm hỗ trợ hạ tầng viễn thông tại các xã chưa có kết nối ổn định, đảm bảo điều kiện triển khai SmartWeb và eOffice đồng bộ.\n\n   3. Kế hoạch kỳ tới: Tập trung đẩy nhanh tiến độ tại ${f.soXaChuaDat} xã chưa đạt chỉ tiêu; đẩy mạnh hỗ trợ kỹ thuật cho ${f.soWebCanHoTro} hộ kinh doanh SmartWeb; tăng cường đôn đốc xử lý nhiệm vụ quá hạn; phấn đấu tỷ lệ giải quyết yêu cầu hỗ trợ đạt trên 95% trong kỳ báo cáo tiếp theo.`,
  };
}

/* ═══════════════════════════════════════════════════
   COMPONENT CHÍNH
═══════════════════════════════════════════════════ */
export default function TinhDoanReport() {
  const [form, setForm]       = useState(mkDefault);
  const [ai, setAi]           = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState('form');
  const [exp, setExp]         = useState({ cd44:true, eo:true, ht:true, nx:true });
  const printRef = useRef();

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const tog = k   => setExp(p=>({...p,[k]:!p[k]}));
  const tyLe   = pct(form.soXaDatChiTieu, form.tongSoXa);
  const tyLeHT = pct(form.soYeuCauDaXuLy, form.soYeuCauHoTro);

  /* ── AI ── */
  const generate = async () => {
    setLoading(true);
    try {
      const prompt = `Bạn là chuyên gia viết báo cáo hành chính nhà nước Việt Nam cho ${form.donViBaoCao}.
Viết báo cáo TIẾN TRÌNH CÔNG VIỆC theo thể thức hành chính, ngôn ngữ trang trọng, văn phong nhà nước.
Kỳ báo cáo: ${form.kyBaoCao} | Loại: ${form.loaiBaoCao}
SỐ LIỆU:
- Tổng xã: ${form.tongSoXa} | Đạt: ${form.soXaDatChiTieu} (${tyLe}%) | Chưa đạt: ${form.soXaChuaDat}
- Hoạt động: ${form.soHoatDong} | Thành viên: ${form.soThanhVienThamGia}
- Văn bản xử lý: ${form.soVanBanXuLy} | NV hoàn thành: ${form.soNhiemVuHoanThanh} | NV đang TH: ${form.soNhiemVuDangThuc} | NV quá hạn: ${form.soNhiemVuQuaHan}
- SmartWeb đăng ký: ${form.soWebDaDangKy} | Hoạt động: ${form.soWebDaHoatDong} | Cần hỗ trợ: ${form.soWebCanHoTro}
- YC hỗ trợ: ${form.soYeuCauHoTro} | Đã xử lý: ${form.soYeuCauDaXuLy} (${tyLeHT}%)
- Kết quả cán bộ nhập: ${form.nhungKetQuaDatDuoc||'chưa nhập'}
- Hạn chế: ${form.hanCheTonTai||'chưa nhập'}
- Nguyên nhân: ${form.nguyenNhan||'chưa nhập'}
- Đề xuất: ${form.deXuatGiaiPhap||'chưa nhập'}
Trả về JSON hợp lệ (KHÔNG có markdown) với 4 key: {"phan1":"...","phan2":"...","phan3":"...","phan4":"..."}
Mỗi phần 3-5 đoạn văn, thụt đầu dòng 3 dấu cách, trích dẫn số liệu cụ thể, văn phong hành chính chuẩn mực.`;

      const res = await api.post('/ai/chat', {
        message: prompt,
        systemPrompt: 'Chỉ trả về JSON hợp lệ, không có bất kỳ markdown wrapper nào.',
      });
      let raw = (res.data?.reply || res.data?.message || '').replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
      const parsed = JSON.parse(raw);
      setAi({ phan1:parsed.phan1, phan2:parsed.phan2, phan3:parsed.phan3, phan4:parsed.phan4 });
      setTab('preview');
      toast.success('✅ AI đã soạn xong báo cáo!');
    } catch(e) {
      setAi(buildFallback(form, tyLe, tyLeHT));
      setTab('preview');
      toast.info('📝 Đã tạo báo cáo mẫu (AI đang bận)');
    } finally { setLoading(false); }
  };

  /* ── Print ── */
  const handlePrint = () => {
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/>
<title>Báo cáo ${form.kyBaoCao} - ${form.donViBaoCao}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Times New Roman',Times,serif;font-size:13pt;color:#000;background:#fff}
.page{padding:20mm 25mm 20mm 30mm}
.hdr{display:flex;justify-content:space-between;text-align:center;margin-bottom:12px}
.hdr-col{width:48%}
.bold{font-weight:bold}.upper{text-transform:uppercase}
.line{border-bottom:1px solid #000;width:65%;margin:5px auto}
.right{text-align:right}.center{text-align:center}.italic{font-style:italic}
p{text-align:justify;line-height:1.85;text-indent:1.5em;margin-bottom:8px;font-size:13pt}
.sec{font-weight:bold;text-transform:uppercase;font-size:13pt;margin:18px 0 10px}
pre{white-space:pre-wrap;font-family:'Times New Roman',Times,serif;font-size:13pt;line-height:1.85;text-align:justify}
table{width:100%;border-collapse:collapse;font-size:12pt;margin:12px 0}
th,td{border:1px solid #444;padding:6px 10px;text-align:center}
th{background:#eef2f7;font-weight:bold}
.sig{display:flex;justify-content:flex-end;margin-top:40px}
.sig-inner{text-align:center;min-width:230px}
.noinhan{margin-top:28px;border-top:1px solid #ccc;padding-top:12px;font-size:11pt}
@media print{@page{size:A4;margin:0}body{-webkit-print-color-adjust:exact}}
</style></head><body><div class="page">${printRef.current.innerHTML}</div></body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),600);
  };

  /* ── Shared styles ── */
  const card  = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, backdropFilter:'blur(12px)' };
  const inp   = { width:'100%', padding:'10px 13px', borderRadius:9, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#E2E8F0', fontSize:'.88rem', outline:'none', fontFamily:'inherit' };
  const label = { display:'block', fontSize:'.7rem', fontWeight:600, color:'rgba(148,163,184,0.75)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.05em' };

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom:26}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:13,background:'linear-gradient(135deg,#4F6DFF,#38BDF8)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 6px 20px rgba(79,109,255,0.4)',flexShrink:0}}>
              <FileText size={22} color="#fff"/>
            </div>
            <div>
              <h2 style={{fontSize:'1.42rem',fontWeight:800,color:'#F1F5F9',margin:0}}>Báo cáo Tiến trình Công việc — Tỉnh đoàn</h2>
              <p style={{color:'rgba(148,163,184,0.7)',fontSize:'.83rem',margin:0}}>Nhập số liệu · AI soạn thảo tự động · Preview công văn chuẩn · In A4</p>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setTab(t=>t==='form'?'preview':'form')}
              style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:10,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.06)',color:'#94A3B8',fontWeight:600,fontSize:'.84rem',cursor:'pointer'}}>
              {tab==='form'?<Eye size={15}/>:<Edit3 size={15}/>}
              {tab==='form'?'Xem Preview':'Về Form nhập'}
            </button>
            {ai&&<button onClick={handlePrint}
              style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#10B981,#34D399)',color:'#fff',fontWeight:700,fontSize:'.84rem',cursor:'pointer',boxShadow:'0 4px 14px rgba(16,185,129,0.4)'}}>
              <Printer size={15}/> In báo cáo
            </button>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:2,marginBottom:22,background:'rgba(255,255,255,0.04)',borderRadius:11,padding:4,border:'1px solid rgba(255,255,255,0.07)',width:'fit-content'}}>
        {[{k:'form',l:'📝 Nhập liệu'},{k:'preview',l:'📄 Preview & In'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            style={{padding:'8px 22px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:'.84rem',transition:'all .2s',
              background:tab===t.k?'linear-gradient(135deg,#4F6DFF,#38BDF8)':'transparent',
              color:tab===t.k?'#fff':'rgba(148,163,184,0.8)',
              boxShadow:tab===t.k?'0 4px 14px rgba(79,109,255,0.4)':'none'}}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ═══ FORM TAB ═══ */}
      {tab==='form'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:18,alignItems:'start'}}>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>

            {/* Thông tin báo cáo */}
            <div style={card}>
              <SHead icon={<Building2 size={15}/>} title="Thông tin báo cáo"/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13}}>
                <FField label="Đơn vị báo cáo" value={form.donViBaoCao} onChange={v=>set('donViBaoCao',v)} s={inp}/>
                <FField label="Loại báo cáo" value={form.loaiBaoCao} onChange={v=>set('loaiBaoCao',v)} type="select" opts={LOAI_BC} s={inp}/>
                <FField label="Kỳ báo cáo" value={form.kyBaoCao} onChange={v=>set('kyBaoCao',v)} s={inp}/>
                <FField label="Địa điểm" value={form.diaDiem} onChange={v=>set('diaDiem',v)} s={inp}/>
                <FField label="Ngày báo cáo" value={form.ngayBaoCao} onChange={v=>set('ngayBaoCao',v)} s={inp}/>
                <FField label="Số hiệu văn bản" value={form.soHieu} onChange={v=>set('soHieu',v)} ph="VD: 123/BC-TĐ" s={inp}/>
              </div>
            </div>

            {/* Chiến dịch 44 ngày */}
            <Acc icon={<Target size={15}/>} title="Chiến dịch 44 ngày — Số liệu tổng hợp" open={exp.cd44} onToggle={()=>tog('cd44')}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:13}}>
                <NBox label="Tổng Xã/Phường" val={form.tongSoXa}         onChange={v=>set('tongSoXa',v)}         color="#4F6DFF"/>
                <NBox label="Số xã đạt chỉ tiêu" val={form.soXaDatChiTieu} onChange={v=>set('soXaDatChiTieu',v)} color="#10B981"/>
                <NBox label="Số xã chưa đạt" val={form.soXaChuaDat}       onChange={v=>set('soXaChuaDat',v)}     color="#F59E0B"/>
                <NBox label="Số hoạt động"   val={form.soHoatDong}         onChange={v=>set('soHoatDong',v)}      color="#8B5CF6"/>
                <NBox label="Thành viên tham gia" val={form.soThanhVienThamGia} onChange={v=>set('soThanhVienThamGia',v)} color="#06B6D4"/>
                <div style={{background:'rgba(79,109,255,0.1)',border:'1px solid rgba(79,109,255,0.2)',borderRadius:10,padding:'13px',display:'flex',flexDirection:'column',gap:6}}>
                  <span style={{fontSize:'.67rem',color:'rgba(148,163,184,0.6)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em'}}>Tỷ lệ hoàn thành</span>
                  <span style={{fontSize:'1.9rem',fontWeight:800,color:tyLe>=70?'#34D399':tyLe>=50?'#FBBF24':'#FB7185'}}>{tyLe}%</span>
                  <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${tyLe}%`,background:tyLe>=70?'#10B981':'#F59E0B',borderRadius:4,transition:'width .4s'}}/>
                  </div>
                </div>
              </div>
            </Acc>

            {/* eOffice */}
            <Acc icon={<BarChart3 size={15}/>} title="eOffice — Văn bản, Công việc & SmartWeb" open={exp.eo} onToggle={()=>tog('eo')}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:13}}>
                <NBox label="Văn bản xử lý"      val={form.soVanBanXuLy}       onChange={v=>set('soVanBanXuLy',v)}       color="#4F6DFF"/>
                <NBox label="NV hoàn thành"       val={form.soNhiemVuHoanThanh} onChange={v=>set('soNhiemVuHoanThanh',v)} color="#10B981"/>
                <NBox label="NV đang thực hiện"   val={form.soNhiemVuDangThuc}  onChange={v=>set('soNhiemVuDangThuc',v)}  color="#F59E0B"/>
                <NBox label="NV quá hạn"          val={form.soNhiemVuQuaHan}    onChange={v=>set('soNhiemVuQuaHan',v)}    color="#F43F5E"/>
                <NBox label="SmartWeb đăng ký"    val={form.soWebDaDangKy}      onChange={v=>set('soWebDaDangKy',v)}      color="#8B5CF6"/>
                <NBox label="SmartWeb hoạt động"  val={form.soWebDaHoatDong}    onChange={v=>set('soWebDaHoatDong',v)}    color="#06B6D4"/>
              </div>
            </Acc>

            {/* Hỗ trợ */}
            <Acc icon={<Users size={15}/>} title="Hỗ trợ dân sinh — Yêu cầu tiếp nhận & xử lý" open={exp.ht} onToggle={()=>tog('ht')}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:13}}>
                <NBox label="Tổng YC hỗ trợ" val={form.soYeuCauHoTro}    onChange={v=>set('soYeuCauHoTro',v)}    color="#4F6DFF"/>
                <NBox label="Đã xử lý"        val={form.soYeuCauDaXuLy}  onChange={v=>set('soYeuCauDaXuLy',v)}  color="#10B981"/>
                <NBox label="Đang xử lý"      val={form.soYeuCauDangXuLy} onChange={v=>set('soYeuCauDangXuLy',v)} color="#F59E0B"/>
              </div>
              <div style={{marginTop:10,display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:'.78rem',color:'rgba(148,163,184,0.65)'}}>Tỷ lệ giải quyết:</span>
                <span style={{fontWeight:700,color:tyLeHT>=80?'#34D399':'#FBBF24',fontSize:'1.05rem'}}>{tyLeHT}%</span>
                <div style={{flex:1,height:6,background:'rgba(255,255,255,0.06)',borderRadius:4}}>
                  <div style={{height:'100%',width:`${tyLeHT}%`,background:'linear-gradient(90deg,#4F6DFF,#10B981)',borderRadius:4,transition:'width .4s'}}/>
                </div>
              </div>
            </Acc>

            {/* Nhận xét */}
            <Acc icon={<Edit3 size={15}/>} title="Nhận xét, đánh giá & Kiến nghị (cán bộ nhập)" open={exp.nx} onToggle={()=>tog('nx')}>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <FField label="Những kết quả đạt được" value={form.nhungKetQuaDatDuoc} onChange={v=>set('nhungKetQuaDatDuoc',v)} type="ta" ph="VD: Hoàn thành 85% chỉ tiêu SmartWeb..." s={{...inp,resize:'vertical',minHeight:80}}/>
                <FField label="Hạn chế, tồn tại"       value={form.hanCheTonTai}       onChange={v=>set('hanCheTonTai',v)}       type="ta" ph="VD: Một số xã vùng sâu còn khó khăn..." s={{...inp,resize:'vertical',minHeight:70}}/>
                <FField label="Nguyên nhân"             value={form.nguyenNhan}         onChange={v=>set('nguyenNhan',v)}         type="ta" ph="VD: Địa bàn rộng, trình độ chưa đồng đều..." s={{...inp,resize:'vertical',minHeight:70}}/>
                <FField label="Đề xuất & Giải pháp"    value={form.deXuatGiaiPhap}     onChange={v=>set('deXuatGiaiPhap',v)}     type="ta" ph="VD: Tăng cường tập huấn, hỗ trợ kỹ thuật..." s={{...inp,resize:'vertical',minHeight:70}}/>
              </div>
            </Acc>

            {/* Người ký */}
            <div style={card}>
              <SHead icon={<CheckCircle2 size={15}/>} title="Thông tin người ký"/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13}}>
                <FField label="Chức danh" value={form.chucDanhNguoiKy} onChange={v=>set('chucDanhNguoiKy',v)} s={inp}/>
                <FField label="Họ và tên" value={form.tenNguoiKy}      onChange={v=>set('tenNguoiKy',v)} ph="VD: Nguyễn Văn A" s={inp}/>
              </div>
            </div>
          </div>

          {/* AI Panel */}
          <div style={{position:'sticky',top:80}}>
            <div style={{background:'linear-gradient(135deg,rgba(79,109,255,0.13),rgba(56,189,248,0.06))',border:'1px solid rgba(79,109,255,0.22)',borderRadius:16,padding:22}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
                <div style={{width:38,height:38,borderRadius:11,background:'linear-gradient(135deg,#4F6DFF,#38BDF8)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(79,109,255,0.5)',flexShrink:0}}>
                  <Sparkles size={18} color="#fff"/>
                </div>
                <div>
                  <div style={{fontWeight:700,color:'#F1F5F9',fontSize:'.93rem'}}>AI Soạn thảo Báo cáo</div>
                  <div style={{fontSize:'.7rem',color:'rgba(148,163,184,0.65)'}}>Tự động viết 4 phần từ số liệu</div>
                </div>
              </div>

              {/* checklist */}
              <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:18}}>
                {[
                  {l:'Đơn vị báo cáo',  ok:!!form.donViBaoCao},
                  {l:'Kỳ báo cáo',      ok:!!form.kyBaoCao},
                  {l:'Số liệu chiến dịch', ok:form.soXaDatChiTieu>0},
                  {l:'Số liệu eOffice', ok:form.soVanBanXuLy>0||form.soNhiemVuHoanThanh>0},
                  {l:'Nhận xét cán bộ', ok:!!form.nhungKetQuaDatDuoc},
                  {l:'Người ký',         ok:!!form.tenNguoiKy},
                ].map(it=>(
                  <div key={it.l} style={{display:'flex',alignItems:'center',gap:8,fontSize:'.81rem'}}>
                    {it.ok?<CheckCircle2 size={13} color="#34D399"/>:<AlertCircle size={13} color="rgba(148,163,184,0.35)"/>}
                    <span style={{color:it.ok?'#CBD5E1':'rgba(148,163,184,0.45)'}}>{it.l}</span>
                  </div>
                ))}
              </div>

              {/* quick stats */}
              <div style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:13,marginBottom:16,border:'1px solid rgba(255,255,255,0.06)'}}>
                <div style={{fontSize:'.67rem',color:'rgba(148,163,184,0.55)',fontWeight:600,marginBottom:9,textTransform:'uppercase',letterSpacing:'.06em'}}>Tóm tắt nhanh</div>
                {[
                  {l:'Tỷ lệ CĐ44',           v:`${tyLe}%`,   c:tyLe>=70?'#34D399':'#FBBF24'},
                  {l:'Xử lý hỗ trợ',          v:`${tyLeHT}%`, c:tyLeHT>=80?'#34D399':'#FBBF24'},
                  {l:'Thành viên tham gia',    v:form.soThanhVienThamGia.toLocaleString('vi'), c:'#93C5FD'},
                  {l:'Văn bản eOffice',        v:form.soVanBanXuLy.toLocaleString('vi'),       c:'#A78BFA'},
                ].map(s=>(
                  <div key={s.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{fontSize:'.78rem',color:'rgba(148,163,184,0.65)'}}>{s.l}</span>
                    <span style={{fontWeight:700,fontSize:'.86rem',color:s.c}}>{s.v}</span>
                  </div>
                ))}
              </div>

              <button onClick={generate} disabled={loading}
                style={{width:'100%',padding:'13px',borderRadius:12,border:'none',cursor:loading?'not-allowed':'pointer',fontWeight:700,fontSize:'.88rem',display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                  background:loading?'rgba(79,109,255,0.3)':'linear-gradient(135deg,#4F6DFF,#38BDF8)',
                  color:'#fff',boxShadow:loading?'none':'0 6px 24px rgba(79,109,255,0.45)'}}>
                {loading?<><Loader2 size={15} style={{animation:'spin .9s linear infinite'}}/>AI đang soạn thảo...</>
                  :<><Sparkles size={15}/>Tạo báo cáo với AI</>}
              </button>
              {ai&&<button onClick={()=>setAi(null)} style={{width:'100%',marginTop:8,padding:'8px',borderRadius:9,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'rgba(148,163,184,0.5)',fontSize:'.78rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                <RefreshCw size={12}/> Làm mới nội dung
              </button>}
              <p style={{fontSize:'.67rem',color:'rgba(148,163,184,0.38)',textAlign:'center',marginTop:12,lineHeight:1.6}}>AI viết theo văn phong hành chính nhà nước dựa trên số liệu bạn nhập</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PREVIEW TAB ═══ */}
      {tab==='preview'&&(
        <div>
          {!ai?(
            <div style={{textAlign:'center',padding:'80px 24px',color:'rgba(148,163,184,0.5)'}}>
              <Sparkles size={48} style={{opacity:.22,margin:'0 auto 16px',display:'block'}}/>
              <p style={{fontSize:'1.05rem',fontWeight:600,color:'rgba(226,232,240,0.5)',marginBottom:10}}>Chưa có nội dung báo cáo</p>
              <p style={{fontSize:'.85rem',marginBottom:22}}>Nhập số liệu rồi nhấn <strong style={{color:'#93C5FD'}}>Tạo báo cáo với AI</strong></p>
              <button onClick={()=>setTab('form')} style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#4F6DFF,#38BDF8)',color:'#fff',fontWeight:700,cursor:'pointer'}}>
                ← Về Form nhập liệu
              </button>
            </div>
          ):(
            <>
              {/* Toolbar */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,padding:'12px 18px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,flexWrap:'wrap',gap:10}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <CheckCircle2 size={15} color="#34D399"/>
                  <span style={{color:'#CBD5E1',fontWeight:600,fontSize:'.86rem'}}>AI đã soạn xong — {form.kyBaoCao}</span>
                </div>
                <div style={{display:'flex',gap:9}}>
                  <button onClick={generate} disabled={loading}
                    style={{display:'flex',alignItems:'center',gap:6,padding:'8px 15px',borderRadius:9,border:'1px solid rgba(79,109,255,0.3)',background:'rgba(79,109,255,0.1)',color:'#93C5FD',fontWeight:600,fontSize:'.81rem',cursor:'pointer'}}>
                    {loading?<Loader2 size={13} style={{animation:'spin .9s linear infinite'}}/>:<Sparkles size={13}/>} Tạo lại
                  </button>
                  <button onClick={handlePrint}
                    style={{display:'flex',alignItems:'center',gap:6,padding:'8px 15px',borderRadius:9,border:'none',background:'linear-gradient(135deg,#10B981,#34D399)',color:'#fff',fontWeight:700,fontSize:'.81rem',cursor:'pointer',boxShadow:'0 4px 14px rgba(16,185,129,0.35)'}}>
                    <Printer size={13}/> In A4
                  </button>
                </div>
              </div>

              {/* A4 Preview */}
              <div style={{background:'#fff',borderRadius:14,boxShadow:'0 20px 60px rgba(0,0,0,0.45)',overflow:'hidden'}}>
                <div ref={printRef} style={{fontFamily:"'Times New Roman',Times,serif",color:'#000',padding:'22mm 26mm 22mm 30mm',lineHeight:1.85,fontSize:'13pt',background:'#fff'}}>

                  {/* Header */}
                  <div style={{display:'flex',justifyContent:'space-between',textAlign:'center',marginBottom:14}}>
                    <div style={{width:'48%'}}>
                      <div style={{fontWeight:'bold',textTransform:'uppercase',fontSize:'11.5pt',lineHeight:1.55}}>BAN THƯỜNG VỤ TRUNG ƯƠNG ĐOÀN</div>
                      <div style={{fontWeight:'bold',textTransform:'uppercase',fontSize:'11.5pt'}}>{form.donViBaoCao}</div>
                      <div style={{borderBottom:'1px solid #000',width:'68%',margin:'5px auto 6px'}}/>
                      {form.soHieu&&<div style={{fontSize:'12pt'}}>Số: {form.soHieu}/BC-TĐ</div>}
                    </div>
                    <div style={{width:'48%'}}>
                      <div style={{fontWeight:'bold',textTransform:'uppercase',fontSize:'12pt'}}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                      <div style={{fontWeight:'bold',fontSize:'13pt'}}>Độc lập - Tự do - Hạnh phúc</div>
                      <div style={{borderBottom:'1px solid #000',width:'62%',margin:'5px auto'}}/>
                    </div>
                  </div>

                  <div style={{textAlign:'right',fontStyle:'italic',marginBottom:16,fontSize:'12pt'}}>{form.diaDiem}, ngày {form.ngayBaoCao}</div>

                  <div style={{textAlign:'center',marginBottom:20}}>
                    <div style={{fontWeight:'bold',textTransform:'uppercase',fontSize:'14pt',letterSpacing:'.05em'}}>BÁO CÁO</div>
                    <div style={{fontWeight:'bold',fontSize:'13pt',marginTop:6,lineHeight:1.55}}>
                      Kết quả thực hiện nhiệm vụ {form.kyBaoCao.toLowerCase()} về công tác chỉ đạo, điều hành<br/>
                      và triển khai các chương trình chuyển đổi số trên địa bàn tỉnh Đắk Lắk
                    </div>
                    <div style={{fontStyle:'italic',fontSize:'12pt',marginTop:4}}>({form.loaiBaoCao} — {form.kyBaoCao})</div>
                  </div>

                  <p><strong>Kính gửi:</strong> Ban Thường vụ Trung ương Đoàn TNCS Hồ Chí Minh; Ủy ban nhân dân tỉnh Đắk Lắk.</p>
                  <p style={{textIndent:'1.5em'}}>Thực hiện chương trình công tác {form.kyBaoCao.toLowerCase()} và chỉ đạo của Ban Thường vụ Tỉnh ủy về công tác Đoàn và phong trào thanh niên, {form.donViBaoCao} báo cáo kết quả thực hiện nhiệm vụ như sau:</p>

                  <div style={{fontWeight:'bold',textTransform:'uppercase',fontSize:'13pt',marginTop:20,marginBottom:10}}>I. KẾT QUẢ THỰC HIỆN</div>
                  <pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',fontSize:'13pt',lineHeight:1.85,textAlign:'justify'}}>{ai.phan1}</pre>

                  {/* Bảng số liệu */}
                  <div style={{fontWeight:'bold',fontSize:'12pt',margin:'16px 0 8px'}}>Bảng tổng hợp số liệu thực hiện {form.kyBaoCao}:</div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12pt',marginBottom:16}}>
                    <thead>
                      <tr style={{background:'#eef2f7'}}>
                        {['STT','Chỉ tiêu','ĐVT','Kế hoạch','Thực hiện','Tỷ lệ (%)'].map(h=>(
                          <th key={h} style={{border:'1px solid #555',padding:'7px 10px',fontWeight:'bold',textAlign:'center'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['1','Xã/phường triển khai chiến dịch','Đơn vị',form.tongSoXa,form.tongSoXa,'100'],
                        ['2','Xã/phường đạt chỉ tiêu','Đơn vị',form.tongSoXa,form.soXaDatChiTieu,`${tyLe}`],
                        ['3','Hoạt động tập thể tổ chức','Hoạt động','—',form.soHoatDong,'—'],
                        ['4','Thành viên tham gia','Người','—',form.soThanhVienThamGia,'—'],
                        ['5','Văn bản eOffice xử lý','Văn bản','—',form.soVanBanXuLy,'—'],
                        ['6','Nhiệm vụ hoàn thành đúng hạn','Nhiệm vụ','—',form.soNhiemVuHoanThanh,'—'],
                        ['7','SmartWeb đang hoạt động','Website',form.soWebDaDangKy,form.soWebDaHoatDong,`${pct(form.soWebDaHoatDong,form.soWebDaDangKy)}`],
                        ['8','Yêu cầu hỗ trợ đã giải quyết','Yêu cầu',form.soYeuCauHoTro,form.soYeuCauDaXuLy,`${tyLeHT}`],
                      ].map(row=>(
                        <tr key={row[0]}>
                          {row.map((cell,ci)=>(
                            <td key={ci} style={{border:'1px solid #555',padding:'6px 10px',textAlign:ci===1?'left':'center'}}>{cell||'—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{fontWeight:'bold',textTransform:'uppercase',fontSize:'13pt',marginTop:20,marginBottom:10}}>II. KẾT QUẢ CHI TIẾT THEO TỪNG LĨNH VỰC</div>
                  <pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',fontSize:'13pt',lineHeight:1.85,textAlign:'justify'}}>{ai.phan2}</pre>

                  <div style={{fontWeight:'bold',textTransform:'uppercase',fontSize:'13pt',marginTop:20,marginBottom:10}}>III. NHẬN XÉT, ĐÁNH GIÁ</div>
                  <pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',fontSize:'13pt',lineHeight:1.85,textAlign:'justify'}}>{ai.phan3}</pre>

                  <div style={{fontWeight:'bold',textTransform:'uppercase',fontSize:'13pt',marginTop:20,marginBottom:10}}>IV. KIẾN NGHỊ VÀ ĐỀ XUẤT GIẢI PHÁP</div>
                  <pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',fontSize:'13pt',lineHeight:1.85,textAlign:'justify'}}>{ai.phan4}</pre>

                  <p style={{textIndent:'1.5em',marginTop:16}}>Trên đây là báo cáo kết quả thực hiện nhiệm vụ {form.kyBaoCao.toLowerCase()} của {form.donViBaoCao}. Kính báo cáo để Ban Thường vụ Trung ương Đoàn và Ủy ban nhân dân tỉnh Đắk Lắk biết, chỉ đạo./.​</p>

                  <div style={{display:'flex',justifyContent:'flex-end',marginTop:40}}>
                    <div style={{textAlign:'center',minWidth:230}}>
                      <div style={{fontWeight:'bold',textTransform:'uppercase',fontSize:'12pt'}}>TM. BAN THƯỜNG VỤ</div>
                      <div style={{fontWeight:'bold',textTransform:'uppercase',fontSize:'12pt'}}>{form.chucDanhNguoiKy}</div>
                      <div style={{fontStyle:'italic',fontSize:'11.5pt',margin:'4px 0 56px'}}>(Ký, đóng dấu)</div>
                      <div style={{fontWeight:'bold',fontSize:'13pt'}}>{form.tenNguoiKy||'(Họ và tên)'}</div>
                    </div>
                  </div>

                  <div style={{marginTop:30,borderTop:'1px solid #ccc',paddingTop:12,fontSize:'11pt'}}>
                    <div style={{fontWeight:'bold',marginBottom:4}}>Nơi nhận:</div>
                    <div>- Như trên;</div>
                    <div>- Ban Thường vụ Tỉnh ủy Đắk Lắk (để b/c);</div>
                    <div>- Sở Thông tin và Truyền thông tỉnh (để p/h);</div>
                    <div>- Các Huyện, Thị, Thành Đoàn trực thuộc (để t/h);</div>
                    <div>- Lưu: VT, VP Tỉnh đoàn.</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────── */
function SHead({icon,title}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
      <span style={{color:'#93C5FD'}}>{icon}</span>
      <span style={{fontWeight:700,color:'#E2E8F0',fontSize:'.88rem'}}>{title}</span>
    </div>
  );
}

function Acc({icon,title,open,onToggle,children}) {
  return (
    <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,overflow:'hidden',backdropFilter:'blur(12px)'}}>
      <button onClick={onToggle} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'15px 20px',border:'none',background:'transparent',cursor:'pointer',borderBottom:open?'1px solid rgba(255,255,255,0.06)':'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:'#93C5FD'}}>{icon}</span>
          <span style={{fontWeight:700,color:'#E2E8F0',fontSize:'.88rem'}}>{title}</span>
        </div>
        {open?<ChevronUp size={15} color="#94A3B8"/>:<ChevronDown size={15} color="#94A3B8"/>}
      </button>
      {open&&<div style={{padding:18}}>{children}</div>}
    </div>
  );
}

function FField({label,value,onChange,type='text',opts=[],ph='',s}) {
  return (
    <div>
      <label style={{display:'block',fontSize:'.7rem',fontWeight:600,color:'rgba(148,163,184,0.75)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em'}}>{label}</label>
      {type==='ta'?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} style={s}/>
        :type==='select'?<select value={value} onChange={e=>onChange(e.target.value)} style={s}>
          {opts.map(o=><option key={o} value={o} style={{background:'#1a2540'}}>{o}</option>)}
        </select>
        :<input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} style={s}/>}
    </div>
  );
}

function NBox({label,val,onChange,color}) {
  return (
    <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${color}22`,borderRadius:10,padding:'13px 13px 9px'}}>
      <label style={{display:'block',fontSize:'.67rem',fontWeight:600,color:'rgba(148,163,184,0.6)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.05em',lineHeight:1.4}}>{label}</label>
      <input type="number" min={0} value={val} onChange={e=>onChange(Number(e.target.value))}
        style={{width:'100%',background:'transparent',border:'none',outline:'none',fontSize:'1.55rem',fontWeight:800,color,fontFamily:"'Lexend Deca',sans-serif",padding:0}}/>
    </div>
  );
}
