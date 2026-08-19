/**
 * Reliably seek an HTML5 <video> to a timestamp and start playback from there.
 *
 * Fixes the "always starts at 0:00" bug by:
 *  - waiting for metadata (readyState >= HAVE_METADATA) before seeking, and
 *  - waiting for the `seeked` event to fire before calling play(), so playback
 *    begins from the requested position rather than the old one.
 *
 * Requires the media server to support HTTP Range (206) — handled by the
 * backend's range-capable media view.
 */
export function seekAndPlay(video, seconds) {
  if (!video) return;
  const target = Math.max(0, Number(seconds) || 0);

  const start = () => {
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };

  const doSeek = () => {
    // Already at (or extremely close to) the target — just play.
    if (Math.abs(video.currentTime - target) < 0.25) {
      start();
      return;
    }
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      start();
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    try {
      video.currentTime = target;
    } catch {
      video.removeEventListener("seeked", onSeeked);
    }
  };

  if (video.readyState >= 1 /* HAVE_METADATA */) {
    doSeek();
  } else {
    const onMeta = () => {
      video.removeEventListener("loadedmetadata", onMeta);
      doSeek();
    };
    video.addEventListener("loadedmetadata", onMeta, { once: true });
    try {
      video.load();
    } catch {
      /* ignore */
    }
  }
}
