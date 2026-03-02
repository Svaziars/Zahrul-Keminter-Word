import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
// ACADEMIC WORD PROCESSOR — Boilerplate Component
// Stack: React + TipTap (simulated) + Tailwind CSS
// Untuk integrasi penuh, install packages di bawah ini:
//   npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-table
//   npm install @tiptap/extension-image @tiptap/extension-font-family
//   npm install @tiptap/extension-text-style @tiptap/extension-line-height
//   npm install html2pdf.js docx file-saver
// ============================================================

const FONTS = ["Times New Roman", "Arial", "Georgia", "Calibri"];
const FONT_SIZES = [10, 11, 12, 14, 16, 18, 24, 36];
const LINE_SPACINGS = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "2.0", value: "2" },
];

const DEFAULT_MARGINS = { top: 4, left: 4, bottom: 3, right: 3 };

// ─── Icons (inline SVG) ──────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  bold: "M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z",
  italic: "M19 4h-9M14 20H5M15 4L9 20",
  underline: "M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M4 21h16",
  alignLeft: "M17 10H3M21 6H3M21 14H3M17 18H3",
  alignCenter: "M21 10H3M21 6H3M21 14H3M21 18H3",
  alignRight: "M21 10H7M21 6H3M21 14H7M21 18H3",
  alignJustify: "M21 10H3M21 6H3M21 14H3M21 18H3",
  table: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 0-2-2v-4m0 0h18",
  image: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  layout: "M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zM4 15a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zM14 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z",
  pageBreak: "M5 12h14M5 5l7 7 7-7M5 19l7-7 7 7",
};

// ─── Ribbon Tab Button ───────────────────────────────────────
const TabBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 text-sm font-semibold tracking-wide border-b-2 transition-all ${
      active
        ? "border-blue-700 text-blue-700 bg-blue-50"
        : "border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-100"
    }`}
  >
    {label}
  </button>
);

// ─── Toolbar Button ──────────────────────────────────────────
const ToolBtn = ({ icon, label, onClick, active = false, className = "" }) => (
  <button
    title={label}
    onClick={onClick}
    className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all ${
      active ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"
    } ${className}`}
  >
    {icon && <span className="w-4 h-4">{icon}</span>}
    {label && <span>{label}</span>}
  </button>
);

// ─── Select Field ────────────────────────────────────────────
const SelectField = ({ value, onChange, options, className = "" }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`border border-gray-300 rounded px-2 py-1 text-xs bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 ${className}`}
  >
    {options.map((opt) => (
      <option key={opt.value ?? opt} value={opt.value ?? opt}>
        {opt.label ?? opt}
      </option>
    ))}
  </select>
);

// ─── Margin Input ────────────────────────────────────────────
const MarginInput = ({ label, value, onChange }) => (
  <div className="flex flex-col items-center gap-1">
    <label className="text-xs text-gray-500 font-medium">{label}</label>
    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        step="0.5"
        min="0"
        max="10"
        className="w-14 px-2 py-1 text-xs text-center focus:outline-none"
      />
      <span className="px-1.5 py-1 bg-gray-100 text-xs text-gray-500 border-l">cm</span>
    </div>
  </div>
);

// ─── Insert Table Dialog ─────────────────────────────────────
const TableDialog = ({ onInsert, onClose }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-72 border border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Insert Table</h3>
        <div className="flex gap-4 mb-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Rows</label>
            <input type="number" value={rows} min={1} max={20} onChange={(e) => setRows(+e.target.value)}
              className="border rounded px-2 py-1 text-sm w-20 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Columns</label>
            <input type="number" value={cols} min={1} max={10} onChange={(e) => setCols(+e.target.value)}
              className="border rounded px-2 py-1 text-sm w-20 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50">Batal</button>
          <button onClick={() => onInsert(rows, cols)} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Insert</button>
        </div>
      </div>
    </div>
  );
};

// ─── Table of Contents Panel ─────────────────────────────────
const TocPanel = ({ headings }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-3">
    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Daftar Isi</p>
    {headings.length === 0 && <p className="text-xs text-gray-400 italic">Belum ada heading.</p>}
    {headings.map((h, i) => (
      <div key={i} className={`text-xs py-0.5 cursor-pointer hover:text-blue-600 truncate ${
        h.level === 1 ? "font-bold text-gray-800" :
        h.level === 2 ? "pl-3 text-gray-700" : "pl-6 text-gray-500"
      }`}>
        {h.level === 1 ? "" : h.level === 2 ? "▸ " : "  ▸ "}{h.text}
      </div>
    ))}
  </div>
);

// ─── Main Component ──────────────────────────────────────────
export default function AcademicWordProcessor() {
  const editorRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Home");
  const [font, setFont] = useState("Times New Roman");
  const [fontSize, setFontSize] = useState(12);
  const [lineSpacing, setLineSpacing] = useState("1.5");
  const [margins, setMargins] = useState(DEFAULT_MARGINS);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [align, setAlign] = useState("left");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [headings, setHeadings] = useState([]);
  const [showToc, setShowToc] = useState(true);

  // Update word/char count & extract headings
  const updateStats = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText || "";
    setCharCount(text.length);
    setWordCount(text.trim() === "" ? 0 : text.trim().split(/\s+/).length);
    const hNodes = el.querySelectorAll("h1, h2, h3");
    const extracted = [];
    hNodes.forEach((h) => {
      const level = parseInt(h.tagName[1]);
      if (h.innerText.trim()) extracted.push({ level, text: h.innerText.trim() });
    });
    setHeadings(extracted);
  }, []);

  const execCmd = (cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    updateStats();
  };

  const applyHeading = (tag) => {
    editorRef.current?.focus();
    document.execCommand("formatBlock", false, tag);
    updateStats();
  };

  const insertTable = (rows, cols) => {
    let html = `<figure contenteditable="false" style="margin:16px 0">
      <figcaption contenteditable="true" style="text-align:center;font-size:11pt;color:#555;margin-bottom:4px">
        Tabel X. Judul Tabel
      </figcaption>
      <table style="width:100%;border-collapse:collapse;font-size:11pt">`;
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? "th" : "td";
        html += `<${tag} style="border:1px solid #aaa;padding:6px 10px;${r===0?"background:#f0f4ff;font-weight:bold":""}"> </${tag}>`;
      }
      html += "</tr>";
    }
    html += `</table></figure><p><br></p>`;
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    setShowTableDialog(false);
    updateStats();
  };

  const insertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const html = `<figure style="text-align:center;margin:16px 0" contenteditable="false">
          <img src="${ev.target.result}" style="max-width:100%;height:auto;border:1px solid #ddd;border-radius:4px" alt="Gambar"/>
          <figcaption contenteditable="true" style="font-size:11pt;color:#555;margin-top:6px">
            Gambar X. Judul Gambar
          </figcaption>
        </figure><p><br></p>`;
        editorRef.current?.focus();
        document.execCommand("insertHTML", false, html);
        updateStats();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const insertPageBreak = () => {
    const html = `<div style="page-break-after:always;border-top:2px dashed #ccc;margin:20px 0;text-align:center">
      <span style="font-size:10px;color:#aaa;background:white;padding:0 8px">— Page Break —</span>
    </div><p><br></p>`;
    execCmd("insertHTML", html);
  };

  const exportPDF = () => {
    // In production: use html2pdf.js
    // import html2pdf from 'html2pdf.js'
    // html2pdf().set({ margin: [...], filename: 'dokumen.pdf', html2canvas: { scale: 2 }, jsPDF: { format: 'a4' } }).from(editorRef.current).save()
    alert("PDF Export:\nnpm install html2pdf.js\nKemudian implementasikan dengan html2pdf().from(editorRef.current).save()");
  };

  const exportDOCX = () => {
    // In production: use docx + file-saver
    // import { Document, Packer, Paragraph } from 'docx'
    // import { saveAs } from 'file-saver'
    alert("DOCX Export:\nnpm install docx file-saver\nKemudian gunakan library docx untuk membuat Document dari konten editor.");
  };

  // Apply font and size changes to editor
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.fontFamily = font;
      editorRef.current.style.fontSize = `${fontSize}pt`;
      editorRef.current.style.lineHeight = lineSpacing;
    }
  }, [font, fontSize, lineSpacing]);

  // Convert cm to px (96dpi: 1cm = 37.795px)
  const cmToPx = (cm) => Math.round(cm * 37.795);

  const pageStyle = {
    width: "210mm",
    minHeight: "297mm",
    paddingTop: `${margins.top}cm`,
    paddingLeft: `${margins.left}cm`,
    paddingBottom: `${margins.bottom}cm`,
    paddingRight: `${margins.right}cm`,
    fontFamily: font,
    fontSize: `${fontSize}pt`,
    lineHeight: lineSpacing,
    textAlign: align,
  };

  const ribbonTabs = ["Home", "Insert", "Layout"];

  return (
    <div className="flex flex-col h-screen bg-gray-200 font-sans select-none">
      {/* ── TOP BAR ── */}
      <div className="bg-blue-800 text-white px-4 py-1.5 flex items-center gap-4 text-xs shadow-md">
        <span className="font-bold text-sm tracking-wide">📄 AcadWrite</span>
        <span className="text-blue-300 text-xs">Dokumen Tanpa Judul</span>
        <div className="ml-auto flex gap-2">
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium transition-colors">
            <Icon d={icons.download} size={13} /> Export PDF
          </button>
          <button onClick={exportDOCX}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-xs font-medium transition-colors">
            <Icon d={icons.download} size={13} /> Export DOCX
          </button>
        </div>
      </div>

      {/* ── RIBBON ── */}
      <div className="bg-white border-b border-gray-300 shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-2">
          {ribbonTabs.map((t) => <TabBtn key={t} label={t} active={activeTab === t} onClick={() => setActiveTab(t)} />)}
          <button
            onClick={() => setShowToc(!showToc)}
            className="ml-auto px-3 py-1 text-xs text-gray-500 hover:text-blue-600 self-center"
            title="Toggle Daftar Isi"
          >
            {showToc ? "▲" : "▼"} Daftar Isi
          </button>
        </div>

        {/* Tab Content */}
        <div className="px-3 py-2 flex items-center gap-1 flex-wrap min-h-[52px]">
          {activeTab === "Home" && <>
            {/* Heading */}
            <div className="flex gap-1 pr-3 border-r border-gray-200 mr-1">
              {["H1","H2","H3"].map((h, i) => (
                <button key={h} onClick={() => applyHeading(`h${i+1}`)}
                  className={`px-2 py-1 text-xs font-bold rounded border hover:bg-blue-50 transition-colors ${
                    h==="H1"?"text-lg":"h"==="H2"?"text-base":"text-sm"
                  } border-gray-300 text-gray-700`}
                  title={`Heading ${i+1}`}>{h}</button>
              ))}
              <button onClick={() => applyHeading("p")}
                className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50">¶ Normal</button>
            </div>

            {/* Font */}
            <SelectField value={font} onChange={setFont}
              options={FONTS.map(f => ({ value: f, label: f }))} className="w-36" />
            <SelectField value={fontSize} onChange={(v) => setFontSize(+v)}
              options={FONT_SIZES.map(s => ({ value: s, label: `${s}pt` }))} className="w-16" />

            {/* Format buttons */}
            <div className="flex gap-0.5 px-2 border-x border-gray-200 mx-1">
              <ToolBtn icon={<Icon d={icons.bold} />} label="B" active={bold}
                onClick={() => { setBold(!bold); execCmd("bold"); }}
                className="font-bold" />
              <ToolBtn icon={<Icon d={icons.italic} />} label="I" active={italic}
                onClick={() => { setItalic(!italic); execCmd("italic"); }}
                className="italic" />
              <ToolBtn icon={<Icon d={icons.underline} />} label="U" active={underline}
                onClick={() => { setUnderline(!underline); execCmd("underline"); }}
                className="underline" />
            </div>

            {/* Alignment */}
            <div className="flex gap-0.5">
              {["left","center","right","justify"].map(a => (
                <ToolBtn key={a} icon={<Icon d={icons[`align${a.charAt(0).toUpperCase()+a.slice(1)}`]} />}
                  active={align===a} onClick={() => { setAlign(a); execCmd(`justify${a.charAt(0).toUpperCase()+a.slice(1)}`); }}
                  label="" />
              ))}
            </div>

            {/* Line spacing */}
            <div className="flex items-center gap-1 pl-2 border-l border-gray-200 ml-1">
              <span className="text-xs text-gray-500">↕</span>
              <SelectField value={lineSpacing} onChange={setLineSpacing}
                options={LINE_SPACINGS} className="w-16" />
            </div>
          </>}

          {activeTab === "Insert" && <>
            <ToolBtn icon={<Icon d={icons.table} />} label="Table" onClick={() => setShowTableDialog(true)} />
            <ToolBtn icon={<Icon d={icons.image} />} label="Image" onClick={insertImage} />
            <ToolBtn icon={<Icon d={icons.pageBreak} />} label="Page Break" onClick={insertPageBreak} />
            <div className="border-l border-gray-200 mx-2 h-8" />
            <span className="text-xs text-gray-400 italic">Caption otomatis tersedia saat insert gambar & tabel</span>
          </>}

          {activeTab === "Layout" && <>
            <span className="text-xs font-semibold text-gray-600 mr-2">Margin (cm):</span>
            {["top","left","bottom","right"].map(side => (
              <MarginInput key={side} label={side.charAt(0).toUpperCase()+side.slice(1)}
                value={margins[side]}
                onChange={(v) => setMargins(prev => ({ ...prev, [side]: v }))} />
            ))}
            <div className="border-l border-gray-200 mx-3 h-10" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-600">Line Spacing:</span>
              <SelectField value={lineSpacing} onChange={setLineSpacing} options={LINE_SPACINGS} />
            </div>
            <div className="ml-3 bg-blue-50 border border-blue-200 rounded px-3 py-1 text-xs text-blue-700">
              📌 Standar Skripsi: Top 4cm · Left 4cm · Bottom 3cm · Right 3cm
            </div>
          </>}
        </div>
      </div>

      {/* ── EDITOR AREA ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar TOC */}
        {showToc && (
          <div className="w-52 bg-gray-100 border-r border-gray-300 p-3 overflow-y-auto flex-shrink-0">
            <TocPanel headings={headings} />
            <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tips</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• H1 = Bab Utama</li>
                <li>• H2 = Sub-bab</li>
                <li>• H3 = Sub-sub bab</li>
                <li>• Ctrl+B = Bold</li>
                <li>• Ctrl+I = Italic</li>
              </ul>
            </div>
          </div>
        )}

        {/* Scrollable canvas */}
        <div className="flex-1 overflow-auto bg-gray-300 flex flex-col items-center py-8 px-4 gap-6">
          {/* A4 Page */}
          <div
            style={{
              ...pageStyle,
              boxShadow: "0 4px 32px rgba(0,0,0,0.18), 0 1px 6px rgba(0,0,0,0.08)",
              background: "white",
              borderRadius: "2px",
              position: "relative",
            }}
          >
            {/* Ruler hint */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0,
              height: "3px",
              background: `linear-gradient(to right, #3b82f6 ${(margins.left/21)*100}%, transparent ${(margins.left/21)*100}%)`,
              opacity: 0.3,
            }} />

            {/* Content-editable editor */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={updateStats}
              onKeyUp={updateStats}
              spellCheck={false}
              style={{
                outline: "none",
                minHeight: "240mm",
                fontFamily: font,
                fontSize: `${fontSize}pt`,
                lineHeight: lineSpacing,
              }}
              className="focus:outline-none"
              data-placeholder="Mulai mengetik di sini..."
            >
              {/* Initial content */}
            </div>
          </div>

          {/* Hint label */}
          <p className="text-xs text-gray-400 mb-4">Kertas A4 · {margins.top}cm/{margins.left}cm/{margins.bottom}cm/{margins.right}cm (T/L/B/R)</p>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div className="bg-blue-800 text-white px-4 py-1 flex items-center gap-6 text-xs">
        <span>📝 Kata: <strong>{wordCount.toLocaleString()}</strong></span>
        <span>🔤 Karakter: <strong>{charCount.toLocaleString()}</strong></span>
        <span className="border-l border-blue-600 pl-4">Font: {font} {fontSize}pt</span>
        <span className="border-l border-blue-600 pl-4">Spasi: {lineSpacing}x</span>
        <span className="border-l border-blue-600 pl-4">Margin: T{margins.top} L{margins.left} B{margins.bottom} R{margins.right} cm</span>
        <span className="ml-auto text-blue-300">AcadWrite v1.0 — Academic Word Processor</span>
      </div>

      {/* Table Insert Dialog */}
      {showTableDialog && (
        <TableDialog onInsert={insertTable} onClose={() => setShowTableDialog(false)} />
      )}

      {/* Placeholder style */}
      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #bbb;
          pointer-events: none;
          font-style: italic;
        }
        @media print {
          .ribbon, .status-bar { display: none !important; }
        }
        figure { user-select: none; }
        figure figcaption { user-select: text; }
        table { border-collapse: collapse; }
        td, th { border: 1px solid #aaa; padding: 6px 10px; min-width: 40px; }
        h1 { font-size: 16pt; font-weight: bold; margin: 20px 0 8px; }
        h2 { font-size: 14pt; font-weight: bold; margin: 16px 0 6px; }
        h3 { font-size: 13pt; font-weight: bold; margin: 14px 0 5px; }
      `}</style>
    </div>
  );
}
