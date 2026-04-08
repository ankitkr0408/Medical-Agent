'use client';

import { useState, useEffect } from 'react';

export default function ReportsTab() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

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
          {reports.map((report, index) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    📋 Analysis #{index + 1}: {report.filename}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleGeneratePDF(report.id)}
                  disabled={generatingPDF === report.id}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm"
                >
                  {generatingPDF === report.id ? '⏳ Generating...' : '📄 Download PDF'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Analysis</h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
                    {report.analysis}
                  </p>
                </div>

                {report.findings && report.findings.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Key Findings</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {report.findings.map((finding: any, idx: number) => (
                        <li key={idx} className="text-sm text-gray-700">
                          {typeof finding === 'string' ? finding : finding.finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.keywords && report.keywords.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Keywords</h5>
                    <div className="flex flex-wrap gap-2">
                      {report.keywords.map((keyword: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {typeof keyword === 'string' ? keyword : keyword.keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
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
