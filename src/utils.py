"""
Image processing and visual utility functions for ExamProctor AI.
"""

import base64
from typing import List, Optional, Tuple
import cv2
import numpy as np


def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Orders 4 points in order: top-left, top-right, bottom-right, bottom-left.
    pts: shape (4, 2)
    """
    rect = np.zeros((4, 2), dtype="float32")
    # Sum of coordinates: top-left has smallest sum, bottom-right has largest sum
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    # Difference of coordinates: top-right has smallest diff (x - y), bottom-left has largest
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """
    Applies perspective transform to extract a top-down orthogonal view of a document.
    """
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    # Compute width of new image
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    # Compute height of new image
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    if maxWidth <= 0 or maxHeight <= 0:
        return image.copy()

    dst = np.array(
        [
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1],
        ],
        dtype="float32",
    )

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped


def calculate_brightness(roi: np.ndarray) -> float:
    """Calculates average brightness (0-255) of an image or region."""
    if roi is None or roi.size == 0:
        return 0.0
    if len(roi.shape) == 3:
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    else:
        gray = roi
    return float(np.mean(gray))


def calculate_texture_variance(roi: np.ndarray) -> float:
    """
    Computes Laplacian variance to measure texture/text presence.
    Higher variance indicates presence of printed or handwritten text/edges.
    """
    if roi is None or roi.size == 0:
        return 0.0
    if len(roi.shape) == 3:
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    else:
        gray = roi
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    return float(lap.var())


def calculate_iou(box1: Tuple[int, int, int, int], box2: Tuple[int, int, int, int]) -> float:
    """Computes Intersection-over-Union between two bounding boxes (x1, y1, x2, y2)."""
    xA = max(box1[0], box2[0])
    yA = max(box1[1], box2[1])
    xB = min(box1[2], box2[2])
    yB = min(box1[3], box2[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (box1[2] - box1[0]) * (box1[3] - box1[1])
    boxBArea = (box2[2] - box2[0]) * (box2[3] - box2[1])
    unionArea = float(boxAArea + boxBArea - interArea)

    if unionArea <= 0:
        return 0.0
    return interArea / unionArea


def draw_styled_box(
    img: np.ndarray,
    box: Tuple[int, int, int, int],
    label: str,
    color: Tuple[int, int, int],
    thickness: int = 2,
    confidence: Optional[float] = None,
):
    """Draws a high-visibility bounding box with label header tag."""
    x1, y1, x2, y2 = [int(v) for v in box]
    h, w = img.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w - 1, x2), min(h - 1, y2)

    # Draw rectangle
    cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)

    # Prepare text
    text = f"{label} ({confidence:.0%})" if confidence is not None else label

    # Text background badge
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.5
    font_thickness = 1
    (text_w, text_h), baseline = cv2.getTextSize(text, font, font_scale, font_thickness)

    # Draw filled background for label
    badge_y1 = max(0, y1 - text_h - 6)
    badge_y2 = y1
    cv2.rectangle(img, (x1, badge_y1), (x1 + text_w + 8, badge_y2), color, -1)
    cv2.putText(
        img,
        text,
        (x1 + 4, y1 - 4),
        font,
        font_scale,
        (255, 255, 255),
        font_thickness,
        cv2.LINE_AA,
    )


def draw_proctor_hud(
    frame: np.ndarray,
    active_violations: List[str],
    fps: float,
    candidate_present: bool = True,
    session_elapsed_sec: float = 0.0,
) -> np.ndarray:
    """
    Draws a professional proctoring HUD status bar across the top of the video frame.
    """
    canvas = frame.copy()
    h, w = canvas.shape[:2]

    # Draw semi-transparent header bar
    overlay = canvas.copy()
    cv2.rectangle(overlay, (0, 0), (w, 54), (20, 20, 25), -1)
    cv2.addWeighted(overlay, 0.75, canvas, 0.25, 0, canvas)

    # Title & FPS
    mins = int(session_elapsed_sec // 60)
    secs = int(session_elapsed_sec % 60)
    time_str = f"SESSION: {mins:02d}:{secs:02d}"
    fps_str = f"FPS: {fps:.1f}"

    cv2.putText(
        canvas,
        "EXAM PROCTOR AI [LIVE]",
        (16, 24),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (0, 255, 180),
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        canvas,
        f"{time_str} | {fps_str}",
        (16, 44),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.42,
        (200, 200, 200),
        1,
        cv2.LINE_AA,
    )

    # Overall Status Banner
    if active_violations:
        status_text = f"WARNING: {', '.join(active_violations[:2])}"
        status_color = (0, 0, 230)  # Bright Red
        badge_bg = (0, 0, 160)
    elif not candidate_present:
        status_text = "ALERT: CANDIDATE ABSENT"
        status_color = (0, 165, 255)  # Orange
        badge_bg = (0, 120, 200)
    else:
        status_text = "STATUS: EXAM NORMAL"
        status_color = (0, 230, 0)  # Green
        badge_bg = (0, 120, 0)

    (s_w, s_h), _ = cv2.getTextSize(status_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
    right_x = w - s_w - 20
    cv2.rectangle(canvas, (right_x - 10, 10), (w - 10, 44), badge_bg, -1)
    cv2.putText(
        canvas,
        status_text,
        (right_x, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )

    # If severe violation, pulse red border around the whole frame
    if active_violations:
        cv2.rectangle(canvas, (0, 0), (w - 1, h - 1), (0, 0, 230), 4)

    return canvas
