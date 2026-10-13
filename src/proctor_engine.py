"""
Core Proctoring Engine coordinating Document Detection, Neural Object Detection,
Violation State Machine, and Evidence Logging.
"""

import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np

from .config import ProctorConfig, default_config
from .document_detector import DocumentDetector, DocumentDetectionResult
from .logger import AuditLogger
from .object_detector import YOLOObjectDetector, ObjectDetectionResult
from .utils import draw_proctor_hud, draw_styled_box


@dataclass
class FrameAnalysisResult:
    """Consolidated result of analyzing a single video frame."""
    annotated_frame: np.ndarray
    active_violations: List[str]
    new_incidents: List[Dict]
    candidate_present: bool
    fps: float
    elapsed_seconds: float
    documents: List[DocumentDetectionResult]
    objects: List[ObjectDetectionResult]


class ProctorEngine:
    """
    Main Exam Monitoring & Proctoring Pipeline.
    Integrates deep learning and classical computer vision detectors to continuously
    audit an examination session.
    """

    # Violation Types
    V_UNAUTHORIZED_DOCUMENT = "UNAUTHORIZED DOCUMENT / NOTES"
    V_MAGAZINE_DETECTED = "UNAUTHORIZED MAGAZINE / PERIODICAL COVER"
    V_PHONE_DETECTED = "MOBILE PHONE / PHOTO DISPLAY"
    V_BOOK_DETECTED = "PROHIBITED BOOK / MANUAL"
    V_MULTIPLE_PERSONS = "MULTIPLE PERSONS DETECTED"
    V_CANDIDATE_ABSENT = "CANDIDATE ABSENT FROM SEAT"
    V_SECONDARY_SCREEN = "SECONDARY SCREEN DETECTED"

    def __init__(
        self,
        config: ProctorConfig = default_config,
        session_id: Optional[str] = None,
    ):
        self.config = config
        self.document_detector = DocumentDetector(config)
        self.object_detector = YOLOObjectDetector(config=config)
        self.logger = AuditLogger(session_id=session_id, config=config)

        # Performance tracking
        self.start_time = time.time()
        self._prev_frame_time = time.time()
        self.fps = 0.0

        # Violation frame counters for debounce
        self._counter_doc = 0
        self._counter_phone = 0
        self._counter_book = 0
        self._counter_multi_person = 0
        self._counter_absent = 0

        # Snapshot cooldown timestamps (prevent redundant snapshots every 30ms)
        self._last_snapshot_time: Dict[str, float] = {}
        self.snapshot_cooldown_sec = 3.0

    def reset_session(self, new_session_id: Optional[str] = None):
        """Resets the engine and creates a fresh audit session."""
        self.logger = AuditLogger(session_id=new_session_id, config=self.config)
        self.start_time = time.time()
        self._prev_frame_time = time.time()
        self._counter_doc = 0
        self._counter_phone = 0
        self._counter_book = 0
        self._counter_multi_person = 0
        self._counter_absent = 0
        self._last_snapshot_time.clear()

    def process_frame(self, frame: np.ndarray) -> FrameAnalysisResult:
        """
        Executes end-to-end analysis on an incoming examination frame.
        """
        if frame is None or frame.size == 0:
            raise ValueError("Invalid frame supplied to process_frame.")

        # Compute FPS
        now = time.time()
        dt = now - self._prev_frame_time
        self._prev_frame_time = now
        if dt > 0:
            current_fps = 1.0 / dt
            self.fps = 0.85 * self.fps + 0.15 * current_fps if self.fps > 0 else current_fps
        elapsed_sec = now - self.start_time

        annotated = frame.copy()
        active_violations: List[str] = []
        new_incidents: List[Dict] = []

        # 1. Run Geometric Paper / Document Detection
        doc_detections = self.document_detector.detect(frame)

        # 2. Run Deep Learning Object Detection (YOLO)
        obj_detections = self.object_detector.detect(frame)

        # Separate detected object categories
        phone_detections = [o for o in obj_detections if o.label == "cell phone"]
        book_detections = [o for o in obj_detections if o.label == "book"]
        screen_detections = [o for o in obj_detections if o.label in {"laptop", "tv"}]
        person_detections = [o for o in obj_detections if o.label == "person"]

        num_persons = len(person_detections)
        candidate_present = num_persons > 0

        # 3. Violation Evaluation & Debouncing

        # A) Unauthorized Document / Magazine Cover / Paper Sheet
        if doc_detections:
            self._counter_doc += 1
            if self._counter_doc >= self.config.DEBOUNCE_FRAMES_DOC:
                has_magazine = any(d.is_magazine for d in doc_detections)
                v_type = self.V_MAGAZINE_DETECTED if has_magazine else self.V_UNAUTHORIZED_DOCUMENT
                active_violations.append(v_type)
                self._maybe_log_incident(
                    v_type,
                    doc_detections[0].confidence,
                    annotated,
                    new_incidents,
                )
        else:
            self._counter_doc = max(0, self._counter_doc - 1)

        # B) Cell Phone / Photo Cheat
        if phone_detections:
            self._counter_phone += 1
            if self._counter_phone >= self.config.DEBOUNCE_FRAMES_PHONE:
                active_violations.append(self.V_PHONE_DETECTED)
                self._maybe_log_incident(
                    self.V_PHONE_DETECTED,
                    phone_detections[0].confidence,
                    annotated,
                    new_incidents,
                )
        else:
            self._counter_phone = max(0, self._counter_phone - 1)

        # C) Book / Manual
        if book_detections:
            self._counter_book += 1
            if self._counter_book >= self.config.DEBOUNCE_FRAMES_DOC:
                active_violations.append(self.V_BOOK_DETECTED)
                self._maybe_log_incident(
                    self.V_BOOK_DETECTED,
                    book_detections[0].confidence,
                    annotated,
                    new_incidents,
                )
        else:
            self._counter_book = max(0, self._counter_book - 1)

        # D) Secondary Display
        if screen_detections:
            active_violations.append(self.V_SECONDARY_SCREEN)
            self._maybe_log_incident(
                self.V_SECONDARY_SCREEN,
                screen_detections[0].confidence,
                annotated,
                new_incidents,
            )

        # E) Multiple Persons (Impersonation / Cheating aid)
        if num_persons > 1:
            self._counter_multi_person += 1
            if self._counter_multi_person >= self.config.DEBOUNCE_FRAMES_MULTI_PERSON:
                active_violations.append(self.V_MULTIPLE_PERSONS)
                self._maybe_log_incident(
                    self.V_MULTIPLE_PERSONS,
                    0.90,
                    annotated,
                    new_incidents,
                    details={"person_count": num_persons},
                )
        else:
            self._counter_multi_person = max(0, self._counter_multi_person - 1)

        # F) Candidate Absence
        if num_persons == 0:
            self._counter_absent += 1
            if self._counter_absent >= self.config.DEBOUNCE_FRAMES_ABSENT:
                active_violations.append(self.V_CANDIDATE_ABSENT)
                self._maybe_log_incident(
                    self.V_CANDIDATE_ABSENT,
                    1.0,
                    annotated,
                    new_incidents,
                )
        else:
            self._counter_absent = max(0, self._counter_absent - 1)

        # 4. Render Annotations & HUD on Frame

        # Render Paper Document / Magazine contours & boxes
        for doc in doc_detections:
            box_color = (255, 0, 180) if doc.is_magazine else self.config.COLOR_DOCUMENT
            tag_label = "MAGAZINE COVER" if doc.is_magazine else "UNAUTHORIZED DOC"
            cv2.polylines(annotated, [doc.corners.astype(int)], isClosed=True, color=box_color, thickness=2)
            draw_styled_box(
                annotated,
                doc.bbox,
                tag_label,
                color=box_color,
                confidence=doc.confidence,
            )

        # Render Object Bounding Boxes
        for obj in obj_detections:
            if obj.label == "cell phone":
                draw_styled_box(
                    annotated,
                    obj.bbox,
                    "PHONE / PHOTO CHEAT",
                    color=self.config.COLOR_PHONE,
                    confidence=obj.confidence,
                )
            elif obj.label == "book":
                draw_styled_box(
                    annotated,
                    obj.bbox,
                    "BOOK / NOTES",
                    color=self.config.COLOR_VIOLATION,
                    confidence=obj.confidence,
                )
            elif obj.label in {"laptop", "tv"}:
                draw_styled_box(
                    annotated,
                    obj.bbox,
                    "SECONDARY SCREEN",
                    color=self.config.COLOR_WARNING,
                    confidence=obj.confidence,
                )
            elif obj.label == "person":
                color = self.config.COLOR_SAFE if num_persons == 1 else self.config.COLOR_VIOLATION
                label = "CANDIDATE" if num_persons == 1 else "UNAUTHORIZED PERSON"
                draw_styled_box(annotated, obj.bbox, label, color=color, confidence=obj.confidence)

        # Top HUD Status Bar
        annotated = draw_proctor_hud(
            annotated,
            active_violations=active_violations,
            fps=self.fps,
            candidate_present=candidate_present,
            session_elapsed_sec=elapsed_sec,
        )

        return FrameAnalysisResult(
            annotated_frame=annotated,
            active_violations=active_violations,
            new_incidents=new_incidents,
            candidate_present=candidate_present,
            fps=self.fps,
            elapsed_seconds=elapsed_sec,
            documents=doc_detections,
            objects=obj_detections,
        )

    def _maybe_log_incident(
        self,
        violation_type: str,
        confidence: float,
        frame: np.ndarray,
        incident_accumulator: List[Dict],
        details: Optional[Dict] = None,
    ):
        """Logs an incident if the cooldown period has elapsed."""
        now = time.time()
        last_time = self._last_snapshot_time.get(violation_type, 0.0)
        if now - last_time >= self.snapshot_cooldown_sec:
            record = self.logger.log_incident(
                violation_type=violation_type,
                confidence=confidence,
                frame=frame,
                details=details,
            )
            self._last_snapshot_time[violation_type] = now
            incident_accumulator.append(record)
