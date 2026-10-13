"""
Desktop CLI application for ExamProctor AI using native OpenCV video windows.
"""

import argparse
import sys
import time
from pathlib import Path
import cv2

from src.config import ProctorConfig
from src.proctor_engine import ProctorEngine


def parse_args():
    parser = argparse.ArgumentParser(
        description="ExamProctor AI - Photo & Document Detection System for Exam Monitoring"
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="Webcam device index (default: 0)",
    )
    parser.add_argument(
        "--source",
        type=str,
        default=None,
        help="Optional path to a test video or image file instead of live camera",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.35,
        help="Confidence threshold for neural object detection (default: 0.35)",
    )
    return parser.parse_args()


def run_image(image_path: str, engine: ProctorEngine):
    """Processes a single static image and displays results."""
    frame = cv2.imread(image_path)
    if frame is None:
        print(f"Error: Could not read image file at {image_path}")
        sys.exit(1)

    print(f"Analyzing {image_path}...")
    res = engine.process_frame(frame)

    print(f"Active Violations: {res.active_violations}")
    print(f"Documents Found:   {len(res.documents)}")
    print(f"Objects Detected:  {[o.label for o in res.objects]}")

    window_name = "ExamProctor AI - Inspection (Press any key to exit)"
    cv2.imshow(window_name, res.annotated_frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


def run_stream(cap: cv2.VideoCapture, engine: ProctorEngine):
    """Processes a continuous video or webcam stream."""
    window_name = "ExamProctor AI - Live Exam Monitor"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 960, 540)

    print("\n=======================================================")
    print("  EXAM PROCTOR AI - LIVE DESKTOP MONITORING ACTIVE")
    print("  Controls:")
    print("    'q' - Quit session & print audit summary")
    print("    's' - Capture manual incident evidence snapshot")
    print("    'r' - Reset violation counters & session timer")
    print("=======================================================\n")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("End of video stream.")
                break

            res = engine.process_frame(frame)

            # Display annotated frame
            cv2.imshow(window_name, res.annotated_frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            elif key == ord("s"):
                snap = engine.logger.log_incident("MANUAL_PROCTOR_FLAG", 1.0, res.annotated_frame)
                print(f"[MANUAL SNAPSHOT] Saved evidence: {snap['evidence_filename']}")
            elif key == ord("r"):
                engine.reset_session()
                print("[SESSION RESET] Counters cleared, new audit session started.")

    finally:
        cap.release()
        cv2.destroyAllWindows()

        # Print audit summary
        summary = engine.logger.get_summary()
        print("\n--- EXAM SESSION COMPLIANCE AUDIT ---")
        print(f"Session ID:         {summary['session_id']}")
        print(f"Total Violations:   {summary['total_incidents']}")
        print(f"Compliance Score:   {summary['compliance_score']}%")
        print(f"Status:             {summary['status']}")
        print(f"Violation Counts:   {summary['breakdown']}")
        print(f"Reports Directory:  {engine.config.REPORTS_DIR}")


def main():
    args = parse_args()
    config = ProctorConfig()
    config.YOLO_CONF_THRESHOLDS["cell phone"] = args.conf
    engine = ProctorEngine(config=config)

    if args.source:
        src_path = Path(args.source)
        if not src_path.exists():
            print(f"Error: Source file '{args.source}' does not exist.")
            sys.exit(1)

        # Check if source is image or video
        ext = src_path.suffix.lower()
        if ext in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}:
            run_image(str(src_path), engine)
            return

        cap = cv2.VideoCapture(str(src_path))
    else:
        print(f"Connecting to webcam index {args.camera}...")
        cap = cv2.VideoCapture(args.camera)
        if not cap.isOpened():
            print(f"Warning: Could not open webcam index {args.camera}.")
            print("Falling back to simulated sample desk feed...")
            fallback = Path("sample_data/cheat_sheet_desk.jpg")
            if fallback.exists():
                run_image(str(fallback), engine)
                return
            sys.exit(1)

    run_stream(cap, engine)


if __name__ == "__main__":
    main()
