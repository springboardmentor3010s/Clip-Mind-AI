export type UserRole = 'CONTENT_CREATOR' | 'LEARNER' | 'EDUCATOR' | 'ADMINISTRATOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export type ProcessingStatus = 
  | 'QUEUED'
  | 'PROCESSING_FFMPEG'
  | 'TRANSCRIBING_WHISPER'
  | 'SUMMARIZING_BART'
  | 'DETECTING_KEY_MOMENTS'
  | 'COMPLETED'
  | 'FAILED';

export interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  format: string;
  size: number; // in bytes
  fps?: number;
  audioBitrate?: string;
  waveform?: number[];
}

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  duration: number;
  size: number;
  status: ProcessingStatus;
  progress: number; // 0 to 100
  uploaderId: string;
  uploaderName: string;
  uploaderRole: UserRole;
  category: string;
  createdAt: string;
  updatedAt: string;
  viewsCount: number;
  bookmarksCount: number;
  metadata?: VideoMetadata;
}

export interface TranscriptSegment {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  speaker?: string;
  confidence: number;
}

export interface VideoTranscript {
  id: string;
  videoId: string;
  language: string;
  fullText: string;
  segments: TranscriptSegment[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoSummary {
  id: string;
  videoId: string;
  shortSummary: string;
  detailedSummary: string;
  contentAbstraction: string;
  bulletPoints: string[];
  readingTimeMinutes: number;
  createdAt: string;
}

export interface KeyMoment {
  id: string;
  videoId: string;
  title: string;
  description: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  importanceScore: number; // 0 to 100
  topic: string;
  keywords: string[];
}

export interface KeywordInsight {
  keyword: string;
  count: number;
  relevanceScore: number;
  category: string;
}

export interface SystemAnalytics {
  totalVideos: number;
  totalUsers: number;
  totalTranscriptsGenerated: number;
  totalSummariesGenerated: number;
  totalKeyMomentsDetected: number;
  totalProcessingTimeSeconds: number;
  totalStorageUsedBytes: number;
  roleCounts: Record<UserRole, number>;
  statusCounts: Record<ProcessingStatus, number>;
  topKeywords: KeywordInsight[];
  recentActivity: ActivityLog[];
  dailyUsage: { date: string; uploads: number; processingJobs: number }[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface LearningBookmark {
  id: string;
  userId: string;
  videoId: string;
  videoTitle: string;
  type: 'SUMMARY' | 'HIGHLIGHT' | 'TRANSCRIPT';
  contentSnippet: string;
  timestampSec?: number;
  createdAt: string;
}
