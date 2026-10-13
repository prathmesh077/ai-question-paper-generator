import os
from io import BytesIO
from typing import Dict, Any, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Adds running page numbers 'Page X of Y' to the PDF document."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#475569"))
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 36, 25, page_text)
        self.drawString(36, 25, "CONFIDENTIAL  *  ACADEMIC EXAMINATION PAPER  *  DO NOT DUPLICATE")
        self.restoreState()


class PDFExporter:
    """Exports structured question paper into a standardized academic university examination PDF."""

    @classmethod
    def generate_pdf(cls, paper_data: Dict[str, Any], output_path: str = None) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            output_path if output_path else buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=45
        )

        styles = getSampleStyleSheet()

        inst_style = ParagraphStyle(
            'InstitutionHeader',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            alignment=1, # Center
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=2
        )
        
        dept_style = ParagraphStyle(
            'DeptHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=13,
            alignment=1,
            textColor=colors.HexColor("#334155"),
            spaceAfter=3
        )

        exam_style = ParagraphStyle(
            'ExamTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            alignment=1,
            textColor=colors.HexColor("#1e293b"),
            spaceAfter=8
        )

        sec_head_style = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=10,
            spaceAfter=4
        )

        meta_label_style = ParagraphStyle(
            'MetaLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#1e293b")
        )

        meta_val_style = ParagraphStyle(
            'MetaVal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#334155")
        )

        q_num_style = ParagraphStyle(
            'QNum',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            alignment=1,
            textColor=colors.HexColor("#0f172a")
        )

        q_text_style = ParagraphStyle(
            'QText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#0f172a")
        )

        q_meta_style = ParagraphStyle(
            'QMeta',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=10,
            alignment=1,
            textColor=colors.HexColor("#64748b")
        )

        instr_style = ParagraphStyle(
            'Instructions',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor("#334155")
        )

        story = []

        is_sgu = bool(
            (paper_data.get("institution_name") and "SANJAY GHODAWAT" in str(paper_data.get("institution_name")).upper()) or
            (paper_data.get("title") and "SGU" in str(paper_data.get("title")).upper()) or
            paper_data.get("layout") == "sgu"
        )

        # 1. Header Information
        if is_sgu:
            inst_name = paper_data.get("institution_name", "SANJAY GHODAWAT UNIVERSITY, KOLHAPUR")
            dept_name = paper_data.get("department", "School of Computer Science and Engineering")
            exam_title = paper_data.get("title", "END SEMESTER EXAMINATION")
        else:
            inst_name = paper_data.get("institution_name", "NATIONAL INSTITUTE OF TECHNOLOGY & SCIENCE")
            dept_name = paper_data.get("department", "Department of Computer Science & Engineering")
            exam_title = paper_data.get("title", "End Semester Examination")

        course_name = paper_data.get("course_name", "Computer Science" if is_sgu else "Data Structures & Algorithms")
        course_code = paper_data.get("course_code", "CSE601" if is_sgu else "CS301")
        semester = paper_data.get("semester", "VI" if is_sgu else "Semester V")
        duration = paper_data.get("duration_minutes", 180)
        total_marks = paper_data.get("total_marks", 100)
        academic_year = paper_data.get("academic_year", "2026–27")

        story.append(Paragraph(inst_name.upper(), inst_style))
        story.append(Paragraph(dept_name, dept_style))
        story.append(Paragraph(exam_title, exam_style))
        story.append(Spacer(1, 4))

        # 2. Examination Metadata Table
        hours = duration // 60
        mins = duration % 60
        dur_str = f"{hours} Hours" + (f" {mins} Mins" if mins else "")

        if is_sgu:
            meta_data = [
                [
                    Paragraph("<b>Subject:</b>", meta_label_style),
                    Paragraph(course_name, meta_val_style),
                    Paragraph("<b>Semester:</b>", meta_label_style),
                    Paragraph(semester, meta_val_style)
                ],
                [
                    Paragraph("<b>Subject Code:</b>", meta_label_style),
                    Paragraph(course_code, meta_val_style),
                    Paragraph("<b>Maximum Marks:</b>", meta_label_style),
                    Paragraph(f"{total_marks} Marks", meta_val_style)
                ],
                [
                    Paragraph("<b>Examination Duration:</b>", meta_label_style),
                    Paragraph(dur_str, meta_val_style),
                    Paragraph("<b>Academic Year:</b>", meta_label_style),
                    Paragraph(academic_year, meta_val_style)
                ]
            ]
        else:
            meta_data = [
                [
                    Paragraph("<b>Course Code:</b>", meta_label_style),
                    Paragraph(course_code, meta_val_style),
                    Paragraph("<b>Course Title:</b>", meta_label_style),
                    Paragraph(course_name, meta_val_style)
                ],
                [
                    Paragraph("<b>Semester:</b>", meta_label_style),
                    Paragraph(semester, meta_val_style),
                    Paragraph("<b>Max Marks:</b>", meta_label_style),
                    Paragraph(f"{total_marks} Marks", meta_val_style)
                ],
                [
                    Paragraph("<b>Duration:</b>", meta_label_style),
                    Paragraph(dur_str, meta_val_style),
                    Paragraph("<b>Reg. / Roll No:</b>", meta_label_style),
                    Paragraph("[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]", meta_val_style)
                ]
            ]
        
        meta_table = Table(meta_data, colWidths=[1.1*inch, 2.3*inch, 1.2*inch, 2.6*inch])
        meta_table.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0f172a")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc"))
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 6))

        # SGU Proposed Demo Notice Box
        if is_sgu:
            notice_style = ParagraphStyle(
                'SGUNotice',
                parent=styles['Normal'],
                fontName='Helvetica-Oblique',
                fontSize=8,
                leading=11,
                alignment=1,
                textColor=colors.HexColor("#92400e")
            )
            notice_p = Paragraph("<b>Notice:</b> This is a proposed demo format, not a verified official SGU examination pattern. Confirm the approved duration and marking scheme with your department.", notice_style)
            notice_table = Table([[notice_p]], colWidths=[7.2*inch])
            notice_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fffbeb")),
                ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#d97706")),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(notice_table)
            story.append(Spacer(1, 6))

        # 3. General Instructions Box
        raw_instructions = paper_data.get("instructions") or (
            "1. Answer ALL questions according to instructions in respective sections.\n"
            "2. Marks for each question are indicated against it.\n"
            "3. Assume suitable data wherever necessary and mention it clearly.\n"
            "4. Use of programmable calculators is strictly prohibited."
        )
        instr_formatted = "<br/>".join([f"• {line.strip()}" for line in raw_instructions.splitlines() if line.strip()])
        story.append(Paragraph(f"<b>General Instructions:</b><br/>{instr_formatted}", instr_style))
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0f172a"), spaceBefore=3, spaceAfter=6))

        # 4. Sections & Questions
        sections = paper_data.get("sections", [])
        show_parts = paper_data.get("show_part_headers", False) if "show_part_headers" in paper_data else (paper_data.get("paper_mode") == "sections")
        num_fmt = paper_data.get("numbering_format", "Q")

        for s_idx, sec in enumerate(sections):
            sec_id = sec.get("section_id", str(s_idx + 1))
            sec_title = sec.get("title", f"Q.{s_idx + 1} Answer the following")
            if is_sgu and not sec_title.upper().startswith("Q.") and not sec_title.upper().startswith("Q"):
                sec_title = f"Q.{s_idx + 1} {sec_title}"
            marks_per_q = sec.get("marks_per_question", 2)
            req_count = sec.get("required_count", len(sec.get("questions", [])))
            tot_sec_marks = sec.get("total_section_marks", req_count * marks_per_q)
            choice_type = sec.get("choice_type", "")

            if is_sgu:
                choice_sub = ""
                if choice_type and choice_type != "Compulsory":
                    choice_sub = f" &nbsp; <i>({choice_type})</i>"
                elif req_count and sec.get("questions") and req_count < len(sec.get("questions")):
                    choice_sub = f" &nbsp; <i>(Answer any {req_count} out of {len(sec.get('questions'))} questions &times; {marks_per_q} marks = {tot_sec_marks})</i>"

                sec_p_left = Paragraph(f"<b>{sec_title.upper()}</b>{choice_sub}", sec_head_style)
                sec_p_right = Paragraph(f"<b>[{tot_sec_marks}]</b>", ParagraphStyle('SecR', parent=styles['Normal'], alignment=2, fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor("#0f172a")))
                sec_bar = Table([[sec_p_left, sec_p_right]], colWidths=[6.2*inch, 1.0*inch])
                sec_bar.setStyle(TableStyle([
                    ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor("#0f172a")),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                    ('TOPPADDING', (0,0), (-1,-1), 5),
                ]))
                story.append(sec_bar)
                story.append(Spacer(1, 3))

                q_table_data = []
                for q_idx, q in enumerate(sec.get("questions", [])):
                    subq_letter = f"({chr(97 + q_idx)})"
                    q_text = q.get("question_text", "")
                    options = q.get("options", [])
                    if options and len(options) >= 2:
                        opt_letters = ['(a)', '(b)', '(c)', '(d)']
                        opt_formatted = "<br/>" + "<br/>".join([f"&nbsp; &nbsp; <b>{opt_letters[idx]}</b> {opt}" for idx, opt in enumerate(options[:4])])
                        full_q_text = f"{q_text}{opt_formatted}"
                    else:
                        full_q_text = q_text

                    bloom_level = q.get("blooms_level", "Understand")
                    meta_tag = f"[{bloom_level}]"
                    marks_val = str(q.get("marks", marks_per_q))

                    q_table_data.append([
                        Paragraph(f"<b>{subq_letter}</b>", q_num_style),
                        Paragraph(full_q_text, q_text_style),
                        Paragraph(meta_tag, q_meta_style),
                        Paragraph(f"<b>[{marks_val}]</b>", q_num_style)
                    ])

                if q_table_data:
                    q_table = Table(q_table_data, colWidths=[0.5*inch, 5.5*inch, 0.7*inch, 0.5*inch])
                    q_table.setStyle(TableStyle([
                        ('TOPPADDING', (0,0), (-1,-1), 3),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                        ('VALIGN', (0,0), (-1,-1), 'TOP'),
                        ('LINEBELOW', (0,0), (-1,-1), 0.3, colors.HexColor("#f1f5f9")),
                    ]))
                    story.append(KeepTogether(q_table))
                    story.append(Spacer(1, 6))

            else:
                if show_parts:
                    sec_header_text = f"<b>{sec_title}</b> &nbsp; (Answer {req_count} Questions &times; {marks_per_q} Marks = {tot_sec_marks} Marks)"
                    story.append(Paragraph(sec_header_text, sec_head_style))
                    story.append(Spacer(1, 4))

                # Question Table
                q_table_data = [
                    [
                        Paragraph("<b>Q.No</b>", q_num_style),
                        Paragraph("<b>Question Description / Problem Statement</b>", q_num_style),
                        Paragraph("<b>Bloom / CO</b>", q_num_style),
                        Paragraph("<b>Marks</b>", q_num_style)
                    ]
                ]

                for q in sec.get("questions", []):
                    raw_n = str(q.get("q_number", "")).lstrip("Qq. ")
                    if num_fmt == "num_only":
                        q_num = raw_n
                    elif num_fmt == "Q_dot":
                        q_num = f"Q.{raw_n}"
                    else:
                        q_num = f"Q{raw_n}"

                    q_text = q.get("question_text", "")
                    options = q.get("options", [])
                    
                    # If MCQ, format options nicely
                    if options and len(options) >= 2:
                        opt_letters = ['(a)', '(b)', '(c)', '(d)', '(e)']
                        opt_formatted = "<br/>" + "<br/>".join([f"&nbsp; &nbsp; <b>{opt_letters[idx]}</b> {opt}" for idx, opt in enumerate(options[:4])])
                        full_q_text = f"{q_text}{opt_formatted}"
                    else:
                        full_q_text = q_text

                    bloom_level = q.get("blooms_level", "L2")
                    diff = q.get("difficulty", "Med")
                    meta_tag = f"[{bloom_level} / {diff}]"
                    marks_val = str(q.get("marks", marks_per_q))

                    q_table_data.append([
                        Paragraph(f"<b>{q_num}</b>", q_num_style),
                        Paragraph(full_q_text, q_text_style),
                        Paragraph(meta_tag, q_meta_style),
                        Paragraph(f"<b>[{marks_val}]</b>", q_num_style)
                    ])

                q_table = Table(q_table_data, colWidths=[0.7*inch, 5.3*inch, 0.7*inch, 0.5*inch])
                q_table.setStyle(TableStyle([
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0f172a")),
                    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ]))

                story.append(KeepTogether(q_table))
                story.append(Spacer(1, 10))

        if is_sgu:
            sgu_total_p = Paragraph(f"<b>TOTAL: {total_marks} MARKS</b>", ParagraphStyle('SGUTotal', parent=styles['Normal'], alignment=1, fontName='Helvetica-Bold', fontSize=10.5, textColor=colors.HexColor("#0f172a")))
            sgu_total_table = Table([[sgu_total_p]], colWidths=[7.2*inch])
            sgu_total_table.setStyle(TableStyle([
                ('LINEABOVE', (0,0), (-1,-1), 1.5, colors.HexColor("#0f172a")),
                ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.HexColor("#0f172a")),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(Spacer(1, 8))
            story.append(sgu_total_table)

        # End of Paper marker
        story.append(Spacer(1, 12))
        end_style = ParagraphStyle('EndNotice', parent=styles['Normal'], alignment=1, fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor("#64748b"))
        story.append(Paragraph("********** END OF QUESTION PAPER **********", end_style))

        # Build document
        doc.build(story, canvasmaker=NumberedCanvas)

        if output_path:
            with open(output_path, "rb") as f:
                return f.read()
        return buffer.getvalue()
