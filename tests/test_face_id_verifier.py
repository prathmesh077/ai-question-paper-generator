"""
Tests for Candidate Photo ID Verification and Biometric Face Matching.
"""

from pathlib import Path
import cv2
import pytest

from src.face_id_verifier import FaceIDVerifier


def test_face_id_verifier_matching():
    id_card_path = Path("sample_data/candidate_id_card.jpg")
    live_face_path = Path("sample_data/candidate_live_face.jpg")
    assert id_card_path.exists()
    assert live_face_path.exists()

    id_img = cv2.imread(str(id_card_path))
    live_img = cv2.imread(str(live_face_path))

    verifier = FaceIDVerifier()
    result = verifier.verify(id_img, live_img)

    assert result.id_face_crop is not None
    assert result.live_face_crop is not None
    assert result.similarity_score > 0.5
    assert result.liveness_score > 0.0


def test_face_id_verifier_missing_face():
    import numpy as np
    blank = np.zeros((300, 300, 3), dtype=np.uint8)
    verifier = FaceIDVerifier()
    result = verifier.verify(blank, blank)
    assert not result.is_verified
    assert "No photo/face detected" in result.message


def test_face_id_verifier_pan_card():
    pan_path = Path("sample_data/candidate_pan_card.jpg")
    live_path = Path("sample_data/candidate_live_face.jpg")
    assert pan_path.exists()
    assert live_path.exists()

    pan_img = cv2.imread(str(pan_path))
    live_img = cv2.imread(str(live_path))

    verifier = FaceIDVerifier()
    result = verifier.verify(pan_img, live_img)

    assert result.id_face_crop is not None
    assert "PAN" in result.document_type
    assert result.similarity_score > 0.5
    assert result.document_metadata.get("validity_status") == "VALID"


def test_face_id_verifier_driving_license():
    dl_path = Path("sample_data/candidate_driving_license.jpg")
    live_path = Path("sample_data/candidate_live_face.jpg")
    assert dl_path.exists()
    assert live_path.exists()

    dl_img = cv2.imread(str(dl_path))
    live_img = cv2.imread(str(live_path))

    verifier = FaceIDVerifier()
    result = verifier.verify(dl_img, live_img)

    assert result.id_face_crop is not None
    assert "License" in result.document_type
    assert result.similarity_score > 0.5
    assert "Car" in result.document_metadata.get("authorised_vehicles", "")

