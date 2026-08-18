import React, { useState } from 'react';
import { VideoSummary } from '../types';
import { Clock, Copy, Check, Download, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface SummaryViewerProps {
  summary: VideoSummary | null;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({ summary }) => {
  const [activeTab, setActiveTab] = useState<'short' | 'detailed' | 'abstraction'>('short');
  const [copied, setCopied] = useState(false);

  if (!summary) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
        <Sparkles className="w-8 h-8 mx-auto text-slate-600 mb-2" />
        <p className="text-xs font-semibold">No summary generated yet.</p>
      </div>
    );
  }

  const handleCopy = () => {
    let textToCopy = summary.shortSummary;
    if (activeTab === 'detailed') textToCopy = summary.detailedSummary;
    if (activeTab === 'abstraction') textToCopy = summary.contentAbstraction;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).catch(() => {
          fallbackCopy(textToCopy);
        });
      } else {
        fallbackCopy(textToCopy);
      }
    } catch (_) {
      fallbackCopy(textToCopy);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (e) {
      console.warn('Fallback copy failed', e);
    }
  };

  const handleDownload = () => {
    const content = `CLIPMIND AI SUMMARY
Short Summary:
${summary.shortSummary}

Executive Abstraction:
${summary.contentAbstraction}

Detailed Section Analysis:
${summary.detailedSummary}

Key Takeaways:
${summary.bulletPoints.map((b) => `- ${b}`).join('\n')}
`;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `summary_${summary.videoId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Reading Time */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('short')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'short'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Short</span>
          </button>

          <button
            onClick={() => setActiveTab('detailed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'detailed'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Detailed</span>
          </button>

          <button
            onClick={() => setActiveTab('abstraction')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'abstraction'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Abstraction</span>
          </button>
        </div>

        {/* Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{summary.readingTimeMinutes} min read</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        {activeTab === 'short' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Concise Short Summary</h4>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">{summary.shortSummary}</p>
            </div>

            {/* Key Takeaways List */}
            {summary.bulletPoints && summary.bulletPoints.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80">
                <h5 className="text-xs font-bold text-slate-400 mb-3">Key Takeaways</h5>
                <ul className="space-y-2">
                  {summary.bulletPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'detailed' && (
          <div className="space-y-3 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Multi-Section Detailed Breakdown</h4>
            <div className="prose prose-invert prose-xs max-w-none">
              {summary.detailedSummary}
            </div>
          </div>
        )}

        {activeTab === 'abstraction' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Executive Content Abstraction</h4>
            <p className="text-sm text-slate-200 leading-relaxed italic bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
              "{summary.contentAbstraction}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
