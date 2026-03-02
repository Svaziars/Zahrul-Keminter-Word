# AcadWrite — Academic Word Processor
## Struktur Folder Proyek (Next.js App Router)

```
acadwrite/
├── public/
│   └── fonts/                          # Times New Roman, Arial lokal (opsional)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (fonts, metadata)
│   │   ├── page.tsx                    # Redirect ke /editor
│   │   └── editor/
│   │       └── page.tsx                # Halaman utama editor
│   │
│   ├── components/
│   │   ├── editor/
│   │   │   ├── EditorCanvas.tsx        # ★ Komponen A4 canvas (margin, paper)
│   │   │   ├── EditorCore.tsx          # TipTap <EditorContent> wrapper
│   │   │   └── EditorProvider.tsx      # Context: editor instance, state
│   │   │
│   │   ├── ribbon/
│   │   │   ├── Ribbon.tsx              # Container ribbon + tab switching
│   │   │   ├── HomeTab.tsx             # Bold, Italic, Font, Heading
│   │   │   ├── InsertTab.tsx           # Table, Image, PageBreak
│   │   │   └── LayoutTab.tsx           # Margin, Spacing controls
│   │   │
│   │   ├── sidebar/
│   │   │   └── TableOfContents.tsx     # Auto-generated TOC dari heading
│   │   │
│   │   ├── dialogs/
│   │   │   ├── InsertTableDialog.tsx   # Pilih rows x cols
│   │   │   └── ImageCaptionDialog.tsx  # Upload + input caption
│   │   │
│   │   └── statusbar/
│   │       └── StatusBar.tsx           # Word count, char count, page info
│   │
│   ├── extensions/                     # TipTap custom extensions
│   │   ├── PageBreak.ts                # Custom node: pemisah halaman
│   │   ├── FigureWithCaption.ts        # Image + caption sebagai satu node
│   │   └── TableWithCaption.ts         # Table + caption sebagai satu node
│   │
│   ├── hooks/
│   │   ├── useEditorState.ts           # Font, margin, spacing state
│   │   ├── useWordCount.ts             # Realtime word/char counter
│   │   └── useTableOfContents.ts       # Extract headings dari dokumen
│   │
│   ├── utils/
│   │   ├── exportPDF.ts                # html2pdf.js wrapper
│   │   ├── exportDOCX.ts               # docx library wrapper
│   │   └── marginToCss.ts             # cm → CSS padding converter
│   │
│   └── styles/
│       ├── globals.css                 # Tailwind directives
│       └── editor.css                  # Tiptap prose styles, print media
│
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## Library Pendukung (Rekomendasi Stabil)

### Core Editor
| Library | Versi | Fungsi |
|---------|-------|--------|
| `@tiptap/react` | ^2.4 | Rich text engine (React binding) |
| `@tiptap/pm` | ^2.4 | ProseMirror core (dependency TipTap) |
| `@tiptap/starter-kit` | ^2.4 | Bold, Italic, Heading, Lists, dll |
| `@tiptap/extension-table` | ^2.4 | Insert & edit table |
| `@tiptap/extension-image` | ^2.4 | Insert image |
| `@tiptap/extension-font-family` | ^2.4 | Ganti font family |
| `@tiptap/extension-text-style` | ^2.4 | Base untuk custom style |
| `@tiptap/extension-line-height` | ^2.4 | Line spacing |
| `@tiptap/extension-color` | ^2.4 | Text color |
| `@tiptap/extension-highlight` | ^2.4 | Highlight teks |

### Export
| Library | Versi | Fungsi |
|---------|-------|--------|
| `html2pdf.js` | ^0.10 | Export ke PDF presisi (berbasis html2canvas + jsPDF) |
| `docx` | ^8.5 | Generate file .docx dari JavaScript |
| `file-saver` | ^2.0 | Trigger download dari browser |
| `@types/file-saver` | ^2.0 | TypeScript types |

### UI & Utilities
| Library | Versi | Fungsi |
|---------|-------|--------|
| `tailwindcss` | ^3.4 | Styling |
| `lucide-react` | ^0.400 | Icon pack |
| `@radix-ui/react-dialog` | ^1.0 | Dialog/modal accessible |
| `@radix-ui/react-select` | ^2.0 | Dropdown select |
| `@radix-ui/react-tooltip` | ^1.0 | Tooltip untuk toolbar |

---

## Install Command

```bash
npx create-next-app@latest acadwrite --typescript --tailwind --app
cd acadwrite

npm install \
  @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-table @tiptap/extension-table-row \
  @tiptap/extension-table-cell @tiptap/extension-table-header \
  @tiptap/extension-image @tiptap/extension-font-family \
  @tiptap/extension-text-style @tiptap/extension-color \
  @tiptap/extension-highlight @tiptap/extension-line-height \
  html2pdf.js docx file-saver \
  lucide-react \
  @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tooltip

npm install -D @types/file-saver
```

---

## Konfigurasi Export PDF (html2pdf.js)

```typescript
// src/utils/exportPDF.ts
import html2pdf from 'html2pdf.js';

export const exportToPDF = (element: HTMLElement, filename = 'dokumen.pdf') => {
  const options = {
    margin: [0, 0, 0, 0],  // Margin sudah di-handle oleh CSS padding
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break',
    }
  };
  return html2pdf().set(options).from(element).save();
};
```

## Konfigurasi Export DOCX (docx library)

```typescript
// src/utils/exportDOCX.ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export const exportToDOCX = async (content: string, filename = 'dokumen.docx') => {
  // Parse HTML content dan konversi ke docx nodes
  // Untuk production, gunakan html-to-docx atau proses manual
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134,    // 4cm dalam twips (1cm = 567 twips / 2 = 567*2)
            left: 1134,   // 4cm
            bottom: 851,  // 3cm
            right: 851,   // 3cm
          }
        }
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: "Konten dokumen di sini", font: "Times New Roman", size: 24 })],
          heading: HeadingLevel.HEADING_1,
        }),
      ],
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};
```

---

## Catatan Penting

1. **TipTap vs contentEditable**: Boilerplate menggunakan `contentEditable` dasar.
   Untuk produksi, gunakan TipTap `useEditor()` + `<EditorContent>`.

2. **Line Height Extension**: TipTap belum include line-height secara official.
   Install: `@tiptap/extension-line-height` atau buat custom extension.

3. **Print CSS**: Tambahkan `@media print` untuk menyembunyikan toolbar dan
   memastikan halaman A4 dicetak dengan benar.

4. **Font Embedding PDF**: Jika menggunakan font kustom, pastikan font di-embed
   saat export PDF agar tidak berubah di mesin lain.

5. **DOCX Formatting Fidelity**: Library `docx` menghasilkan file yang clean,
   tapi mapping dari HTML ke DOCX nodes perlu dilakukan manual untuk hasil terbaik.
   Alternatif: gunakan `html-to-docx` package untuk konversi otomatis.
