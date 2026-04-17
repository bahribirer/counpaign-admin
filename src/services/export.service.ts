// Export Service — PDF (jsPDF + autotable) yardımcıları
// Hem Super Admin (kapsamlı) hem Firma Admin (özet) için ortak helper'lar.
// Türkçe karakter desteği için standart TTF fontları kullanılır.

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular, RobotoBold } from '../assets/fonts/roboto-base64';
import { LogoBase64 } from '../assets/logo-base64';

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------
export interface PdfSection {
    title: string;
    headers: string[];
    rows: (string | number)[][];
    summary?: { label: string; value: string | number }[];
}

export interface PdfReportSpec {
    title: string;
    subtitle?: string;
    sections: PdfSection[];
    meta?: { label: string; value: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const todayStamp = (): string => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
};

const trDate = (date: Date | string): string => {
    if (!date) return '-';
    try {
        return new Date(date).toLocaleString('tr-TR');
    } catch {
        return String(date);
    }
};

const safeFilename = (s: string): string =>
    s.toLowerCase().replace(/[^a-z0-9ğüşıöç_-]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

/**
 * Türkçeleştirilmiş karakterleri Latin muadillerine çevirir.
 * PDF fontu yüklenemezse fallback olarak kullanılır.
 */
function transliterate(text: string): string {
    const map: Record<string, string> = {
        'ş': 's', 'Ş': 'S', 'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
        'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
    };
    return text.split('').map(char => map[char] || char).join('');
}

// ---------------------------------------------------------------------------
// Font Registration & Logic
// ---------------------------------------------------------------------------
let isFontLoaded = false;

function registerFonts(doc: jsPDF): void {
    try {
        // Standard TrueType fonts are added to VFS and then as fonts.
        doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
        doc.addFont('Roboto-Regular.ttf', 'CustomFont', 'normal');
        
        doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
        doc.addFont('Roboto-Bold.ttf', 'CustomFont', 'bold');
        
        doc.setFont('CustomFont', 'normal');
        isFontLoaded = true;
    } catch (err) {
        console.error('PDF registration failed, using helvetica fallback:', err);
        doc.setFont('helvetica', 'normal');
        isFontLoaded = false;
    }
}

/**
 * Font yüklenemediyse karakterleri Latin muadillerine çevirir.
 */
function safeT(text: string | number): string {
    const s = String(text);
    return isFontLoaded ? s : transliterate(s);
}

// ---------------------------------------------------------------------------
// Branding Colors
// ---------------------------------------------------------------------------
const BRAND = {
    primary:     [99, 102, 241] as [number, number, number],    // Indigo
    primaryDark: [79, 70, 229] as [number, number, number],     // Darker Indigo
    secondary:   [16, 185, 129] as [number, number, number],    // Emerald
    dark:        [30, 41, 59] as [number, number, number],      // Slate-800
    medium:      [100, 116, 139] as [number, number, number],   // Slate-500
    light:       [241, 245, 249] as [number, number, number],   // Slate-100
    white:       [255, 255, 255] as [number, number, number],
    tableHead:   [99, 102, 241] as [number, number, number],
    tableAlt:    [245, 243, 255] as [number, number, number],   // Light indigo
    border:      [226, 232, 240] as [number, number, number],   // Slate-200
};

// ---------------------------------------------------------------------------
// PDF — Multi-section professional report (Türkçe destekli)
// ---------------------------------------------------------------------------
export async function exportPdf(filenamePrefix: string, spec: PdfReportSpec): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Register custom fonts
    registerFonts(doc);

    // ======================================================================
    // HEADER
    // ======================================================================
    const headerHeight = 28;

    doc.setFillColor(...BRAND.primary);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setFillColor(...BRAND.primaryDark);
    doc.rect(0, headerHeight - 2, pageWidth, 2, 'F');

    // Logo Image — Robust Circular Masking using Canvas
    try {
        const logoSize = 15;
        const logoX = 14;
        const logoY = (headerHeight - logoSize) / 2 - 1;
        const centerX = logoX + (logoSize / 2);
        const centerY = logoY + (logoSize / 2);

        // We'll use a canvas to pre-mask the image for 100% reliable circular appearance
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = 300; // High res
            canvas.height = 300;
            
            // Masking
            ctx.beginPath();
            ctx.arc(150, 150, 150, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            // Render original logo into the mask
            const img = new Image();
            img.src = LogoBase64;
            
            // Wait for image load if necessary (but it's a data URL, so usually fast)
            // For stability in an async function, we can await it
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
            
            ctx.drawImage(img, 0, 0, 300, 300);
            const circularLogoData = canvas.toDataURL('image/png');
            
            // Add Logo to PDF
            doc.saveGraphicsState();
            doc.setFillColor(255, 255, 255);
            doc.circle(centerX, centerY, (logoSize / 2) + 0.3, 'F');
            doc.addImage(circularLogoData, 'PNG', logoX, logoY, logoSize, logoSize);
            doc.restoreGraphicsState();
        }

        // 3. Subtle Signature Watermark
        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.15 })); // Very subtle
        doc.setDrawColor(200, 200, 200);
        doc.setTextColor(150, 150, 150);
        doc.setLineWidth(0.1);
        
        // Thin elegant rings
        doc.circle(centerX, centerY, (logoSize / 2) + 2, 'S');
        
        doc.setFontSize(4);
        doc.setFont('CustomFont', 'normal');
        doc.text('VERIFIED REPORT', centerX, centerY + (logoSize / 2) + 3, { align: 'center', angle: -20 });
        doc.text('APPROVED', centerX, centerY - (logoSize / 2) - 1, { align: 'center', angle: -20 });
        
        doc.restoreGraphicsState();

    } catch (e) {
        // Fallback
        doc.setFillColor(255, 255, 255);
        doc.circle(18, headerHeight / 2, 7, 'F');
    }

    // Title
    doc.setTextColor(...BRAND.white);
    doc.setFontSize(16);
    doc.setFont(isFontLoaded ? 'CustomFont' : 'helvetica', 'bold');
    doc.text(safeT(spec.title), 38, headerHeight / 2 - 1);

    if (spec.subtitle) {
        doc.setFontSize(9);
        doc.setFont(isFontLoaded ? 'CustomFont' : 'helvetica', 'normal');
        doc.setTextColor(220, 220, 255);
        doc.text(safeT(spec.subtitle), 38, headerHeight / 2 + 5);
    }

    doc.setFontSize(8);
    doc.setFont(isFontLoaded ? 'CustomFont' : 'helvetica', 'normal');
    doc.setTextColor(200, 200, 255);
    const dateStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(safeT(dateStr), pageWidth - doc.getTextWidth(dateStr) - 14, headerHeight / 2 + 1);

    let cursorY = headerHeight + 8;

    // ======================================================================
    // META BLOCK
    // ======================================================================
    if (spec.meta && spec.meta.length) {
        doc.setFontSize(8);
        let metaX = 14;
        spec.meta.forEach((m) => {
            const text = safeT(`${m.label}: ${m.value}`);
            const tw = doc.getTextWidth(text) + 6;
            doc.setFillColor(...BRAND.light);
            doc.roundedRect(metaX, cursorY - 3, tw, 6, 1.5, 1.5, 'F');
            doc.setTextColor(...BRAND.medium);
            doc.text(text, metaX + 3, cursorY + 1);
            metaX += tw + 4;
        });
        cursorY += 10;
    }

    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.3);
    doc.line(14, cursorY, pageWidth - 14, cursorY);
    cursorY += 8;

    // ======================================================================
    // SECTIONS
    // ======================================================================
    spec.sections.forEach((section) => {
        if (cursorY > pageHeight - 40) {
            doc.addPage();
            cursorY = 20;
        }

        const sectionNumMatch = section.title.match(/^(\d+)\.\s*/);
        if (sectionNumMatch) {
            const num = sectionNumMatch[1] || '0';
            const titleText = section.title.replace(/^\d+\.\s*/, '');
            doc.setFillColor(...BRAND.primary);
            doc.circle(18, cursorY - 1, 3.5, 'F');
            doc.setTextColor(...BRAND.white);
            doc.setFontSize(8);
            doc.setFont(isFontLoaded ? 'CustomFont' : 'helvetica', 'bold');
            doc.text(num, 18 - doc.getTextWidth(num) / 2, cursorY + 0.5);
            doc.setTextColor(...BRAND.dark);
            doc.setFontSize(11);
            doc.text(safeT(titleText), 24, cursorY);
        } else {
            doc.setTextColor(...BRAND.dark);
            doc.setFontSize(11);
            doc.setFont(isFontLoaded ? 'CustomFont' : 'helvetica', 'bold');
            doc.text(safeT(section.title), 14, cursorY);
        }
        cursorY += 3;

        if (section.summary && section.summary.length) {
            cursorY += 2;
            const cardWidth = (pageWidth - 28 - (section.summary.length - 1) * 4) / section.summary.length;
            section.summary.forEach((s, si) => {
                const cx = 14 + si * (cardWidth + 4);
                doc.setFillColor(...BRAND.light);
                doc.roundedRect(cx, cursorY, cardWidth, 10, 1.5, 1.5, 'F');
                doc.setTextColor(...BRAND.medium);
                doc.setFontSize(7);
                doc.setFont(isFontLoaded ? 'CustomFont' : 'helvetica', 'normal');
                doc.text(safeT(String(s.label)), cx + 3, cursorY + 4);
                doc.setTextColor(...BRAND.dark);
                doc.setFontSize(9);
                doc.setFont(isFontLoaded ? 'CustomFont' : 'helvetica', 'bold');
                doc.text(safeT(String(s.value)), cx + 3, cursorY + 8.5);
            });
            cursorY += 14;
        }

        if (section.rows.length > 0) {
            autoTable(doc, {
                startY: cursorY + 1,
                head: [section.headers.map(h => safeT(h))],
                body: section.rows.map(row => row.map(cell => safeT(String(cell)))),
                theme: 'striped',
                headStyles: { fillColor: BRAND.tableHead, textColor: 255, fontSize: 8, font: isFontLoaded ? 'CustomFont' : 'helvetica', fontStyle: 'bold' },
                bodyStyles: { font: isFontLoaded ? 'CustomFont' : 'helvetica', fontSize: 8, textColor: BRAND.dark, lineColor: BRAND.border, lineWidth: 0.1 },
                alternateRowStyles: { fillColor: BRAND.tableAlt },
                margin: { left: 14, right: 14 },
                tableLineColor: BRAND.border,
                tableLineWidth: 0.1,
            });
            cursorY = (doc as any).lastAutoTable.finalY + 10;
        } else {
            doc.setFontSize(8);
            doc.setFont(isFontLoaded ? 'CustomFont' : 'helvetica', 'normal');
            doc.setTextColor(...BRAND.medium);
            doc.text(safeT('Bu bölümde veri bulunmamaktadır.'), 14, cursorY + 4);
            cursorY += 14;
        }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(...BRAND.border);
        doc.setLineWidth(0.3);
        doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
        doc.setFontSize(7);
        doc.setFont(isFontLoaded ? 'CustomFont' : 'helvetica', 'normal');
        doc.setTextColor(...BRAND.medium);
        doc.text(safeT(`Counpaign — Otomatik oluşturuldu: ${trDate(new Date())}`), 14, pageHeight - 9);
        const pageText = safeT(`Sayfa ${i} / ${pageCount}`);
        doc.text(pageText, pageWidth - doc.getTextWidth(pageText) - 14, pageHeight - 9);
    }

    doc.save(`${safeFilename(filenamePrefix)}_${todayStamp()}.pdf`);
}

// ---------------------------------------------------------------------------
// Convenience formatters
// ---------------------------------------------------------------------------
export const fmtNum = (n: number | undefined | null): string =>
    n == null ? '-' : Number(n).toLocaleString('tr-TR');

export const fmtPct = (n: number | undefined | null): string =>
    n == null ? '-' : `${n > 0 ? '+' : ''}${n}%`;

export const fmtDate = (d: string | Date | undefined): string => {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleDateString('tr-TR');
    } catch {
        return '-';
    }
};

export const rangeLabel = (range: string): string => {
    const map: Record<string, string> = { '7d': 'Son 7 Gün', '30d': 'Son 30 Gün', '90d': 'Son 90 Gün' };
    return map[range] || range;
};
