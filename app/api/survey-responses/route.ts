import { NextResponse } from "next/server";

import surveyDefinitionJson from "@/data/survey.json";
import { saveSurveyResponse } from "@/lib/survey-storage";
import type { SurveyAnswer, SurveyAnswers, SurveyDefinition, SurveyQuestion } from "@/types/survey";

export const runtime = "nodejs";

const surveyDefinition = surveyDefinitionJson as SurveyDefinition;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAnswer(
  question: SurveyQuestion,
  value: unknown,
):
  | { status: "valid"; answer: SurveyAnswer }
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "skipped" } {
  switch (question.type) {
    case "text":
    case "textarea": {
      if (value === undefined || value === null) {
        return question.required === false ? { status: "skipped" } : { status: "missing" };
      }

      if (typeof value !== "string") {
        return { status: "invalid" };
      }

      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return question.required === false ? { status: "skipped" } : { status: "missing" };
      }

      return { status: "valid", answer: trimmed };
    }

    case "single_choice": {
      if (value === undefined || value === null) {
        return question.required === false ? { status: "skipped" } : { status: "missing" };
      }

      if (typeof value !== "string") {
        return { status: "invalid" };
      }

      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return question.required === false ? { status: "skipped" } : { status: "missing" };
      }

      if (!question.options.includes(trimmed)) {
        return { status: "invalid" };
      }

      return { status: "valid", answer: trimmed };
    }

    case "multi_choice": {
      if (value === undefined || value === null) {
        return question.required === false ? { status: "skipped" } : { status: "missing" };
      }

      if (!Array.isArray(value)) {
        return { status: "invalid" };
      }

      if (!value.every((item) => typeof item === "string")) {
        return { status: "invalid" };
      }

      const normalizedValues = [...new Set(value.map((item) => item.trim()).filter(Boolean))];
      if (normalizedValues.length === 0) {
        return question.required === false ? { status: "skipped" } : { status: "missing" };
      }

      const hasInvalidOption = normalizedValues.some((item) => !question.options.includes(item));
      if (hasInvalidOption) {
        return { status: "invalid" };
      }

      return { status: "valid", answer: normalizedValues };
    }

    case "rating": {
      if (value === undefined || value === null) {
        return question.required === false ? { status: "skipped" } : { status: "missing" };
      }

      if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
        return { status: "invalid" };
      }

      const min = question.min ?? 1;
      const max = question.max ?? 5;
      if (value < min || value > max) {
        return { status: "invalid" };
      }

      return { status: "valid", answer: value };
    }

    default:
      return { status: "invalid" };
  }
}

function validateAnswers(rawAnswers: Record<string, unknown>) {
  const missingQuestionIds: string[] = [];
  const invalidQuestionIds: string[] = [];
  const normalizedAnswers: SurveyAnswers = {};

  for (const question of surveyDefinition.questions) {
    const result = normalizeAnswer(question, rawAnswers[question.id]);

    if (result.status === "missing") {
      missingQuestionIds.push(question.id);
      continue;
    }

    if (result.status === "invalid") {
      invalidQuestionIds.push(question.id);
      continue;
    }

    if (result.status === "skipped") {
      continue;
    }

    normalizedAnswers[question.id] = result.answer;
  }

  return {
    normalizedAnswers,
    missingQuestionIds,
    invalidQuestionIds,
  };
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        email?: unknown;
        answers?: unknown;
      }
    | null;

  if (!payload || typeof payload.email !== "string" || !isRecord(payload.answers)) {
    return NextResponse.json(
      { error: "Invalid request payload. Expected email and answers." },
      { status: 400 },
    );
  }

  const email = payload.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const { normalizedAnswers, missingQuestionIds, invalidQuestionIds } = validateAnswers(
    payload.answers,
  );

  if (missingQuestionIds.length > 0) {
    return NextResponse.json(
      {
        error: "Please answer every question before submitting.",
        missingQuestionIds,
      },
      { status: 400 },
    );
  }

  if (invalidQuestionIds.length > 0) {
    return NextResponse.json(
      {
        error: "One or more answers are invalid. Please review and submit again.",
        invalidQuestionIds,
      },
      { status: 400 },
    );
  }

  try {
    const createdResponse = await saveSurveyResponse({
      surveyId: surveyDefinition.id,
      email,
      answers: normalizedAnswers,
    });

    return NextResponse.json(createdResponse, { status: 201 });
  } catch (error) {
    console.error("Failed to save survey response:", error);

    return NextResponse.json(
      { error: "Unable to save survey response right now. Please try again." },
      { status: 500 },
    );
  }
}
