import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  FiArrowLeft, FiBookOpen, FiZap, FiPlus, FiEdit3, FiTrash2,
  FiSave, FiLoader, FiAlertCircle, FiChevronDown, FiChevronUp,
  FiTag, FiLayers, FiCheckCircle, FiDownload, FiShare2,
} from 'react-icons/fi';
import videoService from '../services/videoService.js';
import educatorService from '../services/educatorService.js';
import MaterialSharePanel from '../components/MaterialSharePanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';


const emptyContent = () => ({
  summary: '',
  key_terms: [],
  flashcards: [],
  takeaways: [],
});

function normalizeContent(content) {
  return {
    summary: content?.summary || '',
    key_terms: (content?.key_terms || []).map((t) => ({
      term: t?.term || '',
      definition: t?.definition || '',
    })),
    flashcards: (content?.flashcards || []).map((f) => ({
      front: f?.front || '',
      back: f?.back || '',
    })),
    takeaways: (content?.takeaways || []).filter((t) => t && String(t).trim()),
  };
}

const LearningMaterials = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [video, setVideo] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [generating, setGenerating] = useState(false);
  const [genTitle, setGenTitle] = useState('Study Notes');

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState(emptyContent());
  const [saving, setSaving] = useState(false);

  const [expanded, setExpanded] = useState({});
  const [shareOpenId, setShareOpenId] = useState(null);

  const isOwner = !!video && video.user_id === user?.id;

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [videoData, materialsData] = await Promise.all([
        videoService.getVideo(videoId),
        educatorService.getLearningMaterials(videoId).catch(() => []),
      ]);
      setVideo(videoData);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load learning materials');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const material = await educatorService.generateLearningMaterial(
        videoId,
        genTitle.trim() || 'Study Notes'
      );
      setMaterials((prev) => [material, ...prev]);
      setExpanded((prev) => ({ ...prev, [material.id]: true }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate learning material');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!editTitle.trim()) {
      setError('Please provide a title for the study notes.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const material = await educatorService.createLearningMaterial(videoId, {
        title: editTitle.trim(),
        content: normalizeContent(editContent),
      });
      setMaterials((prev) => [material, ...prev]);
      setShowCreate(false);
      setEditTitle('');
      setEditContent(emptyContent());
      setExpanded((prev) => ({ ...prev, [material.id]: true }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create learning material');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (material) => {
    setEditingId(material.id);
    setEditTitle(material.title);
    setEditContent(JSON.parse(JSON.stringify(material.content || emptyContent())));
  };

  const handleSave = async (material) => {
    setSaving(true);
    setError('');
    try {
      const updated = await educatorService.updateLearningMaterial(videoId, material.id, {
        title: editTitle.trim(),
        content: normalizeContent(editContent),
      });
      setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save learning material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (material) => {
    if (!window.confirm('Delete this learning material?')) return;
    setError('');
    try {
      await educatorService.deleteLearningMaterial(videoId, material.id);
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete learning material');
    }
  };

  const handleExportPdf = (material) => {
    const c = material.content || {};
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      const videoTitle = video?.title || 'Untitled Video';
      let y = margin;

      // Helper to add text with word wrap and page breaks.
      const addText = (text, size, style, color, indent = 0) => {
        doc.setFontSize(size);
        if (style) doc.setFont(undefined, style);
        if (color) doc.setTextColor(color);
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        lines.forEach((line) => {
          if (y + 7 > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin + indent, y);
          y += 6;
        });
      };

      const ensureSpace = (needed) => {
        if (y + needed > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Title
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Study Notes', margin, y);
      y += 8;

      // Material title
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(26, 115, 232);
      const materialTitleLines = doc.splitTextToSize(material.title, contentWidth);
      doc.text(materialTitleLines, margin, y);
      y += 5;

      // Video title
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      const videoTitleLines = doc.splitTextToSize(videoTitle, contentWidth);
      doc.text(videoTitleLines, margin, y);
      y += 6;

      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Summary
      if (c.summary) {
        ensureSpace(20);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(26, 115, 232);
        doc.text('Summary', margin, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 80, 80);
        addText(c.summary, 11, 'normal', 80);
        y += 6;
      }

      // Key terms
      if (c.key_terms?.length) {
        ensureSpace(20);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(26, 115, 232);
        doc.text('Key Terms', margin, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 80, 80);
        c.key_terms.forEach((term) => {
          const label = term.term + (term.definition ? ` — ${term.definition}` : '');
          ensureSpace(6);
          addText(`• ${label}`, 11, 'normal', 80, 4);
          y += 2;
        });
        y += 6;
      }

      // Flashcards
      if (c.flashcards?.length) {
        ensureSpace(20);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(26, 115, 232);
        doc.text('Flashcards', margin, y);
        y += 8;
        c.flashcards.forEach((card, i) => {
          ensureSpace(14);
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(50, 50, 50);
          doc.text(`${i + 1}. ${card.front}`, margin, y);
          y += 6;
          if (card.back) {
            doc.setFont(undefined, 'normal');
            doc.setTextColor(80, 80, 80);
            addText(card.back, 11, 'normal', 80, 4);
            y += 2;
          }
          y += 3;
        });
        y += 6;
      }

      // Takeaways
      if (c.takeaways?.length) {
        ensureSpace(20);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(26, 115, 232);
        doc.text('Key Takeaways', margin, y);
        y += 8;
        c.takeaways.forEach((takeaway) => {
          ensureSpace(6);
          addText(`• ${takeaway}`, 11, 'normal', 80, 4);
          y += 2;
        });
        y += 6;
      }

      // Footer
      ensureSpace(20);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by ClipMind AI', margin, y);

      const base = `${videoTitle} ${material.title}`;
      const fileName = `study-notes-${base.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 60)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '');

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(`/videos/${videoId}`)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-2"
            >
              <FiArrowLeft className="mr-1" /> Back to video
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Learning Materials</h1>
            <p className="text-sm text-gray-600 mt-1">{video ? video.title : 'Loading...'}</p>
          </div>
          {isOwner && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  setShowCreate(!showCreate);
                  setEditTitle('');
                  setEditContent(emptyContent());
                }}
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <FiPlus className="mr-2" />
                {showCreate ? 'Cancel' : 'Create Manually'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
              >
                {generating ? <FiLoader className="animate-spin mr-2" /> : <FiZap className="mr-2" />}
                {generating ? 'Generating...' : 'Generate from Transcript'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <FiAlertCircle className="mr-2" />
            {error}
          </div>
        )}

        {isOwner && showCreate && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <FiBookOpen className="mr-2 text-primary-500" /> Create Custom Study Notes
            </h3>
            <MaterialEditor
              title={editTitle}
              content={editContent}
              onTitleChange={setEditTitle}
              onContentChange={(patch) => setEditContent((prev) => ({ ...prev, ...patch }))}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
              >
                {creating ? <FiLoader className="animate-spin mr-2" /> : <FiSave className="mr-2" />}
                {creating ? 'Creating...' : 'Create Study Notes'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading learning materials...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <FiBookOpen className="mx-auto text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500 mb-1">No learning materials yet.</p>
            <p className="text-sm text-gray-400 mb-4">
              {isOwner
                ? 'Generate study notes from the transcript or create them manually.'
                : 'The educator has not published study notes for this lesson yet.'}
            </p>
            {isOwner && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {generating ? <FiLoader className="animate-spin mr-2" /> : <FiZap className="mr-2" />}
                {generating ? 'Generating...' : 'Generate from Transcript'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((material) => (
              <div key={material.id} className="space-y-2">
                <MaterialCard
                  material={material}
                  isOwner={isOwner}
                  isEditing={editingId === material.id}
                  expanded={!!expanded[material.id]}
                  onToggle={() =>
                    setExpanded((prev) => ({ ...prev, [material.id]: !prev[material.id] }))
                  }
                  onEdit={() => startEdit(material)}
                  onSave={() => handleSave(material)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleDelete(material)}
                  onExportPdf={() => handleExportPdf(material)}
                  onToggleShare={() =>
                    setShareOpenId((current) => (current === material.id ? null : material.id))
                  }
                  shareOpen={shareOpenId === material.id}
                  onTitleChange={setEditTitle}
                  onContentChange={(patch) => setEditContent((prev) => ({ ...prev, ...patch }))}
                  title={editTitle}
                  content={editContent}
                  saving={saving}
                  formatDate={formatDate}
                />
                {shareOpenId === material.id && isOwner && (
                  <MaterialSharePanel videoId={videoId} materialId={material.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// MaterialEditor — reusable inline editor for learning material content
// ---------------------------------------------------------------
function MaterialEditor({ title, content, onTitleChange, onContentChange }) {
  const setKeyTerm = (index, field, value) => {
    const items = (content.key_terms || []).map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onContentChange({ key_terms: items });
  };
  const setFlashcard = (index, field, value) => {
    const items = (content.flashcards || []).map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onContentChange({ flashcards: items });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="e.g. Chapter 3 — Key Concepts"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
        <textarea
          value={content.summary || ''}
          onChange={(e) => onContentChange({ summary: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Short takeaway summary for students..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Takeaways <span className="text-gray-400">(one per line)</span>
        </label>
        <textarea
          value={(content.takeaways || []).join('\n')}
          onChange={(e) =>
            onContentChange({ takeaways: e.target.value.split('\n') })
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder={'First takeaway\nSecond takeaway\n...'}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Key Terms</label>
          <button
            type="button"
            onClick={() =>
              onContentChange({
                key_terms: [...(content.key_terms || []), { term: '', definition: '' }],
              })
            }
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
          >
            <FiPlus className="mr-1" /> Add term
          </button>
        </div>
        {content.key_terms?.length === 0 && (
          <p className="text-xs text-gray-400">No key terms yet.</p>
        )}
        <div className="space-y-2">
          {content.key_terms?.map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={item.term}
                onChange={(e) => setKeyTerm(index, 'term', e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Term"
              />
              <input
                type="text"
                value={item.definition}
                onChange={(e) => setKeyTerm(index, 'definition', e.target.value)}
                className="flex-[2] px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Definition"
              />
              <button
                type="button"
                onClick={() =>
                  onContentChange({
                    key_terms: content.key_terms.filter((_, i) => i !== index),
                  })
                }
                className="text-gray-400 hover:text-red-600 px-2"
                aria-label="Remove term"
              >
                <FiX />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Flashcards</label>
          <button
            type="button"
            onClick={() =>
              onContentChange({
                flashcards: [...(content.flashcards || []), { front: '', back: '' }],
              })
            }
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
          >
            <FiPlus className="mr-1" /> Add card
          </button>
        </div>
        {content.flashcards?.length === 0 && (
          <p className="text-xs text-gray-400">No flashcards yet.</p>
        )}
        <div className="space-y-2">
          {content.flashcards?.map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={item.front}
                onChange={(e) => setFlashcard(index, 'front', e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Front (question)"
              />
              <input
                type="text"
                value={item.back}
                onChange={(e) => setFlashcard(index, 'back', e.target.value)}
                className="flex-[2] px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Back (answer)"
              />
              <button
                type="button"
                onClick={() =>
                  onContentChange({
                    flashcards: content.flashcards.filter((_, i) => i !== index),
                  })
                }
                className="text-gray-400 hover:text-red-600 px-2"
                aria-label="Remove flashcard"
              >
                <FiX />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// ---------------------------------------------------------------
// MaterialCard — displays or edits a single learning material
// ---------------------------------------------------------------
function MaterialCard({
  material,
  isOwner,
  isEditing,
  expanded,
  onToggle,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onExportPdf,
  onToggleShare,
  shareOpen,
  onTitleChange,
  onContentChange,
  title,
  content,
  saving,
  formatDate,
}) {
  const c = material.content || {};
  const termCount = (c.key_terms || []).length;
  const flashCount = (c.flashcards || []).length;
  const takeCount = (c.takeaways || []).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isEditing ? (
        <div className="p-5">
          <h3 className="font-semibold text-gray-800 mb-4">
            Edit: <span className="text-primary-600">{material.title}</span>
          </h3>
          <MaterialEditor
            title={title}
            content={content}
            onTitleChange={onTitleChange}
            onContentChange={onContentChange}
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <FiX className="mr-2" /> Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
            >
              {saving ? <FiLoader className="animate-spin mr-2" /> : <FiSave className="mr-2" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <button onClick={onToggle} className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                <FiBookOpen className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 leading-tight">{material.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Updated {formatDate(material.updated_at)} • {termCount} terms • {flashCount} cards • {takeCount} takeaways
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onExportPdf();
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                aria-label="Export as PDF"
                title="Export as PDF"
              >
                <FiDownload />
              </span>
              {isOwner && (
                <>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleShare();
                    }}
                    className={`p-2 rounded-lg ${
                      shareOpen
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                    aria-label="Share with students"
                    title="Share with students"
                  >
                    <FiShare2 />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                    aria-label="Edit material"
                  >
                    <FiEdit3 />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                    aria-label="Delete material"
                  >
                    <FiTrash2 />
                  </span>
                </>
              )}
              {expanded ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
            </div>
          </button>

          {expanded && (
            <div className="border-t border-gray-100 px-5 py-4 space-y-6">
              {c.summary && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1.5">Summary</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{c.summary}</p>
                </div>
              )}

              {c.key_terms?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FiTag className="mr-1.5 text-primary-500" /> Key Terms
                  </h4>
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

              {c.flashcards?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FiLayers className="mr-1.5 text-primary-500" /> Flashcards
                  </h4>
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

              {c.takeaways?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FiCheckCircle className="mr-1.5 text-green-500" /> Key Takeaways
                  </h4>
                  <ul className="space-y-1.5">
                    {c.takeaways.map((takeaway, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LearningMaterials;