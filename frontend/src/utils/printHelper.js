/**
 * printHelper.js
 * Generates and triggers high-fidelity academic print layout for examination papers.
 * Supports Classic University Typography, Tabular Grid, custom Marks Formats,
 * and optional Marks Distribution Scheme Table.
 */

export function cleanOptionText(opt) {
  if (!opt) return '';
  return String(opt)
    .replace(/^\(?[A-Da-d]\)?[\.\:\-\)]\s*/, '')
    .replace(/^\([A-Da-d]\)\s*/, '')
    .trim();
}

export function formatQuestionMarks(marks, marksFormat = 'brackets') {
  const m = marks !== undefined && marks !== null ? marks : 2;
  switch (marksFormat) {
    case 'parentheses':
      return `(${m})`;
    case 'full':
      return `[${m} Marks]`;
    case 'label':
      return `Marks: ${m}`;
    case 'brackets':
    default:
      return `[${m}]`;
  }
}

export function formatQuestionNumber(qNum, format = 'Q') {
  const n = String(qNum || '').replace(/^Q\.?\s*/i, '');
  if (format === 'Q_dot') return `Q.${n}.`;
  if (format === 'num_only') return `${n}.`;
  return `Q${n}.`;
}

export function formatQuestionNumberTag(qNum, format = 'Q') {
  const n = String(qNum || '').replace(/^Q\.?\s*/i, '');
  if (format === 'Q_dot') return `Q.${n}`;
  if (format === 'num_only') return `${n}`;
  return `Q${n}`;
}

export function generateExamPaperHtml(paper, options = {}) {
  if (!paper) return '';

  const includeSolutions = Boolean(options.includeSolutions);
  const layout = options.layout || 'standard'; // 'standard' (authentic exam sheet) or 'tabular' (grid matrix)
  const showBloom = options.showBloom !== false; // default true
  const marksFormat = options.marksFormat || 'brackets'; // 'brackets', 'parentheses', 'full', 'label'
  const showMarksTable = Boolean(options.showMarksTable);
  const showOmrSheet = Boolean(options.showOmrSheet);
  const showAnswerKey = Boolean(options.showAnswerKey);
  const paperMode = options.paperMode || 'unified'; // 'unified' (No Part A, continuous Q1, Q2) or 'sections'
  const showPartHeaders = options.showPartHeaders !== undefined ? Boolean(options.showPartHeaders) : (paperMode === 'sections');
  const numberingFormat = options.numberingFormat || 'Q'; // 'Q' -> Q1., Q2. | 'Q_dot' -> Q.1. | 'num_only' -> 1.

  const sections = Array.isArray(paper.sections)
    ? paper.sections
    : (typeof paper.sections_json === 'string' ? JSON.parse(paper.sections_json || '[]') : []);

  const durationHrs = Math.floor((paper.duration_minutes || 180) / 60);
  const durationMins = (paper.duration_minutes || 180) % 60;
  const durStr = `${durationHrs} Hours` + (durationMins ? ` ${durationMins} Mins` : '');

  const totalCalculatedMarks = paper.total_marks || sections.reduce((acc, sec) => {
    return acc + (sec.total_section_marks || (Number(sec.required_count || 0) * Number(sec.marks_per_question || 0)));
  }, 0);

  const instructions = paper.instructions || (
    "1. Answer ALL questions according to instructions in respective sections.\n" +
    "2. Figures to the right indicate full marks.\n" +
    "3. Assume suitable data wherever necessary and state them clearly.\n" +
    "4. Use of non-programmable calculators is permitted."
  );

  const instructionsHtml = instructions
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p style="margin: 2px 0;">${escapeHtml(line.trim())}</p>`)
    .join('');

  // Optional: Formal Marks Scheme / Blueprint Allocation Matrix
  let marksTableHtml = '';
  if (showMarksTable && sections.length > 0) {
    const tableRows = sections.map((sec, i) => {
      const qCount = sec.questions?.length || 0;
      const reqCount = sec.required_count || qCount;
      const mpq = sec.marks_per_question ? formatQuestionMarks(sec.marks_per_question, marksFormat) : 'Variable';
      const secMarks = sec.total_section_marks || (Number(reqCount) * Number(sec.marks_per_question || 0));
      return `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 4px 8px; font-weight: 600; border-right: 1px solid #ddd;">${escapeHtml(sec.title)}</td>
          <td style="padding: 4px 8px; text-align: center; border-right: 1px solid #ddd;">${qCount}</td>
          <td style="padding: 4px 8px; text-align: center; border-right: 1px solid #ddd;">${reqCount}</td>
          <td style="padding: 4px 8px; text-align: center; border-right: 1px solid #ddd; font-family: monospace;">${mpq}</td>
          <td style="padding: 4px 8px; text-align: right; font-weight: bold;">${secMarks} Marks</td>
        </tr>
      `;
    }).join('');

    marksTableHtml = `
      <div style="margin: 12px 0 16px 0; border: 1.5px solid #000; font-family: Arial, sans-serif; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f2f2f2; font-weight: bold; font-size: 9pt; padding: 4px 8px; border-bottom: 1px solid #000; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
          <span>Marks Distribution Scheme &amp; Blueprint Matrix</span>
          <span>Max Marks: ${totalCalculatedMarks}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
          <thead>
            <tr style="background-color: #fafafa; border-bottom: 1px solid #000; font-weight: bold;">
              <th style="padding: 4px 8px; text-align: left; border-right: 1px solid #ddd;">Section / Part</th>
              <th style="padding: 4px 8px; text-align: center; border-right: 1px solid #ddd;">Questions Included</th>
              <th style="padding: 4px 8px; text-align: center; border-right: 1px solid #ddd;">To Answer</th>
              <th style="padding: 4px 8px; text-align: center; border-right: 1px solid #ddd;">Marks / Question</th>
              <th style="padding: 4px 8px; text-align: right;">Total Section Marks</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr style="border-top: 1.5px solid #000; background-color: #f9f9f9; font-weight: bold;">
              <td colspan="4" style="padding: 4px 8px; text-align: right; border-right: 1px solid #ddd; text-transform: uppercase;">Grand Maximum Marks:</td>
              <td style="padding: 4px 8px; text-align: right; font-size: 9pt;">${totalCalculatedMarks} Marks</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  let sectionsHtml = '';

  const isSguMode = layout === 'sgu' ||
    Boolean(paper.institution_name && paper.institution_name.toUpperCase().includes('SANJAY GHODAWAT')) ||
    Boolean(paper.title && paper.title.toUpperCase().includes('SGU'));

  if (isSguMode) {
    // -------------------------------------------------------------
    // SANJAY GHODAWAT UNIVERSITY (SGU) AUTHENTIC EXAMINATION LAYOUT
    // -------------------------------------------------------------
    sections.forEach((sec, sIdx) => {
      const totalSecMarks = sec.total_section_marks || (Number(sec.required_count || 0) * Number(sec.marks_per_question || 0));

      let mainTitle = sec.title || `Q.${sIdx + 1} Answer the following`;
      if (!mainTitle.match(/^Q\.?\s*\d+/i)) {
        mainTitle = `Q.${sIdx + 1} ${mainTitle}`;
      }

      let choiceSubtitle = '';
      if (sec.choice_type && sec.choice_type !== 'Compulsory') {
        choiceSubtitle = sec.choice_type;
      } else if (sec.required_count && sec.questions && sec.required_count < sec.questions.length) {
        choiceSubtitle = `Answer any ${sec.required_count} out of ${sec.questions.length} questions × ${sec.marks_per_question} marks = ${totalSecMarks}`;
      }

      let qItems = '';
      (sec.questions || []).forEach((q, qIdx) => {
        let mcqHtml = '';
        if (q.options && q.options.length > 0) {
          mcqHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; margin-top: 5px; margin-left: 2px; font-family: Arial, sans-serif; font-size: 9.5pt;">
              ${q.options.map((opt, i) => `
                <div><b style="font-family: Arial, sans-serif;">(${String.fromCharCode(97 + i)})</b> ${escapeHtml(cleanOptionText(opt))}</div>
              `).join('')}
            </div>
          `;
        }

        let solHtml = '';
        if (includeSolutions && q.model_answer) {
          solHtml = `
            <div style="margin-top: 6px; padding: 6px 10px; background-color: #f8fafc; border-left: 3px solid #059669; font-family: Arial, sans-serif; font-size: 8.5pt; font-style: italic; color: #1e293b;">
              <b style="color: #065f46; font-style: normal;">Grading Key / Model Answer:</b> ${escapeHtml(q.model_answer)}
            </div>
          `;
        }

        const subqLetter = `(${String.fromCharCode(97 + qIdx)})`;
        const qMarksVal = q.marks || sec.marks_per_question;
        const formattedQMarks = formatQuestionMarks(qMarksVal, marksFormat);

        qItems += `
          <div style="display: flex; align-items: flex-start; margin-bottom: 11px; padding-left: 14px; page-break-inside: avoid; break-inside: avoid; font-family: 'Times New Roman', Times, serif;">
            <div style="min-width: 28px; font-weight: bold; font-size: 11pt; flex-shrink: 0; font-family: Arial, sans-serif; color: #000;">
              ${subqLetter}
            </div>
            <div style="flex: 1; font-size: 11pt; line-height: 1.45; color: #000; padding-right: 16px;">
              <div>${escapeHtml(q.question_text)}</div>
              ${mcqHtml}
              ${solHtml}
            </div>
            <div style="width: 75px; text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; font-family: Arial, sans-serif;">
              <span style="font-weight: bold; font-size: 11pt; color: #000; white-space: nowrap;">${formattedQMarks}</span>
              ${showBloom ? `<span style="font-size: 8pt; color: #555; margin-top: 1px; font-style: italic;">[${escapeHtml(q.blooms_level || 'Understand')}]</span>` : ''}
            </div>
          </div>
        `;
      });

      sectionsHtml += `
        <div style="margin-top: 14px; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">
          <!-- SGU Main Question Header Bar -->
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1.5px solid #000; padding: 4px 0 2px 0; margin-bottom: 10px; font-family: Arial, sans-serif;">
            <div>
              <span style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">${escapeHtml(mainTitle)}</span>
              ${choiceSubtitle ? `<span style="font-size: 9pt; font-style: italic; color: #333; margin-left: 8px;">(${escapeHtml(choiceSubtitle)})</span>` : ''}
            </div>
            <span style="font-size: 11pt; font-weight: bold; font-family: Arial, sans-serif;">[${totalSecMarks}]</span>
          </div>
          <!-- Subquestions -->
          <div>
            ${qItems}
          </div>
        </div>
      `;
    });
  } else if (layout === 'tabular') {
    // -------------------------------------------------------------
    // TABULAR FORMAT (For Matrix / Moderation Checklist)
    // -------------------------------------------------------------
    sections.forEach(sec => {
      const totalSecMarks = sec.total_section_marks || (Number(sec.required_count || 0) * Number(sec.marks_per_question || 0));
      const secSubtitle = sec.marks_per_question
        ? `(Answer ${sec.required_count || 'ALL'} &times; ${sec.marks_per_question} Marks = ${totalSecMarks} Marks)`
        : `(${sec.required_count || (sec.questions?.length || 0)} Questions &bull; Total ${totalSecMarks} Marks)`;

      let qRows = '';
      (sec.questions || []).forEach(q => {
        let mcqHtml = '';
        if (q.options && q.options.length > 0) {
          mcqHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 6px; padding-left: 8px; font-family: Arial, sans-serif; font-size: 9.5pt;">
              ${q.options.map((opt, i) => `
                <div><b>(${String.fromCharCode(97 + i)})</b> ${escapeHtml(cleanOptionText(opt))}</div>
              `).join('')}
            </div>
          `;
        }

        let solHtml = '';
        if (includeSolutions && q.model_answer) {
          solHtml = `
            <div style="margin-top: 6px; padding: 6px; background-color: #f7f9fa; border: 1px dashed #666; font-family: Arial, sans-serif; font-size: 8.5pt; font-style: italic;">
              <b style="color: #065f46; font-style: normal;">Grading Rubric / Answer Key:</b> ${escapeHtml(q.model_answer)}
            </div>
          `;
        }

        const formattedQMarks = formatQuestionMarks(q.marks || sec.marks_per_question, marksFormat);

        qRows += `
          <tr style="page-break-inside: avoid; break-inside: avoid;">
            <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; width: 55px; font-family: Arial, sans-serif;">
              ${formatQuestionNumberTag(q.q_number, numberingFormat)}
            </td>
            <td style="border: 1px solid #333; padding: 6px 10px; vertical-align: top;">
              <div style="font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; line-height: 1.4; color: #000;">
                ${escapeHtml(q.question_text)}
              </div>
              ${mcqHtml}
              ${solHtml}
            </td>
            ${showBloom ? `
              <td style="border: 1px solid #333; padding: 6px; text-align: center; font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: bold; width: 85px; color: #333;">
                [${escapeHtml(q.blooms_level || 'Apply')}]
              </td>
            ` : ''}
            <td style="border: 1px solid #333; padding: 6px; text-align: center; font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; width: 65px; white-space: nowrap;">
              ${formattedQMarks}
            </td>
          </tr>
        `;
      });

      const tabularHeader = showPartHeaders ? `
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 6px; font-family: Arial, sans-serif;">
          <span style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase;">${escapeHtml(sec.title)}</span>
          <span style="font-size: 9.5pt; font-weight: bold;">${secSubtitle}</span>
        </div>
      ` : '';

      sectionsHtml += `
        <div style="margin-top: ${showPartHeaders ? '18px' : '10px'}; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">
          ${tabularHeader}
          <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000;">
            <thead>
              <tr style="background-color: #f5f5f5; font-family: Arial, sans-serif; font-size: 9.5pt; font-weight: bold;">
                <th style="border: 1px solid #333; padding: 6px; width: 55px; text-align: center;">Q.No</th>
                <th style="border: 1px solid #333; padding: 6px 10px; text-align: left;">Question Statement / Problem Description</th>
                ${showBloom ? `<th style="border: 1px solid #333; padding: 6px; width: 85px; text-align: center;">Bloom/CO</th>` : ''}
                <th style="border: 1px solid #333; padding: 6px; width: 65px; text-align: center;">Marks</th>
              </tr>
            </thead>
            <tbody>
              ${qRows}
            </tbody>
          </table>
        </div>
      `;
    });
  } else {
    // -------------------------------------------------------------
    // CLASSIC UNIVERSITY TYPOGRAPHY FORMAT (Default - Authentic Exam Sheet)
    // -------------------------------------------------------------
    sections.forEach(sec => {
      const totalSecMarks = sec.total_section_marks || (Number(sec.required_count || 0) * Number(sec.marks_per_question || 0));
      const secSubtitle = sec.marks_per_question
        ? `Answer ${sec.required_count || 'ALL'} questions (${sec.required_count} &times; ${sec.marks_per_question} = ${totalSecMarks} Marks)`
        : `Answer ${sec.required_count || 'ALL'} questions (Total ${totalSecMarks} Marks)`;

      let qItems = '';
      (sec.questions || []).forEach(q => {
        let mcqHtml = '';
        if (q.options && q.options.length > 0) {
          mcqHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-top: 6px; margin-left: 4px; font-family: Arial, sans-serif; font-size: 9.5pt;">
              ${q.options.map((opt, i) => `
                <div><b style="font-family: Arial, sans-serif;">(${String.fromCharCode(97 + i)})</b> ${escapeHtml(cleanOptionText(opt))}</div>
              `).join('')}
            </div>
          `;
        }

        let solHtml = '';
        if (includeSolutions && q.model_answer) {
          solHtml = `
            <div style="margin-top: 6px; padding: 6px 10px; background-color: #f8fafc; border-left: 3px solid #059669; font-family: Arial, sans-serif; font-size: 8.5pt; font-style: italic; color: #1e293b;">
              <b style="color: #065f46; font-style: normal;">Grading Key / Model Answer:</b> ${escapeHtml(q.model_answer)}
            </div>
          `;
        }

        const formattedQMarks = formatQuestionMarks(q.marks || sec.marks_per_question, marksFormat);

        qItems += `
          <div style="display: flex; align-items: flex-start; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid; font-family: 'Times New Roman', Times, serif;">
            <div style="min-width: 44px; font-weight: bold; font-size: 11pt; flex-shrink: 0; font-family: Arial, sans-serif; color: #000; margin-right: 4px;">
              ${formatQuestionNumber(q.q_number, numberingFormat)}
            </div>
            <div style="flex: 1; font-size: 11pt; line-height: 1.45; color: #000; padding-right: 16px;">
              <div>${escapeHtml(q.question_text)}</div>
              ${mcqHtml}
              ${solHtml}
            </div>
            <div style="width: 85px; text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; font-family: Arial, sans-serif;">
              <span style="font-weight: bold; font-size: 10.5pt; color: #000; white-space: nowrap;">${formattedQMarks}</span>
              ${showBloom ? `<span style="font-size: 8pt; color: #555; margin-top: 2px; font-style: italic;">[${escapeHtml(q.blooms_level || 'Apply')}]</span>` : ''}
            </div>
          </div>
        `;
      });

      const sectionBannerHtml = showPartHeaders ? `
        <!-- Centered Part Header Banner -->
        <div style="text-align: center; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 5px 0; margin-bottom: 14px; font-family: Arial, sans-serif;">
          <div style="font-weight: bold; font-size: 11pt; letter-spacing: 1px; text-transform: uppercase;">
            ${escapeHtml(sec.title)}
          </div>
          <div style="font-size: 9.5pt; font-style: italic; margin-top: 2px; color: #111;">
            (${secSubtitle})
          </div>
        </div>
      ` : '';

      sectionsHtml += `
        <div style="margin-top: ${showPartHeaders ? '20px' : '10px'}; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">
          ${sectionBannerHtml}
          <!-- Question Items List -->
          <div style="padding: 0 4px;">
            ${qItems}
          </div>
        </div>
      `;
    });
  }

  // Collect all questions and MCQ questions for OMR & Answer Key
  const allPaperQuestions = [];
  sections.forEach(sec => {
    (sec.questions || []).forEach(q => {
      allPaperQuestions.push({
        ...q,
        sectionTitle: sec.title,
        marksPerQ: q.marks || sec.marks_per_question
      });
    });
  });

  const mcqQuestions = allPaperQuestions.filter(q => 
    (q.options && q.options.length > 0) || 
    (q.question_type && q.question_type.toLowerCase().includes('mcq'))
  );

  const targetOmrQuestions = mcqQuestions.length > 0 ? mcqQuestions : allPaperQuestions;

  // Student OMR Bubble Sheet for Internal Marks Evaluation
  let omrSheetHtml = '';
  if (showOmrSheet && targetOmrQuestions.length > 0) {
    const totalQ = targetOmrQuestions.length;
    const colCount = totalQ <= 15 ? 2 : (totalQ <= 30 ? 3 : 4);
    const rowsPerCol = Math.ceil(totalQ / colCount);

    let columnsHtml = '';
    for (let c = 0; c < colCount; c++) {
      let colItems = '';
      for (let r = 0; r < rowsPerCol; r++) {
        const qIndex = c * rowsPerCol + r;
        if (qIndex < totalQ) {
          const q = targetOmrQuestions[qIndex];
          const qNumStr = String(q.q_number || (qIndex + 1)).padStart(2, '0');
          colItems += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 3px 6px; border-bottom: 1px dotted #ccc; font-family: Arial, sans-serif; font-size: 8.5pt;">
              <span style="font-weight: bold; width: 34px;">Q.${qNumStr}</span>
              <div style="display: flex; gap: 4px;">
                <span style="display: inline-block; width: 17px; height: 17px; line-height: 15px; border: 1.5px solid #000; border-radius: 50%; text-align: center; font-size: 7.5pt; font-weight: bold;">A</span>
                <span style="display: inline-block; width: 17px; height: 17px; line-height: 15px; border: 1.5px solid #000; border-radius: 50%; text-align: center; font-size: 7.5pt; font-weight: bold;">B</span>
                <span style="display: inline-block; width: 17px; height: 17px; line-height: 15px; border: 1.5px solid #000; border-radius: 50%; text-align: center; font-size: 7.5pt; font-weight: bold;">C</span>
                <span style="display: inline-block; width: 17px; height: 17px; line-height: 15px; border: 1.5px solid #000; border-radius: 50%; text-align: center; font-size: 7.5pt; font-weight: bold;">D</span>
              </div>
            </div>
          `;
        }
      }
      columnsHtml += `
        <div style="flex: 1; border-right: ${c < colCount - 1 ? '1px solid #000' : 'none'}; padding: 0 4px;">
          ${colItems}
        </div>
      `;
    }

    omrSheetHtml = `
      <div style="margin-top: 24px; border: 2px solid #000; font-family: Arial, sans-serif; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 6px 10px; border-bottom: 1.5px solid #000; text-align: center;">
          <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
            STUDENT OMR RESPONSE SHEET &bull; CONTINUOUS INTERNAL EVALUATION (CIE)
          </div>
          <div style="font-size: 8pt; color: #444; margin-top: 1px;">
            Darken the bubble completely with blue/black pen: <span style="display:inline-block; width:11px; height:11px; background:#000; border-radius:50%; vertical-align:middle;"></span> Correct &nbsp;|&nbsp; <span>&#10005;</span> Incorrect
          </div>
        </div>

        <div style="padding: 6px 10px; border-bottom: 1px solid #000; font-size: 8.5pt; display: flex; justify-content: space-between; background: #fff;">
          <div><b>Candidate Name:</b> ______________________________</div>
          <div><b>Roll / Reg No:</b> ___________________</div>
          <div><b>Student Sign:</b> ____________</div>
        </div>

        <div style="display: flex; padding: 6px 4px; background: #fff;">
          ${columnsHtml}
        </div>

        <div style="border-top: 1.5px solid #000; background-color: #fafafa; padding: 6px 10px; font-size: 8.5pt; display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
          <div>Attempted: [ &nbsp; &nbsp; ]</div>
          <div>Correct: [ &nbsp; &nbsp; ]</div>
          <div>Wrong: [ &nbsp; &nbsp; ]</div>
          <div style="font-size: 9pt; color: #000; border: 1px solid #000; padding: 2px 8px; background: #fff;">
            Internal Marks Awarded: &nbsp; &nbsp; &nbsp; &nbsp; / ${totalCalculatedMarks}
          </div>
          <div>Evaluator Sign: _________________</div>
        </div>
      </div>
    `;
  }

  // Master Answer Key / Evaluator Solutions Matrix
  let answerKeyHtml = '';
  if (showAnswerKey && allPaperQuestions.length > 0) {
    const keyRows = allPaperQuestions.map(q => {
      let keyVal = q.correct_option || '';
      let ansText = q.model_answer || '';
      if (!keyVal && ansText) {
        const match = ansText.match(/Option\s*([A-D])/i);
        if (match) keyVal = match[1].toUpperCase();
      }
      return `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 4px 6px; text-align: center; font-weight: bold; border-right: 1px solid #ddd; width: 45px;">${q.q_number}</td>
          <td style="padding: 4px 6px; text-align: center; font-weight: bold; border-right: 1px solid #ddd; background: #f8fafc; font-size: 9.5pt; width: 55px;">${keyVal || '-'}</td>
          <td style="padding: 4px 8px; border-right: 1px solid #ddd; font-size: 8.5pt;">${escapeHtml(ansText || 'Refer to text')}</td>
          <td style="padding: 4px 8px; font-size: 8pt; color: #444; width: 150px;">Unit ${q.unit_number || 1}: ${escapeHtml(q.topic || '')}</td>
        </tr>
      `;
    }).join('');

    answerKeyHtml = `
      <div style="margin-top: 24px; border: 2px solid #000; font-family: Arial, sans-serif; page-break-inside: avoid; break-inside: avoid;">
        <div style="background-color: #0f172a; color: #fff; padding: 6px 10px; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
          <span>Master Answer Key &bull; Continuous Internal Evaluation (CIE)</span>
          <span>Official Evaluator Copy</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #000; font-weight: bold;">
              <th style="padding: 5px 6px; width: 45px; text-align: center; border-right: 1px solid #ddd;">Q.No</th>
              <th style="padding: 5px 6px; width: 55px; text-align: center; border-right: 1px solid #ddd;">Key</th>
              <th style="padding: 5px 8px; text-align: left; border-right: 1px solid #ddd;">Model Answer / Description</th>
              <th style="padding: 5px 8px; text-align: left; width: 150px;">Curriculum Grounding</th>
            </tr>
          </thead>
          <tbody>
            ${keyRows}
          </tbody>
        </table>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(paper.title || 'Question Paper')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.35;
    }
    .paper-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 6px 0;
    }
  </style>
</head>
<body>
  <div class="paper-container">
    ${isSguMode ? `
      <!-- 1. University Header (SGU Format) -->
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; font-family: Arial, sans-serif;">
        <h1 style="margin: 0; font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
          ${escapeHtml(paper.institution_name || "SANJAY GHODAWAT UNIVERSITY, KOLHAPUR")}
        </h1>
        <h2 style="margin: 3px 0; font-size: 10.5pt; font-weight: bold; color: #1e293b;">
          ${escapeHtml(paper.department || "School of Computer Science and Engineering")}
        </h2>
        <h3 style="margin: 3px 0 2px 0; font-size: 11pt; font-weight: bold; text-transform: uppercase;">
          ${escapeHtml(paper.exam_name || paper.title || "END SEMESTER EXAMINATION")}
        </h3>
      </div>

      <!-- 2. SGU Academic Metadata Grid -->
      <div style="border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 6px 4px; margin-bottom: 8px; font-family: Arial, sans-serif; font-size: 9.5pt;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <div><b>Subject:</b> <span>${escapeHtml(paper.course_name || 'Computer Science')}</span></div>
          <div><b>Semester:</b> <span>${escapeHtml(paper.semester || 'VI')}</span></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <div><b>Subject Code:</b> <span style="font-family: monospace; font-weight: bold;">${escapeHtml(paper.course_code || 'CSE601')}</span></div>
          <div><b>Maximum Marks:</b> <b>${totalCalculatedMarks}</b></div>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <div><b>Examination Duration:</b> <span>${durStr}</span></div>
          <div><b>Academic Year:</b> <span>${escapeHtml(paper.academic_year || '2026–27')}</span></div>
        </div>
      </div>

      <!-- SGU Proposed Demo Format Notice -->
      <div style="background-color: #fffbeb; border: 1px dashed #d97706; padding: 5px 8px; margin-bottom: 10px; font-family: Arial, sans-serif; font-size: 8pt; color: #92400e; text-align: center;">
        <b>Notice:</b> This is a proposed demo format, not a verified official SGU examination pattern. Confirm the approved duration and marking scheme with your department.
      </div>

      <!-- 3. General Instructions -->
      <div style="font-family: Arial, sans-serif; font-size: 9pt; border-left: 2.5px solid #000; padding-left: 8px; margin-bottom: 12px; color: #222;">
        <div style="font-weight: bold; text-transform: uppercase; font-size: 9pt; margin-bottom: 2px;">Instructions:</div>
        ${instructionsHtml}
      </div>
    ` : `
      <!-- 1. University Header -->
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; font-family: Arial, sans-serif;">
        <h1 style="margin: 0; font-size: 13.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
          ${escapeHtml(paper.institution_name || "NATIONAL INSTITUTE OF TECHNOLOGY & SCIENCE")}
        </h1>
        <h2 style="margin: 2px 0; font-size: 10pt; font-weight: 600; color: #222;">
          ${escapeHtml(paper.department || "Department of Computer Science & Engineering")}
        </h2>
        <h3 style="margin: 3px 0 2px 0; font-size: 11pt; font-weight: bold;">
          ${escapeHtml(paper.title || paper.exam_name || "End Semester Theory Examination")}
        </h3>
        ${paper.academic_year ? `<div style="font-size: 9pt; color: #444;">Academic Session: ${escapeHtml(paper.academic_year)}</div>` : ''}
      </div>

      <!-- 2. Clean Academic Metadata Bar -->
      <div style="border-top: 1px solid #000; border-bottom: 1.5px solid #000; padding: 6px 2px; margin-bottom: 10px; font-family: Arial, sans-serif; font-size: 9pt;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <div><b>Course Code:</b> <span style="font-family: monospace; font-weight: bold;">${escapeHtml(paper.course_code || 'CS301')}</span></div>
          <div><b>Course Title:</b> <span>${escapeHtml(paper.course_name || 'Data Structures and Algorithms')}</span></div>
          <div><b>Semester:</b> <span>${escapeHtml(paper.semester || 'Semester V')}</span></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #888; padding-top: 4px;">
          <div><b>Duration:</b> <span>${durStr}</span></div>
          <div><b>Maximum Marks:</b> <b>${totalCalculatedMarks} Marks</b></div>
          <div><b>Roll No:</b> <span style="font-family: monospace; border: 1px solid #444; padding: 2px 10px; background: #fff;">[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</span></div>
        </div>
      </div>

      <!-- 3. General Instructions -->
      <div style="font-family: Arial, sans-serif; font-size: 9pt; border-left: 2.5px solid #000; padding-left: 8px; margin-bottom: 12px; color: #222;">
        <div style="font-weight: bold; text-transform: uppercase; font-size: 9pt; margin-bottom: 2px;">General Instructions:</div>
        ${instructionsHtml}
      </div>
    `}

    <!-- Optional: Marks Distribution Scheme Table -->
    ${marksTableHtml}

    <!-- 4. Sections & Questions -->
    ${sectionsHtml}

    <!-- Optional: Student OMR Bubble Response Sheet -->
    ${omrSheetHtml}

    <!-- Optional: Master Answer Key / Solutions Matrix -->
    ${answerKeyHtml}

    ${isSguMode ? `
      <!-- SGU Total Marks Banner -->
      <div style="margin-top: 20px; text-align: center; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0; font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; letter-spacing: 1px;">
        TOTAL: ${totalCalculatedMarks} MARKS
      </div>
    ` : ''}

    <!-- 5. End of Paper Notice -->
    <div style="margin-top: 16px; text-align: center; border-top: 1px solid #000; padding-top: 6px; font-family: Arial, sans-serif; font-size: 8pt; font-weight: bold; letter-spacing: 1px; color: #444;">
      ********** END OF QUESTION PAPER **********
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Executes a clean isolated print job via a hidden iframe.
 * Avoids any CSS collisions, scroll cutoffs, or webpage clutter.
 */
export function printExamPaper(paper, options = {}) {
  const html = generateExamPaperHtml(paper, options);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  try {
    const frameDoc = iframe.contentWindow || iframe.contentDocument;
    const doc = frameDoc.document || frameDoc;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        (iframe.contentWindow || iframe).focus();
        (iframe.contentWindow || iframe).print();
      } catch (err) {
        console.error('Iframe print error, falling back to window.print():', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 400);
  } catch (err) {
    console.error('Print initialization error:', err);
    window.print();
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  }
}
