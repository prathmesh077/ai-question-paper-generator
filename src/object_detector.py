"""
Deep Learning Object Detection Engine for Exam Proctoring using YOLOv8.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np
from ultralytics import YOLO

from .config import ProctorConfig, default_config


@dataclass
class ObjectDetectionResult:
    """Represents a localized object detected by YOLO."""
    bbox: Tuple[int, int, int, int]  # (x1, y1, x2, y2)
    label: str                       # e.g., 'cell phone', 'book', 'person'
    confidence: float                # 0.0 - 1.0
    class_id: int
    is_violation: bool = False       # True if it represents prohibited exam material


class YOLOObjectDetector:
    """
    Detects mobile phones (photo cheat), books/notes, unauthorized secondary displays,
    and monitors candidate presence using YOLOv8.
    """

    # Prohibited object types in an examination environment
    PROHIBITED_CLASSES = {"cell phone", "book", "laptop", "tv"}

    def __init__(
        self,
        model_name: Optional[str] = None,
        config: ProctorConfig = default_config,
    ):
        self.config = config
        self.model_name = model_name or config.YOLO_MODEL_NAME
        self.model = YOLO(self.model_name)
        # Warmup dictionary of target names to COCO class IDs
        self.target_classes = set(self.config.YOLO_CONF_THRESHOLDS.keys())

    def detect(self, frame: np.ndarray) -> List[ObjectDetectionResult]:
        """
        Runs neural detection on the frame and filters for exam-relevant objects.
        """
        if frame is None or frame.size == 0:
            return []

        # Run YOLO inference
        # verbose=False suppresses per-frame console logging
        results = self.model.predict(
            source=frame,
            conf=0.25,
            verbose=False,
            device="cpu",  # reliable cross-platform default
        )

        detections: List[ObjectDetectionResult] = []
        if not results:
            return detections

        first_res = results[0]
        names = first_res.names

        for box in first_res.boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            label = names.get(cls_id, str(cls_id)).lower()

            # Only process classes of interest
            if label not in self.target_classes:
                continue

            threshold = self.config.YOLO_CONF_THRESHOLDS.get(label, 0.4)
            if conf < threshold:
                continue

            xyxy = box.xyxy[0].cpu().numpy().astype(int)
            x1, y1, x2, y2 = xyxy[0], xyxy[1], xyxy[2], xyxy[3]

            is_violation = label in self.PROHIBITED_CLASSES

            detections.append(
                ObjectDetectionResult(
                    bbox=(x1, y1, x2, y2),
                    label=label,
                    confidence=conf,
                    class_id=cls_id,
                    is_violation=is_violation,
                )
            )

        return detections
