import {
  ExamGradeSummary,
  InternalDeliveryExam,
  InternalDeliverySection,
  InternalDeliveryQuestionGroup,
  InternalDeliveryQuestion,
  InternalDeliveryOption,
  QuestionGradeResult,
  QuestionType,
  UserAnswerValue,
} from "@/components/exam-v3/types";

function calculateIeltsBand(rawScore: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  const ratio = rawScore / maxScore;

  if (ratio >= 39 / 40) return 9.0;
  if (ratio >= 37 / 40) return 8.5;
  if (ratio >= 35 / 40) return 8.0;
  if (ratio >= 33 / 40) return 7.5;
  if (ratio >= 30 / 40) return 7.0;
  if (ratio >= 27 / 40) return 6.5;
  if (ratio >= 23 / 40) return 6.0;
  if (ratio >= 19 / 40) return 5.5;
  if (ratio >= 15 / 40) return 5.0;
  if (ratio >= 13 / 40) return 4.5;
  if (ratio >= 10 / 40) return 4.0;
  if (ratio >= 8 / 40) return 3.5;
  if (ratio >= 6 / 40) return 3.0;
  return 2.5;
}

export function gradeExamPaper(
  exam: InternalDeliveryExam,
  answers: Record<number, UserAnswerValue>
): ExamGradeSummary {
  const resultsByQuestion: Record<number, QuestionGradeResult> = {};
  let totalScore = 0;
  let maxScore = 0;

  const allQuestions: InternalDeliveryQuestion[] = (exam.sections || []).flatMap((sec: InternalDeliverySection) => [
    ...(sec.questions || []),
    ...((sec.questionGroups || []).flatMap((g: InternalDeliveryQuestionGroup) => g.questions || [])),
  ]);

  for (const q of allQuestions) {
    const qIndex = q.displayIdx ?? q.idx;
    const userVal = answers[qIndex];
    maxScore += 1;

    let isCorrect = false;
    let correctAnswerText = "See answer key";

    const t = q.type;

    if (
      t === QuestionType.MultipleChoiceSingle ||
      t === QuestionType.MultipleChoiceSingleImage
    ) {
      const correctOpt = (q.options || []).find((o: InternalDeliveryOption) => Boolean(o.isCorrect));
      if (correctOpt) {
        correctAnswerText = correctOpt.contentMd;
        const optId = correctOpt.id || String(correctOpt.idx);
        if (typeof userVal === "string" && userVal === optId) {
          isCorrect = true;
        }
      }
    } else if (t === QuestionType.MultipleChoiceMultiple) {
      const correctIds = (q.options || []).filter((o: InternalDeliveryOption) => Boolean(o.isCorrect)).map((o: InternalDeliveryOption) => o.id || String(o.idx));
      correctAnswerText = (q.options || []).filter((o: InternalDeliveryOption) => Boolean(o.isCorrect)).map((o: InternalDeliveryOption) => o.contentMd).join(", ");
      if (Array.isArray(userVal)) {
        const userSet: Record<string, boolean> = {};
        for (const u of userVal) userSet[u] = true;
        if (correctIds.length > 0 && correctIds.every((id: string) => userSet[id]) && userVal.length === correctIds.length) {
          isCorrect = true;
        }
      }
    } else if (
      t === QuestionType.TrueFalseNotGiven ||
      t === QuestionType.YesNoNotGiven
    ) {
      const correctOpt = (q.options || []).find((o: InternalDeliveryOption) => Boolean(o.isCorrect));
      if (correctOpt) {
        correctAnswerText = correctOpt.contentMd;
        if (
          typeof userVal === "string" &&
          userVal.trim().toUpperCase() === correctOpt.contentMd.trim().toUpperCase()
        ) {
          isCorrect = true;
        }
      }
    } else if (
      t === QuestionType.MatchingHeading ||
      t === QuestionType.MatchingInformation ||
      t === QuestionType.MatchingFeatures ||
      t === QuestionType.MatchingEndings ||
      t === QuestionType.Classification
    ) {
      const pairs = q.matchPairs || {};
      const promptKeys = Object.keys(pairs);
      if (promptKeys.length > 0 && typeof userVal === "object" && !Array.isArray(userVal) && userVal !== null) {
        let allPairsMatch = true;
        for (const pKey of promptKeys) {
          const target = pairs[pKey];
          const expected = (target?.[0] || "").toLowerCase().trim();
          const userChoice = (userVal[pKey] || "").toLowerCase().trim();
          if (!userChoice || userChoice !== expected) {
            allPairsMatch = false;
            break;
          }
        }
        isCorrect = allPairsMatch;
      }
      correctAnswerText = Object.entries(pairs).map(([k, v]) => `[${k}] -> [${v?.[0] || ""}]`).join(", ");
    } else if (
      t === QuestionType.SummaryCompletion ||
      t === QuestionType.TableCompletion ||
      t === QuestionType.NoteCompletion ||
      t === QuestionType.FormCompletion ||
      t === QuestionType.SentenceCompletion ||
      t === QuestionType.DiagramLabel ||
      t === QuestionType.MapLabel ||
      t === QuestionType.FlowChartCompletion
    ) {
      const blanks = q.blankAcceptTexts || {};
      const blankKeys = Object.keys(blanks).length > 0 ? Object.keys(blanks) : ["1"];

      let allBlanksMatch = true;
      const userDict: Record<string, string> =
        typeof userVal === "object" && !Array.isArray(userVal) && userVal !== null
          ? (userVal as Record<string, string>)
          : typeof userVal === "string"
          ? { "1": userVal }
          : {};

      for (const bKey of blankKeys) {
        const userText = (userDict[bKey] || "").trim().toLowerCase();
        const accepted = (blanks[bKey] || []).filter((x): x is string => Boolean(x)).map((x: string) => x.trim().toLowerCase());
        if (!userText || !accepted.includes(userText)) {
          allBlanksMatch = false;
          break;
        }
      }
      isCorrect = allBlanksMatch;
      correctAnswerText = Object.entries(blanks).map(([k, v]) => `[${k}] ${(v || []).join("/")}`).join("; ");
    } else if (t === QuestionType.ShortAnswer) {
      const accepted = (q.shortAnswerAcceptTexts || []).filter((x): x is string => Boolean(x)).map((x: string) => x.trim().toLowerCase());
      const userText = typeof userVal === "string" ? userVal.trim().toLowerCase() : "";
      if (userText && accepted.includes(userText)) {
        isCorrect = true;
      }
      correctAnswerText = accepted.join(" | ");
    } else if (t === QuestionType.FlowChart) {
      const corrects = (q.orderCorrects || []).filter((x): x is string => Boolean(x));
      const userList: string[] = Array.isArray(userVal) ? userVal : [];
      if (corrects.length > 0 && corrects.length === userList.length) {
        let orderMatches = true;
        for (let i = 0; i < corrects.length; i++) {
          if (corrects[i].trim().toLowerCase() !== (userList[i] || "").trim().toLowerCase()) {
            orderMatches = false;
            break;
          }
        }
        isCorrect = orderMatches;
      }
      correctAnswerText = corrects.join(" -> ");
    }

    const score = isCorrect ? 1 : 0;
    totalScore += score;

    resultsByQuestion[qIndex] = {
      questionIdx: qIndex,
      isCorrect,
      score,
      maxScore: 1,
      userAnswer: userVal,
      correctAnswerText,
    };
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const estimatedBand = calculateIeltsBand(totalScore, maxScore);

  return {
    totalScore,
    maxScore,
    percentage,
    estimatedBand,
    resultsByQuestion,
  };
}
