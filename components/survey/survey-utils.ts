import type { SurveyQuestion } from "@/types/survey";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isAnswered(question: SurveyQuestion, value: unknown): boolean {
  if (question.required === false) {
    return true;
  }

  switch (question.type) {
    case "text":
    case "textarea":
    case "single_choice":
      return typeof value === "string" && value.trim().length > 0;
    case "multi_choice":
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((item) => typeof item === "string" && item.trim().length > 0)
      );
    case "rating":
      return typeof value === "number" && Number.isFinite(value);
    default:
      return false;
  }
}
