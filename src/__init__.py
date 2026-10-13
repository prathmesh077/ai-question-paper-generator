"""
AI-Based Photo & Document Detection System for Exam Monitoring (ExamProctor AI).
"""

from .config import ProctorConfig
from .document_detector import DocumentDetector, DocumentDetectionResult
from .object_detector import YOLOObjectDetector, ObjectDetectionResult
from .face_id_verifier import FaceIDVerifier, VerificationResult
from .proctor_engine import ProctorEngine, FrameAnalysisResult
from .logger import AuditLogger

__all__ = [
    "ProctorConfig",
    "DocumentDetector",
    "DocumentDetectionResult",
    "YOLOObjectDetector",
    "ObjectDetectionResult",
    "FaceIDVerifier",
    "VerificationResult",
    "ProctorEngine",
    "FrameAnalysisResult",
    "AuditLogger",
]
