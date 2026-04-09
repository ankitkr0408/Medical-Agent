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
  data: AnalysisData,
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

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Medical Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Add a line separator
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Metadata section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Date: `, margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleString(), margin + 15, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'bold');
  doc.text(`Report ID: `, margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.id || 'N/A', margin + 25, yPosition);
  yPosition += 6;

  if (data.filename) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Source File: `, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(data.filename, margin + 28, yPosition);
    yPosition += 6;
  }

  yPosition += 10;

  // Analysis section
  if (data.analysis) {
    checkNewPage(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Analysis', margin, yPosition);
    yPosition += 8;

    addMarkdownText(data.analysis, 10);
    yPosition += 8;
  }

  // Findings section
  if (data.findings && data.findings.length > 0) {
    checkNewPage(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Findings', margin, yPosition);
    yPosition += 8;

    const findingsArray = Array.isArray(data.findings)
      ? data.findings.map(f => typeof f === 'string' ? f : f.finding)
      : [];

    findingsArray.forEach((finding, index) => {
      const parsed = parseMarkdownLine(finding);
      addFormattedText(`${index + 1}. ${parsed.text}`, 10, parsed.isBold, 5, 1.15);
    });
    yPosition += 8;
  }

  // Keywords section
  if (data.keywords && data.keywords.length > 0) {
    checkNewPage(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Keywords / Tags', margin, yPosition);
    yPosition += 8;

    const keywordsArray = Array.isArray(data.keywords)
      ? data.keywords.map(k => typeof k === 'string' ? k : k.keyword)
      : [];

    addFormattedText(keywordsArray.join(', '), 10, false, 0, 1.15);
    yPosition += 8;
  }

  // References section
  if (includeReferences && data.keywords) {
    const keywordsArray = Array.isArray(data.keywords)
      ? data.keywords.map(k => typeof k === 'string' ? k : k.keyword)
      : [];

    const references = await searchReferences(keywordsArray, 3);

    if (references.length > 0) {
      checkNewPage(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Relevant References', margin, yPosition);
      yPosition += 8;

      references.forEach((ref, index) => {
        checkNewPage(15);
        addFormattedText(`${index + 1}. ${ref.title}`, 10, true, 5, 1.15);
        addFormattedText(`   ${ref.source}, ${ref.year}`, 9, false, 5, 1.1);
        yPosition += 3;
      });
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(
    'This report is generated by AI and should be reviewed by a medical professional.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

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
