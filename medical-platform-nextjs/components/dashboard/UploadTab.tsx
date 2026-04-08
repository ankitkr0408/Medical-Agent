'use client';

import { useState } from 'react';
import Image from 'next/image';

interface UploadTabProps {
  enableXAI: boolean;
  includeReferences: boolean;
  setActiveTab: (tab: number) => void;
}

export default function UploadTab({ enableXAI, includeReferences, setActiveTab }: UploadTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [references, setReferences] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysis(null);
      setReferences([]);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !preview) return;

    setAnalyzing(true);

    try {
      // Analyze image
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: preview,
          filename: file.name,
          enableXAI,
        }),
      });

      const analyzeData = await analyzeResponse.json();

      if (analyzeData.success) {
        setAnalysis(analyzeData.data);

        // Fetch references if enabled
        if (includeReferences && analyzeData.data.keywords?.length > 0) {
          const refResponse = await fetch('/api/pubmed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keywords: analyzeData.data.keywords,
              type: 'pubmed',
              maxResults: 3,
            }),
          });

          const refData = await refResponse.json();
          if (refData.success) {
            setReferences(refData.data);
          }
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartDiscussion = async () => {
    if (!analysis) return;

    try {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `Discussion: ${file?.name}`,
          caseDescription: analysis.findings[0] || 'Case discussion',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActiveTab(2); // Switch to Collaboration tab
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
    }
  };

  const handleStartQA = async () => {
    if (!analysis) return;

    try {
      const response = await fetch('/api/qa/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `Q&A for ${file?.name}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActiveTab(3); // Switch to Q&A tab
      }
    } catch (error) {
      console.error('Error creating QA session:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.dcm,.nii,.nii.gz"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-6xl mb-4">📤</div>
          <div className="text-lg font-semibold text-gray-700 mb-2">
            Upload a medical image
          </div>
          <div className="text-sm text-gray-500">
            Supports JPEG, PNG, DICOM, NIfTI formats
          </div>
        </label>
      </div>

      {/* Preview and Analysis */}
      {preview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Uploaded Image</h3>
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Uploaded medical image"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                <strong>Filename:</strong> {file?.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Size:</strong> {((file?.size || 0) / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {analyzing ? '🔍 Analyzing...' : '🔍 Analyze Image'}
            </button>
          </div>

          {/* Analysis Results */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Analysis Results</h3>
            {analyzing ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="spinner mb-4"></div>
                <p className="text-gray-600">Analyzing image with AI...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Detailed Analysis</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysis.analysis}</p>
                </div>

                {analysis.findings && analysis.findings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Key Findings</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.findings.map((finding: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700">{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.keywords && analysis.keywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywords.map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {enableXAI && (analysis.heatmap || analysis.overlay) && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Explainable AI Visualization</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {analysis.overlay && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Heatmap Overlay</p>
                          <img src={analysis.overlay} alt="Overlay" className="w-full rounded" />
                        </div>
                      )}
                      {analysis.heatmap && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Raw Heatmap</p>
                          <img src={analysis.heatmap} alt="Heatmap" className="w-full rounded" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {references.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Relevant Medical Literature</h4>
                    <ul className="space-y-2">
                      {references.map((ref, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          <strong>{ref.title}</strong>
                          <br />
                          <span className="text-gray-500">
                            {ref.journal}, {ref.year} (PMID: {ref.id})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Collaboration Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Collaborate</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleStartDiscussion}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                    >
                      💬 Start Discussion
                    </button>
                    <button
                      onClick={handleStartQA}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                    >
                      ❓ Start Q&A
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                Upload and analyze an image to see results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
