import React from 'react';
import { Link } from 'react-router-dom';
import { FiUpload, FiBarChart2, FiUser, FiShield, FiZap } from 'react-icons/fi';


const Landing = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Transform Your Videos Into
            <span className="text-primary-600 block">Actionable Knowledge</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            ClipMind AI is a video intelligence platform that transforms video content
            into searchable, summarized, and actionable knowledge using AI-powered
            transcription, summarization, and key moment detection.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 border border-primary-600 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FiUpload className="text-primary-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Video Upload</h3>
            <p className="text-sm text-gray-600">
              Upload your videos and let our AI process them automatically.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FiBarChart2 className="text-primary-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Insights</h3>
            <p className="text-sm text-gray-600">
              Get transcripts, summaries, and key moments from your videos.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FiUser className="text-primary-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Role-Based Access</h3>
            <p className="text-sm text-gray-600">
              Secure access with role-based permissions for teams.
            </p>
          </div>
        </div>

        {/* Roles Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Built for Every Role
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { name: 'Administrator', icon: '👑', desc: 'Full system access and management' },
              { name: 'Content Creator', icon: '🎥', desc: 'Upload and manage video content' },
              { name: 'Educator', icon: '📚', desc: 'Access transcripts and summaries' },
              { name: 'Learner', icon: '🎓', desc: 'View and interact with content' },
            ].map(role => (
              <div key={role.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="text-3xl mb-3">{role.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1">{role.name}</h3>
                <p className="text-xs text-gray-500">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
