import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiBookOpen, FiLoader, FiAlertCircle, FiCheckCircle, FiShare2,
  FiUser, FiCalendar, FiVideo, FiTag, FiLayers,
} from 'react-icons/fi';
import educatorService from '../services/educatorService.js';


const SharedLearningMaterial = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await educatorService.getSharedLearningMaterial(token);
        setData(result);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            'This share link is invalid or has been revoked.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-3">Loading study notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-red-500 text-3xl" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Unable to open study notes</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
        >
          Go to ClipMind AI
        </Link>
      </div>
    );
  }

  const c = data.content || {};

  return (
    <div className="pt-8 pb-16">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
          <FiShare2 />
          Shared by {data.educator_name}
        </div>

        {/* Title card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-7 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
            {data.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
            <span className="inline-flex items-center">
              <FiUser className="mr-1.5 text-green-600" /> {data.educator_name}
            </span>
            <span className="inline-flex items-center">
              <FiVideo className="mr-1.5 text-primary-600" /> {data.video_title}
            </span>
            <span className="inline-flex items-center">
              <FiCalendar className="mr-1.5 text-gray-400" />
              Shared {new Date(data.shared_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Summary */}
        {c.summary && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-7 mb-6">
            <h2 className="font-semibold text-gray-800 mb-2 flex items-center">
              <FiBookOpen className="mr-2 text-primary-500" /> Summary
            </h2>
            <p className="text-gray-600 leading-relaxed">{c.summary}</p>
          </div>
        )}
{/* Key terms */}
        {c.key_terms?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-7 mb-6">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FiTag className="mr-2 text-primary-500" /> Key Terms
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {c.key_terms.map((term, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-800 text-sm">{term.term}</p>
                  {term.definition && (
                    <p className="text-xs text-gray-500 mt-0.5">{term.definition}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flashcards */}
        {c.flashcards?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-7 mb-6">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FiLayers className="mr-2 text-primary-500" /> Flashcards
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {c.flashcards.map((card, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800">{card.front}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.back}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Takeaways */}
        {c.takeaways?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-7 mb-6">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FiCheckCircle className="mr-2 text-green-500" /> Key Takeaways
            </h2>
            <ul className="space-y-2.5">
              {c.takeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                  <span className="text-sm text-gray-700 leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Generated by ClipMind AI • Study notes shared by your instructor
        </p>
      </div>
    </div>
  );
};

export default SharedLearningMaterial;