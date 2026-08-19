import { API_BASE_URL } from '@/config';
import axios from 'axios';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export const uploadVideoMultipart = async (
  file: File,
  onProgress: (progress: number) => void,
  onSuccess: (data: any) => void,
  onError: (error: any) => void,
  signal?: AbortSignal,
  token?: string | null
) => {
  try {
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // 1. Initialize Multipart Upload
    const initRes = await axios.post(`${API_BASE_URL}/upload/multipart/init`, {
      title: file.name,
      filename: file.name,
      file_type: file.type,
      file_size_bytes: file.size
    }, { signal, headers: authHeaders });
    
    const { video_id, upload_id, s3_key } = initRes.data;
    
    // 2. Chunk the file
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const partNumbers = Array.from({ length: totalChunks }, (_, i) => i + 1);
    
    // 3. Get Presigned URLs for all chunks
    const urlsRes = await axios.post(`${API_BASE_URL}/upload/multipart/presigned-urls`, {
      upload_id,
      s3_key,
      part_numbers: partNumbers
    }, { signal });
    
    const presignedUrls = urlsRes.data.presigned_urls;
    const uploadedParts = [];
    
    // 4. Upload chunks
    let totalUploadedBytes = 0;
    
    for (let i = 0; i < totalChunks; i++) {
      if (signal?.aborted) {
        throw new Error('Upload cancelled');
      }
      
      const partNumber = partNumbers[i];
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const presignedUrl = presignedUrls[partNumber];
      
      const uploadRes = await axios.put(presignedUrl, chunk, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.loaded) {
            const currentChunkUploaded = progressEvent.loaded;
            const totalUploadedSoFar = totalUploadedBytes + currentChunkUploaded;
            const percentage = Math.round((totalUploadedSoFar * 100) / file.size);
            if (onProgress) onProgress(percentage);
          }
        },
        signal
      });
      
      totalUploadedBytes += chunk.size;
      
      const eTag = uploadRes.headers.etag;
      uploadedParts.push({ ETag: eTag, PartNumber: partNumber });
    }
    
    // 5. Complete Multipart Upload
    const completeRes = await axios.post(`${API_BASE_URL}/upload/multipart/complete`, {
      video_id,
      upload_id,
      s3_key,
      parts: uploadedParts
    }, { signal });
    
    if (onSuccess) onSuccess(completeRes.data);
    
  } catch (error) {
    if (axios.isCancel(error) || (error instanceof Error && error.message === 'Upload cancelled')) {
      console.log('Upload was cancelled.');
    } else {
      console.error('Upload failed:', error);
      if (onError) onError(error);
    }
  }
};
