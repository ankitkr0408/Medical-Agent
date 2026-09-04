// Premium Medical Report Generation Service
import { jsPDF } from 'jspdf';
import { searchReferences } from './pubmed-service';
import * as fs from 'fs';
import * as path from 'path';

interface AnalysisData {
    id: string;
    analysis: string;
    findings?: Array<{ finding: string }> | string[];
    keywords?: Array<{ keyword: string }> | string[];
    filename?: string;
    createdAt?: Date | string;
    patientName?: string;
}

// Elegant color palette
const COLORS = {
    primary: '#6366F1',      // Indigo
    secondary: '#06B6D4',    // Cyan
    accent: '#10B981',       // Emerald
    dark: '#1E293B',         // Slate 800
    text: '#334155',         // Slate 700
    textLight: '#64748B',    // Slate 500
    border: '#E2E8F0',       // Slate 200
    bg: '#F8FAFC',           // Slate 50
    white: '#FFFFFF',
};

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : { r: 0, g: 0, b: 0 };
}

// Load logo as base64 from file system
function getLogoBase64(): string {
    try {
        const logoPath = path.join(process.cwd(), 'public', 'HealthIQ_logo_transparent.png');
        console.log('[PDF Generator] Looking for logo at:', logoPath);

        if (fs.existsSync(logoPath)) {
            const imageBuffer = fs.readFileSync(logoPath);
            const base64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
            console.log('[PDF Generator] Logo loaded successfully, size:', imageBuffer.length, 'bytes');
            return base64;
        }

        console.warn('[PDF Generator] Logo file not found at:', logoPath);
        return '';
    } catch (error) {
        console.error('[PDF Generator] Failed to load logo:', error);
        return '';
    }
}

// Strip markdown
function stripMarkdown(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/#{1,3}\s+/g, '')
        .replace(/`(.+?)`/g, '$1')
        .trim();
}

// Parse markdown for formatting
function parseMarkdown(line: string): {
    text: string;
    isBold: boolean;
    isHeader: boolean;
    isBullet: boolean;
} {
    let text = line;
    let isBold = false;
    let isHeader = false;
    let isBullet = false;

    if (text.startsWith('### ') || text.startsWith('## ')) {
        isHeader = true;
        text = text.replace(/#{2,3}\s+/, '');
    }

    if (text.startsWith('- ') || text.startsWith('• ')) {
        isBullet = true;
        text = text.replace(/^[-•]\s+/, '');
    }

    if (text.includes('**')) {
        isBold = true;
    }

    text = stripMarkdown(text);
    return { text, isBold, isHeader, isBullet };
}

export async function generateEnhancedReport(
    data: AnalysisData,
    includeReferences: boolean = true
): Promise<Blob> {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 25;
    const contentWidth = pageW - 2 * margin;
    let y = margin;

    const logoBase64 = getLogoBase64();

    // ══════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ══════════════════════════════════════════════════════════════

    // Check if new page needed
    const needsNewPage = (space: number = 20): boolean => {
        return y + space > pageH - 35;
    };

    // Add new page
    const newPage = () => {
        doc.addPage();
        y = margin + 15;
    };

    // Set text color from hex
    const setColor = (hex: string) => {
        const rgb = hexToRgb(hex);
        doc.setTextColor(rgb.r, rgb.g, rgb.b);
    };

    // Set fill color from hex
    const setFill = (hex: string) => {
        const rgb = hexToRgb(hex);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
    };

    // Set draw color from hex
    const setDraw = (hex: string) => {
        const rgb = hexToRgb(hex);
        doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    };

    // Add text with automatic wrapping
    const addText = (
        text: string,
        fontSize: number = 10,
        fontWeight: 'normal' | 'bold' = 'normal',
        leftIndent: number = 0
    ) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontWeight);
        setColor(COLORS.text);

        const lines = doc.splitTextToSize(text, contentWidth - leftIndent);
        for (const line of lines) {
            if (needsNewPage()) newPage();
            doc.text(line, margin + leftIndent, y);
            y += fontSize * 0.4;
        }
    };

    // Add markdown text with formatting
    const addMarkdownText = (text: string) => {
        const lines = text.split('\n');

        for (const line of lines) {
            if (!line.trim()) {
                y += 3;
                continue;
            }

            const parsed = parseMarkdown(line);

            if (parsed.isHeader) {
                y += 4;
                if (needsNewPage(15)) newPage();
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                setColor(COLORS.dark);
                doc.text(parsed.text, margin, y);
                y += 7;
            } else if (parsed.isBullet) {
                if (needsNewPage()) newPage();
                doc.setFontSize(9);
                doc.setFont('helvetica', parsed.isBold ? 'bold' : 'normal');
                setColor(COLORS.text);
                doc.text('•', margin + 2, y);
                const wrapped = doc.splitTextToSize(parsed.text, contentWidth - 8);
                for (const wLine of wrapped) {
                    doc.text(wLine, margin + 7, y);
                    y += 4;
                }
            } else {
                addText(parsed.text, 9, parsed.isBold ? 'bold' : 'normal', 0);
            }
        }
    };

    // ══════════════════════════════════════════════════════════════
    // COVER PAGE
    // ══════════════════════════════════════════════════════════════

    // Top accent line
    setFill(COLORS.primary);
    doc.rect(0, 0, pageW, 3, 'F');

    // Logo (centered)
    if (logoBase64) {
        try {
            const logoSize = 55;
            const logoX = (pageW - logoSize) / 2;
            const logoY = 60;

            // White background for logo
            doc.setFillColor(255, 255, 255);
            doc.rect(logoX, logoY, logoSize, logoSize, 'F');

            doc.addImage(
                logoBase64,
                'PNG',
                logoX,
                logoY,
                logoSize,
                logoSize
            );
        } catch (e) {
            console.error('Logo error:', e);
        }
    }

    // Title
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.dark);
    doc.text('Medical Report', pageW / 2, 135, { align: 'center' });

    // Subtitle line
    setDraw(COLORS.primary);
    doc.setLineWidth(1.5);
    doc.line(pageW / 2 - 30, 142, pageW / 2 + 30, 142);

    // Patient info (if available)
    if (data.patientName) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        setColor(COLORS.text);
        doc.text(`Patient: ${data.patientName}`, pageW / 2, 155, { align: 'center' });
    }

    // Date
    doc.setFontSize(11);
    setColor(COLORS.textLight);
    const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    doc.text(dateStr, pageW / 2, data.patientName ? 165 : 155, { align: 'center' });

    // Footer on cover
    doc.setFontSize(8);
    setColor(COLORS.textLight);
    doc.text('Generated by HealthIQ', pageW / 2, pageH - 20, { align: 'center' });
    doc.text('AI-Powered Medical Analysis', pageW / 2, pageH - 15, { align: 'center' });

    // ══════════════════════════════════════════════════════════════
    // CONTENT PAGES
    // ══════════════════════════════════════════════════════════════

    doc.addPage();
    y = margin;

    // Simple header for content pages
    const addPageHeader = () => {
        // Logo small
        if (logoBase64) {
            try {
                // White background for logo
                doc.setFillColor(255, 255, 255);
                doc.rect(margin, 10, 18, 18, 'F');
                doc.addImage(logoBase64, 'PNG', margin, 10, 18, 18);
            } catch (e) {
                console.error('Logo error:', e);
            }
        }

        // Title next to logo
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        setColor(COLORS.dark);
        doc.text('HealthIQ Report', margin + 22, 17);

        // Date on right
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        setColor(COLORS.textLight);
        doc.text(
            new Date().toLocaleDateString('en-US'),
            pageW - margin,
            17,
            { align: 'right' }
        );

        // Divider line
        setDraw(COLORS.border);
        doc.setLineWidth(0.5);
        doc.line(margin, 32, pageW - margin, 32);

        y = 42;
    };

    addPageHeader();

    // ══════════════════════════════════════════════════════════════
    // REPORT DETAILS
    // ══════════════════════════════════════════════════════════════

    // Report Info Box
    setFill(COLORS.bg);
    setDraw(COLORS.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setColor(COLORS.textLight);
    doc.text('Report ID', margin + 5, y + 7);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.text);
    doc.text(data.id || 'N/A', margin + 35, y + 7);

    doc.setFont('helvetica', 'bold');
    setColor(COLORS.textLight);
    doc.text('Generated', margin + 5, y + 13);
    doc.setFont('helvetica', 'normal');
    setColor(COLORS.text);
    doc.text(new Date().toLocaleString(), margin + 35, y + 13);

    if (data.filename) {
        doc.setFont('helvetica', 'bold');
        setColor(COLORS.textLight);
        doc.text('Source', margin + 5, y + 19);
        doc.setFont('helvetica', 'normal');
        setColor(COLORS.text);
        const truncatedFilename =
            data.filename.length > 50
                ? data.filename.substring(0, 47) + '...'
                : data.filename;
        doc.text(truncatedFilename, margin + 35, y + 19);
    }

    y += 30;

    // ══════════════════════════════════════════════════════════════
    // ANALYSIS SECTION
    // ══════════════════════════════════════════════════════════════

    if (data.analysis) {
        if (needsNewPage(25)) {
            newPage();
            addPageHeader();
        }

        // Section title with accent bar
        setFill(COLORS.primary);
        doc.rect(margin, y, 3, 8, 'F');

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        setColor(COLORS.dark);
        doc.text('Clinical Analysis', margin + 7, y + 6);

        y += 12;

        // Content box
        const analysisStartY = y;
        setFill(COLORS.white);
        setDraw(COLORS.border);
        doc.roundedRect(margin, y, contentWidth, 0, 2, 2, 'D');

        y += 5;
        addMarkdownText(data.analysis);
        y += 5;

        // Update box height
        const analysisHeight = y - analysisStartY;
        doc.roundedRect(margin, analysisStartY, contentWidth, analysisHeight, 2, 2, 'D');

        y += 5;
    }

    // ══════════════════════════════════════════════════════════════
    // KEY FINDINGS
    // ══════════════════════════════════════════════════════════════

    if (data.findings && data.findings.length > 0) {
        if (needsNewPage(25)) {
            newPage();
            addPageHeader();
        }

        // Section title
        setFill(COLORS.accent);
        doc.rect(margin, y, 3, 8, 'F');

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        setColor(COLORS.dark);
        doc.text('Key Findings', margin + 7, y + 6);

        y += 12;

        const findingsArray = Array.isArray(data.findings)
            ? data.findings.map((f) => (typeof f === 'string' ? f : f.finding))
            : [];

        findingsArray.forEach((finding, idx) => {
            if (needsNewPage(15)) {
                newPage();
                addPageHeader();
            }

            // Finding card
            const cardStartY = y;
            setFill(COLORS.white);
            setDraw(COLORS.border);
            doc.roundedRect(margin, y, contentWidth, 0, 2, 2, 'D');

            // Number badge
            setFill(COLORS.accent);
            doc.circle(margin + 5, y + 5, 2.5, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(`${idx + 1}`, margin + 5, y + 6.5, { align: 'center' });

            // Finding text
            y += 4;
            const parsed = parseMarkdown(finding);
            doc.setFontSize(9);
            doc.setFont('helvetica', parsed.isBold ? 'bold' : 'normal');
            setColor(COLORS.text);

            const lines = doc.splitTextToSize(parsed.text, contentWidth - 18);
            for (const line of lines) {
                if (needsNewPage()) {
                    newPage();
                    addPageHeader();
                }
                doc.text(line, margin + 10, y);
                y += 4;
            }

            y += 2;
            const cardHeight = y - cardStartY;
            doc.roundedRect(margin, cardStartY, contentWidth, cardHeight, 2, 2, 'D');
            y += 3;
        });

        y += 3;
    }

    // ══════════════════════════════════════════════════════════════
    // KEYWORDS
    // ══════════════════════════════════════════════════════════════

    if (data.keywords && data.keywords.length > 0) {
        if (needsNewPage(20)) {
            newPage();
            addPageHeader();
        }

        // Section title
        setFill(COLORS.secondary);
        doc.rect(margin, y, 3, 8, 'F');

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        setColor(COLORS.dark);
        doc.text('Medical Keywords', margin + 7, y + 6);

        y += 12;

        const keywordsArray = Array.isArray(data.keywords)
            ? data.keywords.map((k) => (typeof k === 'string' ? k : k.keyword))
            : [];

        // Render keywords as simple tags
        let xPos = margin;
        const tagHeight = 7;
        const tagSpacing = 3;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        keywordsArray.forEach((keyword) => {
            const textW = doc.getTextWidth(keyword);
            const tagW = textW + 8;

            // Check if tag fits on current line
            if (xPos + tagW > pageW - margin) {
                xPos = margin;
                y += tagHeight + tagSpacing;
                if (needsNewPage()) {
                    newPage();
                    addPageHeader();
                    xPos = margin;
                }
            }

            // Draw tag
            setFill(COLORS.bg);
            setDraw(COLORS.border);
            doc.roundedRect(xPos, y, tagW, tagHeight, 2, 2, 'FD');

            // Text
            setColor(COLORS.text);
            doc.text(keyword, xPos + 4, y + 5);

            xPos += tagW + tagSpacing;
        });

        y += tagHeight + 8;
    }

    // ══════════════════════════════════════════════════════════════
    // REFERENCES
    // ══════════════════════════════════════════════════════════════

    if (includeReferences && data.keywords) {
        const keywordsArray = Array.isArray(data.keywords)
            ? data.keywords.map((k) => (typeof k === 'string' ? k : k.keyword))
            : [];

        const references = await searchReferences(keywordsArray, 3);

        if (references.length > 0) {
            if (needsNewPage(25)) {
                newPage();
                addPageHeader();
            }

            // Section title
            setFill(COLORS.dark);
            doc.rect(margin, y, 3, 8, 'F');

            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            setColor(COLORS.dark);
            doc.text('References', margin + 7, y + 6);

            y += 12;

            references.forEach((ref, idx) => {
                if (needsNewPage(12)) {
                    newPage();
                    addPageHeader();
                }

                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                setColor(COLORS.text);
                doc.text(`[${idx + 1}]`, margin, y);

                const titleLines = doc.splitTextToSize(ref.title, contentWidth - 12);
                for (const line of titleLines) {
                    doc.text(line, margin + 8, y);
                    y += 4;
                }

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                setColor(COLORS.textLight);
                doc.text(`${ref.source}, ${ref.year}`, margin + 8, y);
                y += 7;
            });
        }
    }

    // ══════════════════════════════════════════════════════════════
    // DISCLAIMER
    // ══════════════════════════════════════════════════════════════

    if (needsNewPage(25)) {
        newPage();
        addPageHeader();
    }

    y += 5;

    // Disclaimer box
    setFill('#FEF3C7'); // Amber 100
    setDraw('#FCD34D'); // Amber 300
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14); // Amber 900
    doc.text('⚠ Medical Disclaimer', margin + 5, y + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const disclaimerText =
        'This report is AI-generated and for informational purposes only. It does not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.';
    const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 10);
    let disclaimerY = y + 11;
    disclaimerLines.forEach((line: string) => {
        doc.text(line, margin + 5, disclaimerY);
        disclaimerY += 3.5;
    });

    // ══════════════════════════════════════════════════════════════
    // ADD FOOTERS TO ALL PAGES
    // ══════════════════════════════════════════════════════════════

    const totalPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer line
        setDraw(COLORS.border);
        doc.setLineWidth(0.5);
        doc.line(margin, pageH - 20, pageW - margin, pageH - 20);

        // Footer logo (small)
        if (logoBase64) {
            try {
                // White background for logo
                doc.setFillColor(255, 255, 255);
                doc.rect(margin, pageH - 17, 10, 10, 'F');
                doc.addImage(logoBase64, 'PNG', margin, pageH - 17, 10, 10);
            } catch (e) {
                console.error('Footer logo error:', e);
            }
        }

        // Footer text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        setColor(COLORS.textLight);

        doc.text('HealthIQ Medical Report', margin + 12, pageH - 10.5);
        doc.text(`Page ${i - 1} of ${totalPages - 1}`, pageW / 2, pageH - 10.5, {
            align: 'center',
        });
        doc.text(`© ${new Date().getFullYear()} HealthIQ`, pageW - margin, pageH - 10.5, {
            align: 'right',
        });
    }

    return doc.output('blob');
}

// Backward compatibility
export async function generateReport(
    data: AnalysisData,
    includeReferences: boolean = true
): Promise<Blob> {
    return generateEnhancedReport(data, includeReferences);
}

export async function generateStatisticsReport(analyses: AnalysisData[]): Promise<Blob> {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, pageW - 2 * margin);
        for (const line of lines) {
            doc.text(line, margin, y);
            y += fontSize * 0.5;
        }
        y += 5;
    };

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistics Report', pageW / 2, y, { align: 'center' });
    y += 15;

    addText('Overall Statistics', 14, true);
    addText(`Total analyses: ${analyses.length}`, 11, false);

    const keywordCounts: Record<string, number> = {};
    analyses.forEach((analysis) => {
        if (analysis.keywords) {
            const keywordsArray = Array.isArray(analysis.keywords)
                ? analysis.keywords.map((k) => (typeof k === 'string' ? k : k.keyword))
                : [];
            keywordsArray.forEach((keyword) => {
                keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
            });
        }
    });

    const sortedKeywords = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (sortedKeywords.length > 0) {
        addText('Common Findings', 14, true);
        sortedKeywords.forEach(([keyword, count]) => {
            addText(`${keyword}: ${count}`, 11, false);
        });
    }

    return doc.output('blob');
}
