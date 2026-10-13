"""
Interactive Streamlit Web Dashboard for ExamProctor AI.
AI-based Photo & Document Detection System for Online/Offline Exam Monitoring.
Featuring Customizable Background Color Themes, Interactive Presentation Slideshow, and User Guide.
"""

import datetime
import json
import os
import time
from pathlib import Path
import cv2
import numpy as np
import pandas as pd
from PIL import Image
import streamlit as st

from src.config import ProctorConfig, default_config
from src.document_detector import DocumentDetector
from src.face_id_verifier import FaceIDVerifier
from src.logger import AuditLogger
from src.object_detector import YOLOObjectDetector
from src.proctor_engine import ProctorEngine

# Page configuration
st.set_page_config(
    page_title="ExamProctor AI - Document & Exam Monitoring",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# -----------------------------------------------------------------------------
# SIDEBAR THEME & BACKGROUND COLOR CONTROLS
# -----------------------------------------------------------------------------
st.sidebar.image("https://img.icons8.com/color/96/shield.png", width=64)
st.sidebar.title("ExamProctor AI")
st.sidebar.caption("AI-Powered Examination Integrity Suite")

st.sidebar.markdown("---")
st.sidebar.subheader("🎨 Background Color & Theme")

theme_choice = st.sidebar.selectbox(
    "Choose Color Theme:",
    [
        "🌙 Midnight Command (Dark)",
        "☀️ Clean Academic (Light)",
        "🏛️ Cyber Navy (Pro)",
        "🎯 Emerald Security",
        "🖌️ Custom Background Color",
    ],
    index=0,
)

custom_bg_color = None
if theme_choice == "🖌️ Custom Background Color":
    custom_bg_color = st.sidebar.color_picker("Pick Background Color:", "#1a1f2c")

# Generate Dynamic CSS based on selected background theme
if theme_choice == "🌙 Midnight Command (Dark)":
    bg_gradient = "linear-gradient(135deg, #0b0f19 0%, #111827 50%, #030712 100%)"
    card_bg = "rgba(24, 32, 47, 0.85)"
    card_border = "#2d3748"
    text_color = "#f8fafc"
    text_muted = "#94a3b8"
    accent_color = "#38bdf8"
    header_color = "#38bdf8"
elif theme_choice == "☀️ Clean Academic (Light)":
    bg_gradient = "linear-gradient(135deg, #f8fafc 0%, #edf2f7 50%, #e2e8f0 100%)"
    card_bg = "#ffffff"
    card_border = "#cbd5e1"
    text_color = "#0f172a"
    text_muted = "#475569"
    accent_color = "#2563eb"
    header_color = "#1e293b"
elif theme_choice == "🏛️ Cyber Navy (Pro)":
    bg_gradient = "linear-gradient(135deg, #0a192f 0%, #172a45 50%, #0f172a 100%)"
    card_bg = "rgba(23, 42, 69, 0.88)"
    card_border = "#334d6e"
    text_color = "#e6f1ff"
    text_muted = "#8892b0"
    accent_color = "#64ffda"
    header_color = "#64ffda"
elif theme_choice == "🎯 Emerald Security":
    bg_gradient = "linear-gradient(135deg, #06281e 0%, #0c382b 50%, #03140f 100%)"
    card_bg = "rgba(12, 56, 43, 0.85)"
    card_border = "#1b6950"
    text_color = "#ecfdf5"
    text_muted = "#a7f3d0"
    accent_color = "#34d399"
    header_color = "#34d399"
else:  # Custom Color
    bg_gradient = f"linear-gradient(135deg, {custom_bg_color} 0%, #0a0c10 100%)"
    card_bg = "rgba(25, 30, 42, 0.85)"
    card_border = "#4a5568"
    text_color = "#ffffff"
    text_muted = "#cbd5e1"
    accent_color = "#38bdf8"
    header_color = "#38bdf8"

# Inject Custom Styles into Streamlit App
st.markdown(
    f"""
    <style>
    .stApp {{
        background: {bg_gradient} !important;
        background-attachment: fixed !important;
        color: {text_color} !important;
    }}
    .main-header {{
        font-size: 2.2rem;
        font-weight: 800;
        color: {header_color};
        margin-bottom: 0.2rem;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }}
    .sub-header {{
        font-size: 1.05rem;
        color: {text_muted};
        margin-bottom: 1.5rem;
    }}
    .metric-card {{
        background-color: {card_bg};
        border: 1px solid {card_border};
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 15px;
    }}
    .slide-box {{
        background: {card_bg};
        border: 2px solid {card_border};
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        color: {text_color};
    }}
    .guide-step {{
        background: {card_bg};
        border-left: 4px solid {accent_color};
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 14px;
    }}
    .violation-badge {{
        display: inline-block;
        background-color: #ef4444;
        color: #ffffff;
        padding: 4px 12px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.85rem;
    }}
    .safe-badge {{
        display: inline-block;
        background-color: #10b981;
        color: #ffffff;
        padding: 4px 12px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.85rem;
    }}
    </style>
    """,
    unsafe_allow_html=True,
)

# -----------------------------------------------------------------------------
# RESOURCE LOADERS
# -----------------------------------------------------------------------------
@st.cache_resource
def load_engine():
    """Caches the ProctorEngine instance to avoid reloading YOLO weights."""
    return ProctorEngine()


@st.cache_resource
def load_verifier():
    """Caches the FaceIDVerifier instance."""
    return FaceIDVerifier()


engine = load_engine()
verifier = load_verifier()

# -----------------------------------------------------------------------------
# NAVIGATION
# -----------------------------------------------------------------------------
st.sidebar.markdown("---")
st.sidebar.subheader("Navigation")
page = st.sidebar.radio(
    "Go to Module:",
    [
        "📸 Live Exam Monitor",
        "🎬 Slideshow & User Guide",
        "📑 Document & Photo Inspector",
        "🪪 Candidate Photo ID Verification",
        "📊 Audit Log & Incident Reports",
    ],
    index=0,
)

st.sidebar.markdown("---")
st.sidebar.subheader("Detection Sensitivity")
conf_phone = st.sidebar.slider("Phone Detection Sensitivity", 0.2, 0.8, 0.35, 0.05)
conf_doc = st.sidebar.slider("Paper Document Min Brightness", 80, 200, 120, 10)
min_debounce = st.sidebar.slider("Debounce Frames Count", 1, 10, 4, 1)

# Apply dynamic config from sidebar
engine.config.YOLO_CONF_THRESHOLDS["cell phone"] = conf_phone
engine.config.DOC_MIN_BRIGHTNESS = float(conf_doc)
engine.config.DEBOUNCE_FRAMES_DOC = min_debounce

# -----------------------------------------------------------------------------
# PAGE 1: LIVE EXAM MONITOR
# -----------------------------------------------------------------------------
if page == "📸 Live Exam Monitor":
    st.markdown('<div class="main-header">Live Examination Monitoring Room</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Real-time webcam proctoring detecting unauthorized paper documents, phone screens, and multi-person presence.</div>',
        unsafe_allow_html=True,
    )

    col_ctrl, col_stats = st.columns([2, 1])

    with col_ctrl:
        source_mode = st.radio(
            "Video Input Source:",
            ["Use Built-in Webcam (Browser)", "Simulated Desk Feed (Sample)", "Upload Exam Video Clip"],
            horizontal=True,
        )

    # Metric placeholders
    m1, m2, m3, m4 = st.columns(4)
    metric_status = m1.empty()
    metric_violations = m2.empty()
    metric_docs = m3.empty()
    metric_fps = m4.empty()

    frame_placeholder = st.empty()
    alert_placeholder = st.empty()

    if source_mode == "Use Built-in Webcam (Browser)":
        cam_image = st.camera_input("Candidate Live Video Stream")
        if cam_image is not None:
            bytes_data = cam_image.getvalue()
            cv_img = cv2.imdecode(np.frombuffer(bytes_data, np.uint8), cv2.IMREAD_COLOR)

            res = engine.process_frame(cv_img)
            rgb_frame = cv2.cvtColor(res.annotated_frame, cv2.COLOR_BGR2RGB)
            frame_placeholder.image(rgb_frame, channels="RGB", use_container_width=True)

            if res.active_violations:
                metric_status.error("⚠️ VIOLATION DETECTED")
                alert_placeholder.error(f"Active Violation: {', '.join(res.active_violations)}")
            else:
                metric_status.success("🟢 EXAM NORMAL")
                alert_placeholder.success("No prohibited materials detected in camera field.")

            metric_violations.metric("Total Incidents", len(engine.logger.incidents))
            metric_docs.metric("Documents Found", len(res.documents))
            metric_fps.metric("Inference FPS", f"{res.fps:.1f}")

    elif source_mode == "Simulated Desk Feed (Sample)":
        sample_path = Path("sample_data/cheat_sheet_desk.jpg")
        if sample_path.exists():
            sample_img = cv2.imread(str(sample_path))
            res = engine.process_frame(sample_img)
            rgb_frame = cv2.cvtColor(res.annotated_frame, cv2.COLOR_BGR2RGB)
            frame_placeholder.image(rgb_frame, channels="RGB", use_container_width=True)

            metric_status.warning("⚠️ AUDIT ALERT")
            metric_violations.metric("Total Incidents", len(engine.logger.incidents))
            metric_docs.metric("Documents Found", len(res.documents))
            metric_fps.metric("Processing FPS", f"{res.fps:.1f}")

            if res.documents:
                doc = res.documents[0]
                alert_placeholder.warning(
                    f"Flagged Document: Brightness={doc.brightness:.1f}, Text Variance={doc.texture_variance:.1f}, Confidence={doc.confidence:.1%}"
                )
                if doc.warped_document is not None:
                    st.subheader("Rectified Evidence Document Crop")
                    st.image(
                        cv2.cvtColor(doc.warped_document, cv2.COLOR_BGR2RGB),
                        caption="Perspective Flattened Cheat Sheet",
                        width=340,
                    )
        else:
            st.error("Sample image not found. Run python generate_sample_data.py first.")

    elif source_mode == "Upload Exam Video Clip":
        uploaded_video = st.file_uploader("Upload MP4 / AVI video recording", type=["mp4", "avi", "mov"])
        if uploaded_video:
            tfile = Path("temp_exam_video.mp4")
            tfile.write_bytes(uploaded_video.read())
            cap = cv2.VideoCapture(str(tfile))

            st.info("Processing uploaded exam video recording...")
            stop_btn = st.button("Stop Playback")

            while cap.isOpened() and not stop_btn:
                ret, frame = cap.read()
                if not ret:
                    break
                res = engine.process_frame(frame)
                rgb_frame = cv2.cvtColor(res.annotated_frame, cv2.COLOR_BGR2RGB)
                frame_placeholder.image(rgb_frame, channels="RGB", use_container_width=True)

                if res.active_violations:
                    metric_status.error("⚠️ VIOLATION")
                else:
                    metric_status.success("🟢 NORMAL")
                metric_violations.metric("Total Incidents", len(engine.logger.incidents))
                metric_docs.metric("Documents", len(res.documents))
                metric_fps.metric("FPS", f"{res.fps:.1f}")
            cap.release()

# -----------------------------------------------------------------------------
# PAGE 2: SLIDESHOW & USER GUIDE
# -----------------------------------------------------------------------------
elif page == "🎬 Slideshow & User Guide":
    st.markdown('<div class="main-header">Interactive Slideshow & User Manual</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Learn how ExamProctor AI operates, view the guided visual slideshow, and master all features.</div>',
        unsafe_allow_html=True,
    )

    slide_tab1, slide_tab2, slide_tab3 = st.tabs(
        ["🎬 System Architecture Slideshow", "📸 Evidence Replay Slideshow", "📖 Step-by-Step User Guide"]
    )

    # ---------------- TAB 1: GUIDED SLIDESHOW ----------------
    with slide_tab1:
        slides = [
            {
                "title": "Slide 1: Welcome to ExamProctor AI",
                "badge": "OVERVIEW",
                "icon": "🛡️",
                "content": """
                ### The Challenge in Remote & In-Person Exam Proctoring
                Online and hybrid examinations are vulnerable to unauthorized physical study materials:
                * **Hidden Paper Cheat Sheets & Notes** placed just outside or below direct view.
                * **Mobile Phones & Tablets** displaying saved photos of answers or instant messaging apps.
                * **Impersonation & Secondary Persons** sitting in the examination room assisting the candidate.

                ### The Solution: Dual-Engine Artificial Intelligence
                ExamProctor AI unifies **Classical Computer Vision Geometry** with **Deep Neural Network Detection**
                running concurrently in real-time to guarantee academic integrity.
                """,
                "highlight": "Dual-Engine: Adaptive Edge/Texture Geometry + YOLOv8 Deep Learning Neural Network",
            },
            {
                "title": "Slide 2: Physical Paper & Document Detection",
                "badge": "ENGINE 1",
                "icon": "📄",
                "content": """
                ### How Unauthorized Documents are Detected:
                1. **Bilateral Filtering**: Eliminates desk wood-grain noise while preserving crisp paper edges.
                2. **Multi-Scale Canny Edge Extraction & Morphological Closing**: Traces complete closed contours.
                3. **Quadrilateral Polygon Approximation (`cv2.approxPolyDP`)**: Locates 4-corner convex polygons.
                4. **Paper Luminance & Texture Variance Analysis**: Checks high-reflection paper brightness (>120/255) and Laplacian text detail (>25.0 variance).
                5. **Perspective Rectification**: Automatically un-tilts and crops detected papers into flat orthogonal views for proctors to read!
                """,
                "highlight": "Catches loose sheets of paper, index cards, notebooks, and printed formula sheets.",
            },
            {
                "title": "Slide 3: Mobile Phone & Screen Photo Cheating",
                "badge": "ENGINE 2",
                "icon": "📱",
                "content": """
                ### Detecting Smartphones and Electronic Displays:
                * Candidates frequently place mobile phones on their desk or lap to glance at photos of textbook pages or chat with helpers.
                * **YOLOv8 Inference**: Real-time object detection tuned with dedicated confidence thresholds for:
                  - `cell phone` (flags mobile screens & photo cheating)
                  - `book` (flags printed textbooks and manuals)
                  - `laptop` / `tv` (flags secondary displays and HDMI-connected monitors)
                * Flags visual alerts immediately and pulses a high-visibility warning HUD on the video stream.
                """,
                "highlight": "Detects mobile phones in hand or on desk with sub-second response times.",
            },
            {
                "title": "Slide 4: Photo ID Document & Biometric Face Verification",
                "badge": "BIOMETRICS",
                "icon": "🪪",
                "content": """
                ### Automated Pre-Exam Candidate Check-In:
                1. **Official ID Card Detection**: Locates official Student ID, Passport, or Driver's License.
                2. **Portrait Photo Extraction**: Identifies the candidate portrait window on the ID card.
                3. **Live Camera Capture**: Detects candidate face in the live webcam stream.
                4. **Biometric Embedding & Cosine Similarity**: Standardizes facial geometry with CLAHE histogram equalization, extracts normalized multi-cell gradient vectors, and computes biometric match confidence (e.g. 88.5%).
                5. **Anti-Spoofing Check**: Examines high-frequency gradient entropy to prevent candidates from holding up a printed photo in front of the camera.
                """,
                "highlight": "Prevents exam impersonation by strictly verifying candidate identity prior to exam start.",
            },
            {
                "title": "Slide 5: Incident Debouncing & Audit Compliance Logging",
                "badge": "AUDIT TRAIL",
                "icon": "📊",
                "content": """
                ### Eliminating False Alarms & Preserving Evidence:
                * **Temporal Debounce Machine**: Requires violations to persist across consecutive frames (default: 4 frames) so normal hand gestures or light flickers don't raise false alarms.
                * **Timestamped Evidence Capture**: When a violation is confirmed, an annotated JPEG snapshot with labeled bounding boxes is automatically stored in `audit_logs/evidence/<session_id>/`.
                * **Snapshot Cooldown**: Prevents disk flooding while capturing conclusive visual evidence.
                * **Official Reports**: Exports compliance summary and full incident logs to CSV and JSON.
                """,
                "highlight": "Generates immutable photographic evidence ready for academic disciplinary review.",
            },
        ]

        if "current_slide" not in st.session_state:
            st.session_state.current_slide = 0

        # Slide controls row
        c_prev, c_selector, c_next = st.columns([1, 2, 1])
        with c_prev:
            if st.button("⬅️ Previous Slide", use_container_width=True):
                st.session_state.current_slide = (st.session_state.current_slide - 1) % len(slides)
        with c_selector:
            slide_titles = [f"{idx+1}. {s['badge']}: {s['title'].split(': ')[1]}" for idx, s in enumerate(slides)]
            selected_idx = st.selectbox(
                "Jump to Slide:",
                range(len(slides)),
                format_func=lambda i: slide_titles[i],
                index=st.session_state.current_slide,
            )
            if selected_idx != st.session_state.current_slide:
                st.session_state.current_slide = selected_idx
        with c_next:
            if st.button("Next Slide ➡️", use_container_width=True):
                st.session_state.current_slide = (st.session_state.current_slide + 1) % len(slides)

        st.progress((st.session_state.current_slide + 1) / len(slides))

        # Render Active Slide Card
        curr = slides[st.session_state.current_slide]
        st.markdown(
            f"""
            <div class="slide-box">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 1.8rem;">{curr['icon']} <b>{curr['title']}</b></span>
                    <span class="safe-badge">{curr['badge']}</span>
                </div>
                {curr['content']}
                <div style="margin-top: 20px; padding: 12px 18px; background: rgba(56, 189, 248, 0.15); border-left: 4px solid #38bdf8; border-radius: 6px;">
                    💡 <b>Key Takeaway:</b> {curr['highlight']}
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # ---------------- TAB 2: EVIDENCE REPLAY SLIDESHOW ----------------
    with slide_tab2:
        st.subheader("Captured Cheating Evidence Replay Slideshow")
        st.write("Browse and present all photographic evidence snapshots captured during exam sessions.")

        evidence_dir = default_config.EVIDENCE_DIR
        evidence_files = sorted(list(evidence_dir.glob("*/*.jpg")), key=os.path.getmtime, reverse=True)

        if not evidence_files:
            st.info("No evidence snapshots captured yet. Start a live session or trigger a violation to generate snapshots.")
        else:
            if "ev_slide_idx" not in st.session_state:
                st.session_state.ev_slide_idx = 0

            # Evidence navigation
            ev_col1, ev_col2, ev_col3 = st.columns([1, 2, 1])
            with ev_col1:
                if st.button("⏮️ Previous Evidence", use_container_width=True):
                    st.session_state.ev_slide_idx = (st.session_state.ev_slide_idx - 1) % len(evidence_files)
            with ev_col2:
                st.write(f"**Evidence Item {st.session_state.ev_slide_idx + 1} of {len(evidence_files)}**")
            with ev_col3:
                if st.button("Next Evidence ⏭️", use_container_width=True):
                    st.session_state.ev_slide_idx = (st.session_state.ev_slide_idx + 1) % len(evidence_files)

            current_ev_file = evidence_files[st.session_state.ev_slide_idx]
            session_folder = current_ev_file.parent.name
            st.image(
                str(current_ev_file),
                caption=f"Session: {session_folder} | File: {current_ev_file.name}",
                use_container_width=True,
            )

    # ---------------- TAB 3: STEP-BY-STEP USER GUIDE ----------------
    with slide_tab3:
        st.subheader("How to Use ExamProctor AI: Step-by-Step")

        st.markdown(
            """
            <div class="guide-step">
                <h4>Step 1: Check-in Candidate with Photo ID Verification</h4>
                <p>Navigate to <b>🪪 Candidate Photo ID Verification</b>. Upload or scan the candidate's official Student ID Card or Passport. Take a webcam photo or select the candidate's live image, and click <b>Verify Identity</b>. The AI verifies biometric similarity (threshold: 65%) and checks anti-spoof liveness before admitting the student.</p>
            </div>
            <div class="guide-step">
                <h4>Step 2: Start the Live Exam Proctoring Feed</h4>
                <p>Navigate to <b>📸 Live Exam Monitor</b>. Select your input source (Webcam, Uploaded Video Clip, or Simulated Desk Feed). The proctoring HUD activates, showing real-time FPS, session timer, and live status.</p>
            </div>
            <div class="guide-step">
                <h4>Step 3: Monitor Real-Time Violation Alerts</h4>
                <p>If the candidate pulls out a paper sheet, cheat note, or mobile phone, the AI highlights the object with colored bounding boxes and initiates the debounce counter. When confirmed, a high-priority alert triggers and timestamped evidence is logged.</p>
            </div>
            <div class="guide-step">
                <h4>Step 4: Deep Inspect Flagged Documents</h4>
                <p>Navigate to <b>📑 Document & Photo Inspector</b> to upload any suspicious frame or photo. The system will extract the exact quadrilateral corners of any paper document and display an un-tilted, flattened view of the text notes.</p>
            </div>
            <div class="guide-step">
                <h4>Step 5: Review Audit Logs and Download Compliance Reports</h4>
                <p>Navigate to <b>📊 Audit Log & Incident Reports</b> to inspect all session violations, browse the photographic evidence gallery, and download the official <b>CSV</b> or <b>JSON</b> compliance audit report.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

# -----------------------------------------------------------------------------
# PAGE 3: DOCUMENT & PHOTO INSPECTOR
# -----------------------------------------------------------------------------
elif page == "📑 Document & Photo Inspector":
    st.markdown('<div class="main-header">Document & Photo Deep Inspector</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Examine candidate images or evidence snapshots with deep geometric contour extraction and paper rectification.</div>',
        unsafe_allow_html=True,
    )

    inspector_choice = st.radio(
        "Choose Inspection Target:",
        [
            "📝 Desk Formula Cheat Sheet (Preloaded)",
            "📖 Unauthorized Magazine Cover - Tech Horizon (Preloaded)",
            "📁 Upload Custom Candidate Snapshot or Document",
        ],
        horizontal=True,
    )

    target_img = None
    if inspector_choice == "📝 Desk Formula Cheat Sheet (Preloaded)":
        sample_path = Path("sample_data/cheat_sheet_desk.jpg")
        if sample_path.exists():
            target_img = cv2.imread(str(sample_path))
    elif inspector_choice == "📖 Unauthorized Magazine Cover - Tech Horizon (Preloaded)":
        sample_path = Path("sample_data/unauthorized_magazine_cover.jpg")
        if sample_path.exists():
            target_img = cv2.imread(str(sample_path))
    else:
        uploaded_file = st.file_uploader(
            "Upload candidate snapshot or desk image for analysis",
            type=["jpg", "jpeg", "png", "bmp"],
        )
        if uploaded_file:
            file_bytes = np.asarray(bytearray(uploaded_file.read()), dtype=np.uint8)
            target_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if target_img is not None:
        c1, c2 = st.columns(2)
        with c1:
            st.subheader("Original Image")
            st.image(cv2.cvtColor(target_img, cv2.COLOR_BGR2RGB), use_container_width=True)

        doc_detector = DocumentDetector(default_config)
        docs = doc_detector.detect(target_img)

        yolo_detector = YOLOObjectDetector(config=default_config)
        objects = yolo_detector.detect(target_img)

        # Draw inspection overlays
        annotated = target_img.copy()
        for doc in docs:
            bcolor = (255, 0, 180) if doc.is_magazine else (255, 140, 0)
            tag_name = "MAGAZINE" if doc.is_magazine else "DOC"
            cv2.polylines(annotated, [doc.corners.astype(int)], True, bcolor, 3)
            x1, y1, x2, y2 = doc.bbox
            cv2.rectangle(annotated, (x1, y1), (x2, y2), bcolor, 2)
            cv2.putText(
                annotated,
                f"{tag_name} ({doc.confidence:.0%})",
                (x1, max(20, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                bcolor,
                2,
            )

        for obj in objects:
            x1, y1, x2, y2 = obj.bbox
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(
                annotated,
                f"{obj.label.upper()} ({obj.confidence:.0%})",
                (x1, max(20, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2,
            )

        with c2:
            st.subheader("AI Detection Output")
            st.image(cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB), use_container_width=True)

        st.markdown("---")
        st.subheader(f"Extracted Documents & Publications ({len(docs)} Found)")
        if docs:
            doc_cols = st.columns(min(3, len(docs)))
            for idx, doc in enumerate(docs):
                with doc_cols[idx % len(doc_cols)]:
                    badge_style = "background-color: #ec4899; color: white; padding: 3px 8px; border-radius: 4px;" if doc.is_magazine else "background-color: #3b82f6; color: white; padding: 3px 8px; border-radius: 4px;"
                    badge_title = "MAGAZINE COVER" if doc.is_magazine else "PAPER DOCUMENT"
                    st.markdown(f"**Item #{idx + 1}** <span style='{badge_style}'>{badge_title}</span>", unsafe_allow_html=True)
                    if doc.warped_document is not None:
                        st.image(
                            cv2.cvtColor(doc.warped_document, cv2.COLOR_BGR2RGB),
                            caption="Rectified View",
                            use_container_width=True,
                        )
                    st.write(f"- **Classification:** `{doc.label}`")
                    st.write(f"- **Confidence:** `{doc.confidence:.1%}`")
                    st.write(f"- **Color Richness (Saturation):** `{doc.color_richness:.1f} / 255`")
                    st.write(f"- **Texture Variance:** `{doc.texture_variance:.1f}`")
                    st.write(f"- **Bounding Box:** `{doc.bbox}`")
        else:
            st.info("No physical paper documents or publications detected in this image.")

# -----------------------------------------------------------------------------
# PAGE 4: CANDIDATE PHOTO ID VERIFICATION
# -----------------------------------------------------------------------------
elif page == "🪪 Candidate Photo ID Verification":
    st.markdown('<div class="main-header">Candidate Photo ID Verification Station</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Biometric verification comparing candidate\'s official Photo ID Card against their live webcam face.</div>',
        unsafe_allow_html=True,
    )

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Step 1: Select or Upload Identity Document")
        doc_choice = st.radio(
            "Select Document Type to Verify:",
            [
                "💳 Indian Income Tax PAN Card (Preloaded)",
                "🚗 Driver's License / Car License (Preloaded)",
                "🎓 Student University Admit Card (Preloaded)",
                "📁 Upload Custom Document (PAN / License / ID)",
            ],
            index=0,
        )

        id_img = None
        if doc_choice == "💳 Indian Income Tax PAN Card (Preloaded)":
            sample_path = Path("sample_data/candidate_pan_card.jpg")
            if sample_path.exists():
                id_img = cv2.imread(str(sample_path))
                st.image(cv2.cvtColor(id_img, cv2.COLOR_BGR2RGB), caption="Official Income Tax PAN Card - Alex Mercer", use_container_width=True)
        elif doc_choice == "🚗 Driver's License / Car License (Preloaded)":
            sample_path = Path("sample_data/candidate_driving_license.jpg")
            if sample_path.exists():
                id_img = cv2.imread(str(sample_path))
                st.image(cv2.cvtColor(id_img, cv2.COLOR_BGR2RGB), caption="Official Driving Licence (LMV Car / MCWG) - Alex Mercer", use_container_width=True)
        elif doc_choice == "🎓 Student University Admit Card (Preloaded)":
            sample_path = Path("sample_data/candidate_id_card.jpg")
            if sample_path.exists():
                id_img = cv2.imread(str(sample_path))
                st.image(cv2.cvtColor(id_img, cv2.COLOR_BGR2RGB), caption="Metropolitan University Admit Card - Alex Mercer", use_container_width=True)
        else:
            uploaded_id = st.file_uploader("Upload PAN Card, Driving License, or Passport", type=["jpg", "jpeg", "png"])
            if uploaded_id:
                bytes_id = np.asarray(bytearray(uploaded_id.read()), dtype=np.uint8)
                id_img = cv2.imdecode(bytes_id, cv2.IMREAD_COLOR)
                st.image(cv2.cvtColor(id_img, cv2.COLOR_BGR2RGB), caption="Uploaded Document", use_container_width=True)

    with col2:
        st.subheader("Step 2: Candidate Live Photo")
        live_input_choice = st.radio("Live Image Source:", ["Preloaded Live Face Sample", "Webcam Snapshot"], horizontal=True)

        live_img = None
        if live_input_choice == "Webcam Snapshot":
            cam_shot = st.camera_input("Capture Face from Webcam")
            if cam_shot:
                live_bytes = cam_shot.getvalue()
                live_img = cv2.imdecode(np.frombuffer(live_bytes, np.uint8), cv2.IMREAD_COLOR)
        else:
            sample_face_path = Path("sample_data/candidate_live_face.jpg")
            if sample_face_path.exists():
                live_img = cv2.imread(str(sample_face_path))
                st.image(cv2.cvtColor(live_img, cv2.COLOR_BGR2RGB), caption="Live Candidate Camera (Alex Mercer)", use_container_width=True)

    st.markdown("---")
    if st.button("🚀 Verify Identity & Admit Candidate", type="primary", use_container_width=True):
        if id_img is None or live_img is None:
            st.error("Please supply both a Photo ID Card and a Live Face image.")
        else:
            with st.spinner("Analyzing document geometry, layout headers, and facial biometrics..."):
                res = verifier.verify(id_img, live_img)

            v_col1, v_col2, v_col3 = st.columns([1, 1, 2])
            with v_col1:
                st.markdown("**ID Portrait Extracted**")
                if res.id_face_crop is not None:
                    st.image(cv2.cvtColor(res.id_face_crop, cv2.COLOR_BGR2RGB), use_container_width=True)
                else:
                    st.warning("No face detected on ID")

            with v_col2:
                st.markdown("**Live Webcam Face**")
                if res.live_face_crop is not None:
                    st.image(cv2.cvtColor(res.live_face_crop, cv2.COLOR_BGR2RGB), use_container_width=True)
                else:
                    st.warning("No face detected in live feed")

            with v_col3:
                st.markdown(f"**Verification Verdict: {res.document_type}**")
                if res.is_verified:
                    st.success(f"✅ CANDIDATE ADMISSION APPROVED")
                    st.markdown(f"### Match Score: `{res.similarity_score:.1%}`")
                    st.write(f"- **Document Identified:** `{res.document_type}`")
                    meta = res.document_metadata
                    if meta.get("authority"):
                        st.write(f"- **Issuing Authority:** `{meta['authority']}`")
                    if meta.get("authorised_vehicles"):
                        st.write(f"- **Vehicle Authorization:** `{meta['authorised_vehicles']}`")
                    if meta.get("pan_format"):
                        st.write(f"- **PAN Number Format:** `{meta['pan_format']}`")
                    st.write(f"- **Anti-Spoof Liveness:** `{res.liveness_score:.1%}`")
                    st.write(f"- **Status:** {res.message}")
                else:
                    st.error(f"❌ VERIFICATION REJECTED")
                    st.markdown(f"### Match Score: `{res.similarity_score:.1%}`")
                    st.write(f"- **Document:** `{res.document_type}`")
                    st.write(f"- **Required Threshold:** `{verifier.config.FACE_VERIFICATION_THRESHOLD:.1%}`")
                    st.write(f"- **Status:** {res.message}")

# -----------------------------------------------------------------------------
# PAGE 5: AUDIT LOG & INCIDENT REPORTS
# -----------------------------------------------------------------------------
elif page == "📊 Audit Log & Incident Reports":
    st.markdown('<div class="main-header">Proctoring Session Audit Log</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Review timestamped cheating incidents, inspect evidence images, and export compliance reports.</div>',
        unsafe_allow_html=True,
    )

    incidents = engine.logger.incidents
    summary = engine.logger.get_summary()

    # Metrics
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Flagged Incidents", summary["total_incidents"])
    c2.metric("Exam Compliance Score", f"{summary['compliance_score']}%")
    c3.metric("Session ID", summary["session_id"])
    c4.metric("Status", summary["status"])

    st.markdown("---")

    if not incidents:
        st.info("No exam violations have been recorded for the current session. Start a live monitoring session to populate logs.")
    else:
        # Table of incidents
        df = pd.DataFrame(incidents)
        st.subheader("Logged Incidents Table")
        st.dataframe(
            df[["incident_id", "timestamp", "violation_type", "confidence", "evidence_filename"]],
            use_container_width=True,
        )

        # Evidence Gallery
        st.subheader("Timestamped Photographic Evidence")
        evidence_cols = st.columns(3)
        for idx, inc in enumerate(incidents[-6:]):
            with evidence_cols[idx % 3]:
                ev_path = inc.get("evidence_path")
                if ev_path and os.path.exists(ev_path):
                    st.image(
                        ev_path,
                        caption=f"#{inc['incident_id']} - {inc['violation_type']} ({inc['timestamp']})",
                        use_container_width=True,
                    )

        # Download Buttons
        st.markdown("---")
        d_col1, d_col2 = st.columns(2)
        with d_col1:
            csv_data = df.to_csv(index=False).encode("utf-8")
            st.download_button(
                "📥 Download Incident CSV Report",
                data=csv_data,
                file_name=f"{engine.logger.session_id}_report.csv",
                mime="text/csv",
                use_container_width=True,
            )
        with d_col2:
            json_data = json.dumps(summary, indent=2).encode("utf-8")
            st.download_button(
                "📥 Download Full JSON Audit Log",
                data=json_data,
                file_name=f"{engine.logger.session_id}_audit.json",
                mime="application/json",
                use_container_width=True,
            )
