import React from 'react';
import { ProcessingStatus as StatusType } from '../types';
import { CheckCircle2, Clock, Loader2, AlertCircle, Cpu, Mic, FileText, Sparkles } from 'lucide-react';

interface ProcessingStatusProps {
  status: StatusType;
  progress: number;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status, progress }) => {
  const steps = [
    { key: 'PROCESSING_FFMPEG', label: 'FFmpeg Processing', icon: <Cpu className="w-4 h-4" /> },
    { key: 'TRANSCRIBING_WHISPER', label: 'Whisper Speech-to-Text', icon: <Mic className="w-4 h-4" /> },
    { key: 'SUMMARIZING_BART', label: 'BART NLP Summarization', icon: <FileText className="w-4 h-4" /> },
    { key: 'DETECTING_KEY_MOMENTS', label: 'Key Moments & Highlights', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const getStepIndex = (st: StatusType) => {
    switch (st) {
      case 'QUEUED': return 0;
      case 'PROCESSING_FFMPEG': return 0;
      case 'TRANSCRIBING_WHISPER': return 1;
      case 'SUMMARIZING_BART': return 2;
      case 'DETECTING_KEY_MOMENTS': return 3;
      case 'COMPLETED': return 4;
      case 'FAILED': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  if (status === 'COMPLETED') {
    return (
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs font-semibold text-emerald-300">AI Processing Complete</p>
            <p className="text-[11px] text-slate-400">Transcript, summary, and key moments ready for review</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/20">
          100% Ready
        </span>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-xs">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div>
          <p className="font-semibold">Processing Error Encountered</p>
          <p className="text-[11px] text-slate-400">Unable to complete processing. Check file encoding or retry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-xs font-bold text-white">AI Processing Pipeline Active</span>
        </div>
        <span className="text-xs font-extrabold text-indigo-400">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
        {steps.map((step, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <div
              key={step.key}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isCurrent
                  ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={isDone ? 'text-emerald-400' : isCurrent ? 'text-indigo-400' : 'text-slate-500'}>
                  {step.icon}
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <p className="text-[10px] font-semibold truncate">{step.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
