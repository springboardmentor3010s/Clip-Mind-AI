import React, { useState, useRef } from 'react';
import { UploadCloud, FileVideo, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { MAX_VIDEO_SIZE_MB, MAX_VIDEO_SIZE_BYTES, validateVideoFile } from '../constants';

interface FileUploaderProps {
  onSuccess: (video: any) => void;
  onClose?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onSuccess, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('AI & Technology');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'failed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    // Always clear previous errors and states first when user selects a file
    setError(null);
    setUploadStatus('idle');
    setUploadedVideo(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationError = validateVideoFile(selectedFile);

    console.log('[FileUploader] selected file:', {
      name: selectedFile.name,
      sizeBytes: selectedFile.size,
      sizeMB: (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB',
      type: selectedFile.type
    });
    console.log('[FileUploader] max bytes:', MAX_VIDEO_SIZE_BYTES);
    console.log('[FileUploader] validation result:', validationError);

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
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);

      const res = await api.uploadVideo(formData, (percent) => {
        setUploadProgress(percent);
      });

      setUploadStatus('uploaded');
      setUploadedVideo(res);
    } catch (err: any) {
      setUploadStatus('failed');
      setUploadedVideo(null);
      setError(err.message || 'Failed to upload video');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-xl w-full mx-auto relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Upload Video Presentation</h3>
          <p className="text-xs text-slate-400">Extract transcripts, summaries, and key moments using Whisper & BART</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUploadSubmit} className="space-y-4">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10'
              : file
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
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
            <div className="flex items-center justify-center gap-3">
              <FileVideo className="w-8 h-8 text-emerald-400" />
              <div className="text-left">
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[11px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />
            </div>
          ) : (
            <div className="space-y-2">
              <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto opacity-80" />
              <p className="text-xs font-semibold text-slate-200">
                Drag and drop video here or <span className="text-indigo-400 underline">browse</span>
              </p>
              <p className="text-[10px] text-slate-400">MP4, MOV, AVI, MKV, WEBM up to 500MB</p>
            </div>
          )}
        </div>

        {/* Video Metadata Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Video Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lecture 4: Machine Learning Architectures"
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context or educational goals for the video..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="AI & Technology">AI & Technology</option>
            <option value="Education & Lectures">Education & Lectures</option>
            <option value="Business & Strategy">Business & Strategy</option>
            <option value="Creative & Content">Creative & Content</option>
            <option value="General">General</option>
          </select>
        </div>

        {/* Upload Progress Indicator */}
        {uploadStatus === 'uploading' && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Uploading Video File...</span>
              <span className="text-indigo-400 font-semibold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Uploaded Success Status */}
        {uploadStatus === 'uploaded' && uploadedVideo && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Upload complete! Video ID: <strong className="font-mono text-white">{uploadedVideo.id}</strong></span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(uploadStatus === 'idle' || uploadStatus === 'failed') && (
          <button
            type="submit"
            disabled={!file}
            className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            Upload Video File
          </button>
        )}

        {uploadStatus === 'uploaded' && uploadedVideo && (
          <button
            type="button"
            onClick={() => onSuccess(uploadedVideo)}
            className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all mt-2"
          >
            Start Processing Video
          </button>
        )}
      </form>
    </div>
  );
};
