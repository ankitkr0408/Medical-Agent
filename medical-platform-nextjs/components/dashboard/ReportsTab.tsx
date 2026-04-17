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
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <span className="mr-3">📊</span>
              Medical Reports & Analytics
            </h2>
            <p className="text-blue-100 text-sm">
              Comprehensive analysis history with AI-powered insights
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-center">
            <div className="text-3xl font-bold">{reports.length}</div>
            <div className="text-xs text-blue-100 mt-1">Total Reports</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="spinner mb-4"></div>
          <p className="text-gray-500 text-sm">Loading reports...</p>
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {reports.map((report, index) => {
            const isExpanded = expandedReports.has(report.id);
            return (
              <div
                key={report.id}
                className="bg-white border-2 border-gray-100 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Medical Report Header with Color Accent */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-purple-200 p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-600 text-white rounded-lg px-3 py-1 text-xs font-bold">
                          #{String(index + 1).padStart(3, '0')}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {report.filename}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span>📅</span>
                          {new Date(report.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🕐</span>
                          {new Date(report.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGeneratePDF(report.id)}
                        disabled={generatingPDF === report.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-md hover:shadow-lg"
                      >
                        {generatingPDF === report.id ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Generating...
                          </>
                        ) : (
                          <>
                            <span>📄</span>
                            Export PDF
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        disabled={deletingReport === report.id}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-md hover:shadow-lg"
                        title="Delete Report"
                      >
                        {deletingReport === report.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                <div className="p-6">
                  {/* Analysis Section with Medical Card Style */}
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-l-4 border-blue-600 rounded-lg p-5 mb-5">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center text-base">
                      <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-2 text-sm">🔍</span>
                      Clinical Analysis
                    </h4>
                    <div
                      className={`text-sm text-gray-800 leading-relaxed ${!isExpanded ? 'line-clamp-4' : ''}`}
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(report.analysis) }}
                    />
                  </div>

                  {/* Key Findings - Enhanced Card */}
                  {isExpanded && report.findings && report.findings.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-600 rounded-lg p-5 mb-5">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center text-base">
                        <span className="bg-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-2 text-sm">✓</span>
                        Key Findings
                      </h4>
                      <div className="space-y-2">
                        {report.findings.map((finding: any, idx: number) => {
                          const findingText = typeof finding === 'string' ? finding : finding.finding;
                          return (
                            <div key={idx} className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                              <span className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center mr-3 text-xs font-bold flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span
                                className="text-sm text-gray-800 flex-1"
                                dangerouslySetInnerHTML={{ __html: formatMarkdown(findingText) }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Keywords Section - Enhanced Pills */}
                  {report.keywords && report.keywords.length > 0 && (
                    <div className={`${isExpanded ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-600 rounded-lg p-5' : ''}`}>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center text-base">
                        <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-2 text-sm">🏷️</span>
                        Medical Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {report.keywords.slice(0, isExpanded ? undefined : 6).map((keyword: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs font-semibold shadow-md hover:shadow-lg transition-shadow"
                          >
                            {typeof keyword === 'string' ? keyword : keyword.keyword}
                          </span>
                        ))}
                        {!isExpanded && report.keywords.length > 6 && (
                          <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                            +{report.keywords.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expand/Collapse Button - Enhanced */}
                  <button
                    onClick={() => toggleExpanded(report.id)}
                    className="mt-5 w-full py-3 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 border-2 border-purple-200 hover:border-purple-300"
                  >
                    {isExpanded ? (
                      <span className="flex items-center justify-center gap-2">
                        <span>▲</span>
                        Show Less Details
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>▼</span>
                        Show Full Report
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl p-16 text-center">
          <div className="text-8xl mb-6 animate-pulse">📊</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Reports Available</h3>
          <p className="text-gray-600 text-lg mb-6">
            Start by uploading and analyzing medical images to generate your first report.
          </p>
          <div className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition cursor-pointer">
            Upload Your First Image →
          </div>
        </div>
      )}
    </div>
  );
}
