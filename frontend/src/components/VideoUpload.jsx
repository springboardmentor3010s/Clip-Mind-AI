import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadVideoMultipart } from '../services/upload';
import { UploadCloud, XCircle, CheckCircle, Video, FileVideo, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoUpload() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, SUCCESS, ERROR
  const abortControllerRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
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
        console.log('Upload complete:', data);
      },
      (err) => {
        setStatus('ERROR');
      },
      abortControllerRef.current.signal
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
          <Video size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Upload Content</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Securely upload your videos to Cloudflare R2.</p>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {status === 'IDLE' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div 
              {...getRootProps()} 
              className={`relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 group
                ${isDragActive ? 'border-blue-500 bg-blue-50/50 shadow-inner' : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
            >
              <input {...getInputProps()} />
              
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="mx-auto h-20 w-20 bg-white shadow-lg rounded-full flex items-center justify-center mb-6 text-indigo-500 group-hover:text-indigo-600 transition-colors"
              >
                <UploadCloud size={40} strokeWidth={1.5} />
              </motion.div>
              
              {file ? (
                <div className="space-y-2">
                  <p className="text-gray-800 font-semibold text-lg flex items-center justify-center gap-2">
                    <FileVideo className="text-indigo-500" size={20} />
                    {file.name}
                  </p>
                  <p className="text-gray-400 text-sm">{(file.size / (1024*1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-700 font-medium text-lg">Drag & drop your video here</p>
                  <p className="text-gray-400 text-sm">Or click to browse from your computer (MP4, WebM, MOV)</p>
                </div>
              )}
            </div>

            {file && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex justify-end"
              >
                <button
                  onClick={handleUpload}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <UploadCloud size={20} />
                  Start Upload
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {status === 'UPLOADING' && (
          <motion.div 
            key="uploading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gray-50/50 border border-gray-100 rounded-3xl"
          >
            <div className="flex items-center justify-between text-sm text-gray-700 font-medium mb-3">
              <span className="flex items-center gap-2 truncate">
                <Loader className="animate-spin text-blue-500" size={18} />
                Uploading {file?.name}
              </span>
              <span className="text-blue-600 font-bold">{progress}%</span>
            </div>
            
            <div className="w-full bg-gray-200/80 rounded-full h-3 mb-6 overflow-hidden shadow-inner">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.5 }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>
            
            <button 
              onClick={handleCancel}
              className="group flex items-center justify-center w-full py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-semibold"
            >
              <XCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Cancel Upload
            </button>
          </motion.div>
        )}

        {status === 'SUCCESS' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 bg-gradient-to-b from-green-50 to-white rounded-3xl border border-green-100 shadow-sm"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="mx-auto h-24 w-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner"
            >
              <ShieldCheck size={48} />
            </motion.div>
            <h3 className="text-2xl text-gray-800 font-bold mb-2">Upload Complete!</h3>
            <p className="text-gray-500 mb-8">Your video has been securely stored in Cloudflare R2 and is ready for AI analysis.</p>
            
            <button 
              onClick={() => { setFile(null); setStatus('IDLE'); }}
              className="bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-xl font-semibold transition-all shadow-sm"
            >
              Upload another video
            </button>
          </motion.div>
        )}

        {status === 'ERROR' && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 bg-red-50/50 rounded-3xl border border-red-100"
          >
            <XCircle className="mx-auto h-20 w-20 text-red-500 mb-4" />
            <h3 className="text-xl text-red-800 font-bold mb-2">Upload Failed</h3>
            <p className="text-red-600/80 mb-6">Something went wrong while transferring your file.</p>
            <button 
              onClick={() => setStatus('IDLE')}
              className="bg-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
