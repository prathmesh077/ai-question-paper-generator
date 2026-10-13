"""
Computer Vision Document & Paper Sheet Detection Engine for Exam Proctoring.
"""

from dataclasses import dataclass
from typing import List, Optional, Tuple
import cv2
import numpy as np

from .config import ProctorConfig, default_config
from .utils import calculate_brightness, calculate_texture_variance, four_point_transform


@dataclass
class DocumentDetectionResult:
    """Represents a localized document/paper detection."""
    bbox: Tuple[int, int, int, int]           # (x1, y1, x2, y2)
    corners: np.ndarray                       # 4 corner points (4, 2)
    confidence: float                         # 0.0 - 1.0 confidence score
    brightness: float                         # Mean luminance
    texture_variance: float                   # Laplacian texture variance
    warped_document: Optional[np.ndarray]     # Orthogonally rectified document crop
    label: str = "Unauthorized Document"
    is_magazine: bool = False                 # True if classified as glossy magazine / periodical
    color_richness: float = 0.0               # Mean color saturation (0-255)


class DocumentDetector:
    """
    Detects unauthorized physical paper documents, exam cheat sheets,
    and printed materials within camera frames using geometric and texture analysis.
    """

    def __init__(self, config: ProctorConfig = default_config):
        self.config = config

    def detect(self, frame: np.ndarray) -> List[DocumentDetectionResult]:
        """
        Scans a video frame for physical paper documents or cheat sheets.
        Returns a list of detected DocumentDetectionResult objects.
        """
        if frame is None or frame.size == 0:
            return []

        h, w = frame.shape[:2]
        frame_area = float(w * h)
        results: List[DocumentDetectionResult] = []

        # 1. Convert to grayscale and smooth noise
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.bilateralFilter(gray, d=7, sigmaColor=75, sigmaSpace=75)

        # 2. Multi-threshold edge detection
        # Otsu threshold as an adaptive baseline
        otsu_val, _ = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        canny_low = max(30, int(otsu_val * 0.5))
        canny_high = min(220, int(otsu_val * 1.2))
        edged = cv2.Canny(blurred, canny_low, canny_high)

        # 3. Morphological close to seal broken edges
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        closed = cv2.morphologyEx(edged, cv2.MORPH_CLOSE, kernel, iterations=2)

        # 4. Extract external contours
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return []

        # Sort contours by area descending and test the most prominent
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:15]

        for cnt in contours:
            area = cv2.contourArea(cnt)
            area_ratio = area / frame_area

            # Area criteria
            if area_ratio < self.config.DOC_MIN_AREA_RATIO or area_ratio > self.config.DOC_MAX_AREA_RATIO:
                continue

            # Perimeter and polygon approximation
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.03 * peri, True)

            # Must be a 4-point convex polygon
            if len(approx) != 4 or not cv2.isContourConvex(approx):
                continue

            pts = approx.reshape(4, 2)

            # Bounding box & aspect ratio
            x, y, bw, bh = cv2.boundingRect(pts)
            if bw <= 0 or bh <= 0:
                continue

            aspect_ratio = float(bw) / float(bh)
            if (
                aspect_ratio < self.config.DOC_MIN_ASPECT_RATIO
                or aspect_ratio > self.config.DOC_MAX_ASPECT_RATIO
            ):
                continue

            # Extract rectified document crop
            warped = four_point_transform(frame, pts)
            if warped is None or warped.size == 0 or warped.shape[0] < 20 or warped.shape[1] < 20:
                continue

            # Analyze document brightness, texture, and color saturation
            brightness = calculate_brightness(warped)
            texture_var = calculate_texture_variance(warped)

            # Measure color saturation in HSV to detect glossy magazine covers
            hsv = cv2.cvtColor(warped, cv2.COLOR_BGR2HSV) if len(warped.shape) == 3 else None
            mean_sat = float(np.mean(hsv[:, :, 1])) if hsv is not None else 0.0

            # Document qualification criteria:
            # Type A: Plain white/light paper sheet (high brightness >= DOC_MIN_BRIGHTNESS)
            # Type B: Magazine cover / periodical (rich color saturation > 50 and high edge/text variance)
            is_valid_paper = brightness >= self.config.DOC_MIN_BRIGHTNESS
            is_magazine = (mean_sat > 55.0 and texture_var >= self.config.DOC_MIN_EDGE_VARIANCE)

            if not (is_valid_paper or is_magazine):
                continue

            # Confidence scoring
            if is_magazine:
                # Magazine covers have rich saturation and distinct print typography
                label = "Unauthorized Magazine Cover"
                sat_score = min(1.0, mean_sat / 120.0)
                tex_score = min(1.0, texture_var / 120.0)
                confidence = float(0.45 * sat_score + 0.40 * tex_score + 0.15 * (area_ratio / 0.15))
            else:
                label = "Unauthorized Paper Sheet"
                bright_score = min(1.0, max(0.0, (brightness - 100) / 140))
                texture_score = min(1.0, max(0.2, texture_var / 150.0))
                area_score = min(1.0, max(0.4, (area_ratio / 0.15)))
                confidence = float(0.4 * bright_score + 0.35 * texture_score + 0.25 * area_score)

            confidence = min(0.99, max(0.40, confidence))
            bbox = (x, y, x + bw, y + bh)
            results.append(
                DocumentDetectionResult(
                    bbox=bbox,
                    corners=pts,
                    confidence=confidence,
                    brightness=brightness,
                    texture_variance=texture_var,
                    warped_document=warped,
                    label=label,
                    is_magazine=is_magazine,
                    color_richness=mean_sat,
                )
            )

        # Fallback for directly uploaded / isolated full-frame document or magazine images
        if not results and w >= 80 and h >= 80:
            brightness = calculate_brightness(frame)
            texture_var = calculate_texture_variance(frame)
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV) if len(frame.shape) == 3 else None
            mean_sat = float(np.mean(hsv[:, :, 1])) if hsv is not None else 0.0

            is_valid_paper = brightness >= self.config.DOC_MIN_BRIGHTNESS
            is_magazine = (mean_sat > 55.0 and texture_var >= self.config.DOC_MIN_EDGE_VARIANCE)

            if is_valid_paper or is_magazine:
                label = "Unauthorized Magazine Cover" if is_magazine else "Unauthorized Paper Sheet"
                conf = 0.88 if is_magazine else 0.85
                corners = np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]], dtype=np.int32)
                results.append(
                    DocumentDetectionResult(
                        bbox=(0, 0, w, h),
                        corners=corners,
                        confidence=conf,
                        brightness=brightness,
                        texture_variance=texture_var,
                        warped_document=frame.copy(),
                        label=label,
                        is_magazine=is_magazine,
                        color_richness=mean_sat,
                    )
                )

        return results
