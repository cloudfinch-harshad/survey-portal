"use client";

import { useMemo, useState, type FormEvent } from "react";

import { SurveyCompleteView } from "@/components/survey/survey-complete-view";
import { SurveyEmptyView } from "@/components/survey/survey-empty-view";
import { SurveyIntroView } from "@/components/survey/survey-intro-view";
import { SurveyQuestionInput } from "@/components/survey/survey-question-input";
import { SurveyQuestionView } from "@/components/survey/survey-question-view";
import { EMAIL_REGEX, isAnswered } from "@/components/survey/survey-utils";
import type { StorageMode } from "@/components/survey/types";
import type { SurveyAnswers, SurveyDefinition } from "@/types/survey";

type FlowState = "intro" | "questions" | "submitting" | "complete";

interface SurveyRunnerProps {
  survey: SurveyDefinition;
}

export function SurveyRunner({ survey }: SurveyRunnerProps) {
  const [flow, setFlow] = useState<FlowState>("intro");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [submitError, setSubmitError] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [storageMode, setStorageMode] = useState<StorageMode | null>(null);

  const totalQuestions = survey.questions.length;
  const currentQuestion = survey.questions[currentIndex] ?? null;
  const isSubmitting = flow === "submitting";
  const isLastQuestion = totalQuestions > 0 && currentIndex === totalQuestions - 1;

  const answeredCount = useMemo(
    () => survey.questions.filter((question) => isAnswered(question, answers[question.id])).length,
    [answers, survey.questions],
  );

  const completion = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  function resetSurvey() {
    setFlow("intro");
    setCurrentIndex(0);
    setAnswers({});
    setSubmitError("");
    setSubmissionId("");
    setStorageMode(null);
    setEmailError("");
  }

  function startSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setEmailError("Enter a valid email to start the survey.");
      return;
    }

    setEmail(normalizedEmail);
    setEmailError("");
    setSubmitError("");
    setFlow("questions");
  }

  function updateAnswer(questionId: string, value: string | number | string[]) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
    setSubmitError("");
  }

  function toggleMultiChoice(questionId: string, option: string) {
    setAnswers((previous) => {
      const currentSelection = Array.isArray(previous[questionId])
        ? (previous[questionId] as string[])
        : [];

      const nextSelection = currentSelection.includes(option)
        ? currentSelection.filter((value) => value !== option)
        : [...currentSelection, option];

      return {
        ...previous,
        [questionId]: nextSelection,
      };
    });
    setSubmitError("");
  }

  function getMissingQuestionIds() {
    return survey.questions
      .filter((question) => !isAnswered(question, answers[question.id]))
      .map((question) => question.id);
  }

  async function submitSurvey() {
    const missingQuestionIds = getMissingQuestionIds();
    if (missingQuestionIds.length > 0) {
      setSubmitError("Please answer every question before submitting.");
      const firstMissingIndex = survey.questions.findIndex(
        (question) => question.id === missingQuestionIds[0],
      );
      if (firstMissingIndex >= 0) {
        setCurrentIndex(firstMissingIndex);
      }
      return;
    }

    setSubmitError("");
    setFlow("submitting");

    try {
      const response = await fetch("/api/survey-responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          answers,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            id?: string;
            storage?: StorageMode;
            error?: string;
            missingQuestionIds?: string[];
            invalidQuestionIds?: string[];
          }
        | null;

      if (!response.ok) {
        setFlow("questions");
        setSubmitError(
          result?.error ?? "Unable to submit right now. Please review your responses and retry.",
        );

        if (result?.missingQuestionIds && result.missingQuestionIds.length > 0) {
          const firstMissingIndex = survey.questions.findIndex(
            (question) => question.id === result.missingQuestionIds?.[0],
          );
          if (firstMissingIndex >= 0) {
            setCurrentIndex(firstMissingIndex);
          }
        }

        if (result?.invalidQuestionIds && result.invalidQuestionIds.length > 0) {
          const firstInvalidIndex = survey.questions.findIndex(
            (question) => question.id === result.invalidQuestionIds?.[0],
          );
          if (firstInvalidIndex >= 0) {
            setCurrentIndex(firstInvalidIndex);
          }
        }
        return;
      }

      setSubmissionId(result?.id ?? "");
      setStorageMode(result?.storage ?? "file");
      setFlow("complete");
    } catch {
      setFlow("questions");
      setSubmitError("Unable to submit right now. Please try again in a moment.");
    }
  }

  if (flow === "intro") {
    return (
      <SurveyIntroView
        title={survey.title}
        description={survey.description}
        totalQuestions={totalQuestions}
        email={email}
        emailError={emailError}
        onEmailChange={setEmail}
        onStartSurvey={startSurvey}
      />
    );
  }

  if (flow === "complete") {
    return (
      <SurveyCompleteView
        submissionId={submissionId}
        storageMode={storageMode}
        onResetSurvey={resetSurvey}
      />
    );
  }

  if (!currentQuestion) {
    return <SurveyEmptyView onResetSurvey={resetSurvey} />;
  }

  const questionSubtitle =
    currentQuestion.helperText ??
    "A short survey to improve our service. Complete all questions before final submission.";

  return (
    <SurveyQuestionView
      totalQuestions={totalQuestions}
      currentIndex={currentIndex}
      prompt={currentQuestion.prompt}
      subtitle={questionSubtitle}
      completion={completion}
      submitError={submitError}
      isSubmitting={isSubmitting}
      isLastQuestion={isLastQuestion}
      canGoPrevious={currentIndex > 0}
      onClose={resetSurvey}
      onPrevious={() => setCurrentIndex((current) => Math.max(0, current - 1))}
      onSkip={() => setCurrentIndex((current) => Math.min(totalQuestions - 1, current + 1))}
      onNext={() => setCurrentIndex((current) => Math.min(totalQuestions - 1, current + 1))}
      onSubmit={submitSurvey}
    >
      <SurveyQuestionInput
        question={currentQuestion}
        currentValue={answers[currentQuestion.id]}
        isSubmitting={isSubmitting}
        onAnswerChange={updateAnswer}
        onToggleMultiChoice={toggleMultiChoice}
      />
    </SurveyQuestionView>
  );
}
