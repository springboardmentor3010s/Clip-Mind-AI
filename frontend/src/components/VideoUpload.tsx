"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadVideoMultipart } from '@/services/upload';
import { UploadCloud, XCircle, CheckCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/context/AuthContext';

import Link from 'next/link';

interface VideoUploadProps {
  onUploadComplete?: () => void;
  onProcessingComplete?: () => void;
}

export default function VideoUpload({ onUploadComplete, onProcessingComplete }: VideoUploadProps = {}) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [uploadedVideoId, setUploadedVideoId] = useState<number | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Once uploaded, poll for the backend's transcription status — the file
  // finishing its upload doesn't mean processing (Whisper, summarization
  // prerequisites) is done yet.
  useEffect(() => {
    if (status !== 'SUCCESS' || !uploadedVideoId) return;
    if (videoStatus === 'COMPLETED' || videoStatus === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/upload/video/${uploadedVideoId}`);
        if (res.ok) {
          const data = await res.json();
          setVideoStatus(data.status || 'PROCESSING');
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            onProcessingComplete?.();
          }
        }
      } catch (e) {
        console.error("Failed to poll processing status:", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, uploadedVideoId, videoStatus]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('IDLE');
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    multiple: false,
    disabled: status === 'UPLOADING'
  });

  const handleUpload = async () => {
    if (!file) return;

    setStatus('UPLOADING');
    setProgress(0);
    
    abortControllerRef.current = new AbortController();

    await uploadVideoMultipart(
      file,
      (prog) => setProgress(prog),
      (data) => {
        setStatus('SUCCESS');
        setVideoStatus('PROCESSING');
        if (data && data.id) {
          setUploadedVideoId(data.id);
        }
        console.log('Upload complete:', data);
        onUploadComplete?.();
      },
      (err) => {
        setStatus('ERROR');
      },
      abortControllerRef.current.signal,
      token
    );
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus('IDLE');
      setProgress(0);
      setFile(null);
    }
  };

  return (
    <div className="w-full p-6 bg-md-surface-container rounded-xl">
      <h2 className="text-title-large font-semibold mb-4 text-md-on-surface">Upload Video</h2>

      {status === 'IDLE' && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-md-primary bg-md-primary-container/30' : 'border-md-outline-variant hover:border-md-outline'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-md-on-surface-variant mb-4" />
          {file ? (
            <p className="text-md-on-surface font-medium">{file.name} ({(file.size / (1024*1024)).toFixed(2)} MB)</p>
          ) : (
            <p className="text-md-on-surface-variant">Drag & drop a video file here, or click to select</p>
          )}
        </div>
      )}

      {status === 'UPLOADING' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-body-small text-md-on-surface-variant mb-1">
            <span className="font-medium truncate">{file?.name}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-md-surface-container-highest rounded-full h-2.5">
            <div
              className="bg-md-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center text-md-error hover:opacity-80 text-body-small font-medium mt-4"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancel Upload
          </button>
        </div>
      )}

      {status === 'SUCCESS' && videoStatus !== 'COMPLETED' && (
        <div className="text-center p-8 bg-md-secondary-container rounded-xl">
          <Loader className="mx-auto h-12 w-12 text-md-on-secondary-container mb-3 animate-spin" />
          <p className="text-md-on-secondary-container font-medium text-title-medium mb-1">
            {videoStatus === 'FAILED' ? 'Processing Failed' : 'Processing video…'}
          </p>
          <p className="text-md-on-secondary-container/80 text-body-small mb-4">
            {videoStatus === 'FAILED'
              ? 'Something went wrong while transcribing this video.'
              : "Upload finished — we're transcribing and analyzing it now. This can take a minute or two."}
          </p>
          <button
            onClick={() => { setFile(null); setStatus('IDLE'); setUploadedVideoId(null); setVideoStatus(null); }}
            className="text-md-on-secondary-container hover:underline text-body-small font-medium"
          >
            Upload another video
          </button>
        </div>
      )}

      {status === 'SUCCESS' && videoStatus === 'COMPLETED' && (
        <div className="text-center p-8 bg-md-tertiary-container rounded-xl">
          <CheckCircle className="mx-auto h-12 w-12 text-md-on-tertiary-container mb-3" />
          <p className="text-md-on-tertiary-container font-medium text-title-medium mb-4">Video Ready!</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {uploadedVideoId && (
              <Link
                href={`/dashboard/video/${uploadedVideoId}`}
                className="bg-md-primary hover:opacity-90 text-md-on-primary text-body-small font-medium px-4 py-2 rounded-full transition"
              >
                View Transcript & AI Summary
              </Link>
            )}
            <button
              onClick={() => { setFile(null); setStatus('IDLE'); setUploadedVideoId(null); setVideoStatus(null); }}
              className="text-md-on-surface-variant hover:underline text-body-small font-medium"
            >
              Upload another video
            </button>
          </div>
        </div>
      )}

      {status === 'ERROR' && (
        <div className="text-center p-8 bg-md-error-container rounded-xl">
          <XCircle className="mx-auto h-12 w-12 text-md-on-error-container mb-3" />
          <p className="text-md-on-error-container font-medium text-title-medium">Upload Failed</p>
          <button
            onClick={() => setStatus('IDLE')}
            className="mt-4 text-md-on-error-container hover:underline text-body-small font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {status === 'IDLE' && file && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpload}
            className="bg-md-primary text-md-on-primary px-6 py-2 rounded-full font-medium hover:opacity-90 transition flex items-center"
          >
            Start Upload
          </button>
        </div>
      )}
    </div>
  );
}
