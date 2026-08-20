"""
OpenCV-based visual scene-change detection. Independent of the
transcript — analyzes the actual video frames to detect cuts,
slide changes, and camera transitions.
"""

import cv2


def detect_scene_changes(video_path: str, threshold: float = 0.35, sample_interval_seconds: float = 1.0) -> list[dict]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    frame_interval = max(1, int(fps * sample_interval_seconds))

    scenes = []
    prev_hist = None
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_interval == 0:
            small = cv2.resize(frame, (160, 90))
            hist = cv2.calcHist([small], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
            hist = cv2.normalize(hist, hist).flatten()

            if prev_hist is not None:
                diff = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA)
                if diff > threshold:
                    timestamp = frame_idx / fps
                    scenes.append({"time": round(timestamp, 1), "label": "Scene change detected"})

            prev_hist = hist

        frame_idx += 1

    cap.release()

    # Keep scenes at least 3 seconds apart, cap at 20
    filtered = []
    last_time = -999
    for s in scenes:
        if s["time"] - last_time >= 3:
            filtered.append(s)
            last_time = s["time"]

    return filtered[:20]