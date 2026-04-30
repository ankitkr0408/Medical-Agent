'use client';

import { useState } from 'react';

interface UploadTabProps {
  enableXAI: boolean;
  includeReferences: boolean;
  setActiveTab: (tab: number) => void;
}

// Renders markdown the same way Streamlit does
function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="prose prose-sm max-w-none text-gray-800 space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith('### '))
          return <h3 key={i} className="text-base font-bold text-purple-800 mt-4 mb-1 border-b border-purple-100 pb-1">{line.slice(4)}</h3>;
        if (line.startsWith('## '))
          return <h2 key={i} className="text-lg font-bold text-gray-900 mt-5 mb-2">{line.slice(3)}</h2>;
        if (line.startsWith('# '))
          return <h1 key={i} className="text-xl font-bold text-gray-900 mt-5 mb-2">{line.slice(2)}</h1>;
        // Bold-only lines act as section headers (Streamlit response style)
        if (/^\*\*[^*]+\*\*:?\s*$/.test(line.trim()))
          return <h4 key={i} className="text-sm font-bold text-purple-800 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: fmt(line) }} />;
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <div key={i} className="flex gap-2 ml-4 my-0.5">
              <span className="text-purple-500 mt-1 text-xs">●</span>
              <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: fmt(line.slice(2)) }} />
            </div>
          );
        if (/^\d+\.\s/.test(line)) {
          const m = line.match(/^(\d+)\.\s(.*)$/);
          if (m)
            return (
              <div key={i} className="flex gap-2 ml-4 my-0.5">
                <span className="text-purple-600 font-semibold min-w-[1.4rem]">{m[1]}.</span>
                <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: fmt(m[2]) }} />
              </div>
            );
        }
        if (line.trim() === '') return <div key={i} className="h-1.5" />;
        return <p key={i} className="my-0.5 leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: fmt(line) }} />;
      })}
    </div>
  );
}

function fmt(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm font-mono">$1</code>');
}

const SEVERITY_STYLES: Record<string, string> = {
  NORMAL:   'bg-green-100 text-green-800 border-green-300',
  MILD:     'bg-yellow-100 text-yellow-800 border-yellow-300',
  MODERATE: 'bg-orange-100 text-orange-800 border-orange-300',
  SEVERE:   'bg-red-100 text-red-800 border-red-300',
  CRITICAL: 'bg-red-200 text-red-900 border-red-500 font-bold animate-pulse',
}

const SEVERITY_ICONS: Record<string, string> = {
  NORMAL: '✅', MILD: '🟡', MODERATE: '🟠', SEVERE: '🔴', CRITICAL: '🚨',
}

function SeverityBadge({ severity, small }: { severity?: string; small?: boolean }) {
  if (!severity) return null;
  const cls = SEVERITY_STYLES[severity] ?? 'bg-gray-100 text-gray-700 border-gray-300';
  const icon = SEVERITY_ICONS[severity] ?? '⚪';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${small ? 'text-[10px]' : ''} ${cls}`}>
      {icon} {severity}
    </span>
  );
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high:   'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  low:    'bg-gray-50 text-gray-500 border-gray-200',
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const cls = CONFIDENCE_STYLES[confidence] ?? CONFIDENCE_STYLES.low;
  const pct = confidence === 'high' ? '~90%' : confidence === 'medium' ? '~65%' : '~40%';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium ${cls}`}>
      {pct} confidence
    </span>
  );
}

export default function UploadTab({ enableXAI, includeReferences, setActiveTab }: UploadTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<{ overlay: string; heatmap: string } | null>(null);
  const [references, setReferences] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setAnalysis(null);
    setHeatmap(null);
    setReferences([]);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleAnalyze = async () => {
    if (!file || !preview) return;
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setHeatmap(null);
    setReferences([]);
    setStreamingText('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: preview, filename: file.name, enableXAI }),
      });

      if (!res.ok || !res.body) throw new Error('Analysis request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalData: any = null;
      let accumulatedText = '';   // local var — not subject to stale closure

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'meta') {
              if (enableXAI && event.overlay && event.heatmap) {
                setHeatmap({ overlay: event.overlay, heatmap: event.heatmap });
              }
            } else if (event.type === 'token') {
              accumulatedText += event.text;
              setStreamingText(accumulatedText);
            } else if (event.type === 'done') {
              finalData = event;
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }

      if (finalData) {
        setAnalysis({
          id: finalData.id,
          analysis: accumulatedText,
          findings: finalData.findings,
          keywords: finalData.keywords,
          severity: finalData.severity,
          date: finalData.date,
          structured: finalData.structured ?? null,
        });

        // Fetch PubMed references if enabled
        if (includeReferences && finalData.keywords?.length) {
          const refRes = await fetch('/api/pubmed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords: finalData.keywords }),
          });
          const refData = await refRes.json();
          if (refData.success) setReferences(refData.data || []);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartDiscussion = async () => {
    if (!analysis) return;
    const desc = analysis.findings?.[0] || file?.name || 'Case discussion';
    const fileType = file?.name.split('.').pop()?.toUpperCase() || 'CASE';
    await fetch('/api/chat/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseDescription: desc, fileType }),
    });
    setActiveTab(2);
  };

  const handleStartQA = async () => {
    if (!file) return;
    await fetch('/api/qa/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName: `Q&A for ${file.name}` }),
    });
    setActiveTab(3);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">📤 Upload & Analyze Medical Image</h2>

      {/* Upload area */}
      <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center bg-purple-50 hover:bg-purple-100 transition">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.dcm,.nii,.nii.gz"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-4xl mb-3">🏥</div>
          <p className="text-purple-700 font-semibold text-lg">
            {file ? file.name : 'Click to upload a medical image'}
          </p>
          <p className="text-sm text-gray-500 mt-1">JPEG, PNG, DICOM, NIfTI — max 50MB</p>
        </label>
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img src={preview} alt="Preview" className="w-full max-h-80 object-contain bg-black" />
        </div>
      )}

      {/* Analyze button */}
      {file && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analyzing image...
            </>
          ) : '🔍 Analyze Image'}
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Live streaming panel — shown while analyzing */}
      {analyzing && streamingText && (
        <div className="bg-white border border-purple-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            AI Analysis — Live
          </h3>
          <MarkdownContent text={streamingText} />
          <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1 align-middle" />
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-5">

          {/* Severity + modality header bar */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
            <SeverityBadge severity={analysis.severity} />
            {analysis.structured?.urgent && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                ⚠️ URGENT — Seek immediate medical attention
              </span>
            )}
            {analysis.structured?.modality && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                🩺 {analysis.structured.modality}
              </span>
            )}
            <span className="ml-auto text-xs text-gray-400">{analysis.date}</span>
          </div>

          {/* Structured findings with confidence badges */}
          {analysis.structured?.findings?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                📋 Structured Findings
                <span className="text-xs font-normal text-gray-400 ml-1">AI-extracted with confidence levels</span>
              </h3>
              <div className="space-y-2">
                {analysis.structured.findings.map((f: any, i: number) => (
                  <div key={i} className="flex flex-wrap items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-gray-700 flex-1 text-sm">{f.finding}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <ConfidenceBadge confidence={f.confidence} />
                      <SeverityBadge severity={f.severity} small />
                    </div>
                  </div>
                ))}
              </div>
              {analysis.structured.icd10_hints?.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  Approximate ICD-10 references: {analysis.structured.icd10_hints.join(', ')} — for clinical reference only
                </p>
              )}
            </div>
          )}

          {/* Main analysis text */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              🔬 Full AI Analysis
            </h3>
            <MarkdownContent text={analysis.analysis} />
          </div>

          {/* Recommended follow-up */}
          {analysis.structured?.recommended_followup?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-blue-800 mb-2">📅 Recommended Follow-up</h3>
              <ul className="space-y-1">
                {analysis.structured.recommended_followup.map((r: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-blue-700">
                    <span className="text-blue-400 mt-0.5">→</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keywords */}
          {analysis.keywords?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 mr-1">Keywords:</span>
              {analysis.keywords.map((k: string, i: number) => (
                <span key={i} className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{k}</span>
              ))}
            </div>
          )}

          {/* XAI Heatmap */}
          {enableXAI && heatmap && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-1">🔥 Explainable AI Heatmap</h3>
              <p className="text-xs text-gray-400 mb-4">JET colormap overlay highlights regions of interest. Red = high intensity, Blue = low intensity.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 text-center">Overlay (50/50 blend)</p>
                  <img src={heatmap.overlay} alt="Heatmap Overlay" className="w-full rounded-lg border border-gray-200" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 text-center">Raw Heatmap</p>
                  <img src={heatmap.heatmap} alt="Raw Heatmap" className="w-full rounded-lg border border-gray-200" />
                </div>
              </div>
            </div>
          )}

          {/* Medical References */}
          {includeReferences && references.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-3">📚 Relevant Medical Literature</h3>
              <ul className="space-y-3">
                {references.map((ref: any, i: number) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
                    <div>
                      <span className="font-medium text-gray-800">{ref.title}</span>
                      <span className="text-gray-500 ml-2">{ref.journal}, {ref.year}</span>
                      {ref.id && <span className="text-xs text-purple-500 ml-2">PMID: {ref.id}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Medical disclaimer — industry standard */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <span className="text-amber-500 flex-shrink-0 text-lg">⚕️</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Clinical Decision Support Tool.</strong> This AI analysis is intended to assist licensed healthcare professionals and does not constitute a medical diagnosis. All findings must be verified by a qualified physician before clinical action. Do not make treatment decisions based solely on this output.
            </p>
          </div>

          {/* Collaborate */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="text-base font-bold text-gray-900 mb-3">🤝 Next Steps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button onClick={handleStartDiscussion}
                className="py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">
                💬 Multidisciplinary Discussion
              </button>
              <button onClick={handleStartQA}
                className="py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">
                ❓ Ask Questions About This Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
