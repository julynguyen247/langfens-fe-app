import {
  ExamGradeSummary,
  InternalDeliveryExam,
  InternalDeliveryQuestion,
  QuestionGradeResult,
  QuestionType,
  UserAnswerValue,
} from "./types";

export function calculateIeltsBand(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;

  // Normalized to 40 questions scale
  const normalized40 = Math.round((correctCount / totalQuestions) * 40);

  if (normalized40 >= 39) return 9.0;
  if (normalized40 >= 37) return 8.5;
  if (normalized40 >= 35) return 8.0;
  if (normalized40 >= 32) return 7.5;
  if (normalized40 >= 30) return 7.0;
  if (normalized40 >= 26) return 6.5;
  if (normalized40 >= 23) return 6.0;
  if (normalized40 >= 18) return 5.5;
  if (normalized40 >= 16) return 5.0;
  if (normalized40 >= 13) return 4.5;
  if (normalized40 >= 10) return 4.0;
  if (normalized40 >= 7) return 3.5;
  if (normalized40 >= 4) return 3.0;
  return 2.5;
}

export function gradeSingleQuestion(
  q: InternalDeliveryQuestion,
  userAnswer?: UserAnswerValue
): QuestionGradeResult {
  const t = q.type;
  const qIdx = q.displayIdx ?? q.idx;

  // 1. Single Choice, TFNG, YNNG, Single Image
  if (
    t === QuestionType.MultipleChoiceSingle ||
    t === QuestionType.MultipleChoiceSingleImage ||
    t === QuestionType.TrueFalseNotGiven ||
    t === QuestionType.YesNoNotGiven
  ) {
    const correctOpt = q.options?.find((o) => o.isCorrect);
    const correctVal = correctOpt?.contentMd?.trim() || "";
    const correctId = correctOpt?.id || "";

    const userStr = typeof userAnswer === "string" ? userAnswer.trim() : "";
    const isCorrect = Boolean(
      userStr &&
        (userStr === correctId ||
          userStr.toLowerCase() === correctVal.toLowerCase() ||
          (correctOpt && userStr === String(correctOpt.idx)))
    );

    return {
      questionIdx: qIdx,
      isCorrect,
      score: isCorrect ? 1 : 0,
      maxScore: 1,
      userAnswer,
      correctAnswerText: correctVal || "N/A",
    };
  }

  // 2. Multiple Choice Multiple
  if (t === QuestionType.MultipleChoiceMultiple) {
    const correctOpts = q.options?.filter((o) => o.isCorrect) || [];
    const correctIds = new Set(correctOpts.map((o) => o.id));
    const correctTexts = correctOpts.map((o) => o.contentMd.trim());

    const userArr = Array.isArray(userAnswer)
      ? userAnswer.map((s) => String(s).trim())
      : typeof userAnswer === "string"
      ? [userAnswer.trim()]
      : [];

    let matched = 0;
    for (const val of userArr) {
      if (
        correctIds.has(val) ||
        correctTexts.some((c) => c.toLowerCase() === val.toLowerCase())
      ) {
        matched++;
      }
    }

    const isAllCorrect = matched === correctOpts.length && userArr.length === correctOpts.length;
    const score = correctOpts.length > 0 ? matched / correctOpts.length : 0;

    return {
      questionIdx: qIdx,
      isCorrect: isAllCorrect,
      score: Math.round(score * 100) / 100,
      maxScore: 1,
      userAnswer,
      correctAnswerText: correctTexts.join(", ") || "N/A",
    };
  }

  // 3. Completion Family (BlankAcceptTexts & BlankAcceptRegex)
  if (
    t === QuestionType.SummaryCompletion ||
    t === QuestionType.TableCompletion ||
    t === QuestionType.NoteCompletion ||
    t === QuestionType.FormCompletion ||
    t === QuestionType.SentenceCompletion ||
    t === QuestionType.DiagramLabel ||
    t === QuestionType.MapLabel
  ) {
    const texts = q.blankAcceptTexts || {};
    const regex = q.blankAcceptRegex || {};
    const blankKeys = Object.keys(texts).length > 0 ? Object.keys(texts) : ["1"];

    let correctBlanks = 0;
    const correctParts: string[] = [];

    const userDict: Record<string, string> =
      userAnswer && typeof userAnswer === "object" && !Array.isArray(userAnswer)
        ? (userAnswer as Record<string, string>)
        : typeof userAnswer === "string"
        ? { "1": userAnswer }
        : {};

    for (const k of blankKeys) {
      const acceptedList = texts[k] || [];
      const regexList = regex[k] || [];
      const userVal = (userDict[k] || "").trim().toLowerCase();

      correctParts.push(`[${k}]: ${acceptedList.join(" | ")}`);

      let blankOk = false;
      if (userVal) {
        if (acceptedList.some((acc) => acc && acc.trim().toLowerCase() === userVal)) {
          blankOk = true;
        } else if (regexList.length > 0) {
          for (const regStr of regexList) {
            try {
              if (regStr && new RegExp(regStr, "i").test(userVal)) {
                blankOk = true;
                break;
              }
            } catch {
              // Ignore regex parse errors
            }
          }
        }
      }

      if (blankOk) {
        correctBlanks++;
      }
    }

    const totalBlanks = Math.max(1, blankKeys.length);
    const isCorrect = correctBlanks === totalBlanks;

    return {
      questionIdx: qIdx,
      isCorrect,
      score: Math.round((correctBlanks / totalBlanks) * 100) / 100,
      maxScore: 1,
      userAnswer,
      correctAnswerText: correctParts.join(" ; "),
    };
  }

  // 4. Matching Family (MatchPairs)
  if (
    t === QuestionType.MatchingHeading ||
    t === QuestionType.MatchingInformation ||
    t === QuestionType.MatchingFeatures ||
    t === QuestionType.MatchingEndings ||
    t === QuestionType.Classification
  ) {
    const pairs = q.matchPairs || {};
    const promptKeys = Object.keys(pairs);

    let correctPairs = 0;
    const correctDisplay: string[] = [];

    const userDict: Record<string, string> =
      userAnswer && typeof userAnswer === "object" && !Array.isArray(userAnswer)
        ? (userAnswer as Record<string, string>)
        : {};

    for (const pKey of promptKeys) {
      const val = pairs[pKey] || [];
      const gradingKey = (val[0] || "").trim().toLowerCase();
      const displayLabel = val[1] || val[0] || "";
      correctDisplay.push(`${pKey} → ${displayLabel}`);

      const userChoice = (userDict[pKey] || "").trim().toLowerCase();
      if (userChoice && userChoice === gradingKey) {
        correctPairs++;
      }
    }

    const totalPairs = Math.max(1, promptKeys.length);
    const isCorrect = correctPairs === totalPairs;

    return {
      questionIdx: qIdx,
      isCorrect,
      score: Math.round((correctPairs / totalPairs) * 100) / 100,
      maxScore: 1,
      userAnswer,
      correctAnswerText: correctDisplay.join(" ; "),
    };
  }

  // 5. Short Answer
  if (t === QuestionType.ShortAnswer) {
    const acceptedTexts = q.shortAnswerAcceptTexts || [];
    const acceptedRegex = q.shortAnswerAcceptRegex || [];
    const userVal = typeof userAnswer === "string" ? userAnswer.trim().toLowerCase() : "";

    let isCorrect = false;
    if (userVal) {
      if (acceptedTexts.some((acc) => acc.trim().toLowerCase() === userVal)) {
        isCorrect = true;
      } else {
        for (const reg of acceptedRegex) {
          try {
            if (reg && new RegExp(reg, "i").test(userVal)) {
              isCorrect = true;
              break;
            }
          } catch {
            // ignore
          }
        }
      }
    }

    return {
      questionIdx: qIdx,
      isCorrect,
      score: isCorrect ? 1 : 0,
      maxScore: 1,
      userAnswer,
      correctAnswerText: acceptedTexts.join(" | ") || "N/A",
    };
  }

  // 6. Flow Chart
  if (t === QuestionType.FlowChart || t === QuestionType.FlowChartCompletion) {
    const expected = (q.orderCorrects || []).map((k) => k.trim().toLowerCase());
    const userArr = Array.isArray(userAnswer)
      ? userAnswer.map((k) => String(k).trim().toLowerCase())
      : [];

    let isCorrect = false;
    if (expected.length > 0 && expected.length === userArr.length) {
      isCorrect = expected.every((val, idx) => val === userArr[idx]);
    }

    return {
      questionIdx: qIdx,
      isCorrect,
      score: isCorrect ? 1 : 0,
      maxScore: 1,
      userAnswer,
      correctAnswerText: expected.map((k) => k.replace(/-/g, " ")).join(" → "),
    };
  }

  // Default fallback
  return {
    questionIdx: qIdx,
    isCorrect: false,
    score: 0,
    maxScore: 1,
    userAnswer,
    correctAnswerText: "Answer key not automated",
  };
}

export function gradeExamPaper(
  exam: InternalDeliveryExam,
  answers: Record<number, UserAnswerValue>
): ExamGradeSummary {
  const allQuestions: InternalDeliveryQuestion[] = [];
  for (const sec of exam.sections || []) {
    for (const q of sec.questions || []) {
      allQuestions.push(q);
    }
    for (const grp of sec.questionGroups || []) {
      for (const q of grp.questions || []) {
        if (
          !allQuestions.some((x) =>
            x.id ? x.id === q.id : (x.displayIdx ?? x.idx) === (q.displayIdx ?? q.idx)
          )
        ) {
          allQuestions.push(q);
        }
      }
    }
  }

  allQuestions.sort((a, b) => (a.displayIdx ?? a.idx) - (b.displayIdx ?? b.idx));

  const resultsByQuestion: Record<number, QuestionGradeResult> = {};
  let totalScore = 0;
  let maxScore = 0;

  for (const q of allQuestions) {
    const qIndex = q.displayIdx ?? q.idx;
    const userAns = answers[qIndex];
    const res = gradeSingleQuestion(q, userAns);
    resultsByQuestion[qIndex] = res;
    totalScore += res.score;
    maxScore += res.maxScore;
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const estimatedBand = calculateIeltsBand(Math.round(totalScore), maxScore);

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    maxScore,
    percentage,
    estimatedBand,
    resultsByQuestion,
  };
}
