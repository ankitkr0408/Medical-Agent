// Report Generation Service
import { jsPDF } from 'jspdf';
import { searchReferences, Reference } from './pubmed-service';

interface AnalysisData {
  id: string;
  analysis: string;
  findings?: Array<{ finding: string }> | string[];
  keywords?: Array<{ keyword: string }> | string[];
  filename?: string;
  createdAt?: Date | string;
}

// Helper function to strip markdown formatting
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1')     // Remove italic
    .replace(/###\s+/g, '')          // Remove h3
    .replace(/##\s+/g, '')           // Remove h2
    .replace(/`(.+?)`/g, '$1')       // Remove code blocks
    .trim();
}

// Helper function to parse markdown and apply formatting
function parseMarkdownLine(line: string): { text: string; isBold: boolean; isHeader: boolean; indent: number } {
  let text = line;
  let isBold = false;
  let isHeader = false;
  let indent = 0;

  // Check for headers
  if (text.startsWith('### ')) {
    isHeader = true;
    text = text.substring(4);
  } else if (text.startsWith('## ')) {
    isHeader = true;
    text = text.substring(3);
  }

  // Check for list items
  if (text.match(/^\d+\.\s+/)) {
    // Numbered list
    indent = 5;
  } else if (text.startsWith('- ')) {
    // Bullet list - replace dash with bullet
    text = '• ' + text.substring(2);
    indent = 5;
  }

  // Check for bold text (keep the bold marker for now)
  if (text.includes('**')) {
    isBold = true;
  }

  // Strip markdown
  text = stripMarkdown(text);

  return { text, isBold, isHeader, indent };
}

export async function generateReport(
  data: AnalysisData & { structured?: any },
  includeReferences: boolean = true
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number = 10) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add formatted text
  const addFormattedText = (
    text: string,
    fontSize: number = 11,
    isBold: boolean = false,
    indent: number = 0,
    lineSpacing: number = 1.2
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');

    const lines = doc.splitTextToSize(text, maxWidth - indent);

    for (const line of lines) {
      checkNewPage();
      doc.text(line, margin + indent, yPosition);
      yPosition += fontSize * 0.35 * lineSpacing;
    }
  };

  // Add text with markdown parsing
  const addMarkdownText = (text: string, baseFontSize: number = 11) => {
    const lines = text.split('\n');

    for (const line of lines) {
      if (!line.trim()) {
        yPosition += 3; // Small space for empty lines
        continue;
      }

      const parsed = parseMarkdownLine(line);

      if (parsed.isHeader) {
        yPosition += 5; // Space before header
        checkNewPage(15);
        addFormattedText(parsed.text, 13, true, 0, 1.3);
        yPosition += 2; // Space after header
      } else {
        addFormattedText(parsed.text, baseFontSize, parsed.isBold, parsed.indent, 1.15);
      }
    }
  };

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(88, 28, 135)   // purple-900
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('HealthIQ — AI Medical Imaging Report', pageWidth / 2, 12, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('CLINICAL DECISION SUPPORT  |  FOR LICENSED HEALTHCARE PROFESSIONALS ONLY', pageWidth / 2, 21, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  yPosition = 36

  // ── Report metadata ────────────────────────────────────────────────────────
  doc.setFillColor(248, 245, 255)
  doc.roundedRect(margin, yPosition, maxWidth, 22, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Report ID:', margin + 3, yPosition + 7)
  doc.setFont('helvetica', 'normal')
  doc.text(data.id || 'N/A', margin + 24, yPosition + 7)
  doc.setFont('helvetica', 'bold')
  doc.text('Generated:', margin + 3, yPosition + 15)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleString(), margin + 26, yPosition + 15)
  if (data.filename) {
    doc.setFont('helvetica', 'bold')
    doc.text('Source:', pageWidth / 2 + 3, yPosition + 7)
    doc.setFont('helvetica', 'normal')
    doc.text(data.filename, pageWidth / 2 + 20, yPosition + 7)
  }
  const structured = (data as any).structured
  if (structured?.overall_severity) {
    doc.setFont('helvetica', 'bold')
    doc.text('Severity:', pageWidth / 2 + 3, yPosition + 15)
    doc.setFont('helvetica', 'normal')
    doc.text(structured.overall_severity + (structured.urgent ? '  ⚠ URGENT' : ''), pageWidth / 2 + 22, yPosition + 15)
  }
  yPosition += 28

  // ── Section helper ─────────────────────────────────────────────────────────
  const soapSection = (title: string, letter: string) => {
    checkNewPage(18)
    doc.setFillColor(237, 233, 254)   // purple-100
    doc.rect(margin, yPosition, maxWidth, 10, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(88, 28, 135)
    doc.text(`${letter}  ${title}`, margin + 3, yPosition + 7)
    doc.setTextColor(0, 0, 0)
    yPosition += 14
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // S — SUBJECTIVE  (patient-facing info: file info, date presented)
  // ═══════════════════════════════════════════════════════════════════════════
  soapSection('SUBJECTIVE — Clinical Context', 'S')
  addFormattedText(`Imaging file: ${data.filename || 'unknown'}`, 10, false, 3, 1.2)
  if (structured?.modality) addFormattedText(`Imaging modality: ${structured.modality}`, 10, false, 3, 1.2)
  addFormattedText(`Date of analysis: ${data.createdAt ? new Date(data.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 10, false, 3, 1.2)
  yPosition += 6

  // ═══════════════════════════════════════════════════════════════════════════
  // O — OBJECTIVE  (structured AI findings with confidence)
  // ═══════════════════════════════════════════════════════════════════════════
  soapSection('OBJECTIVE — AI-Extracted Findings', 'O')
  if (structured?.findings?.length > 0) {
    structured.findings.forEach((f: any, i: number) => {
      checkNewPage(12)
      const conf = f.confidence ? ` [${f.confidence} confidence]` : ''
      const sev = f.severity && f.severity !== 'NORMAL' ? `  (${f.severity})` : ''
      addFormattedText(`${i + 1}. ${f.finding}${conf}${sev}`, 10, false, 5, 1.2)
    })
  } else {
    const findingsArray = Array.isArray(data.findings)
      ? data.findings.map(f => typeof f === 'string' ? f : (f as any).finding)
      : []
    if (findingsArray.length > 0) {
      findingsArray.forEach((f, i) => addFormattedText(`${i + 1}. ${stripMarkdown(f)}`, 10, false, 5, 1.2))
    } else {
      addFormattedText('No discrete findings extracted.', 10, false, 5, 1.2)
    }
  }
  const keywordsArray = Array.isArray(data.keywords)
    ? data.keywords.map(k => typeof k === 'string' ? k : (k as any).keyword)
    : []
  if (keywordsArray.length > 0) {
    yPosition += 3
    addFormattedText(`Keywords: ${keywordsArray.join(', ')}`, 9, false, 5, 1.1)
  }
  yPosition += 6

  // ═══════════════════════════════════════════════════════════════════════════
  // A — ASSESSMENT  (full AI analysis narrative)
  // ═══════════════════════════════════════════════════════════════════════════
  soapSection('ASSESSMENT — AI Analysis Narrative', 'A')
  if (data.analysis) {
    addMarkdownText(data.analysis, 10)
  }
  yPosition += 6

  // ═══════════════════════════════════════════════════════════════════════════
  // P — PLAN  (follow-up recommendations + references)
  // ═══════════════════════════════════════════════════════════════════════════
  soapSection('PLAN — Recommended Follow-up', 'P')
  if (structured?.recommended_followup?.length > 0) {
    structured.recommended_followup.forEach((r: string, i: number) => {
      addFormattedText(`${i + 1}. ${r}`, 10, false, 5, 1.2)
    })
  } else {
    addFormattedText('Please consult your healthcare provider for follow-up recommendations.', 10, false, 5, 1.2)
  }
  if (structured?.icd10_hints?.length > 0) {
    yPosition += 3
    addFormattedText(`Approximate ICD-10 references (for coding guidance only): ${structured.icd10_hints.join(', ')}`, 9, false, 5, 1.1)
  }

  // References
  if (includeReferences && keywordsArray.length > 0) {
    const references = await searchReferences(keywordsArray, 3)
    if (references.length > 0) {
      yPosition += 6
      checkNewPage(20)
      doc.setFontSize(10); doc.setFont('helvetica', 'bold')
      doc.text('Supporting Literature', margin + 3, yPosition); yPosition += 6
      references.forEach((ref, i) => {
        checkNewPage(14)
        addFormattedText(`${i + 1}. ${ref.title}`, 9, true, 5, 1.15)
        addFormattedText(`   ${ref.source}, ${ref.year}`, 8, false, 5, 1.1)
        yPosition += 2
      })
    }
  }

  // ── Footer on every page ────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFillColor(248, 245, 255)
    doc.rect(0, pageHeight - 14, pageWidth, 14, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(120, 80, 180)
    doc.text(
      '⚕ CLINICAL DECISION SUPPORT ONLY — AI output must be verified by a licensed physician before clinical action.  |  HealthIQ v2.0',
      pageWidth / 2, pageHeight - 5, { align: 'center' }
    )
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${p} / ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' })
  }
  doc.setTextColor(0, 0, 0)

  return doc.output('blob');
}

export async function generateStatisticsReport(analyses: AnalysisData[]): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);

    for (const line of lines) {
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    }
    yPosition += 5;
  };

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Medical Imaging Statistics Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Overall Statistics
  addText('Overall Statistics', 14, true);
  addText(`Total analyses: ${analyses.length}`, 11, false);
  yPosition += 10;

  // Extract keyword counts
  const keywordCounts: Record<string, number> = {};

  analyses.forEach(analysis => {
    if (analysis.keywords) {
      const keywordsArray = Array.isArray(analysis.keywords)
        ? analysis.keywords.map(k => typeof k === 'string' ? k : k.keyword)
        : [];

      keywordsArray.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    }
  });

  // Sort keywords by frequency
  const sortedKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (sortedKeywords.length > 0) {
    addText('Common Findings', 14, true);
    sortedKeywords.forEach(([keyword, count]) => {
      addText(`${keyword}: ${count} occurrences`, 11, false);
    });
  }

  return doc.output('blob');
}
