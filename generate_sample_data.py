"""
Synthetic sample data generator for testing ExamProctor AI.
Generates simulated ID cards, PAN cards, Driving Licenses, cheat sheets, and test exam frames.
"""

import os
from pathlib import Path
import cv2
import numpy as np


def draw_candidate_face(canvas: np.ndarray, px: int, py: int, pw: int, ph: int):
    """Draws consistent synthetic portrait face for Alex Mercer."""
    # Photo box frame
    cv2.rectangle(canvas, (px - 2, py - 2), (px + pw + 2, py + ph + 2), (180, 180, 180), 2)
    cv2.rectangle(canvas, (px, py), (px + pw, py + ph), (220, 210, 200), -1)

    center_x = px + pw // 2
    head_y = py + 110
    # Head oval
    cv2.ellipse(canvas, (center_x, head_y), (60, 75), 0, 0, 360, (190, 160, 140), -1)
    # Hair
    cv2.ellipse(canvas, (center_x, head_y - 35), (62, 45), 0, 180, 360, (40, 30, 20), -1)
    # Eyes
    cv2.circle(canvas, (center_x - 22, head_y - 10), 8, (255, 255, 255), -1)
    cv2.circle(canvas, (center_x + 22, head_y - 10), 8, (255, 255, 255), -1)
    cv2.circle(canvas, (center_x - 22, head_y - 10), 4, (50, 40, 30), -1)
    cv2.circle(canvas, (center_x + 22, head_y - 10), 4, (50, 40, 30), -1)
    # Mouth/Smile
    cv2.ellipse(canvas, (center_x, head_y + 35), (25, 12), 0, 0, 180, (80, 40, 50), 2)
    # Torso
    cv2.ellipse(canvas, (center_x, py + ph + 40), (95, 70), 0, 180, 360, (60, 80, 140), -1)


def create_sample_student_id(output_path: Path):
    """Generates a realistic mock Student Photo ID Card."""
    w, h = 856, 540
    card = np.ones((h, w, 3), dtype=np.uint8) * 245

    # Top header bar (University Blue)
    cv2.rectangle(card, (0, 0), (w, 100), (140, 50, 20), -1)
    cv2.putText(card, "METROPOLITAN UNIVERSITY", (40, 55), cv2.FONT_HERSHEY_DUPLEX, 1.1, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(card, "EXAMINATION ADMIT CARD & STUDENT IDENTIFICATION", (40, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 220, 255), 1, cv2.LINE_AA)

    # Portrait photo box
    draw_candidate_face(card, 50, 140, 220, 280)

    # Student Details
    details_x = 310
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(card, "STUDENT NAME: ALEX MERCER", (details_x, 180), font, 0.75, (30, 30, 30), 2)
    cv2.putText(card, "STUDENT ID:   2026-CS-8942", (details_x, 225), font, 0.7, (60, 60, 60), 2)
    cv2.putText(card, "PROGRAM:      B.Sc. COMPUTER SCIENCE", (details_x, 270), font, 0.65, (60, 60, 60), 2)
    cv2.putText(card, "EXAM VENUE:   ONLINE PORTAL HALL A", (details_x, 315), font, 0.65, (60, 60, 60), 2)
    cv2.putText(card, "VALID THROUGH: SEPT 2026", (details_x, 360), font, 0.6, (120, 40, 40), 2)

    # Barcode
    bx, by, bw_bar, bh_bar = 310, 410, 480, 50
    for i in range(bx, bx + bw_bar, 6):
        thickness = 2 if (i // 6) % 3 == 0 else 4
        cv2.line(card, (i, by), (i, by + bh_bar), (20, 20, 20), thickness)

    # Bottom footer
    cv2.rectangle(card, (0, h - 30), (w, h), (140, 50, 20), -1)
    cv2.putText(card, "AUTHORIZED OFFICIAL DOCUMENT - TAMPERING IS STRICTLY PROHIBITED", (150, h - 10), font, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

    cv2.imwrite(str(output_path), card)
    print(f"Generated sample ID Card: {output_path}")


def create_sample_pan_card(output_path: Path):
    """Generates an authentic mock Indian Income Tax PAN Card."""
    w, h = 856, 540
    # PAN Card light blue-gray security tint
    card = np.ones((h, w, 3), dtype=np.uint8) * 230
    for y in range(h):
        card[y, :, 0] = int(225 - (y / h) * 15)  # Blue
        card[y, :, 1] = int(235 - (y / h) * 10)  # Green
        card[y, :, 2] = int(240 - (y / h) * 10)  # Red

    # Top Header: Income Tax Department
    cv2.rectangle(card, (0, 0), (w, 85), (130, 95, 45), -1)
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(card, "INCOME TAX DEPARTMENT", (40, 45), cv2.FONT_HERSHEY_DUPLEX, 0.95, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(card, "GOVT. OF INDIA  /  आयकर विभाग - भारत सरकार", (40, 72), font, 0.48, (210, 230, 255), 1, cv2.LINE_AA)

    # National Emblem emblem circle
    cv2.circle(card, (w - 70, 42), 30, (255, 255, 255), 2)
    cv2.putText(card, "INDIA", (w - 92, 47), font, 0.42, (255, 255, 255), 1)

    # Portrait photo box on the left
    px, py, pw, ph = 45, 115, 210, 260
    draw_candidate_face(card, px, py, pw, ph)

    # Signature box under photo
    cv2.rectangle(card, (px, 395), (px + pw, 465), (255, 255, 255), -1)
    cv2.rectangle(card, (px, 395), (px + pw, 465), (160, 160, 160), 1)
    cv2.putText(card, "Alex Mercer", (px + 20, 442), cv2.FONT_HERSHEY_SCRIPT_SIMPLEX, 0.95, (30, 20, 60), 2)
    cv2.putText(card, "Signature / हस्ताक्षर", (px + 35, 485), font, 0.4, (80, 80, 80), 1)

    # Candidate details
    dx = 285
    cv2.putText(card, "Permanent Account Number Card / स्थायी लेखा संख्या", (dx, 125), font, 0.48, (100, 70, 30), 1)
    # PAN Number (Large bold box)
    cv2.putText(card, "ABCDE1234F", (dx, 168), cv2.FONT_HERSHEY_DUPLEX, 1.15, (20, 20, 90), 2, cv2.LINE_AA)

    cv2.putText(card, "Name / नाम", (dx, 205), font, 0.42, (90, 90, 90), 1)
    cv2.putText(card, "ALEX MERCER", (dx, 230), font, 0.72, (20, 20, 20), 2)

    cv2.putText(card, "Father's Name / पिता का नाम", (dx, 268), font, 0.42, (90, 90, 90), 1)
    cv2.putText(card, "ROBERT MERCER", (dx, 292), font, 0.68, (20, 20, 20), 2)

    cv2.putText(card, "Date of Birth / जन्म की तारीख", (dx, 330), font, 0.42, (90, 90, 90), 1)
    cv2.putText(card, "15/08/2002", (dx, 354), font, 0.68, (20, 20, 20), 2)

    # QR Code placeholder on right side
    qrx, qry, qrs = 660, 180, 140
    cv2.rectangle(card, (qrx, qry), (qrx + qrs, qry + qrs), (255, 255, 255), -1)
    cv2.rectangle(card, (qrx, qry), (qrx + qrs, qry + qrs), (40, 40, 40), 2)
    # Simulated QR patterns
    for r in range(qry + 10, qry + qrs - 10, 12):
        for c in range(qrx + 10, qrx + qrs - 10, 12):
            if (r + c) % 5 == 0 or (r * c) % 7 == 0:
                cv2.rectangle(card, (c, r), (c + 8, r + 8), (20, 20, 20), -1)
    cv2.putText(card, "SECURE QR", (qrx + 25, qry + qrs + 22), font, 0.42, (60, 60, 60), 1)

    # Security Hologram box
    cv2.rectangle(card, (dx, 400), (dx + 80, 465), (200, 190, 140), -1)
    cv2.rectangle(card, (dx, 400), (dx + 80, 465), (140, 130, 80), 1)
    cv2.putText(card, "HOLOGRAM", (dx + 6, 438), font, 0.32, (80, 60, 20), 1)

    # Footer note
    cv2.rectangle(card, (0, h - 25), (w, h), (130, 95, 45), -1)
    cv2.putText(card, "INCOME TAX DEPARTMENT - VALID IDENTITY PROOF FOR EXAMINATIONS", (160, h - 8), font, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

    cv2.imwrite(str(output_path), card)
    print(f"Generated sample PAN Card: {output_path}")


def create_sample_driving_license(output_path: Path):
    """Generates an authentic mock Driver's License / Car License."""
    w, h = 856, 540
    # Soft light-gold transport card background
    card = np.ones((h, w, 3), dtype=np.uint8) * 240
    card[:, :, 0] = 230  # Blue
    card[:, :, 1] = 242  # Green
    card[:, :, 2] = 248  # Red

    # Top Header (Transport Green/Teal)
    cv2.rectangle(card, (0, 0), (w, 90), (45, 110, 30), -1)
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(card, "UNION OF INDIA - DRIVING LICENCE", (40, 42), cv2.FONT_HERSHEY_DUPLEX, 0.95, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(card, "MOTOR VEHICLES DEPARTMENT - FORM 7", (40, 72), font, 0.52, (200, 255, 210), 1, cv2.LINE_AA)

    # Smart Chip Icon on left
    cx, cy, cw_chip, ch_chip = 45, 115, 95, 75
    cv2.rectangle(card, (cx, cy), (cx + cw_chip, cy + ch_chip), (100, 180, 215), -1)  # Gold contact
    cv2.rectangle(card, (cx, cy), (cx + cw_chip, cy + ch_chip), (40, 120, 150), 2)
    cv2.line(card, (cx + 30, cy), (cx + 30, cy + ch_chip), (40, 120, 150), 2)
    cv2.line(card, (cx + 65, cy), (cx + 65, cy + ch_chip), (40, 120, 150), 2)

    # Portrait Photo box
    px, py, pw, ph = 45, 205, 210, 260
    draw_candidate_face(card, px, py, pw, ph)

    # License Details
    dx = 280
    cv2.putText(card, "DL NUMBER:", (dx, 125), font, 0.5, (100, 100, 100), 1)
    cv2.putText(card, "DL-1420260012345", (dx + 120, 125), cv2.FONT_HERSHEY_DUPLEX, 0.75, (20, 20, 110), 2)

    cv2.putText(card, "NAME:", (dx, 168), font, 0.48, (100, 100, 100), 1)
    cv2.putText(card, "ALEX MERCER", (dx + 120, 168), font, 0.72, (20, 20, 20), 2)

    cv2.putText(card, "S/W/D OF:", (dx, 205), font, 0.48, (100, 100, 100), 1)
    cv2.putText(card, "ROBERT MERCER", (dx + 120, 205), font, 0.68, (20, 20, 20), 2)

    cv2.putText(card, "DOB / BLOOD:", (dx, 242), font, 0.48, (100, 100, 100), 1)
    cv2.putText(card, "15-08-2002  |  BG: O+", (dx + 120, 242), font, 0.65, (20, 20, 20), 2)

    # Authorization box (Car / Light Motor Vehicle)
    cv2.rectangle(card, (dx, 275), (w - 40, 350), (225, 235, 220), -1)
    cv2.rectangle(card, (dx, 275), (w - 40, 350), (100, 140, 90), 1)
    cv2.putText(card, "CLASS OF VEHICLES AUTHORISED:", (dx + 15, 300), font, 0.45, (40, 80, 30), 1)
    cv2.putText(card, "LMV (CAR / LIGHT MOTOR VEHICLE) & MCWG", (dx + 15, 332), cv2.FONT_HERSHEY_DUPLEX, 0.62, (10, 60, 20), 2)

    cv2.putText(card, "VALIDITY (NT):", (dx, 385), font, 0.48, (100, 100, 100), 1)
    cv2.putText(card, "14-08-2042", (dx + 130, 385), font, 0.65, (20, 20, 20), 2)

    cv2.putText(card, "ISSUING AUTH:", (dx, 422), font, 0.48, (100, 100, 100), 1)
    cv2.putText(card, "RTO DELHI METRO WEST (DL-14)", (dx + 130, 422), font, 0.58, (50, 50, 50), 2)

    # Signature box
    cv2.putText(card, "Holder Signature: Alex Mercer", (dx, 465), cv2.FONT_HERSHEY_SCRIPT_SIMPLEX, 0.75, (40, 30, 60), 2)

    # Bottom footer
    cv2.rectangle(card, (0, h - 25), (w, h), (45, 110, 30), -1)
    cv2.putText(card, "OFFICIAL DRIVING LICENCE - AUTHORIZED PHOTO IDENTITY FOR EXAM ADMISSION", (110, h - 8), font, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

    cv2.imwrite(str(output_path), card)
    print(f"Generated sample Driving License: {output_path}")


def create_sample_matching_live_face(output_path: Path):
    """Generates a live webcam capture matching the ID card candidate."""
    w, h = 640, 480
    frame = np.ones((h, w, 3), dtype=np.uint8) * 210

    # Room wall background gradient
    for y in range(h):
        shade = int(180 + (y / h) * 40)
        frame[y, :] = (shade - 20, shade - 10, shade)

    center_x = w // 2
    head_y = h // 2 - 20

    # Torso
    cv2.ellipse(frame, (center_x, h + 80), (180, 150), 0, 180, 360, (70, 90, 150), -1)

    # Head oval (matching Alex Mercer's skin tone and features)
    cv2.ellipse(frame, (center_x, head_y), (85, 110), 0, 0, 360, (190, 160, 140), -1)
    # Hair
    cv2.ellipse(frame, (center_x, head_y - 50), (90, 65), 0, 180, 360, (40, 30, 20), -1)
    # Eyes
    cv2.circle(frame, (center_x - 30, head_y - 12), 11, (255, 255, 255), -1)
    cv2.circle(frame, (center_x + 30, head_y - 12), 11, (255, 255, 255), -1)
    cv2.circle(frame, (center_x - 30, head_y - 12), 6, (50, 40, 30), -1)
    cv2.circle(frame, (center_x + 30, head_y - 12), 6, (50, 40, 30), -1)
    # Smile
    cv2.ellipse(frame, (center_x, head_y + 45), (32, 16), 0, 0, 180, (80, 40, 50), 3)

    cv2.imwrite(str(output_path), frame)
    print(f"Generated matching live face: {output_path}")


def create_sample_desk_cheat_sheet(output_path: Path):
    """Generates an image of a desk with an unauthorized formula cheat sheet."""
    w, h = 800, 600
    desk = np.ones((h, w, 3), dtype=np.uint8)
    # Wooden desk tone (Brown/Tan)
    desk[:] = (45, 80, 125)

    # Place a tilted white paper document (Cheat Sheet)
    pts = np.array([[220, 140], [580, 170], [520, 490], [170, 450]], dtype=np.int32)
    # White paper sheet
    cv2.fillPoly(desk, [pts], (240, 242, 245))
    cv2.polylines(desk, [pts], True, (180, 180, 185), 2)

    # Handwritten/printed formulas and cheat notes on the document
    font = cv2.FONT_HERSHEY_SIMPLEX
    lines = [
        "FORMULA SHEET [EXAM]",
        "E = mc^2  |  F = ma",
        "P(A|B) = P(B|A)*P(A)/P(B)",
        "Integral sin(x)dx = -cos(x)",
        "dy/dx = lim h->0 [f(x+h)-f(x)]/h",
        "Cheat Notes: Sec 4.2",
    ]
    y_start = 220
    for i, line in enumerate(lines):
        cv2.putText(desk, line, (240 + i * 5, y_start + i * 38), font, 0.58, (25, 20, 20), 2)

    cv2.imwrite(str(output_path), desk)
    print(f"Generated cheat sheet document: {output_path}")


def create_sample_magazine_cover(output_path: Path):
    """Generates an authentic mock glossy Magazine Cover (prohibited reading material)."""
    w, h = 600, 800
    mag = np.ones((h, w, 3), dtype=np.uint8)

    # Rich glossy gradient background (Deep Indigo to Cyber Purple)
    for y in range(h):
        ratio = y / float(h)
        mag[y, :, 0] = int(50 + 60 * ratio)   # Blue
        mag[y, :, 1] = int(15 + 20 * ratio)   # Green
        mag[y, :, 2] = int(25 + 90 * ratio)   # Red

    font = cv2.FONT_HERSHEY_SIMPLEX

    # Top Category Header
    cv2.rectangle(mag, (0, 0), (w, 35), (20, 20, 40), -1)
    cv2.putText(mag, "GLOBAL SCIENCE & TECHNOLOGY MONTHLY", (60, 24), font, 0.45, (220, 220, 240), 1, cv2.LINE_AA)

    # Magazine Masthead / Title
    cv2.putText(mag, "TECH HORIZON", (35, 110), cv2.FONT_HERSHEY_DUPLEX, 1.6, (255, 255, 255), 3, cv2.LINE_AA)
    cv2.putText(mag, "TECH HORIZON", (35, 110), cv2.FONT_HERSHEY_DUPLEX, 1.6, (255, 215, 0), 1, cv2.LINE_AA)

    # Issue banner line
    cv2.line(mag, (35, 128), (w - 35, 128), (200, 180, 80), 2)
    cv2.putText(mag, "ISSUE #184 | SEPTEMBER 2026 | $8.99 USD", (40, 148), font, 0.42, (200, 200, 220), 1)
    cv2.putText(mag, "SPECIAL COLLECTOR'S EDITION", (360, 148), font, 0.42, (100, 220, 255), 1)

    # Central Cover Feature Graphic (Glossy Portrait Oval & Glowing Rings)
    cx, cy = w // 2, h // 2 + 10
    # Glowing concentric circles
    cv2.circle(mag, (cx, cy), 170, (80, 50, 120), 2)
    cv2.circle(mag, (cx, cy), 150, (120, 80, 180), 2)
    cv2.circle(mag, (cx, cy), 130, (180, 120, 240), 2)

    # Cover Portrait Face (Celebrity / Scientist cover star)
    draw_candidate_face(mag, cx - 105, cy - 130, 210, 260)

    # Cover Story Big Bold Headline
    cv2.rectangle(mag, (25, 460), (w - 25, 545), (20, 10, 30), -1)
    cv2.rectangle(mag, (25, 460), (w - 25, 545), (255, 200, 0), 2)
    cv2.putText(mag, "ARTIFICIAL INTELLIGENCE", (38, 500), cv2.FONT_HERSHEY_DUPLEX, 1.15, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(mag, "CAN EXAM PROCTORS OUTSMART CHEATING?", (40, 532), font, 0.55, (100, 240, 255), 1, cv2.LINE_AA)

    # Supporting Teaser Articles (Left & Right columns)
    teasers = [
        ("• NEURAL VISION IN 2026", 590),
        ("• QUANTUM BRAIN INTERFACES", 625),
        ("• THE FUTURE OF ROBOTICS", 660),
    ]
    for text, ty in teasers:
        cv2.putText(mag, text, (40, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (240, 240, 255), 2)

    # Barcode & UPC Block (Bottom Right)
    bx, by, bw_bar, bh_bar = 420, 680, 145, 65
    cv2.rectangle(mag, (bx, by), (bx + bw_bar, by + bh_bar), (255, 255, 255), -1)
    for i in range(bx + 10, bx + bw_bar - 10, 5):
        thick = 2 if (i // 5) % 2 == 0 else 1
        cv2.line(mag, (i, by + 8), (i, by + 48), (20, 20, 20), thick)
    cv2.putText(mag, "9 771234 567003", (bx + 8, by + 60), font, 0.35, (10, 10, 10), 1)

    # Outer Glossy Border
    cv2.rectangle(mag, (10, 10), (w - 10, h - 10), (220, 200, 140), 2)

    cv2.imwrite(str(output_path), mag)
    print(f"Generated sample Magazine Cover: {output_path}")


def main():
    sample_dir = Path("sample_data")
    sample_dir.mkdir(exist_ok=True)
    create_sample_student_id(sample_dir / "candidate_id_card.jpg")
    create_sample_pan_card(sample_dir / "candidate_pan_card.jpg")
    create_sample_driving_license(sample_dir / "candidate_driving_license.jpg")
    create_sample_matching_live_face(sample_dir / "candidate_live_face.jpg")
    create_sample_desk_cheat_sheet(sample_dir / "cheat_sheet_desk.jpg")
    create_sample_magazine_cover(sample_dir / "unauthorized_magazine_cover.jpg")
    print("All sample data fixtures (ID, PAN, DL, Cheat Sheet, Magazine) generated successfully.")


if __name__ == "__main__":
    main()
