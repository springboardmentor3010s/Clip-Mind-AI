import React, { useEffect, useState } from 'react';
import {
  FiShare2, FiLink, FiCopy, FiCheck, FiTrash2, FiPlus,
  FiLoader, FiAlertCircle,
} from 'react-icons/fi';
import educatorService from '../services/educatorService.js';


const buildShareUrl = (token) => `${window.location.origin}/study-notes/${token}`;

const MaterialSharePanel = ({ videoId, materialId, disabled = false }) => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [error, setError] = useState('');

  const activeShares = shares.filter((s) => s.is_active);

  useEffect(() => {
    if (videoId && materialId) loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, materialId]);

  const loadShares = async () => {
    try {
      setLoading(true);
      const data = await educatorService.getLearningMaterialShares(videoId, materialId);
      setShares(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load share links');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const share = await educatorService.createLearningMaterialShare(videoId, materialId);
      setShares((prev) => [share, ...prev.filter((s) => s.id !== share.id)]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create share link');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (shareId) => {
    if (!window.confirm('Revoke this share link? Students using it will lose access.')) return;
    setError('');
    try {
      await educatorService.revokeLearningMaterialShare(videoId, materialId, shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to revoke share link');
    }
  };

  const handleCopy = async (token) => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(token));
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (_) {
      setError('Could not copy link. Try selecting it manually.');
    }
  };

  return (
    <div className="border border-primary-200 bg-primary-50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <FiShare2 className="mr-2 text-primary-600" /> Share with Students
        </h3>
      </div>

      <div className="mt-3 space-y-3">
        <p className="text-xs text-gray-500">
          Anyone with the link can view these study notes — perfect for sharing
          the notes with your students. You can revoke a link at any time.
        </p>

        {error && (
          <div className="flex items-center text-xs text-red-600">
            <FiAlertCircle className="mr-1.5" /> {error}
          </div>
        )}

        {activeShares.length > 0 ? (
          <div className="space-y-2">
            {activeShares.map((share) => (
              <div
                key={share.id}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 pl-3"
              >
                <FiLink className="text-gray-400 shrink-0" />
                <a
                  href={buildShareUrl(share.token)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-700 truncate flex-1 min-w-0"
                >
                  {buildShareUrl(share.token)}
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(share.token)}
                  disabled={copiedToken === share.token}
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    copiedToken === share.token
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                  aria-label="Copy link"
                >
                  {copiedToken === share.token ? <FiCheck /> : <FiCopy />}
                </button>
                <button
                  type="button"
                  onClick={() => handleRevoke(share.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                  aria-label="Revoke link"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            No active share links. Create one to give students access to these notes.
          </p>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || disabled}
          className="inline-flex items-center px-3.5 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {creating ? <FiLoader className="animate-spin mr-1.5" /> : <FiPlus className="mr-1.5" />}
          {creating ? 'Creating...' : 'Create Share Link'}
        </button>

        {loading && <p className="text-xs text-gray-400">Refreshing...</p>}
      </div>
    </div>
  );
};

export default MaterialSharePanel;