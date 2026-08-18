export const MAX_VIDEO_SIZE_MB = 500;
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

export const validateVideoFile = (file: File | null): string | null => {
  if (!file) {
    return "Please select a video file.";
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return `File size exceeds maximum allowed limit (${MAX_VIDEO_SIZE_MB} MB).`;
  }

  const validExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.wmv', '.flv', '.3gp', '.mpeg', '.mpg', '.ogv'];
  const dotIndex = file.name.lastIndexOf('.');
  const ext = dotIndex >= 0 ? file.name.substring(dotIndex).toLowerCase() : '';

  // Fall back to the browser-reported MIME type if the extension check is
  // inconclusive (some phones/screen recorders produce odd filenames).
  const mimeLooksLikeVideo = file.type ? file.type.toLowerCase().startsWith('video/') : false;

  if (!ext && !mimeLooksLikeVideo) {
    return `Invalid video format (unknown). Supported formats: MP4, MOV, WEBM, AVI, MKV, M4V, WMV, FLV, 3GP, MPEG, MPG, OGV.`;
  }

  if (ext && !validExtensions.includes(ext) && !mimeLooksLikeVideo) {
    return `Invalid video format (${ext}). Supported formats: MP4, MOV, WEBM, AVI, MKV, M4V, WMV, FLV, 3GP, MPEG, MPG, OGV.`;
  }

  return null;
};

