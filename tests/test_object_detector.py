"""
Tests for YOLO-based Exam Object Detector.
"""

from pathlib import Path
import cv2
import numpy as np
import pytest

from src.object_detector import YOLOObjectDetector


def test_yolo_detector_instantiation():
    detector = YOLOObjectDetector()
    assert detector is not None
    assert "cell phone" in detector.target_classes
    assert "book" in detector.target_classes
    assert "person" in detector.target_classes


def test_yolo_detector_blank_frame():
    detector = YOLOObjectDetector()
    blank = np.zeros((320, 320, 3), dtype=np.uint8)
    results = detector.detect(blank)
    assert isinstance(results, list)
