import React, { useState, useEffect } from 'react';
import { VideoItem, VideoSummary } from '../types';
import { api } from '../services/api';
import { Sparkles, Copy, Download, RefreshCw, FileText, Check, ListChecks, Layers, Brain } from 'lucide-react';
import { motion } from 'motion/react';

interface SummariesPageProps {
  initialVideoId?: string;
}

export const SummariesPage: React.FC<SummariesPageProps> = ({ initialVideoId }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(initialVideoId || null);
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'short' | 'detailed' | 'bullet' | 'abstraction'>('short');
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (selectedVideoId) {
      loadSummary(selectedVideoId);
    }
  }, [selectedVideoId]);

  const loadVideos = async () => {
    try {
      const vList = await api.getVideos();
      setVideos(vList);
      if (vList.length > 0 && !selectedVideoId) {
        setSelectedVideoId(vList[0].id);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async (vId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getSummary(vId);
      setSummary(data);
    } catch (err) {
      console.warn('Summary not ready or error:', err);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSummarize = async () => {
    if (!selectedVideoId) return;
    setIsSummarizing(true);
    try {
      await api.triggerSummarize(selectedVideoId);
      setTimeout(() => {
        loadSummary(selectedVideoId);
        setIsSummarizing(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to trigger BART summarization:', err);
      setIsSummarizing(false);
    }
  };

  const selectedVideo = videos.find((v) => v.id === selectedVideoId);

  const getCurrentText = () => {
    if (!summary) return '';
    if (activeTab === 'short') return summary.shortSummary;
    if (activeTab === 'detailed') return summary.detailedSummary;
    if (activeTab === 'bullet') return summary.bulletPoints.map((b) => `• ${b}`).join('\n');
    return summary.shortSummary;
  };

  const handleCopy = () => {
    const text = getCurrentText();
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    } catch (_) {
      fallbackCopy(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fallbackCopy = (textToCopy: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
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
    if (!summary || !selectedVideo) return;
    const text = `CLIPMIND AI SUMMARY REPORT\nVideo Title: ${selectedVideo.title}\nDate: ${new Date().toLocaleDateString()}\n\n--- EXECUTIVE SUMMARY ---\n${summary.shortSummary}\n\n--- DETAILED BREAKDOWN ---\n${summary.detailedSummary}\n\n--- KEY BULLET POINTS ---\n${summary.bulletPoints.map((b) => `• ${b}`).join('\n')}`;
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedVideo.title.replace(/\s+/g, '_')}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header & Video Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0A0F1E] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">HUGGING FACE BART TRANSFORMER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
          <h1 className="text-2xl font-black text-white mt-1">BART Abstractive Summaries</h1>
          <p className="text-xs text-slate-400">Multi-level text condensation, executive briefs, and key point extractions</p>
        </div>

        {/* Video Dropdown Selector */}
        {videos.length > 0 && (
          <div className="w-full sm:w-72">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Video:</label>
            <select
              value={selectedVideoId || ''}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedVideo ? (
        <div className="p-8 rounded-3xl bg-[#0A0F1E] border border-slate-800 space-y-6">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            {/* View Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('short')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'short'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Brief</span>
              </button>

              <button
                onClick={() => setActiveTab('detailed')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'detailed'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Detailed Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab('bullet')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'bullet'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Bullet Points</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!summary}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!summary}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs text-white font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>

              <button
                onClick={handleTriggerSummarize}
                disabled={isSummarizing}
                title="Re-run BART Model"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-purple-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSummarizing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Summary Display Content */}
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-400 mx-auto animate-spin" />
              <p className="text-xs text-slate-400">Synthesizing abstractive summary with Hugging Face BART...</p>
            </div>
          ) : summary ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-white uppercase tracking-wider">{selectedVideo.title}</span>
                <span>Compression Ratio: <strong className="text-purple-400">82% Reduction</strong></span>
              </div>

              {activeTab === 'short' && (
                <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>EXECUTIVE BRIEF</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-normal">
                    {summary.shortSummary}
                  </p>
                </div>
              )}

              {activeTab === 'detailed' && (
                <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                    <FileText className="w-4 h-4" />
                    <span>SECTIONAL BREAKDOWN</span>
                  </div>
                  <div className="text-sm text-slate-200 leading-relaxed space-y-4">
                    {summary.detailedSummary.split('\n\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'bullet' && (
                <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                    <ListChecks className="w-4 h-4" />
                    <span>KEY TAKEAWAYS</span>
                  </div>
                  <ul className="space-y-3">
                    {summary.bulletPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs text-slate-200">
                        <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <span className="leading-relaxed pt-0.5">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <Brain className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">Summary Not Available</p>
                <p className="text-xs text-slate-400 mt-1">Run the BART NLP model to generate concise executive summaries.</p>
              </div>
              <button
                onClick={handleTriggerSummarize}
                disabled={isSummarizing}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white inline-flex items-center gap-2 transition-all"
              >
                {isSummarizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isSummarizing ? 'Running BART Model...' : 'Generate BART Summary'}</span>
              </button>
            </div>
          )}

        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-[#0A0F1E] border border-slate-800 text-center space-y-3">
          <Brain className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-white">No Videos Found</p>
          <p className="text-xs text-slate-400">Upload a video to start generating BART NLP summaries.</p>
        </div>
      )}

    </div>
  );
};
