'use client';

import { useState, useEffect } from 'react';

// Enhanced markdown formatter for medical reports
function formatMarkdown(text: string) {
  return text
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Italic text: *text* -> <em>text</em>
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // Headers: ### text -> <h3>text</h3>
    .replace(/^###\s+(.+)$/gm, '<h3 class="font-bold text-base mt-3 mb-1.5 text-gray-900">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2 class="font-bold text-lg mt-3 mb-1.5 text-gray-900">$1</h2>')
    // Numbered lists: 1. text -> proper list items with tighter spacing
    .replace(/^(\d+)\.\s+\*\*(.+?)\*\*(.*)$/gm, '<div class="ml-4 my-1 flex"><span class="font-semibold text-gray-700 mr-2">$1.</span><span><strong class="font-semibold text-gray-900">$2</strong>$3</span></div>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="ml-4 my-1 flex"><span class="font-semibold text-gray-700 mr-2">$1.</span><span>$2</span></div>')
    // Bullet points: - text -> proper list items with round bullets
    .replace(/^-\s+\*\*(.+?)\*\*(.*)$/gm, '<div class="ml-4 my-1 flex"><span class="text-gray-600 mr-2 text-base leading-tight">●</span><span><strong class="font-semibold text-gray-900">$1</strong>$2</span></div>')
    .replace(/^-\s+(.+)$/gm, '<div class="ml-4 my-1 flex"><span class="text-gray-600 mr-2 text-base leading-tight">●</span><span>$1</span></div>')
    // Code blocks: `code` -> <code>code</code>
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-purple-700">$1</code>')
    // Paragraphs: double line breaks (reduce spacing)
    .replace(/\n\n/g, '<br/>')
    // Single line breaks (reduce spacing)
    .replace(/\n/g, '<br/>');
}

export default function ReportsTab() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState<string | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports?limit=10');
      const data = await response.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (analysisId: string) => {
    setGeneratingPDF(analysisId);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          includeReferences: true,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${analysisId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    setDeletingReport(reportId);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the report from the list
        setReports(reports.filter(r => r.id !== reportId));
      } else {
        alert('Failed to delete report. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report. Please try again.');
    } finally {
      setDeletingReport(null);
    }
  };

  const toggleExpanded = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          📊 Medical Reports & Analytics
        </h3>
        <p className="text-sm text-gray-600">
          View your analysis history and generate detailed PDF reports.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report, index) => {
            const isExpanded = expandedReports.has(report.id);
            return (
              <div
                key={report.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Header Section */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        📋 Analysis #{index + 1}: {report.filename}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGeneratePDF(report.id)}
                        disabled={generatingPDF === report.id}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm font-medium"
                      >
                        {generatingPDF === report.id ? '⏳ Generating...' : '📄 PDF'}
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        disabled={deletingReport === report.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm font-medium"
                      >
                        {deletingReport === report.id ? '⏳ Deleting...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Analysis Preview/Full */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <span className="mr-2">🔍</span>
                        Analysis
                      </h5>
                      <div
                        className={`text-sm text-gray-700 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(report.analysis) }}
                      />
                    </div>

                    {/* Key Findings - Only show when expanded */}
                    {isExpanded && report.findings && report.findings.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <span className="mr-2">✓</span>
                          Key Findings
                        </h5>
                        <div className="space-y-1">
                          {report.findings.map((finding: any, idx: number) => {
                            const findingText = typeof finding === 'string' ? finding : finding.finding;
                            return (
                              <div key={idx} className="flex items-start ml-4 my-1">
                                <span className="text-purple-600 mr-2 text-base leading-tight">●</span>
                                <span
                                  className="text-sm text-gray-700"
                                  dangerouslySetInnerHTML={{ __html: formatMarkdown(findingText) }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Keywords */}
                    {report.keywords && report.keywords.length > 0 && (
                      <div className={isExpanded ? 'pt-2 border-t border-gray-100' : ''}>
                        <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <span className="mr-2">🏷️</span>
                          Keywords
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {report.keywords.slice(0, isExpanded ? undefined : 5).map((keyword: any, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                            >
                              {typeof keyword === 'string' ? keyword : keyword.keyword}
                            </span>
                          ))}
                          {!isExpanded && report.keywords.length > 5 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              +{report.keywords.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpanded(report.id)}
                    className="mt-4 w-full py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                  >
                    {isExpanded ? '▲ Show Less' : '▼ Show More'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
          <p className="text-gray-600">
            Upload and analyze medical images to generate reports.
          </p>
        </div>
      )}
    </div>
  );
}
