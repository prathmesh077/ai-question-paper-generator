"""
Audit Logger and Evidence Capture for Exam Proctoring Sessions.
"""

import csv
import datetime
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import cv2
import numpy as np

from .config import ProctorConfig, default_config


class AuditLogger:
    """
    Manages session incident logging, timestamped evidence image capture,
    and compliance report generation.
    """

    def __init__(self, session_id: Optional[str] = None, config: ProctorConfig = default_config):
        self.config = config
        self.session_id = session_id or datetime.datetime.now().strftime("session_%Y%m%d_%H%M%S")
        self.session_evidence_dir = self.config.EVIDENCE_DIR / self.session_id
        os.makedirs(self.session_evidence_dir, exist_ok=True)
        self.incidents: List[Dict[str, Any]] = []
        self._incident_counter = 0

    def log_incident(
        self,
        violation_type: str,
        confidence: float,
        frame: Optional[np.ndarray] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Logs a confirmed exam violation and saves the evidence snapshot.
        """
        self._incident_counter += 1
        now = datetime.datetime.now()
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
        evidence_filename = f"incident_{self._incident_counter:04d}_{violation_type.lower().replace(' ', '_')}.jpg"
        evidence_path = self.session_evidence_dir / evidence_filename

        evidence_saved = False
        if frame is not None and frame.size > 0:
            try:
                cv2.imwrite(str(evidence_path), frame)
                evidence_saved = True
            except Exception as e:
                print(f"[AuditLogger] Error saving evidence image: {e}")

        incident_record = {
            "incident_id": self._incident_counter,
            "session_id": self.session_id,
            "timestamp": timestamp_str,
            "violation_type": violation_type,
            "confidence": round(float(confidence), 3),
            "evidence_path": str(evidence_path) if evidence_saved else None,
            "evidence_filename": evidence_filename if evidence_saved else None,
            "details": details or {},
        }

        self.incidents.append(incident_record)
        self._save_json()
        self._save_csv()
        return incident_record

    def _save_json(self):
        """Persists current incidents to JSON."""
        json_path = self.config.REPORTS_DIR / f"{self.session_id}_incidents.json"
        try:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(self.incidents, f, indent=2)
        except Exception as e:
            print(f"[AuditLogger] JSON save error: {e}")

    def _save_csv(self):
        """Persists current incidents to CSV."""
        csv_path = self.config.REPORTS_DIR / f"{self.session_id}_incidents.csv"
        if not self.incidents:
            return
        fieldnames = [
            "incident_id",
            "session_id",
            "timestamp",
            "violation_type",
            "confidence",
            "evidence_path",
            "evidence_filename",
        ]
        try:
            with open(csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
                writer.writeheader()
                for inc in self.incidents:
                    writer.writerow(inc)
        except Exception as e:
            print(f"[AuditLogger] CSV save error: {e}")

    def get_summary(self, elapsed_sec: float = 0.0) -> Dict[str, Any]:
        """
        Generates an aggregate compliance audit summary for this exam session.
        """
        counts: Dict[str, int] = {}
        for inc in self.incidents:
            vt = inc["violation_type"]
            counts[vt] = counts.get(vt, 0) + 1

        total_violations = len(self.incidents)
        # Compliance score: starts at 100, drops by 5 per violation (clamped at 0)
        compliance_score = max(0, 100 - (total_violations * 5))

        return {
            "session_id": self.session_id,
            "elapsed_seconds": round(elapsed_sec, 1),
            "total_incidents": total_violations,
            "compliance_score": compliance_score,
            "status": "FLAGGED FOR REVIEW" if total_violations > 0 else "CLEAN - PASS",
            "breakdown": counts,
            "incidents": self.incidents,
        }
