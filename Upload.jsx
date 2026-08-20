import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFile, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import videoService from '../services/videoService.js';
import { useNavigate } from 'react-router-dom';


const Upload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        setError('File type not supported. Allowed: MP4, MOV, AVI, MKV, WebM');
        return;
      }
      // Validate file size (100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError('File size exceeds 100MB limit');
        return;
      }
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      setError('');
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file || !title) {
      setError('Please select a file and provide a title');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      const result = await videoService.uploadVideo(
        title,
        description,
        file,
        (progress) => setUploadProgress(progress)
      );
      setSuccess('Video uploaded successfully!');
      setTimeout(() => navigate('/my-videos'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Upload Video</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Upload your video to get started with AI processing
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <FiAlertCircle className="mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <FiCheck className="mr-2" />
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : isDragReject
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-primary-500 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <FiUpload className="mx-auto text-4xl text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-primary-600">Drop the video file here...</p>
            ) : (
              <>
                <p className="text-gray-700 font-medium mb-2">
                  Drag & drop a video file, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: MP4, MOV, AVI, MKV, WebM (max 100MB)
                </p>
              </>
            )}
          </div>

          {/* File Preview */}
          {file && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FiFile className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-red-600"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter video title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter video description"
                rows={3}
              />
            </div>
          </div>

          {/* Upload Button */}
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={uploading || !file || !title}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? `Processing... (${uploadProgress}%)` : 'Upload Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
