import React, { useEffect, useState } from 'react';

import {
  ArrowLeft,
  BookOpen,
  FileText,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  Video,
  X,
  Zap,
} from 'lucide-react';

import {
  api,
  getMediaUrl,
} from '../services/api';

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  educatorId: string;
  educatorName?: string;
  students: number;
  videos: number;
  assignments: number;
  createdAt: string;
  updatedAt?: string;
}

interface ClassroomVideo {
  id: string;
  title: string;
  description?: string | null;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  size?: number | null;
  status?: string;
  progress?: number;
  category?: string | null;
  viewsCount?: number;
  sharedAt?: string | null;
}

interface TranscriptSegment {
  id?: string | number;
  start: number;
  end: number;
  text: string;
}

interface TranscriptData {
  id?: string;
  videoId?: string;
  language?: string;
  fullText?: string;
  segments?: TranscriptSegment[];
  createdAt?: string;
}

interface KeyMoment {
  id?: string;
  videoId?: string;
  title?: string;
  description?: string;
  startTime?: number;
  endTime?: number;
  importanceScore?: number;
  topic?: string;
  keywords?: string[];
}

interface LearnerClassroomPageProps {
  onNavigate?: (
    tab: string,
    videoId?: string
  ) => void;
}

const formatTime = (
  seconds?: number | null
): string => {
  if (
    seconds === undefined ||
    seconds === null ||
    Number.isNaN(seconds)
  ) {
    return '0:00';
  }

  const totalSeconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const minutes = Math.floor(
    totalSeconds / 60
  );

  const remainingSeconds =
    totalSeconds % 60;

  return `${minutes}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
};

const formatDate = (
  value?: string | null
): string => {
  if (!value) {
    return '';
  }

  try {
    return new Date(
      value
    ).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const getSummaryText = (
  summary: any
): string => {
  if (!summary) {
    return '';
  }

  return (
    summary.shortSummary ||
    summary.short_summary ||
    summary.detailedSummary ||
    summary.detailed_summary ||
    summary.summary ||
    summary.content ||
    ''
  );
};

const getMomentStart = (
  moment: any
): number => {
  return Number(
    moment?.startTime ??
      moment?.start_time ??
      0
  );
};

const getMomentEnd = (
  moment: any
): number => {
  return Number(
    moment?.endTime ??
      moment?.end_time ??
      0
  );
};

const normalizeTranscript = (
  data: any
): TranscriptData | null => {
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    videoId:
      data.videoId ??
      data.video_id,
    language: data.language,
    fullText:
      data.fullText ??
      data.full_text,
    segments:
      data.segments ??
      [],
    createdAt:
      data.createdAt ??
      data.created_at,
  };
};

export default function LearnerClassroomPage({
  onNavigate,
}: LearnerClassroomPageProps) {

  const [
    classrooms,
    setClassrooms,
  ] = useState<Classroom[]>([]);

  const [
    selectedClassroom,
    setSelectedClassroom,
  ] = useState<Classroom | null>(null);

  const [
    videos,
    setVideos,
  ] = useState<ClassroomVideo[]>([]);

  const [
    selectedVideo,
    setSelectedVideo,
  ] = useState<ClassroomVideo | null>(null);

  const [
    transcript,
    setTranscript,
  ] = useState<TranscriptData | null>(
    null
  );

  const [
    summary,
    setSummary,
  ] = useState<any>(null);

  const [
    keyMoments,
    setKeyMoments,
  ] = useState<KeyMoment[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingVideos,
    setLoadingVideos,
  ] = useState(false);

  const [
    loadingDetails,
    setLoadingDetails,
  ] = useState(false);

  const [
    showJoinModal,
    setShowJoinModal,
  ] = useState(false);

  const [
    classCode,
    setClassCode,
  ] = useState('');

  const [
    joinError,
    setJoinError,
  ] = useState('');

  const [
    joining,
    setJoining,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  // =======================================================
  // LOAD CLASSROOMS
  // =======================================================

  const loadClassrooms =
    async () => {
      try {
        setLoading(true);
        setError('');

        const data =
          await api.getClassrooms();

        setClassrooms(
          data || []
        );
      } catch (err: any) {
        console.error(
          'Failed to load classrooms:',
          err
        );

        setError(
          err?.message ||
            'Unable to load your classrooms.'
        );
      } finally {
        setLoading(false);
      }
    };

  // =======================================================
  // LOAD CLASSROOM VIDEOS
  // =======================================================

  const loadVideos = async (
    classroomId: string
  ) => {
    try {
      setLoadingVideos(true);
      setError('');

      const data =
        await api.getClassroomVideos(
          classroomId
        );

      setVideos(
        data || []
      );
    } catch (err: any) {
      console.error(
        'Failed to load classroom videos:',
        err
      );

      setVideos([]);

      setError(
        err?.message ||
          'Unable to load classroom videos.'
      );
    } finally {
      setLoadingVideos(false);
    }
  };

  // =======================================================
  // LOAD VIDEO DETAILS
  // =======================================================

  const loadVideoDetails =
    async (
      video: ClassroomVideo
    ) => {
      try {
        setSelectedVideo(video);
        setLoadingDetails(true);

        setTranscript(null);
        setSummary(null);
        setKeyMoments([]);

        setError('');

        const [
          transcriptResult,
          summaryResult,
          keyMomentsResult,
        ] =
          await Promise.allSettled([
            api.getTranscript(
              video.id
            ),
            api.getSummary(
              video.id
            ),
            api.getKeyMoments(
              video.id
            ),
          ]);

        if (
          transcriptResult.status ===
          'fulfilled'
        ) {
          setTranscript(
            normalizeTranscript(
              transcriptResult.value
            )
          );
        }

        if (
          summaryResult.status ===
          'fulfilled'
        ) {
          setSummary(
            summaryResult.value
          );
        }

        if (
          keyMomentsResult.status ===
          'fulfilled'
        ) {
          setKeyMoments(
            keyMomentsResult.value ||
              []
          );
        }

      } catch (err: any) {
        console.error(
          'Failed to load video details:',
          err
        );

        setError(
          err?.message ||
            'Unable to load video details.'
        );
      } finally {
        setLoadingDetails(false);
      }
    };

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadClassrooms();
  }, []);

  // =======================================================
  // LOAD VIDEOS WHEN CLASSROOM CHANGES
  // =======================================================

  useEffect(() => {
    if (
      selectedClassroom
    ) {
      loadVideos(
        selectedClassroom.id
      );
    } else {
      setVideos([]);
    }
  }, [
    selectedClassroom?.id,
  ]);

  // =======================================================
  // JOIN CLASSROOM BY CODE
  // =======================================================

  const handleJoinClass =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      const code =
        classCode
          .trim()
          .toUpperCase();

      setJoinError('');

      if (!code) {
        setJoinError(
          'Enter the classroom code.'
        );
        return;
      }

      try {
        setJoining(true);

        // -------------------------------------------------
        // STEP 1: RESOLVE CODE
        // -------------------------------------------------

        console.log(
          '[CLASSROOM] Resolving code:',
          code
        );

        const classroom =
          await api.resolveClassroomCode(
            code
          );

        console.log(
          '[CLASSROOM] Classroom resolved:',
          classroom
        );

        if (!classroom?.id) {
          throw new Error(
            'Classroom could not be found.'
          );
        }

        // -------------------------------------------------
        // STEP 2: JOIN CLASSROOM
        // -------------------------------------------------

        console.log(
          '[CLASSROOM] Joining classroom:',
          classroom.id
        );

        const result =
          await api.joinClassroom(
            classroom.id,
            code
          );

        console.log(
          '[CLASSROOM] Join successful:',
          result
        );

        // -------------------------------------------------
        // STEP 3: REFRESH CLASSROOM LIST
        // -------------------------------------------------

        const updatedClassrooms =
          await api.getClassrooms();

        setClassrooms(
          updatedClassrooms || []
        );

        // -------------------------------------------------
        // STEP 4: FIND THE NEWLY JOINED CLASSROOM
        // -------------------------------------------------

        const joinedClassroom =
          (updatedClassrooms || []).find(
            (item) =>
              item.id ===
              classroom.id
          ) || classroom;

        // -------------------------------------------------
        // STEP 5: CLOSE MODAL + RESET FORM
        // -------------------------------------------------

        setClassCode('');
        setJoinError('');
        setShowJoinModal(false);

        // -------------------------------------------------
        // STEP 6: OPEN JOINED CLASSROOM
        // -------------------------------------------------

        setSelectedClassroom(
          joinedClassroom
        );

      } catch (err: any) {
        console.error(
          '[CLASSROOM JOIN ERROR]',
          err
        );

        setJoinError(
          err?.message ||
            'Unable to join classroom. Please check the code and try again.'
        );
      } finally {
        setJoining(false);
      }
    };

  // =======================================================
  // BACK TO CLASSES
  // =======================================================

  const handleBackToClasses =
    () => {
      setSelectedClassroom(null);
      setSelectedVideo(null);
      setTranscript(null);
      setSummary(null);
      setKeyMoments([]);
      setVideos([]);
    };

  // =======================================================
  // BACK TO VIDEOS
  // =======================================================

  const handleBackToVideos =
    () => {
      setSelectedVideo(null);
      setTranscript(null);
      setSummary(null);
      setKeyMoments([]);
    };

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="min-h-full bg-[#070B16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">

          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />

          <p className="text-sm text-slate-400">
            Loading your classrooms...
          </p>

        </div>
      </div>
    );
  }

  // =======================================================
  // VIDEO DETAIL
  // =======================================================

  if (
    selectedClassroom &&
    selectedVideo
  ) {
    return (
      <div className="min-h-full bg-[#070B16] text-white p-6 md:p-8">

        <button
          onClick={
            handleBackToVideos
          }
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />

          Back to Classroom Videos
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">

          <div>

            <div className="rounded-2xl border border-slate-800 bg-black overflow-hidden">

              <video
                controls
                className="w-full aspect-video"
                src={getMediaUrl(
                  selectedVideo.fileUrl
                )}
              />

            </div>

            <div className="mt-5">

              <h1 className="text-2xl md:text-3xl font-black">
                {selectedVideo.title}
              </h1>

              <p className="text-sm text-slate-400 mt-2">
                {selectedVideo.description ||
                  'Video shared by your educator.'}
              </p>

              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">

                <span>
                  Duration:{' '}
                  {formatTime(
                    selectedVideo.duration
                  )}
                </span>

                {selectedVideo.sharedAt && (
                  <span>
                    Shared:{' '}
                    {formatDate(
                      selectedVideo.sharedAt
                    )}
                  </span>
                )}

              </div>

            </div>

          </div>

          <div className="space-y-5">

            {/* TRANSCRIPT */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

              <div className="flex items-center gap-2 mb-4">

                <FileText className="w-5 h-5 text-emerald-400" />

                <h2 className="font-black">
                  Transcript
                </h2>

              </div>

              {loadingDetails ? (

                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />

              ) : transcript ? (

                <div className="max-h-72 overflow-y-auto">

                  {transcript.segments &&
                  transcript.segments.length > 0 ? (

                    <div className="space-y-3">

                      {transcript.segments.map(
                        (
                          segment,
                          index
                        ) => (

                          <div
                            key={
                              segment.id ??
                              index
                            }
                            className="flex gap-3"
                          >

                            <span className="shrink-0 h-fit text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                              {formatTime(
                                segment.start
                              )}
                            </span>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              {
                                segment.text
                              }
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {transcript.fullText ||
                        'Transcript is empty.'}
                    </p>

                  )}

                </div>

              ) : (

                <p className="text-xs text-slate-500">
                  Transcript not available.
                </p>

              )}

            </div>

            {/* SUMMARY */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

              <div className="flex items-center gap-2 mb-4">

                <Sparkles className="w-5 h-5 text-purple-400" />

                <h2 className="font-black">
                  AI Summary
                </h2>

              </div>

              {loadingDetails ? (

                <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />

              ) : summary ? (

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">

                  {getSummaryText(
                    summary
                  ) ||
                    'Summary is available but contains no displayable text.'}

                </p>

              ) : (

                <p className="text-xs text-slate-500">
                  Summary not available.
                </p>

              )}

            </div>

            {/* KEY MOMENTS */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

              <div className="flex items-center gap-2 mb-4">

                <Zap className="w-5 h-5 text-cyan-400" />

                <h2 className="font-black">
                  Key Moments
                </h2>

              </div>

              {loadingDetails ? (

                <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />

              ) : keyMoments.length > 0 ? (

                <div className="space-y-3 max-h-80 overflow-y-auto">

                  {keyMoments.map(
                    (
                      moment,
                      index
                    ) => {

                      const start =
                        getMomentStart(
                          moment
                        );

                      const end =
                        getMomentEnd(
                          moment
                        );

                      return (

                        <div
                          key={
                            moment.id ??
                            index
                          }
                          className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div>

                              <p className="text-xs font-bold text-white">
                                {moment.title ||
                                  `Key Moment ${
                                    index + 1
                                  }`}
                              </p>

                              {moment.description && (
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                  {
                                    moment.description
                                  }
                                </p>
                              )}

                            </div>

                            <span className="shrink-0 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg">
                              {formatTime(
                                start
                              )}
                            </span>

                          </div>

                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-600">

                            <span>
                              {formatTime(
                                start
                              )}{' '}
                              –{' '}
                              {formatTime(
                                end
                              )}
                            </span>

                            {moment.topic && (
                              <span>
                                {
                                  moment.topic
                                }
                              </span>
                            )}

                          </div>

                        </div>

                      );
                    }
                  )}

                </div>

              ) : (

                <p className="text-xs text-slate-500">
                  No key moments available.
                </p>

              )}

            </div>

          </div>

        </div>

      </div>
    );
  }

  // =======================================================
  // CLASSROOM DETAIL
  // =======================================================

  if (
    selectedClassroom
  ) {
    return (
      <div className="min-h-full bg-[#070B16] text-white p-6 md:p-8">

        <button
          onClick={
            handleBackToClasses
          }
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />

          Back to My Classes
        </button>

        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 md:p-8 mb-7">

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

            <div>

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">

                  <BookOpen className="w-6 h-6 text-blue-400" />

                </div>

                <div>

                  <p className="text-[10px] uppercase tracking-widest font-bold text-blue-400">
                    Classroom
                  </p>

                  <h1 className="text-2xl md:text-3xl font-black">
                    {selectedClassroom.name}
                  </h1>

                </div>

              </div>

              <p className="text-sm text-slate-400 mt-4 max-w-2xl">
                {selectedClassroom.description ||
                  'No classroom description available.'}
              </p>

              {selectedClassroom.educatorName && (
                <p className="text-xs text-slate-500 mt-4">
                  Educator:{' '}

                  <span className="text-slate-300 font-semibold">
                    {
                      selectedClassroom.educatorName
                    }
                  </span>

                </p>
              )}

            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4">

              <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">
                Classroom Code
              </p>

              <p className="text-xl font-black tracking-widest mt-1">
                {selectedClassroom.code}
              </p>

            </div>

          </div>

          <div className="grid grid-cols-3 gap-3 mt-7">

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">

              <Users className="w-4 h-4 text-blue-400" />

              <p className="text-lg font-black mt-2">
                {selectedClassroom.students}
              </p>

              <p className="text-[10px] text-slate-500">
                Students
              </p>

            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">

              <Video className="w-4 h-4 text-purple-400" />

              <p className="text-lg font-black mt-2">
                {selectedClassroom.videos}
              </p>

              <p className="text-[10px] text-slate-500">
                Videos
              </p>

            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">

              <FileText className="w-4 h-4 text-emerald-400" />

              <p className="text-lg font-black mt-2">
                {selectedClassroom.assignments}
              </p>

              <p className="text-[10px] text-slate-500">
                Assignments
              </p>

            </div>

          </div>

        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-5">

          <div>

            <h2 className="text-xl font-black">
              Classroom Videos
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Videos shared by your educator.
            </p>

          </div>

          <button
            onClick={() =>
              loadVideos(
                selectedClassroom.id
              )
            }
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

        </div>

        {loadingVideos ? (

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 flex justify-center">

            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />

          </div>

        ) : videos.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">

            <Video className="w-10 h-10 text-slate-700 mx-auto" />

            <h3 className="font-bold text-slate-300 mt-4">
              No videos shared yet
            </h3>

            <p className="text-xs text-slate-500 mt-2">
              Your educator has not shared any videos with this classroom.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {videos.map(
              (video) => (

                <div
                  key={video.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-blue-500/30 transition"
                >

                  <div className="aspect-video bg-slate-950 relative">

                    {video.thumbnailUrl ? (

                      <img
                        src={getMediaUrl(
                          video.thumbnailUrl
                        )}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />

                    ) : (

                      <div className="w-full h-full flex items-center justify-center">

                        <Video className="w-12 h-12 text-slate-700" />

                      </div>

                    )}

                    <button
                      onClick={() =>
                        loadVideoDetails(
                          video
                        )
                      }
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/50 transition"
                    >

                      <span className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-xl">

                        <Play className="w-6 h-6 fill-white ml-1" />

                      </span>

                    </button>

                  </div>

                  <div className="p-5">

                    <h3 className="font-bold text-white truncate">
                      {video.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[32px]">
                      {video.description ||
                        'Video shared by your educator.'}
                    </p>

                    <div className="flex items-center justify-between mt-4 text-[10px] text-slate-500">

                      <span>
                        {formatTime(
                          video.duration
                        )}
                      </span>

                      {video.sharedAt && (
                        <span>
                          Shared{' '}
                          {formatDate(
                            video.sharedAt
                          )}
                        </span>
                      )}

                    </div>

                    <button
                      onClick={() =>
                        loadVideoDetails(
                          video
                        )
                      }
                      className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold"
                    >

                      <Play className="w-4 h-4" />

                      Watch & Learn

                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>
    );
  }

  // =======================================================
  // MY CLASSES
  // =======================================================

  return (
    <div className="min-h-full bg-[#070B16] text-white p-6 md:p-8">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

        <div>

          <p className="text-xs uppercase tracking-widest font-bold text-blue-400">
            Learner Workspace
          </p>

          <h1 className="text-3xl md:text-4xl font-black mt-1">
            My Classes
          </h1>

          <p className="text-sm text-slate-400 mt-2">
            Access classrooms and videos shared by your educators.
          </p>

        </div>

        <button
          onClick={() => {
            setShowJoinModal(true);
            setJoinError('');
            setClassCode('');
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-xs font-black"
        >

          <Plus className="w-4 h-4" />

          Join Classroom

        </button>

      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {classrooms.length === 0 ? (

        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-14 text-center">

          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">

            <BookOpen className="w-8 h-8 text-blue-400" />

          </div>

          <h2 className="text-xl font-black mt-5">
            No classrooms yet
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Join a classroom using the code provided by your educator.
          </p>

          <button
            onClick={() =>
              setShowJoinModal(true)
            }
            className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-xs font-bold"
          >
            Join Classroom
          </button>

        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {classrooms.map(
            (classroom) => (

              <button
                key={classroom.id}
                onClick={() =>
                  setSelectedClassroom(
                    classroom
                  )
                }
                className="text-left rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-blue-500/40 hover:bg-slate-900 transition"
              >

                <div className="flex items-start justify-between">

                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">

                    <BookOpen className="w-5 h-5 text-blue-400" />

                  </div>

                  <span className="text-[10px] font-bold tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
                    {classroom.code}
                  </span>

                </div>

                <h2 className="mt-5 text-lg font-black">
                  {classroom.name}
                </h2>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[32px]">
                  {classroom.description ||
                    'No description available.'}
                </p>

                {classroom.educatorName && (
                  <p className="mt-4 text-xs text-slate-500">

                    Educator:{' '}

                    <span className="text-slate-300">
                      {
                        classroom.educatorName
                      }
                    </span>

                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 mt-5">

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-2.5">

                    <Users className="w-3.5 h-3.5 text-blue-400" />

                    <p className="text-sm font-bold mt-1">
                      {classroom.students}
                    </p>

                    <p className="text-[9px] text-slate-600">
                      Students
                    </p>

                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-2.5">

                    <Video className="w-3.5 h-3.5 text-purple-400" />

                    <p className="text-sm font-bold mt-1">
                      {classroom.videos}
                    </p>

                    <p className="text-[9px] text-slate-600">
                      Videos
                    </p>

                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-2.5">

                    <FileText className="w-3.5 h-3.5 text-emerald-400" />

                    <p className="text-sm font-bold mt-1">
                      {classroom.assignments}
                    </p>

                    <p className="text-[9px] text-slate-600">
                      Tasks
                    </p>

                  </div>

                </div>

                <div className="mt-5 text-xs font-bold text-blue-400 text-right">
                  Open Class →
                </div>

              </button>

            )
          )}

        </div>

      )}

      {/* ===================================================
          JOIN MODAL
          =================================================== */}

      {showJoinModal && (

        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">

          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0B1020] p-6 shadow-2xl">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-xl font-black">
                  Join Classroom
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Enter the classroom code provided by your educator.
                </p>

              </div>

              <button
                onClick={() => {
                  if (!joining) {
                    setShowJoinModal(
                      false
                    );
                    setJoinError('');
                  }
                }}
                disabled={joining}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-50"
              >

                <X className="w-4 h-4" />

              </button>

            </div>

            <form
              onSubmit={
                handleJoinClass
              }
            >

              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                Classroom Code
              </label>

              <input
                value={classCode}
                onChange={(event) => {
                  setClassCode(
                    event.target.value
                      .toUpperCase()
                  );

                  if (joinError) {
                    setJoinError('');
                  }
                }}
                placeholder="Enter classroom code"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white uppercase tracking-widest placeholder:text-slate-700 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-blue-500/50"
                autoFocus
                disabled={joining}
              />

              {joinError && (
                <p className="mt-3 text-xs text-red-400">
                  {joinError}
                </p>
              )}

              <button
                type="submit"
                disabled={joining}
                className="w-full mt-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-xs font-black disabled:opacity-60 flex items-center justify-center gap-2"
              >

                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Classroom'
                )}

              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}