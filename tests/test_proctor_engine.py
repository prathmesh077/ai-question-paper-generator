"""
Tests for End-to-End ProctorEngine Pipeline.
"""

from pathlib import Path
import cv2
import pytest

from src.proctor_engine import ProctorEngine


def test_proctor_engine_process_frame():
    image_path = Path("sample_data/cheat_sheet_desk.jpg")
    frame = cv2.imread(str(image_path))
    assert frame is not None

    engine = ProctorEngine(session_id="test_session")
    result = engine.process_frame(frame)

    assert result.annotated_frame is not None
    assert result.annotated_frame.shape == frame.shape
    assert isinstance(result.documents, list)
    assert isinstance(result.objects, list)
    assert result.elapsed_seconds >= 0.0


def test_proctor_engine_session_reset():
    engine = ProctorEngine(session_id="session_initial")
    assert engine.logger.session_id == "session_initial"
    engine.reset_session("session_new")
    assert engine.logger.session_id == "session_new"
