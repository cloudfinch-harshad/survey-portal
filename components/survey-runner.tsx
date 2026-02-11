"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Mail, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SurveyAnswers, SurveyDefinition, SurveyQuestion } from "@/types/survey";

type FlowState = "intro" | "questions" | "submitting" | "complete";
type StorageMode = "database" | "file";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAnswered(question: SurveyQuestion, value: unknown): boolean {
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
  const positionProgress =
    totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

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

  function renderQuestionInput(question: SurveyQuestion) {
    const currentValue = answers[question.id];

    switch (question.type) {
      case "text":
        return (
          <Input
            value={typeof currentValue === "string" ? currentValue : ""}
            onChange={(event) => updateAnswer(question.id, event.target.value)}
            placeholder={question.placeholder ?? "Type your response"}
            disabled={isSubmitting}
            autoFocus
          />
        );

      case "textarea":
        return (
          <Textarea
            value={typeof currentValue === "string" ? currentValue : ""}
            onChange={(event) => updateAnswer(question.id, event.target.value)}
            placeholder={question.placeholder ?? "Type your response"}
            disabled={isSubmitting}
            autoFocus
          />
        );

      case "single_choice":
        return (
          <RadioGroup
            value={typeof currentValue === "string" ? currentValue : ""}
            onValueChange={(value) => updateAnswer(question.id, value)}
            className="gap-3"
          >
            {question.options.map((option, index) => {
              const optionId = `${question.id}-option-${index}`;
              const selected = currentValue === option;

              return (
                <Label
                  key={option}
                  htmlFor={optionId}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40",
                    selected && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem id={optionId} value={option} disabled={isSubmitting} />
                  <span>{option}</span>
                </Label>
              );
            })}
          </RadioGroup>
        );

      case "multi_choice": {
        const selections = Array.isArray(currentValue) ? currentValue : [];

        return (
          <div className="grid gap-3">
            {question.options.map((option) => {
              const selected = selections.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border border-border bg-background/70 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50",
                    selected && "border-primary bg-primary/5",
                  )}
                  onClick={() => toggleMultiChoice(question.id, option)}
                  disabled={isSubmitting}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md border border-border bg-background",
                      selected && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {selected ? <Check className="size-3" /> : null}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        );
      }

      case "rating": {
        const min = question.min ?? 1;
        const max = question.max ?? 5;
        const selectedValue = typeof currentValue === "number" ? currentValue : null;
        const options = Array.from({ length: max - min + 1 }, (_, index) => min + index);

        return (
          <div className="grid grid-cols-5 gap-2">
            {options.map((option) => (
              <Button
                key={option}
                type="button"
                variant={selectedValue === option ? "default" : "outline"}
                onClick={() => updateAnswer(question.id, option)}
                disabled={isSubmitting}
              >
                {option}
              </Button>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  }

  if (flow === "intro") {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-16 size-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-16 bottom-10 size-80 rounded-full bg-accent/35 blur-3xl" />
        </div>

        <Card className="relative w-full max-w-2xl">
          <CardHeader className="space-y-4">
            <Badge variant="secondary" className="w-fit">
              <Sparkles className="size-3" />
              Survey Portal
            </Badge>
            <CardTitle className="text-3xl leading-tight">{survey.title}</CardTitle>
            <CardDescription className="text-base">{survey.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={startSurvey}>
              <div className="space-y-2">
                <Label htmlFor="survey-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="survey-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="pl-9"
                  />
                </div>
                {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
                {totalQuestions} questions, step-by-step navigation, and required completion at
                final submission.
              </div>

              <Button type="submit" className="w-full">
                Start Survey
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (flow === "complete") {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-12 size-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-8 size-72 rounded-full bg-accent/30 blur-3xl" />
        </div>

        <Card className="relative w-full max-w-xl text-center">
          <CardHeader className="items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Check className="size-7" />
            </span>
            <Badge variant="secondary">Submission Received</Badge>
            <CardTitle>Thanks for completing the survey.</CardTitle>
            <CardDescription>
              Your response has been saved successfully.
              {submissionId ? ` Reference: ${submissionId}` : ""}
              {storageMode === "file"
                ? " Stored in local JSON file because database is not configured."
                : ""}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="secondary" onClick={resetSurvey}>
              Submit Another Response
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>No Questions Configured</CardTitle>
            <CardDescription>
              Add at least one question in <code>data/survey.json</code> to launch the survey.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="secondary" onClick={resetSurvey}>
              Back to Start
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-12 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-12 bottom-6 size-80 rounded-full bg-accent/30 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-3xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="secondary">
              Question {currentIndex + 1} of {totalQuestions}
            </Badge>
            <span className="text-sm text-muted-foreground">{completion}% completed</span>
          </div>
          <Progress value={positionProgress} />
          <CardTitle className="text-xl leading-snug">{currentQuestion.prompt}</CardTitle>
          {currentQuestion.helperText ? (
            <CardDescription>{currentQuestion.helperText}</CardDescription>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4">{renderQuestionInput(currentQuestion)}</CardContent>

        <CardFooter className="flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentIndex((current) => Math.max(0, current - 1))}
            disabled={isSubmitting || currentIndex === 0}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

            {isLastQuestion ? (
              <Button type="button" onClick={submitSurvey} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {isSubmitting ? "Submitting..." : "Submit Survey"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() =>
                  setCurrentIndex((current) => Math.min(totalQuestions - 1, current + 1))
                }
                disabled={isSubmitting}
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
