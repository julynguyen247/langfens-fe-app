import type { AttemptAnswerItem, InternalDeliveryQuestion, UserAnswerValue } from "./types";
import { decodeAnswer } from "./contract";

/** Compatibility parser; display labels never override the persisted wire answer. */
export function parseUserAnswer(answer?: AttemptAnswerItem, question?: InternalDeliveryQuestion): UserAnswerValue {
  return decodeAnswer(answer, question);
}
