import re
from typing import List, Dict, Any, Tuple
import difflib

class DeduplicationEngine:
    """
    Intelligent question deduplication and diversity verification engine.
    Detects duplicate, near-duplicate, and reworded questions across:
    1. The institution's Question Bank
    2. Previously generated examination papers
    """

    @staticmethod
    def _clean_text(text: str) -> str:
        """Normalizes question text for robust comparison."""
        text = text.lower()
        # Remove numbers at start like "1.", "(a)", "Q3:"
        text = re.sub(r'^\s*(?:q\d+[:.]?|\(?\d+\)?[:.]?|\(?[a-z]\)[:.]?)\s*', '', text)
        # Remove punctuation
        text = re.sub(r'[^\w\s]', ' ', text)
        return " ".join(text.split())

    @staticmethod
    def _get_ngrams(tokens: List[str], n: int = 2) -> set:
        if len(tokens) < n:
            return set(tokens)
        return set(" ".join(tokens[i:i+n]) for i in range(len(tokens) - n + 1))

    @classmethod
    def calculate_similarity(cls, text1: str, text2: str) -> float:
        """
        Calculates a hybrid similarity score combining:
        - Token Jaccard similarity (vocabulary overlap)
        - Bigram Jaccard similarity (phrase order)
        - SequenceMatcher ratio (Levenshtein-style character alignment)
        """
        clean1 = cls._clean_text(text1)
        clean2 = cls._clean_text(text2)

        if not clean1 or not clean2:
            return 0.0

        if clean1 == clean2:
            return 1.0

        tokens1 = clean1.split()
        tokens2 = clean2.split()

        set1 = set(tokens1)
        set2 = set(tokens2)
        
        # Token Jaccard
        intersection_tokens = len(set1.intersection(set2))
        union_tokens = len(set1.union(set2))
        jaccard_token = intersection_tokens / union_tokens if union_tokens > 0 else 0.0

        # Bigram Jaccard
        bg1 = cls._get_ngrams(tokens1, 2)
        bg2 = cls._get_ngrams(tokens2, 2)
        intersection_bg = len(bg1.intersection(bg2))
        union_bg = len(bg1.union(bg2))
        jaccard_bg = intersection_bg / union_bg if union_bg > 0 else 0.0

        # SequenceMatcher
        seq_ratio = difflib.SequenceMatcher(None, clean1, clean2).ratio()

        # Weighted combination: bigrams & tokens are best indicators of academic questions
        composite_score = (0.45 * jaccard_token) + (0.35 * jaccard_bg) + (0.20 * seq_ratio)
        return round(composite_score, 4)

    @classmethod
    def check_question_against_pool(
        cls,
        candidate_text: str,
        pool: List[Dict[str, Any]],
        threshold: float = 0.65
    ) -> Dict[str, Any]:
        """
        Checks a candidate question against a pool of existing questions.
        Returns highest similarity score, duplicate status, and matching question details.
        """
        highest_score = 0.0
        best_match = None

        for item in pool:
            existing_text = item.get("question_text", "")
            score = cls.calculate_similarity(candidate_text, existing_text)
            if score > highest_score:
                highest_score = score
                best_match = item

        is_duplicate = highest_score >= threshold
        recommendation = "Unique - Approved for paper"
        if highest_score >= 0.80:
            recommendation = "High Duplicate Risk: Re-generate or replace with alternative question"
        elif highest_score >= threshold:
            recommendation = "Moderate Similarity: Review for conceptual overlap with past exams"

        match_info = None
        if best_match and highest_score > 0.40:
            match_info = {
                "existing_id": best_match.get("id"),
                "existing_text": best_match.get("question_text"),
                "source": best_match.get("source", "question_bank"),
                "paper_title": best_match.get("paper_title", ""),
                "course_code": best_match.get("course_code", ""),
                "similarity_score": highest_score,
                "similarity_percentage": int(highest_score * 100),
                "recommendation": recommendation
            }

        return {
            "is_duplicate": is_duplicate,
            "highest_similarity": highest_score,
            "match": match_info
        }

    @classmethod
    def evaluate_paper_diversity(
        cls,
        sections: List[Dict[str, Any]],
        past_paper_questions: List[Dict[str, Any]],
        bank_questions: List[Dict[str, Any]],
        threshold: float = 0.70
    ) -> Dict[str, Any]:
        """
        Evaluates complete generated paper for:
        1. Internal repetition between questions in the paper
        2. Overlap with previous papers
        3. Overlap with question bank
        Calculates Overall Paper Diversity Score and Duplicate Risk Score.
        """
        all_paper_questions = []
        for sec in sections:
            sec_id = sec.get("section_id", "")
            for idx, q in enumerate(sec.get("questions", [])):
                all_paper_questions.append({
                    "section_id": sec_id,
                    "index": idx,
                    "question_text": q.get("question_text", ""),
                    "unit": q.get("unit_number", 1),
                    "marks": q.get("marks", 2)
                })

        comparison_pool = []
        for q in past_paper_questions:
            comparison_pool.append({
                "id": q.get("id"),
                "question_text": q.get("question_text", ""),
                "source": "past_examination_paper",
                "paper_title": q.get("paper_title", "Prior Exam"),
                "course_code": q.get("course_code", "")
            })
        for q in bank_questions:
            comparison_pool.append({
                "id": q.get("id"),
                "question_text": q.get("question_text", ""),
                "source": "question_bank",
                "paper_title": "Active Bank",
                "course_code": q.get("course_code", "")
            })

        duplicate_count = 0
        total_questions = len(all_paper_questions)
        similarity_sum = 0.0
        question_alerts = []

        # Check intra-paper diversity
        for i in range(total_questions):
            q1 = all_paper_questions[i]
            for j in range(i + 1, total_questions):
                q2 = all_paper_questions[j]
                sim = cls.calculate_similarity(q1["question_text"], q2["question_text"])
                if sim >= threshold:
                    duplicate_count += 1
                    question_alerts.append({
                        "section_id": q1["section_id"],
                        "question_index": q1["index"],
                        "question_text": q1["question_text"],
                        "issue": f"Internal overlap ({int(sim*100)}%) with Question in Section {q2['section_id']}",
                        "similarity_score": sim
                    })

            # Check vs pool
            check = cls.check_question_against_pool(q1["question_text"], comparison_pool, threshold)
            similarity_sum += check["highest_similarity"]
            if check["is_duplicate"]:
                duplicate_count += 1
                question_alerts.append({
                    "section_id": q1["section_id"],
                    "question_index": q1["index"],
                    "question_text": q1["question_text"],
                    "issue": f"Matches previously used question ({int(check['highest_similarity']*100)}%) from {check['match']['source']}",
                    "match": check["match"],
                    "similarity_score": check["highest_similarity"]
                })

        avg_similarity = (similarity_sum / total_questions) if total_questions > 0 else 0.0
        diversity_score = max(0.0, round((1.0 - avg_similarity) * 100, 1))
        duplicate_risk = min(100.0, round((duplicate_count / max(1, total_questions)) * 100, 1))

        return {
            "total_questions": total_questions,
            "duplicate_flags_count": duplicate_count,
            "diversity_score": diversity_score,
            "duplicate_risk_score": duplicate_risk,
            "alerts": question_alerts
        }
