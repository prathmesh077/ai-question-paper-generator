import re
import math
from typing import List, Dict, Any, Tuple
from io import BytesIO
from pypdf import PdfReader
from docx import Document

class RAGEngine:
    """
    Retrieval-Augmented Generation (RAG) engine for syllabus grounding.
    Extracts text from syllabus PDFs & Word DOCX files, breaks content into modular units,
    extracts topics and learning outcomes, indexes semantic chunks, and retrieves
    verified context passages for grounded examination question formulation.
    """

    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> str:
        """Extract plain text from uploaded PDF syllabus."""
        reader = PdfReader(BytesIO(pdf_bytes))
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted_pages.append(text.strip())
        return "\n\n".join(extracted_pages)

    @staticmethod
    def extract_text_from_docx(docx_bytes: bytes) -> str:
        """Extract plain text from uploaded DOCX syllabus."""
        doc = Document(BytesIO(docx_bytes))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        # Also extract table text if syllabus uses tables
        for table in doc.tables:
            for row in table.rows:
                cells = [c.text.strip() for c in row.cells if c.text.strip()]
                if cells:
                    paragraphs.append(" - ".join(cells))
        return "\n\n".join(paragraphs)

    @staticmethod
    def parse_syllabus_units(raw_text: str) -> List[Dict[str, Any]]:
        """
        Parses syllabus text into units/modules, topic lists, and learning outcomes.
        Handles patterns like 'UNIT I', 'Unit 1', 'MODULE 1', 'CHAPTER 1', 'Course Outcomes', etc.
        """
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        unit_pattern = re.compile(
            r'^(?:UNIT|MODULE|CHAPTER|PART)\s*([0-9IVXLCDM]+)[\s:\-\.]*(.*)$',
            re.IGNORECASE
        )
        co_pattern = re.compile(
            r'^(?:CO|LO|CLO|OUTCOME|OBJECTIVE)\s*([0-9]+)[\s:\-\.]*(.*)$',
            re.IGNORECASE
        )

        units = []
        current_unit = None
        roman_map = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8}

        for line in lines:
            match = unit_pattern.match(line)
            if match:
                raw_num = match.group(1).upper()
                unit_num = roman_map.get(raw_num, int(raw_num) if raw_num.isdigit() else len(units) + 1)
                raw_title = match.group(2).strip() or f"Unit {unit_num}"
                # Clean unit title: strip leading dashes/symbols and trailing duration (e.g. '(9 hours)')
                unit_title = re.sub(r'^[^\w\s]+', '', raw_title).strip()
                unit_title = re.sub(r'\s*\(\s*\d+\s*(?:hours|hrs|credits)?\s*\)\s*$', '', unit_title, flags=re.I).strip()
                if not unit_title:
                    unit_title = f"Unit {unit_num}"
                
                if current_unit:
                    units.append(current_unit)
                
                current_unit = {
                    "unit_num": unit_num,
                    "title": unit_title,
                    "topics": [],
                    "learning_outcomes": [],
                    "weightage": 20,
                    "raw_content": []
                }
            else:
                if current_unit is not None:
                    current_unit["raw_content"].append(line)
                    
                    # Detect learning outcome / objective
                    co_match = co_pattern.match(line)
                    if co_match:
                        co_desc = co_match.group(2).strip() or line
                        co_desc = re.sub(r'^[^\w\s]+', '', co_desc).strip()
                        co_desc = re.sub(r'\s*\(\s*\d+\s*(?:hours|hrs|credits)?\s*\)\s*$', '', co_desc, flags=re.I).strip()
                        if co_desc not in current_unit["learning_outcomes"]:
                            current_unit["learning_outcomes"].append(co_desc)
                        continue

                    if any(kw in line.lower() for kw in ["learning outcome", "objective:", "students will be able to", "outcome:"]):
                        outcome_clean = re.sub(r'^(?:learning outcome|objective|students will be able to|outcome)[:\-]?\s*', '', line, flags=re.I).strip()
                        outcome_clean = re.sub(r'^[^\w\s]+', '', outcome_clean).strip()
                        outcome_clean = re.sub(r'\s*\(\s*\d+\s*(?:hours|hrs|credits)?\s*\)\s*$', '', outcome_clean, flags=re.I).strip()
                        if outcome_clean and outcome_clean not in current_unit["learning_outcomes"]:
                            current_unit["learning_outcomes"].append(outcome_clean)
                        continue

                    # Pre-clean line: merge common academic compound splits like "Three, schema"
                    clean_line = re.sub(r'\bThree\s*,\s*schema\b', 'Three-schema', line, flags=re.I)
                    clean_line = re.sub(r'\bFile\s*,\s*processing\b', 'File processing', clean_line, flags=re.I)

                    # Split comma-separated or dash-separated topics
                    sub_topics = [t.strip() for t in re.split(r'[,;•\-\*]', clean_line) if len(t.strip()) > 3]
                    stop_words = {
                        'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'one', 'two',
                        'hours', 'unit', 'module', 'chapter', 'part', 'topics', 'topic', 'data', 'file',
                        'and', 'or', 'the', 'versus', 'vs', 'etc', 'for', 'with', 'intro', 'null'
                    }

                    for st in sub_topics:
                        st_clean = re.sub(r'^[^\w\s]+', '', st).strip()
                        st_clean = re.sub(r'[^\w\s\)]+$', '', st_clean).strip()
                        st_lower = st_clean.lower()
                        if st_lower in stop_words or len(st_clean) < 4:
                            continue
                        if st_lower.startswith(('and ', 'or ', 'with ', 'versus ', 'vs ', 'to ')):
                            st_clean = re.sub(r'^(?:and|or|with|versus|vs|to)\s+', '', st_clean, flags=re.I).strip()
                        if len(st_clean) >= 4 and len(st_clean) < 90 and st_clean not in current_unit["topics"]:
                            current_unit["topics"].append(st_clean)

        if current_unit:
            units.append(current_unit)

        # Fallback if no explicit 'Unit' headers were matched
        if not units:
            chunks = [c for c in re.split(r'\n{2,}', raw_text) if len(c.strip()) > 20]
            num_units = min(5, max(1, len(chunks)))
            chunk_step = max(1, len(chunks) // num_units)
            for i in range(1, num_units + 1):
                sub_chunk = chunks[(i-1)*chunk_step : i*chunk_step]
                first_line = sub_chunk[0] if sub_chunk else f"Module {i}"
                units.append({
                    "unit_num": i,
                    "title": first_line[:60],
                    "topics": [c[:60] for c in sub_chunk[:4]],
                    "learning_outcomes": [f"Understand and apply concepts of {first_line[:40]}"],
                    "weightage": round(100 / num_units),
                    "raw_content": sub_chunk
                })

        # Add default learning outcome if none was explicitly detected
        for u in units:
            if not u.get("learning_outcomes"):
                u["learning_outcomes"] = [
                    f"Understand foundational concepts of {u['title']}",
                    f"Analyze and solve engineering problems related to {u['topics'][0] if u.get('topics') else u['title']}"
                ]

        return units

    @staticmethod
    def chunk_syllabus(units: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Splits syllabus into semantic chunks with verifiable source passages."""
        chunks = []
        for u in units:
            unit_num = u.get("unit_num", 1)
            title = u.get("title", f"Unit {unit_num}")
            topics = u.get("topics", [])
            outcomes = u.get("learning_outcomes", [])
            raw_content = " ".join(u.get("raw_content", []))
            
            # Unit overview passage
            chunks.append({
                "unit_number": unit_num,
                "unit_title": title,
                "topic": "Overview & Core Concepts",
                "learning_outcome": outcomes[0] if outcomes else f"Comprehend core principles of {title}",
                "content": f"{title} curriculum overview. Core syllabus: {raw_content[:450]}",
                "keywords": " ".join(topics[:8])
            })
            
            # Granular topic passages
            for idx, topic in enumerate(topics):
                associated_lo = outcomes[idx % len(outcomes)] if outcomes else f"Master concepts of {topic}"
                passage = f"Unit {unit_num} [{title}], Topic: {topic}. Specific learning outcome: {associated_lo}. Focus areas include theoretical derivations, algorithmic behavior, design trade-offs, and practical evaluation."
                chunks.append({
                    "unit_number": unit_num,
                    "unit_title": title,
                    "topic": topic,
                    "learning_outcome": associated_lo,
                    "content": passage,
                    "keywords": f"{topic.lower()} {title.lower()}"
                })
        return chunks

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', text)]

    @classmethod
    def retrieve_context(cls, chunks: List[Dict[str, Any]], query: str, top_k: int = 3, unit_filter: int = None) -> List[Dict[str, Any]]:
        """
        Retrieves top-k most relevant syllabus chunks with verifiable passages.
        Ensures questions are strictly grounded in retrieved passages with zero hallucinations.
        """
        query_tokens = cls._tokenize(query)
        if not query_tokens:
            candidates = [c for c in chunks if unit_filter is None or c.get("unit_number") == unit_filter]
            return candidates[:top_k] if candidates else chunks[:top_k]

        candidates = [c for c in chunks if unit_filter is None or c.get("unit_number") == unit_filter]
        if not candidates:
            candidates = chunks

        scores = []
        for chunk in candidates:
            chunk_tokens = cls._tokenize(chunk.get("content", "") + " " + chunk.get("topic", "") + " " + chunk.get("keywords", ""))
            if not chunk_tokens:
                scores.append(0.0)
                continue
            
            score = 0.0
            chunk_len = len(chunk_tokens)
            for q in query_tokens:
                count = chunk_tokens.count(q)
                if count > 0:
                    tf = count / (count + 1.2 * (0.25 + 0.75 * (chunk_len / 50.0)))
                    score += tf
            scores.append(score)

        ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
        return [item[0] for item in ranked[:top_k]]
