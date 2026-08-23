const BASE = 'http://localhost:5000/api';

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('cm_token') : null;
const getRefreshToken = () => typeof window !== 'undefined' ? localStorage.getItem('cm_refresh_token') : null;

const headers = (extra?: Record<string, string>) => {
  const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
};

// Try to silently refresh the access token using the stored refresh token
const tryRefreshToken = async (): Promise<boolean> => {
  const refreshTok = getRefreshToken();
  if (!refreshTok) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTok }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.data?.accessToken) {
      localStorage.setItem('cm_token', data.data.accessToken);
      if (data.data.refreshToken) localStorage.setItem('cm_refresh_token', data.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const handleResponse = async (res: Response, retryFn?: () => Promise<Response>) => {
  // Token expired — try silent refresh once
  if (res.status === 401 && retryFn) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryRes = await retryFn();
      return handleResponse(retryRes); // retry without retryFn to prevent infinite loop
    }
    // Refresh also failed — clear tokens and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cm_token');
      localStorage.removeItem('cm_refresh_token');
      localStorage.removeItem('cm_user');
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.errors && Array.isArray(data.errors)) {
      const errMsg = data.errors.map((err: any) => err.msg).join(', ');
      throw new Error(errMsg);
    }
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
};

export const get = async (path: string) => {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  return handleResponse(res, () => fetch(`${BASE}${path}`, { headers: headers() }));
};

export const post = async (path: string, body?: unknown) => {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  return handleResponse(res, () => fetch(`${BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }));
};

export const put = async (path: string, body?: unknown) => {
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
  return handleResponse(res, () => fetch(`${BASE}${path}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }));
};

export const patch = async (path: string, body?: unknown) => {
  const res = await fetch(`${BASE}${path}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) });
  return handleResponse(res, () => fetch(`${BASE}${path}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }));
};

export const del = async (path: string) => {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() });
  return handleResponse(res, () => fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() }));
};

export const uploadFile = async (path: string, formData: FormData, onProgress?: (pct: number) => void) => {
  return new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}${path}`);
    const t = getToken();
    if (t) xhr.setRequestHeader('Authorization', `Bearer ${t}`);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.message || `Upload failed: ${xhr.status}`));
      } catch { reject(new Error('Invalid response')); }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
};

export const downloadTranscriptExport = async (videoId: string, format: 'txt' | 'srt' | 'vtt', defaultTitle: string) => {
  const res = await fetch(`${BASE}/transcripts/${videoId}/export?format=${format}`, { headers: headers() });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = defaultTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `${safeTitle}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadHighlightReport = async (videoId: string, format: 'markdown' | 'html' | 'json', defaultTitle: string) => {
  const res = await fetch(`${BASE}/keymoments/${videoId}/highlight-report?format=${format}`, { headers: headers() });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = format === 'markdown' ? 'md' : format;
  const safeTitle = defaultTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `${safeTitle}_highlight_report.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadStudyPacket = async (videoId: string, defaultTitle: string) => {
  const res = await fetch(`${BASE}/learning/${videoId}/export-packet`, { headers: headers() });
  if (!res.ok) throw new Error('Study packet download failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = defaultTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `${safeTitle}_study_packet.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadCsvAnalyticsReport = async (videoId?: string) => {
  const query = videoId ? `?videoId=${videoId}` : '';
  const res = await fetch(`${BASE}/analytics/export-report${query}`, { headers: headers() });
  if (!res.ok) throw new Error('CSV Download failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clipmind_analytics_report_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const rateSummary = async (videoId: string, rating: number, feedback?: string) => {
  return post(`/summaries/${videoId}/rating`, { rating, feedback });
};

export const updateTranscript = async (videoId: string, content: string) => {
  return put(`/transcripts/${videoId}`, { content });
};

export const toggleBookmark = async (videoId: string, keyMomentId?: string, note?: string) => {
  return post('/bookmarks', { videoId, keyMomentId, note });
};

export const getBookmarks = async () => {
  return get('/bookmarks');
};

export const deleteBookmark = async (id: string) => {
  return del(`/bookmarks/${id}`);
};

export const fixVideoTimestamps = async (videoId: string, clientDuration?: number) => {
  return post(`/videos/${videoId}/fix-timestamps`, clientDuration ? { clientDuration } : {});
};

// ── Transcript & Summary Quality Engine API ───────────────────────────────────

export const validateTranscript = (videoId: string) => get(`/transcripts/${videoId}/validate`);
export const benchmarkTranscript = (videoId: string, referenceText: string) => post(`/transcripts/${videoId}/benchmark`, { referenceText });
export const autoCorrectTranscriptApi = (videoId: string) => post(`/transcripts/${videoId}/auto-correct`);
export const submitTranscript = (videoId: string, content: string, language?: string) =>
  post(`/transcripts/${videoId}/submit`, { content, language: language || 'en' });

export const evaluateSummaryApi = (videoId: string) => get(`/summaries/${videoId}/evaluate`);
export const reEvaluateSummaryApi = (videoId: string) => post(`/summaries/${videoId}/re-evaluate`);

export const getVideoPipelineStatus = (videoId: string) => get(`/videos/${videoId}/pipeline-status`);
export const triggerAIPipeline = (videoId: string) => post(`/videos/${videoId}/process`);


export const formatDuration = (seconds: number): string => {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const formatTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'badge-rose',
  CONTENT_CREATOR: 'badge-blue',
  EDUCATOR: 'badge-violet',
  LEARNER: 'badge-green',
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  CONTENT_CREATOR: 'Creator',
  EDUCATOR: 'Educator',
  LEARNER: 'Learner',
};

export const STATUS_COLORS: Record<string, string> = {
  READY: 'badge-green',
  PROCESSING: 'badge-amber',
  UPLOADING: 'badge-blue',
  FAILED: 'badge-rose',
  PENDING: 'badge-gray',
  COMPLETED: 'badge-green',
};

// ── Classroom / Educator Hub ──────────────────────────────────────────────────

export const getClassroomsList = () => get('/classroom/list');
export const createClassroom = (data: { name: string; subject?: string; description?: string; customCode?: string }) => post('/classroom/create', data);
export const updateClassroom = (id: string, data: { name?: string; subject?: string; description?: string }) => put(`/classroom/${id}`, data);
export const deleteClassroom = (id: string) => del(`/classroom/${id}`);
export const addVideoToClassroom = (classroomId: string, videoId: string) => post(`/classroom/${classroomId}/videos`, { videoId });
export const removeVideoFromClassroom = (classroomId: string, videoId: string) => del(`/classroom/${classroomId}/videos/${videoId}`);
export const joinClassroom = (code: string) => post('/classroom/join', { code });

export const getClassroomOverview = (classroomId?: string) => get(`/classroom/overview${classroomId ? `?classroomId=${classroomId}` : ''}`);
export const getClassroomAnalytics = (classroomId?: string) => get(`/classroom/analytics${classroomId ? `?classroomId=${classroomId}` : ''}`);
export const getClassroomEngagement = (classroomId?: string) => get(`/classroom/engagement${classroomId ? `?classroomId=${classroomId}` : ''}`);
export const getClassroomActivityFeed = (classroomId?: string) => get(`/classroom/activity-feed${classroomId ? `?classroomId=${classroomId}` : ''}`);


