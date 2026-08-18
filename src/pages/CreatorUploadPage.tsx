import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UploadCloud, FileVideo, CheckCircle2, AlertCircle, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { MAX_VIDEO_SIZE_MB, MAX_VIDEO_SIZE_BYTES, validateVideoFile } from '../constants';

interface UploadPageProps {
  onNavigate: (tab: string, videoId?: string) => void;
}

export const CreatorUploadPage: React.FC<UploadPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'failed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    // Always clear previous errors and states first when user selects a file
    setError(null);
    setUploadStatus('idle');
    setUploadedVideoId(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationError = validateVideoFile(selectedFile);

    console.log('[UPLOAD] selected file:', {
      name: selectedFile.name,
      sizeBytes: selectedFile.size,
      sizeMB: (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB',
      type: selectedFile.type
    });
    console.log('[UPLOAD] max bytes:', MAX_VIDEO_SIZE_BYTES);
    console.log('[UPLOAD] validation result:', validationError);

    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    // Valid file - ensure error remains null
    setError(null);
    setFile(selectedFile);
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateVideoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);

    console.log('[FRONTEND UPLOAD LOG]:', {
      'file.name': file!.name,
      'file.size': file!.size,
      'file.size / 1024 / 1024': file!.size / 1024 / 1024,
      'upload endpoint': '/videos/upload'
    });

    try {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('title', title || file!.name);
      formData.append('description', description);

      const res = await api.uploadVideo(formData, (percent) => {
        setUploadProgress(percent);
      });

      setUploadStatus('uploaded');
      setUploadedVideoId(res.id);
    } catch (err: any) {
      setUploadStatus('failed');
      setUploadedVideoId(null);
      setError(err.message || 'Failed to upload video');
    }
  };

  const handleStartProcessing = () => {
    if (uploadedVideoId) {
      onNavigate('creator-processing', uploadedVideoId);
    } else {
      onNavigate('creator-videos');
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-white">Upload Footage</h1>
        <p className="text-sm text-slate-400">
          Drop a video in and ClipMind will start transcribing and analyzing it.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="p-8 sm:p-10 rounded-3xl bg-[#0D1220] border border-slate-800/80 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[100px] pointer-events-none" />

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-xs text-red-300">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[240px] ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.mov,.webm,.avi,.mkv,.m4v,.wmv,.flv,.3gp,.mpeg,.mpg,.ogv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  validateAndSetFile(e.target.files[0]);
                }
              }}
            />

            {file ? (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <FileVideo className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-white max-w-md truncate">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> File Selected
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-200">
                    Drag and drop a video file
                  </p>
                  <p className="text-xs text-blue-400 font-semibold underline">
                    or click to browse
                  </p>
                </div>
                <p className="text-[11px] text-slate-500">
                  Supported: MP4, MOV, WEBM, AVI, MKV (Up to 500 MB)
                </p>
              </div>
            )}
          </div>

          {file && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Video Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'uploaded'}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              {/* Uploading Progress Bar */}
              {uploadStatus === 'uploading' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      Uploading Video File...
                    </span>
                    <span className="text-blue-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Transmitting video data to server...</span>
                    <span className="text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB total</span>
                  </div>
                </div>
              )}

              {/* Uploaded Success Status */}
              {uploadStatus === 'uploaded' && uploadedVideoId && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-emerald-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Upload complete! Video ID: <strong className="font-mono text-white">{uploadedVideoId}</strong></span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">Ready</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                {(uploadStatus === 'idle' || uploadStatus === 'failed') && (
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Video File</span>
                  </button>
                )}

                {uploadStatus === 'uploaded' && (
                  <button
                    type="button"
                    onClick={handleStartProcessing}
                    className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Start Processing Video</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
