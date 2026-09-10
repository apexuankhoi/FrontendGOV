import React, { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign
} from "docx";
import { Building2, Download, Search, TrendingUp, Calendar } from "lucide-react";

const FIELDS = [
  { key: "digitalSkills",   label: "1. Kỹ năng số cộng đồng",      unit: "lượt",       target: 980 },
  { key: "vneidSupport",    label: "2. Kích hoạt VNeID mức 2",      unit: "lượt",       target: 490 },
  { key: "publicServices",  label: "3. Dịch vụ công trực tuyến",    unit: "hồ sơ",     target: 294 },
  { key: "qrSupport",       label: "4. Hộ KD dùng QR thanh toán",  unit: "hộ",         target: 98  },
  { key: "activeTeams",     label: "5. Đội hình Thanh niên số",     unit: "đội",        target: 1   },
  { key: "trainingClasses", label: "6. Lớp/Điểm tập huấn KNS",     unit: "lớp",        target: 5   },
  { key: "digitalModels",   label: "7. Mô hình điểm CĐS",           unit: "mô hình",    target: 1   },
  { key: "digitalProducts", label: "8. SP OCOP số hóa",             unit: "sản phẩm",  target: 10  },
  { key: "youthTrained",    label: "9. Đoàn viên tập huấn AI",      unit: "đoàn viên",  target: 196 },
  { key: "youthProjects",   label: "10. Công trình thanh niên CĐS", unit: "công trình", target: 1   },
  { key: "smartwebCount",   label: "11. Website SmartWeb",           unit: "website",    target: 1   },
];

export default function AgencyReport() {
  const [agencies, setAgencies]     = useState([]);
  const [search, setSearch]         = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [loadingA, setLoadingA]     = useState(true);

  useEffect(() => {
    api.get("/agencies?level=commune&limit=200")
      .then(r => setAgencies(r.data?.agencies || r.data || []))
      .catch(() => toast.error("Không tải được danh sách đơn vị"))
      .finally(() => setLoadingA(false));
  }, []);

  const filtered = agencies.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.district?.toLowerCase().includes(search.toLowerCase())
  );

  const fetchHistory = useCallback(async (id) => {
    if (!id) return;
    setLoading(true); setData(null);
    try {
      const r = await api.get(`/campaign/agency-history/${id}`);
      setData(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi tải dữ liệu đơn vị");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (id) => { setSelectedId(id); fetchHistory(id); };

  const exportWord = async () => {
    if (!data) return;
    toast.info("Đang tạo báo cáo Word...");
    try {
      const now = new Date();
      const printDate = `ngày ${String(now.getDate()).padStart(2,"0")} tháng ${String(now.getMonth()+1).padStart(2,"0")} năm ${now.getFullYear()}`;
      const { agency, cumulative, daily, totalReportDays } = data;
      const P = (children, opts={}) => new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : opts.right ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
        spacing: { after: opts.after ?? 200, line: 360, lineRule: "auto" },
        indent: opts.indent ? { firstLine: 720 } : undefined, children,
      });
      const T = (text, opts={}) => new TextRun({
        text: String(text ?? ""), bold: opts.bold||false, italics: opts.italic||false,
        size: opts.size||24, font: "Times New Roman", color: opts.color||"000000",
        underline: opts.underline ? {} : undefined,
      });
      const HR = () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1E3A8A" } }, spacing: { after: 200 }, children: [] });
      const bL = { style: BorderStyle.SINGLE, size: 4, color: "BFDBFE" };
      const bD = { style: BorderStyle.SINGLE, size: 6, color: "1E3A8A" };
      const cBdr = { top: bL, bottom: bL, left: bL, right: bL };
      const hSh = { type: ShadingType.SOLID, fill: "1E3A8A" };
      const eSh = { type: ShadingType.SOLID, fill: "EFF6FF" };
      const hCell = (text) => new TableCell({ shading: hSh, borders: cBdr, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [T(text, { bold: true, color: "FFFFFF", size: 20 })] })] });
      const dCell = (text, opts={}) => new TableCell({ shading: opts.shade, borders: cBdr, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: opts.center ? AlignmentType.CENTER : opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [T(text, opts)] })] });

      const cumRows = [
        new TableRow({ tableHeader: true, children: [hCell("Chỉ tiêu"), hCell("Lũy kế"), hCell("Mục tiêu"), hCell("Đạt %")] }),
        ...FIELDS.map((f, i) => {
          const val = cumulative[f.key] || 0;
          const pct = f.target > 0 ? Math.min(100, Math.round(val / f.target * 100)) : 0;
          const sh = i % 2 === 0 ? eSh : undefined;
          return new TableRow({ children: [
            dCell(f.label, { shade: sh }),
            dCell(Number(val).toLocaleString("vi-VN") + " " + f.unit, { right: true, bold: true, color: "1E3A8A", shade: sh }),
            dCell(Number(f.target).toLocaleString("vi-VN") + " " + f.unit, { center: true, shade: sh }),
            dCell(pct + "%", { center: true, bold: true, color: pct>=100?"16A34A":pct>=70?"D97706":"CC0000", shade: sh }),
          ]});
        })
      ];
      const dailyRows = [
        new TableRow({ tableHeader: true, children: [hCell("Ngày"), hCell("KNS"), hCell("VNeID"), hCell("DVC"), hCell("QR"), hCell("Lớp"), hCell("AI"), hCell("SmartWeb"), hCell("Người nộp")] }),
        ...daily.map((d, i) => {
          const dt = new Date(d.reportDate);
          const sh = i % 2 === 0 ? eSh : undefined;
          return new TableRow({ children: [
            dCell(`${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}`, { center: true, bold: true, shade: sh }),
            dCell(String(d.digitalSkills||0), { center: true, shade: sh }),
            dCell(String(d.vneidSupport||0), { center: true, shade: sh }),
            dCell(String(d.publicServices||0), { center: true, shade: sh }),
            dCell(String(d.qrSupport||0), { center: true, shade: sh }),
            dCell(String(d.trainingClasses||0), { center: true, shade: sh }),
            dCell(String(d.youthTrained||0), { center: true, shade: sh }),
            dCell(String(d.smartwebCount||0), { center: true, shade: sh }),
            dCell(d.reporterName || "—", { shade: sh }),
          ]});
        })
      ];
      const avgPct = Math.round(FIELDS.reduce((s,f) => s + Math.min(100, f.target>0 ? Math.round((cumulative[f.key]||0)/f.target*100) : 0), 0) / FIELDS.length);
      const doc = new Document({
        styles: { default: { document: { run: { font: "Times New Roman", size: 24 } } } },
        sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 } } }, children: [
          P([T("ĐOÀN TNCS HỒ CHÍ MINH TỈNH ĐẮK LẮK", { bold: true, size: 22 })], { center: true, after: 0 }),
          P([T("BAN CHẤP HÀNH TỈNH ĐOÀN", { bold: true, size: 22 })], { center: true, after: 160 }),
          P([T("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { bold: true, size: 22 })], { center: true, after: 0 }),
          P([T("Độc lập – Tự do – Hạnh phúc", { bold: true, size: 22 })], { center: true, after: 200 }),
          P([T(`Đắk Lắk, ${printDate}`, { italic: true })], { right: true, after: 400 }),
          P([T("BÁO CÁO", { bold: true, size: 28 })], { center: true, after: 80 }),
          P([T("Tình hình thực hiện Chiến dịch \"44 Ngày Đêm\" Chuyển đổi số", { bold: true, size: 26 })], { center: true, after: 80 }),
          P([T(`Đơn vị: ${agency.name}${agency.district ? " – " + agency.district : ""}`, { bold: true, size: 24 })], { center: true, after: 80 }),
          P([T(`(Tổng hợp ${totalReportDays} ngày báo cáo toàn chiến dịch)`, { size: 22, color: "555555", italic: true })], { center: true, after: 500 }),
          HR(),
          P([T("I. TÌNH HÌNH CHUNG", { bold: true, underline: true })], { after: 200 }),
          P([T(`${agency.name}${agency.district ? " – " + agency.district : ""}`, { bold: true }), T(` đã tham gia báo cáo `), T(`${totalReportDays} lần`, { bold: true }), T(` trong chiến dịch. Kết quả trung bình đạt `), T(`${avgPct}%`, { bold: true, color: avgPct>=80?"16A34A":avgPct>=60?"D97706":"CC0000" }), T(` so với chỉ tiêu phân bổ.`)], { indent: true }),
          P([T("II. KẾT QUẢ LŨY KẾ TOÀN CHIẾN DỊCH", { bold: true, underline: true })], { after: 120 }),
          ...FIELDS.map((f,i) => {
            const val = cumulative[f.key]||0, pct = f.target>0?Math.min(100,Math.round(val/f.target*100)):0;
            return P([T(`${i+1}. ${f.label}: `,{bold:true}),T(`${Number(val).toLocaleString("vi-VN")} ${f.unit}`,{bold:true}),T(` / ${Number(f.target).toLocaleString("vi-VN")} ${f.unit} — `),T(`${pct}%`,{bold:true,color:pct>=100?"16A34A":pct>=70?"D97706":"CC0000"}),T(pct>=100?" (Đạt).":pct>=70?" (Tốt).":pct>=40?" (Khá).":" (Cần đẩy mạnh).",{italic:true,color:pct>=100?"16A34A":pct>=70?"D97706":"CC0000"})], { indent: true, after: 100 });
          }),
          P([T("III. BẢNG TÓM TẮT 11 CHỈ TIÊU", { bold: true, underline: true })], { after: 120 }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: bD, bottom: bD, left: bD, right: bD, insideH: bL, insideV: bL }, rows: cumRows }),
          P([T("IV. BẢNG THEO TỪNG NGÀY", { bold: true, underline: true })], { after: 120 }),
          daily.length > 0
            ? new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: bD, bottom: bD, left: bD, right: bD, insideH: bL, insideV: bL }, rows: dailyRows })
            : P([T("Chưa có dữ liệu theo ngày.", { italic: true, color: "888888" })], { indent: true }),
          P([], { after: 400 }), HR(),
          P([T(`Nơi nhận:\n– Ban Thường vụ Tỉnh Đoàn;\n– Lưu VT.`, { size: 22, italic: true })], { after: 0 }),
          P([T("TM. BAN CHẤP HÀNH TỈNH ĐOÀN", { bold: true })], { right: true, after: 80 }),
          P([T("BÍ THƯ", { bold: true })], { right: true, after: 0 }),
          P([T("(Ký, đóng dấu)", { italic: true, size: 22, color: "888888" })], { right: true, after: 600 }),
          P([T("________________________________", { bold: true })], { right: true, after: 300 }),
          P([T(`Webgov Đắk Lắk — gov.daklak.site`, { size: 18, italic: true, color: "999999" })], { center: true }),
        ] }]
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `BaoCao_${agency.name.replace(/\s+/g,"_")}_ToanChienDich.docx`);
      toast.success("✅ Đã tải xuống file Word!");
    } catch (err) { console.error(err); toast.error("Lỗi tạo Word: " + err.message); }
  };

  return (
    <div className="animate-up" style={{ paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}><Building2 size={26} color="var(--primary)" /> Báo cáo theo Đơn vị</h2>
          <p style={{ color: "var(--tx-3)", fontSize: ".92rem", marginTop: 4 }}>Xem số liệu toàn chiến dịch của 1 xã/phường — xuất Word</p>
        </div>
        {data && (<button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={exportWord}><Download size={16} /> Xuất Word (.docx)</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "flex-start" }}>
        <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--tx-3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm xã/phường..." style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1px solid var(--border)", borderRadius: 8, fontSize: ".88rem", background: "var(--bg)", color: "var(--tx-1)" }} />
            </div>
            <div style={{ marginTop: 6, fontSize: ".78rem", color: "var(--tx-3)" }}>{loadingA ? "Đang tải..." : `${filtered.length} đơn vị`}</div>
          </div>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {filtered.map(a => (
              <button key={a._id} onClick={() => handleSelect(a._id)} style={{ width: "100%", padding: "9px 14px", textAlign: "left", background: selectedId===a._id ? "#EFF6FF" : "transparent", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", borderLeft: selectedId===a._id ? "3px solid var(--primary)" : "3px solid transparent" }}>
                <div style={{ fontWeight: selectedId===a._id ? 700 : 500, fontSize: ".88rem", color: selectedId===a._id ? "var(--primary)" : "var(--tx-1)" }}>{a.name}</div>
                {a.district && <div style={{ fontSize: ".76rem", color: "var(--tx-3)", marginTop: 1 }}>{a.district}</div>}
              </button>
            ))}
          </div>
        </div>
        <div>
          {loading && <div style={{ textAlign: "center", padding: 60, color: "var(--tx-3)" }}>Đang tải dữ liệu...</div>}
          {!loading && !data && <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: "60px 32px", textAlign: "center" }}><Building2 size={48} color="var(--tx-3)" style={{ marginBottom: 16 }} /><div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--tx-2)" }}>Chọn một đơn vị để xem báo cáo</div></div>}
          {!loading && data && (() => {
            const { agency, cumulative, daily, totalReportDays } = data;
            const avgPct = Math.round(FIELDS.reduce((s,f) => s + Math.min(100, f.target>0 ? Math.round((cumulative[f.key]||0)/f.target*100) : 0), 0) / FIELDS.length);
            return (<>
              <div style={{ background: "linear-gradient(135deg,#1E3A8A,#0284C7)", borderRadius: 16, padding: "18px 22px", color: "#fff", marginBottom: 18 }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>{agency.name}</div>
                {agency.district && <div style={{ opacity: .8, fontSize: ".88rem", marginTop: 2 }}>{agency.district}</div>}
                <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
                  <div><div style={{ opacity: .7, fontSize: ".75rem", textTransform: "uppercase" }}>Ngày báo cáo</div><div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{totalReportDays}</div></div>
                  <div><div style={{ opacity: .7, fontSize: ".75rem", textTransform: "uppercase" }}>Trung bình</div><div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{avgPct}%</div></div>
                </div>
              </div>
              <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: "18px 22px", marginBottom: 18 }}>
                <div style={{ fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><TrendingUp size={17} color="var(--primary)" /> Lũy kế 11 Chỉ tiêu</div>
                {FIELDS.map(f => {
                  const val = cumulative[f.key]||0, pct = f.target>0 ? Math.min(100,Math.round(val/f.target*100)) : 0;
                  return (<div key={f.key} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: ".83rem", color: "var(--tx-2)" }}>{f.label}</span>
                      <span style={{ fontSize: ".83rem", fontWeight: 700 }}>{Number(val).toLocaleString("vi-VN")} <span style={{ color: pct>=100?"#16A34A":pct>=70?"#D97706":"#DC2626", fontSize: ".75rem" }}>({pct}%)</span></span>
                    </div>
                    <div style={{ background: "var(--border)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                      <div style={{ height: 5, width: `${pct}%`, background: pct>=100?"#16A34A":pct>=70?"#F59E0B":"#2563EB", borderRadius: 4 }} />
                    </div>
                  </div>);
                })}
              </div>
              <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: "18px 22px" }}>
                <div style={{ fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><Calendar size={17} color="var(--primary)" /> Lịch sử từng ngày ({totalReportDays})</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".81rem" }}>
                    <thead><tr style={{ background: "var(--bg-2)" }}>
                      {["Ngày","KNS","VNeID","DVC","QR","Lớp","AI","SmartWeb","Người nộp"].map(h => <th key={h} style={{ padding: "7px 9px", textAlign: "center", fontWeight: 700, color: "var(--tx-2)", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{daily.map((d,i) => {
                      const dt = new Date(d.reportDate);
                      return (<tr key={d._id} style={{ background: i%2===0?"var(--bg)":"var(--card)" }}>
                        <td style={{ padding: "6px 9px", textAlign: "center", fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap" }}>{String(dt.getDate()).padStart(2,"0")}/{String(dt.getMonth()+1).padStart(2,"0")}</td>
                        {["digitalSkills","vneidSupport","publicServices","qrSupport","trainingClasses","youthTrained","smartwebCount"].map(k => <td key={k} style={{ padding: "6px 9px", textAlign: "center" }}>{Number(d[k]||0).toLocaleString("vi-VN")}</td>)}
                        <td style={{ padding: "6px 9px", fontSize: ".78rem", color: "var(--tx-2)" }}>{d.reporterName||"—"}</td>
                      </tr>);
                    })}</tbody>
                  </table>
                </div>
              </div>
            </>);
          })()}
        </div>
      </div>
    </div>
  );
}