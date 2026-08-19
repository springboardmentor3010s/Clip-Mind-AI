export interface TranscriptSegment {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
}

export interface Transcript {
  id: string;
  video_id: string;
  segments: TranscriptSegment[];
  keywords?: string[];
}
