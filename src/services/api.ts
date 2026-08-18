import {
  VideoItem,
  VideoTranscript,
  VideoSummary,
  SystemAnalytics,
  User,
  LearningBookmark,
} from '../types';

// =========================================================
// EXPORTED API TYPES
// =========================================================

export interface Classroom {
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

export interface EducatorAssignment {
  id: string;
  classroomId: string;
  classroom: string | null;
  videoId?: string | null;
  videoTitle?: string | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
  status?: string;
}

export interface ClassroomVideo {
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

export interface Video {
  id: string;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  fileName?: string | null;
  duration?: number | null;
  size?: number | null;
  status?: string;
  progress?: number;
  category?: string | null;
  viewsCount?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TranscriptResponse {
  videoId?: string;
  transcript?: string;
  text?: string;
  segments?: Array<{
    id?: number;
    start: number;
    end: number;
    text: string;
  }>;
  status?: string;
}

export interface KeyMoment {
  id?: string;
  videoId?: string;
  title?: string;
  description?: string;
  timestamp?: number;
  startTime?: number;
  endTime?: number;
  text?: string;
  importance?: number;
}

export type ApiKeyMomentType = KeyMoment;

// =========================================================
// API CONFIG
// =========================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8001';

// =========================================================
// MEDIA URL
// =========================================================

export const getMediaUrl = (url?: string | null) => {
  if (!url) return '';

  if (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  return `${API_BASE_URL}${
    url.startsWith('/') ? url : `/${url}`
  }`;
};

// =========================================================
// AUTH HELPERS
// =========================================================

const getToken = () => {
  return localStorage.getItem('clipmind_token');
};

const getAuthHeaders = () => {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
};

const apiUrl = (endpoint: string) => {
  if (
    endpoint.startsWith('http://') ||
    endpoint.startsWith('https://')
  ) {
    return endpoint;
  }

  return `${API_BASE_URL}${
    endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  }`;
};

// =========================================================
// GENERIC FETCH
// =========================================================

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = apiUrl(endpoint);

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  console.log(
    '[API REQUEST]',
    options.method || 'GET',
    url
  );

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error(
      '[API NETWORK ERROR]',
      url,
      error
    );

    throw new Error(
      'Cannot connect to the ClipMind backend. Make sure the backend is running on port 8001.'
    );
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const text = await response.text();

      if (text) {
        try {
          const json = JSON.parse(text);

          if (typeof json.detail === 'string') {
            message = json.detail;
          } else if (Array.isArray(json.detail)) {
            message = json.detail
              .map(
                (e: any) =>
                  e.msg || JSON.stringify(e)
              )
              .join(', ');
          } else if (json.message) {
            message = json.message;
          } else if (json.error) {
            message = json.error;
          } else {
            message = text;
          }
        } catch {
          message = text;
        }
      }
    } catch {
      // Keep HTTP status message.
    }

    console.error('[API ERROR]', {
      url,
      status: response.status,
      message,
    });

    if (response.status === 401) {
      throw new Error(
        'Your session has expired. Please sign in again.'
      );
    }

    throw new Error(`API Error: ${message}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// =========================================================
// API
// =========================================================

export const api = {

  // =======================================================
  // AUTH
  // =======================================================

  register: (data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
  }) =>
    fetchApi<{
      message?: string;
      access_token?: string;
      token_type?: string;
      user?: User;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        full_name: data.full_name,
        role: data.role.toLowerCase(),
      }),
    }),

  login: async (data: {
    email: string;
    password: string;
  }) => {
    console.log('[API] POST /auth/login');

    const result = await fetchApi<{
      access_token: string;
      token_type: string;
      user?: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    });

    if (!result || !result.access_token) {
      throw new Error(
        'Backend did not return an access token.'
      );
    }

    localStorage.setItem(
      'clipmind_token',
      result.access_token
    );

    console.log(
      '[API] Login token received'
    );

    return result;
  },

  getMe: async () => {
    return fetchApi<User>('/auth/me');
  },

  // =======================================================
  // CLASSROOMS
  // =======================================================

  getClassrooms: () =>
    fetchApi<Classroom[]>('/classrooms'),

  // -------------------------------------------------------
  // NEW: RESOLVE CLASSROOM BY CODE
  // -------------------------------------------------------

  resolveClassroomCode: (code: string) =>
    fetchApi<Classroom>(
      `/classrooms/code/${encodeURIComponent(
        code.trim().toUpperCase()
      )}`
    ),

  // -------------------------------------------------------
  // JOIN CLASSROOM
  // -------------------------------------------------------

  joinClassroom: (
    classroomId: string,
    code: string
  ) =>
    fetchApi<{
      message: string;
      classroomId: string;
      name: string;
      code: string;
    }>(
      `/classrooms/${classroomId}/join`,
      {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
        }),
      }
    ),

  createClassroom: (data: {
    name: string;
    description: string;
  }) =>
    fetchApi<Classroom>('/classrooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getClassroom: (classroomId: string) =>
    fetchApi<Classroom>(
      `/classrooms/${classroomId}`
    ),

  // -------------------------------------------------------
  // DELETE CLASSROOM
  // -------------------------------------------------------

  deleteClassroom: (classroomId: string) =>
    fetchApi<{ message: string }>(
      `/classrooms/${classroomId}`,
      {
        method: 'DELETE',
      }
    ),

  // =======================================================
  // EDUCATOR STUDENTS
  // =======================================================

  getEducatorStudents: () =>
    fetchApi<{
      id: string;
      name: string;
      email: string;
      classroomId: string;
      classroom: string;
      joinedAt?: string | null;
    }[]>('/educator/students'),

  // =======================================================
  // EDUCATOR ASSIGNMENTS
  // =======================================================

  getEducatorAssignments: () =>
    fetchApi<EducatorAssignment[]>(
      '/educator/assignments'
    ),

  createEducatorAssignment: (data: {
    classroomId: string;
    title: string;
    description?: string | null;
    dueDate?: string | null;
    videoId?: string | null;
  }) =>
    fetchApi<EducatorAssignment>(
      '/educator/assignments',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  updateEducatorAssignment: (
    assignmentId: string,
    data: {
      title?: string;
      description?: string | null;
      dueDate?: string | null;
      videoId?: string | null;
    }
  ) =>
    fetchApi<EducatorAssignment>(
      `/educator/assignments/${assignmentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  deleteEducatorAssignment: (
    assignmentId: string
  ) =>
    fetchApi<{
      message: string;
    }>(
      `/educator/assignments/${assignmentId}`,
      {
        method: 'DELETE',
      }
    ),

  // =======================================================
  // VIDEOS
  // =======================================================

  getVideos: () =>
    fetchApi<VideoItem[]>('/videos'),

  getVideo: (id: string) =>
    fetchApi<VideoItem>(
      `/videos/${id}`
    ),

  updateVideo: (
    id: string,
    data: any
  ) =>
    fetchApi<{ message: string }>(
      `/videos/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  deleteVideo: (id: string) =>
    fetchApi<{ message: string }>(
      `/videos/${id}`,
      {
        method: 'DELETE',
      }
    ),

  // =======================================================
  // VIDEO UPLOAD
  // =======================================================

  uploadVideo: (
    formData: FormData,
    onProgress?: (
      percent: number
    ) => void
  ): Promise<any> => {
    return new Promise(
      (resolve, reject) => {
        const xhr =
          new XMLHttpRequest();

        const url =
          apiUrl('/videos/upload');

        console.log(
          '[UPLOAD] Starting upload:',
          url
        );

        xhr.open(
          'POST',
          url,
          true
        );

        const token = getToken();

        if (token) {
          xhr.setRequestHeader(
            'Authorization',
            `Bearer ${token}`
          );
        }

        xhr.timeout =
          10 * 60 * 1000;

        xhr.upload.onprogress =
          (event) => {
            if (
              event.lengthComputable &&
              onProgress
            ) {
              const percent =
                Math.round(
                  (event.loaded /
                    event.total) *
                    100
                );

              onProgress(percent);
            }
          };

        xhr.onload = () => {
          console.log(
            '[UPLOAD] Response:',
            xhr.status,
            xhr.responseText
          );

          if (
            xhr.status >= 200 &&
            xhr.status < 300
          ) {
            try {
              resolve(
                JSON.parse(
                  xhr.responseText
                )
              );
            } catch {
              resolve({
                message:
                  'Upload successful',
              });
            }

            return;
          }

          let message =
            `Upload failed (${xhr.status})`;

          try {
            const error =
              JSON.parse(
                xhr.responseText
              );

            if (
              typeof error.detail ===
              'string'
            ) {
              message =
                error.detail;
            } else if (
              Array.isArray(
                error.detail
              )
            ) {
              message =
                error.detail
                  .map(
                    (e: any) =>
                      e.msg ||
                      JSON.stringify(e)
                  )
                  .join(', ');
            } else if (
              error.message
            ) {
              message =
                error.message;
            } else if (
              error.error
            ) {
              message =
                error.error;
            }
          } catch {
            if (
              xhr.responseText
            ) {
              message =
                xhr.responseText;
            }
          }

          if (
            xhr.status === 400
          ) {
            message =
              message ||
              'Invalid upload request.';
          } else if (
            xhr.status === 401
          ) {
            message =
              'Your session has expired. Please sign in again.';
          } else if (
            xhr.status === 403
          ) {
            message =
              'Permission denied. Please sign in again.';
          } else if (
            xhr.status === 413
          ) {
            message =
              'File is larger than the 500 MB limit.';
          } else if (
            xhr.status === 502 ||
            xhr.status === 503 ||
            xhr.status === 504
          ) {
            message =
              'Backend is unavailable or the upload timed out. Please try again.';
          }

          reject(
            new Error(message)
          );
        };

        xhr.onerror = () => {
          reject(
            new Error(
              'Cannot connect to the ClipMind backend. Make sure port 8001 is running.'
            )
          );
        };

        xhr.ontimeout = () => {
          reject(
            new Error(
              'Upload timed out after 10 minutes. Please try again.'
            )
          );
        };

        xhr.send(formData);
      }
    );
  },

  // =======================================================
  // AI PROCESSING
  // =======================================================

  getTranscript: (
    videoId: string
  ) =>
    fetchApi<VideoTranscript>(
      `/videos/${videoId}/transcript`
    ),

  getSummary: (
    videoId: string
  ) =>
    fetchApi<VideoSummary>(
      `/videos/${videoId}/summary`
    ),

  getKeyMoments: (
    videoId: string
  ) =>
    fetchApi<KeyMoment[]>(
      `/videos/${videoId}/key-moments`
    ),

  triggerTranscribe: (
    videoId: string
  ) =>
    fetchApi<{ message: string }>(
      `/videos/${videoId}/transcribe`,
      {
        method: 'POST',
      }
    ),

  triggerSummarize: (
    videoId: string
  ) =>
    fetchApi<{ message: string }>(
      `/videos/${videoId}/summarize`,
      {
        method: 'POST',
      }
    ),

  triggerKeyMoments: (
    videoId: string
  ) =>
    fetchApi<{ message: string }>(
      `/videos/${videoId}/key-moments`,
      {
        method: 'POST',
      }
    ),

  // =======================================================
  // ANALYTICS
  // =======================================================

  getAnalytics: () =>
    fetchApi<SystemAnalytics>(
      '/api/analytics'
    ),

  // =======================================================
  // USERS
  // =======================================================

  getUsers: () =>
    fetchApi<User[]>('/users'),

  updateUserRole: (
    userId: string,
    role: string
  ) =>
    fetchApi<{ message: string }>(
      `/users/${userId}/role`,
      {
        method: 'PUT',
        body: JSON.stringify({
          role,
        }),
      }
    ),

  // =======================================================
  // ADMIN ACTIVITY
  // =======================================================

  getActivityLogs: () =>
    fetchApi<{
      id: string;
      userId: string;
      userName: string;
      userEmail: string;
      action: string;
      details: string;
      timestamp: string;
    }[]>('/admin/activity'),

  getAdminActivity: () =>
    fetchApi<any[]>(
      '/admin/activity'
    ),

  // =======================================================
  // BOOKMARKS
  // =======================================================

  createBookmark: (data: any) =>
    fetchApi<{
      id: string;
      message: string;
    }>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBookmarks: () =>
    fetchApi<LearningBookmark[]>(
      '/bookmarks'
    ),

  // =======================================================
  // CLASSROOM VIDEO SHARING
  // =======================================================

  shareVideoToClassroom: (
    classroomId: string,
    videoId: string
  ) =>
    fetchApi<{
      message: string;
      classroomId: string;
      videoId: string;
      sharedAt?: string;
    }>(
      `/classrooms/${classroomId}/videos/${videoId}`,
      {
        method: 'POST',
      }
    ),

  getClassroomVideos: (
    classroomId: string
  ) =>
    fetchApi<ClassroomVideo[]>(
      `/classrooms/${classroomId}/videos`
    ),
};

export default api;