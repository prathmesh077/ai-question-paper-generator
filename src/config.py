"""
Configuration module for ExamProctor AI system.
"""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Tuple


@dataclass
class ProctorConfig:
    """System-wide configuration parameters."""

    # Base workspace directory
    BASE_DIR: Path = Path(__file__).resolve().parent.parent

    # Log & Evidence storage
    AUDIT_DIR: Path = BASE_DIR / "audit_logs"
    EVIDENCE_DIR: Path = AUDIT_DIR / "evidence"
    REPORTS_DIR: Path = AUDIT_DIR / "reports"

    # YOLO Model configuration
    YOLO_MODEL_NAME: str = "yolov8n.pt"  # lightweight, fast real-time inference
    YOLO_CONF_THRESHOLDS: Dict[str, float] = field(
        default_factory=lambda: {
            "cell phone": 0.35,  # Detection for mobile screen / photo cheat
            "book": 0.35,        # Printed notes, textbooks, manuals
            "laptop": 0.40,      # Secondary screens
            "person": 0.40,      # Candidate & secondary persons
        }
    )

    # Document / Paper Sheet Geometry & Texture Thresholds
    DOC_MIN_AREA_RATIO: float = 0.012  # Minimum document area as fraction of frame
    DOC_MAX_AREA_RATIO: float = 0.80   # Maximum document area (avoids entire frame background)
    DOC_MIN_ASPECT_RATIO: float = 0.40 # Standard paper (A4 is ~0.71 or ~1.41)
    DOC_MAX_ASPECT_RATIO: float = 2.60
    DOC_MIN_BRIGHTNESS: float = 120.0  # White/light-colored paper brightness filter (0-255)
    DOC_MIN_EDGE_VARIANCE: float = 25.0 # Laplacian edge variance indicating printed/handwritten text

    # Exam Violation Debounce Settings (number of consecutive frames to trigger an alert)
    DEBOUNCE_FRAMES_DOC: int = 4
    DEBOUNCE_FRAMES_PHONE: int = 3
    DEBOUNCE_FRAMES_ABSENT: int = 15
    DEBOUNCE_FRAMES_MULTI_PERSON: int = 4

    # Face ID Verification settings
    FACE_VERIFICATION_THRESHOLD: float = 0.55  # Multi-modal biometric cutoff (0.0 to 1.0)
    ID_CARD_ASPECT_RATIO: float = 1.586        # ISO/IEC 7810 standard ID card aspect ratio (85.6mm / 53.98mm)

    # Visualization BGR Colors (OpenCV format)
    COLOR_SAFE: Tuple[int, int, int] = (0, 200, 0)        # Green
    COLOR_WARNING: Tuple[int, int, int] = (0, 165, 255)   # Orange
    COLOR_VIOLATION: Tuple[int, int, int] = (0, 0, 230)   # Red
    COLOR_DOCUMENT: Tuple[int, int, int] = (255, 140, 0)  # Cyan/Blue
    COLOR_PHONE: Tuple[int, int, int] = (0, 0, 255)       # Red
    COLOR_FACE: Tuple[int, int, int] = (255, 200, 0)      # Light Blue

    def __post_init__(self):
        """Ensure storage directories exist."""
        os.makedirs(self.AUDIT_DIR, exist_ok=True)
        os.makedirs(self.EVIDENCE_DIR, exist_ok=True)
        os.makedirs(self.REPORTS_DIR, exist_ok=True)


# Default shared configuration instance
default_config = ProctorConfig()
