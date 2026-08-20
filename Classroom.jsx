import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiBookOpen,
  FiExternalLink,
  FiFileText,
  FiLink,
  FiSave,
  FiUsers,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';

import { useAuth } from '../context/AuthContext.jsx';
import videoService from '../services/videoService.js';


const Classroom = () => {
  const { videoId } = useParams();
  const { user } = useAuth();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editable links
  const [summaryLink, setSummaryLink] = useState('');
  const [materialsLink, setMaterialsLink] = useState('');

  // Saved links
  const [savedSummaryLink, setSavedSummaryLink] = useState('');
  const [savedMaterialsLink, setSavedMaterialsLink] = useState('');

  // UI states
  const [summarySaved, setSummarySaved] = useState(false);
  const [materialsSaved, setMaterialsSaved] = useState(false);
  const [copied, setCopied] = useState('');

  // Classroom name
  const [classroomName, setClassroomName] = useState('');
  const [editName, setEditName] = useState(false);

  /*
   * =========================================================
   * USER ROLE
   * =========================================================
   */

  const userRole = String(user?.role || '').toLowerCase();

  const isEducator = userRole === 'educator';
  const isLearner = userRole === 'learner';

  /*
   * =========================================================
   * LOCAL STORAGE KEY
   * =========================================================
   *
   * Each classroom gets separate saved data.
   *
   * Example:
   * clipmind_classroom_1
   * clipmind_classroom_2
   * clipmind_classroom_10
   *
   */

  const storageKey = `clipmind_classroom_${videoId}`;

  /*
   * =========================================================
   * LOAD CLASSROOM
   * =========================================================
   */

  useEffect(() => {
    if (!videoId) return;

    loadClassroom();
    loadSavedClassroomData();
  }, [videoId]);

  /*
   * =========================================================
   * LOAD VIDEO DATA
   * =========================================================
   */

  const loadClassroom = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await videoService.getVideo(videoId);

      setVideo(data);

      /*
       * Only use backend classroom/video name if
       * localStorage does not already contain a custom name.
       */

      const storedData = localStorage.getItem(storageKey);

      if (!storedData) {
        setClassroomName(
          data?.title ||
            data?.name ||
            `Classroom ${videoId}`
        );
      }

    } catch (err) {
      console.error('Failed to load classroom:', err);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          'Failed to load classroom.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * LOAD SAVED DATA FROM LOCAL STORAGE
   * =========================================================
   */

  const loadSavedClassroomData = () => {
    try {
      const storedData = localStorage.getItem(storageKey);

      /*
       * No saved data yet
       */

      if (!storedData) {
        return;
      }

      const classroomData = JSON.parse(storedData);

      /*
       * Load classroom name
       */

      if (classroomData.classroomName) {
        setClassroomName(
          classroomData.classroomName
        );
      }

      /*
       * Load summary link
       */

      if (classroomData.summaryLink) {
        setSummaryLink(
          classroomData.summaryLink
        );

        setSavedSummaryLink(
          classroomData.summaryLink
        );
      }

      /*
       * Load learning materials link
       */

      if (classroomData.materialsLink) {
        setMaterialsLink(
          classroomData.materialsLink
        );

        setSavedMaterialsLink(
          classroomData.materialsLink
        );
      }

    } catch (err) {
      console.error(
        'Failed to load saved classroom data:',
        err
      );

      setError(
        'Unable to load saved classroom data.'
      );
    }
  };

  /*
   * =========================================================
   * SAVE CLASSROOM DATA TO LOCAL STORAGE
   * =========================================================
   */

  const saveClassroomData = ({
    summaryLinkValue = savedSummaryLink,
    materialsLinkValue = savedMaterialsLink,
    classroomNameValue = classroomName,
  } = {}) => {
    try {
      const classroomData = {
        videoId: videoId,

        classroomName:
          classroomNameValue,

        summaryLink:
          summaryLinkValue,

        materialsLink:
          materialsLinkValue,

        updatedAt:
          new Date().toISOString(),
      };

      localStorage.setItem(
        storageKey,
        JSON.stringify(classroomData)
      );

      return true;

    } catch (err) {
      console.error(
        'Failed to save classroom data:',
        err
      );

      setError(
        'Unable to save classroom data.'
      );

      return false;
    }
  };

  /*
   * =========================================================
   * SAVE SUMMARY LINK
   * =========================================================
   */

  const handleSaveSummaryLink = () => {
    const link = summaryLink.trim();

    if (!link) {
      setError(
        'Please enter a summary page link.'
      );
      return;
    }

    const saved = saveClassroomData({
      summaryLinkValue: link,
      materialsLinkValue: savedMaterialsLink,
      classroomNameValue: classroomName,
    });

    if (!saved) {
      return;
    }

    setSummaryLink(link);
    setSavedSummaryLink(link);

    setSummarySaved(true);
    setError('');

    setTimeout(() => {
      setSummarySaved(false);
    }, 2000);
  };

  /*
   * =========================================================
   * SAVE LEARNING MATERIALS LINK
   * =========================================================
   */

  const handleSaveMaterialsLink = () => {
    const link = materialsLink.trim();

    if (!link) {
      setError(
        'Please enter a learning materials page link.'
      );
      return;
    }

    const saved = saveClassroomData({
      summaryLinkValue: savedSummaryLink,
      materialsLinkValue: link,
      classroomNameValue: classroomName,
    });

    if (!saved) {
      return;
    }

    setMaterialsLink(link);
    setSavedMaterialsLink(link);

    setMaterialsSaved(true);
    setError('');

    setTimeout(() => {
      setMaterialsSaved(false);
    }, 2000);
  };

  /*
   * =========================================================
   * COPY LINK
   * =========================================================
   */

  const handleCopy = async (link, type) => {
    if (!link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(link);

      setCopied(type);

      setTimeout(() => {
        setCopied('');
      }, 2000);

    } catch (err) {
      console.error(
        'Copy failed:',
        err
      );

      setError(
        'Unable to copy the link.'
      );
    }
  };

  /*
   * =========================================================
   * REMOVE SUMMARY LINK
   * =========================================================
   */

  const removeSummaryLink = () => {
    if (!isEducator) {
      return;
    }

    const saved = saveClassroomData({
      summaryLinkValue: '',
      materialsLinkValue: savedMaterialsLink,
      classroomNameValue: classroomName,
    });

    if (!saved) {
      return;
    }

    setSummaryLink('');
    setSavedSummaryLink('');
  };

  /*
   * =========================================================
   * REMOVE MATERIALS LINK
   * =========================================================
   */

  const removeMaterialsLink = () => {
    if (!isEducator) {
      return;
    }

    const saved = saveClassroomData({
      summaryLinkValue: savedSummaryLink,
      materialsLinkValue: '',
      classroomNameValue: classroomName,
    });

    if (!saved) {
      return;
    }

    setMaterialsLink('');
    setSavedMaterialsLink('');
  };

  /*
   * =========================================================
   * SAVE CLASSROOM NAME
   * =========================================================
   */

  const handleSaveClassroomName = () => {
    const name = classroomName.trim();

    if (!name) {
      setError(
        'Classroom name cannot be empty.'
      );
      return;
    }

    const saved = saveClassroomData({
      summaryLinkValue: savedSummaryLink,
      materialsLinkValue: savedMaterialsLink,
      classroomNameValue: name,
    });

    if (!saved) {
      return;
    }

    setClassroomName(name);
    setEditName(false);
    setError('');
  };

  /*
   * =========================================================
   * DELETE CLASSROOM DATA
   * =========================================================
   */

  const handleDeleteClassroom = () => {
    if (!isEducator) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this classroom data?'
    );

    if (!confirmed) {
      return;
    }

    try {
      localStorage.removeItem(storageKey);

      setSummaryLink('');
      setSavedSummaryLink('');

      setMaterialsLink('');
      setSavedMaterialsLink('');

      alert(
        'Classroom shared links have been deleted.'
      );

    } catch (err) {
      console.error(
        'Delete failed:',
        err
      );

      setError(
        'Failed to delete classroom data.'
      );
    }
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />

          <p className="text-gray-500 mt-3">
            Loading classroom...
          </p>

        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * ERROR PAGE
   * =========================================================
   */

  if (error && !video) {
    return (
      <div className="pt-6 pb-12">

        <div className="max-w-5xl mx-auto px-4">

          {isLearner ? (
            <Link
              to={`/videos/${videoId}`}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-5"
            >
              <FiArrowLeft />
              Back to Video
            </Link>
          ) : (
            <Link
              to="/classroom-analytics"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-5"
            >
              <FiArrowLeft />
              Back to Classroom Analytics
            </Link>
          )}

          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
            {error}
          </div>

        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * MAIN PAGE
   * =========================================================
   */

  return (
    <div className="pt-6 pb-12">

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ===================================================
            BACK BUTTON
        ==================================================== */}

        {isLearner ? (
          <Link
            to={`/videos/${videoId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-5"
          >
            <FiArrowLeft />
            Back to Video
          </Link>
        ) : (
          <Link
            to="/classroom-analytics"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-5"
          >
            <FiArrowLeft />
            Back to Classroom Analytics
          </Link>
        )}

        {/* ===================================================
            ERROR MESSAGE
        ==================================================== */}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ===================================================
            CLASSROOM HEADER
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-7 mb-6">

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

            {/* Classroom title */}

            <div>

              <div className="flex items-center gap-2 mb-3">

                <div className="h-11 w-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">

                  <FiBookOpen className="text-xl" />

                </div>

                <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                  Classroom
                </span>

              </div>

              <div className="flex items-center gap-3">

                {editName && isEducator ? (

                  <div className="flex flex-wrap gap-2">

                    <input
                      type="text"
                      value={classroomName}
                      onChange={(e) =>
                        setClassroomName(e.target.value)
                      }
                      autoFocus
                      className="text-xl sm:text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    <button
                      type="button"
                      onClick={handleSaveClassroomName}
                      className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditName(false);
                        loadSavedClassroomData();
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                  </div>

                ) : (

                  <>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {classroomName}
                    </h1>

                    {isEducator && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditName(true)
                        }
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        title="Edit classroom name"
                      >
                        <FiEdit2 />
                      </button>
                    )}

                  </>

                )}

              </div>

              <p className="text-gray-500 mt-2">
                Share summary and learning materials with your
                learners.
              </p>

            </div>

            {/* Educator controls */}

            {isEducator && (
              <button
                type="button"
                onClick={handleDeleteClassroom}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
              >
                <FiTrash2 />
                Delete
              </button>
            )}

          </div>

          {/* =================================================
              CLASSROOM INFORMATION
          ================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">

            {/* Lecture */}

            <div className="bg-gray-50 rounded-xl p-4">

              <FiBookOpen className="text-primary-600 text-xl mb-2" />

              <p className="text-xs text-gray-500">
                Lecture
              </p>

              <p className="font-semibold text-gray-800 mt-1 break-words">
                {video?.title || classroomName}
              </p>

            </div>

            {/* Access */}

            <div className="bg-gray-50 rounded-xl p-4">

              <FiUsers className="text-primary-600 text-xl mb-2" />

              <p className="text-xs text-gray-500">
                Your Access
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {isEducator
                  ? 'Educator'
                  : 'Learner'}
              </p>

            </div>

            {/* Resources */}

            <div className="bg-gray-50 rounded-xl p-4">

              <FiLink className="text-primary-600 text-xl mb-2" />

              <p className="text-xs text-gray-500">
                Shared Resources
              </p>

              <p className="font-semibold text-gray-800 mt-1">

                {(savedSummaryLink ? 1 : 0) +
                  (savedMaterialsLink ? 1 : 0)}

                {' '}

                Resource

                {(savedSummaryLink ? 1 : 0) +
                  (savedMaterialsLink ? 1 : 0) !== 1
                  ? 's'
                  : ''}

              </p>

            </div>

          </div>

        </div>

        {/* ===================================================
            SHARING SECTION
        ==================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* =================================================
              SUMMARY
          ================================================== */}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">

            <div className="flex items-start gap-3 mb-5">

              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">

                <FiFileText className="text-xl" />

              </div>

              <div>

                <h2 className="font-semibold text-gray-900 text-lg">
                  Share Summary
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Add the link to your Summary page.
                </p>

              </div>

            </div>

            {/* ===============================================
                EDUCATOR INPUT
            ================================================ */}

            {isEducator && (
              <>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Page Link
                </label>

                <div className="flex flex-col sm:flex-row gap-2">

                  <input
                    type="url"
                    value={summaryLink}
                    onChange={(e) =>
                      setSummaryLink(e.target.value)
                    }
                    placeholder="Paste summary page link here..."
                    className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />

                  <button
                    type="button"
                    onClick={handleSaveSummaryLink}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >

                    {summarySaved ? (
                      <>
                        <FiCheck />
                        Saved
                      </>
                    ) : (
                      <>
                        <FiSave />
                        Save Link
                      </>
                    )}

                  </button>

                </div>

              </>
            )}

            {/* ===============================================
                SAVED SUMMARY
            ================================================ */}

            {savedSummaryLink ? (

              <div className="mt-5">

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">

                  <div className="flex items-start gap-2">

                    <FiLink className="text-blue-600 mt-1 shrink-0" />

                    <a
                      href={savedSummaryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 break-all hover:underline"
                    >
                      {savedSummaryLink}
                    </a>

                  </div>

                </div>

                <div className="flex flex-wrap gap-2 mt-3">

                  <a
                    href={savedSummaryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    <FiExternalLink />
                    Open Summary
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        savedSummaryLink,
                        'summary'
                      )
                    }
                    className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >

                    {copied === 'summary' ? (
                      <>
                        <FiCheck />
                        Copied
                      </>
                    ) : (
                      <>
                        <FiCopy />
                        Copy Link
                      </>
                    )}

                  </button>

                  {isEducator && (
                    <button
                      type="button"
                      onClick={removeSummaryLink}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                    >
                      <FiTrash2 />
                      Remove
                    </button>
                  )}

                </div>

              </div>

            ) : (

              <div className="mt-5 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-5 text-center">

                <FiFileText className="mx-auto text-2xl text-gray-300 mb-2" />

                <p className="text-sm text-gray-500">
                  No summary link added yet.
                </p>

                {isEducator && (
                  <p className="text-xs text-gray-400 mt-1">
                    Paste the link above to share the summary.
                  </p>
                )}

              </div>

            )}

          </div>

          {/* =================================================
              LEARNING MATERIALS
          ================================================== */}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">

            <div className="flex items-start gap-3 mb-5">

              <div className="h-11 w-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">

                <FiBookOpen className="text-xl" />

              </div>

              <div>

                <h2 className="font-semibold text-gray-900 text-lg">
                  Share Learning Materials
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Add the link to your Learning Materials page.
                </p>

              </div>

            </div>

            {/* ===============================================
                EDUCATOR INPUT
            ================================================ */}

            {isEducator && (
              <>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Materials Link
                </label>

                <div className="flex flex-col sm:flex-row gap-2">

                  <input
                    type="url"
                    value={materialsLink}
                    onChange={(e) =>
                      setMaterialsLink(e.target.value)
                    }
                    placeholder="Paste learning materials link here..."
                    className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />

                  <button
                    type="button"
                    onClick={handleSaveMaterialsLink}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >

                    {materialsSaved ? (
                      <>
                        <FiCheck />
                        Saved
                      </>
                    ) : (
                      <>
                        <FiSave />
                        Save Link
                      </>
                    )}

                  </button>

                </div>

              </>
            )}

            {/* ===============================================
                SAVED MATERIALS
            ================================================ */}

            {savedMaterialsLink ? (

              <div className="mt-5">

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">

                  <div className="flex items-start gap-2">

                    <FiLink className="text-green-600 mt-1 shrink-0" />

                    <a
                      href={savedMaterialsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 break-all hover:underline"
                    >
                      {savedMaterialsLink}
                    </a>

                  </div>

                </div>

                <div className="flex flex-wrap gap-2 mt-3">

                  <a
                    href={savedMaterialsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <FiExternalLink />
                    Open Materials
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        savedMaterialsLink,
                        'materials'
                      )
                    }
                    className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >

                    {copied === 'materials' ? (
                      <>
                        <FiCheck />
                        Copied
                      </>
                    ) : (
                      <>
                        <FiCopy />
                        Copy Link
                      </>
                    )}

                  </button>

                  {isEducator && (
                    <button
                      type="button"
                      onClick={removeMaterialsLink}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                    >
                      <FiTrash2 />
                      Remove
                    </button>
                  )}

                </div>

              </div>

            ) : (

              <div className="mt-5 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-5 text-center">

                <FiBookOpen className="mx-auto text-2xl text-gray-300 mb-2" />

                <p className="text-sm text-gray-500">
                  No learning materials link added yet.
                </p>

                {isEducator && (
                  <p className="text-xs text-gray-400 mt-1">
                    Paste the link above to share learning
                    materials.
                  </p>
                )}

              </div>

            )}

          </div>

        </div>

        {/* ===================================================
            LEARNER INFORMATION
        ==================================================== */}

        {isLearner && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">

            <div className="flex items-start gap-3">

              <FiUsers className="text-blue-600 mt-0.5 shrink-0" />

              <div>

                <p className="font-semibold text-blue-900">
                  Learner Access
                </p>

                <p className="text-sm text-blue-700 mt-1">
                  You can view and open the shared summary and
                  learning materials. Only the educator can add,
                  edit, or remove classroom links.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ===================================================
            EDUCATOR INFORMATION
        ==================================================== */}

        {isEducator && (
          <div className="mt-6 bg-primary-50 border border-primary-200 rounded-xl p-4">

            <div className="flex items-start gap-3">

              <FiLink className="text-primary-600 mt-0.5 shrink-0" />

              <div>

                <p className="font-semibold text-primary-900">
                  Educator
                </p>

                <p className="text-sm text-primary-700 mt-1">
                  Paste the links generated from your Summary
                  and Learning Materials pages above. The links
                  are saved and will remain available after
                  refreshing this page.
                </p>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default Classroom;