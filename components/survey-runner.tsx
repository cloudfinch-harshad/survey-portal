"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, Loader2, Mail } from "lucide-react";

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
            className="gap-3 sm:gap-4"
          >
            {question.options.map((option, index) => {
              const optionId = `${question.id}-option-${index}`;
              const selected = currentValue === option;

              return (
                <Label
                  key={option}
                  htmlFor={optionId}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base font-medium shadow-[0_8px_18px_rgba(85,62,62,0.12)] transition-colors sm:gap-4 sm:px-5 sm:py-4 sm:text-lg",
                    selected
                      ? "border-[#d8cece] bg-[#f8f5f5]"
                      : "border-[#e7d6d6] bg-[#f0dddd] hover:bg-[#edd8d8]",
                  )}
                >
                  <RadioGroupItem
                    id={optionId}
                    value={option}
                    disabled={isSubmitting}
                    className="size-5 border-[#b88c90] text-[#c6888f]"
                  />
                  <span>{option}</span>
                </Label>
              );
            })}
          </RadioGroup>
        );

      case "multi_choice": {
        const selections = Array.isArray(currentValue) ? currentValue : [];

        return (
          <div className="grid gap-3 sm:gap-4">
            {question.options.map((option) => {
              const selected = selections.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base font-medium shadow-[0_8px_18px_rgba(85,62,62,0.12)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:gap-4 sm:px-5 sm:py-4 sm:text-lg",
                    selected
                      ? "border-[#d8cece] bg-[#f8f5f5]"
                      : "border-[#e7d6d6] bg-[#f0dddd] hover:bg-[#edd8d8]",
                  )}
                  onClick={() => toggleMultiChoice(question.id, option)}
                  disabled={isSubmitting}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md border border-[#b88c90] bg-[#f8f2f2]",
                      selected && "border-[#bd8087] bg-[#bd8087] text-[#fff8f8]",
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
          <div className="grid grid-cols-5 gap-3">
            {options.map((option) => (
              <Button
                key={option}
                type="button"
                variant={selectedValue === option ? "default" : "outline"}
                onClick={() => updateAnswer(question.id, option)}
                disabled={isSubmitting}
                className="h-12 text-base"
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
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-3xl border border-white/80 bg-[#f4efef]">
          <CardHeader className="space-y-5">
            <Badge variant="secondary" className="w-fit bg-[#ebdddd] text-[#4c4040]">
              Survey Portal
            </Badge>
            <CardTitle className="text-4xl leading-tight">{survey.title}</CardTitle>
            <CardDescription className="max-w-xl text-base text-[#867878]">
              {survey.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={startSurvey}>
              <div className="space-y-3">
                <Label htmlFor="survey-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#988a8a]" />
                  <Input
                    id="survey-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="h-12 border-[#e2d7d7] bg-[#faf7f7] pl-9"
                  />
                </div>
                {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
              </div>

              <div className="rounded-xl border border-[#e4d8d8] bg-[#ece2e2] px-4 py-3 text-sm text-[#6f6161]">
                {totalQuestions} questions, step-by-step navigation, and required completion at
                final submission.
              </div>

              <Button type="submit" className="h-12 w-full text-base">
                Start survey
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (flow === "complete") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-xl border border-white/80 bg-[#f4efef] text-center">
          <CardHeader className="items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(165,102,111,0.3)]">
              <Check className="size-7" />
            </span>
            <Badge variant="secondary" className="bg-[#ebdddd] text-[#4c4040]">
              Submission Received
            </Badge>
            <CardTitle>Thanks for completing the survey.</CardTitle>
            <CardDescription className="text-[#847777]">
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
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-lg border border-white/80 bg-[#f4efef]">
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

  const questionSubtitle =
    currentQuestion.helperText ??
    "A short survey to improve our service. Complete all questions before final submission.";

  return (
    <main className="flex h-[100svh] items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
      <section className="h-full w-full max-w-[1080px] rounded-[2rem] border border-white/80 bg-[#efe9e9] p-1.5 shadow-[0_18px_50px_rgba(60,45,45,0.2)]">
        <div className="relative h-full overflow-hidden rounded-[1.65rem] border border-[#e8e0e0] bg-[#f6f2f2]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[#d8d0d0]" />
            <div className="absolute -left-[4%] bottom-[34%] h-40 w-[54%] rounded-full bg-[#dcd3d3]" />
            <div className="absolute left-[27%] bottom-[37%] h-28 w-[45%] rounded-full bg-[#f3eeee]" />
            <div className="absolute right-[-10%] bottom-[40%] h-56 w-[58%] rounded-full bg-[#f6f2f2]" />
          </div>

          <div className="relative z-10 flex h-full flex-col px-5 py-5 sm:px-10 sm:py-6">
            <div className="flex items-center justify-between">
              <span
                className="h-7 w-10 opacity-80"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(155deg, #2f2626 0 2px, transparent 2px 5px)",
                }}
              />
              <Button
                variant="ghost"
                onClick={resetSurvey}
                className="h-auto rounded-none px-0 py-0 text-base font-medium text-[#3d3333] hover:bg-transparent hover:text-[#2d2424]"
              >
                × Close
              </Button>
            </div>

            <div className="mx-auto mt-3 flex w-full max-w-2xl flex-1 min-h-0 flex-col">
              <div className="text-center">
                <span className="text-sm font-medium text-[#8e8181]">
                  {currentIndex + 1} of {totalQuestions}
                </span>
              </div>

              <CardHeader className="items-center gap-4 px-0 pt-4 text-center sm:pt-5">
                <CardTitle className="max-w-xl text-[1.85rem] leading-tight tracking-tight sm:text-[2.1rem]">
                  {currentQuestion.prompt}
                </CardTitle>
                <CardDescription className="max-w-xl text-lg leading-relaxed text-[#837676] sm:text-xl">
                  {questionSubtitle}
                </CardDescription>
                <Badge variant="secondary" className="bg-[#ece1e1] text-[#5c5050]">
                  {completion}% completed
                </Badge>
              </CardHeader>

              <CardContent className="mx-auto mt-1 flex-1 w-full max-w-2xl min-h-0 px-0">
                <div className="h-full w-full overflow-y-auto pr-1">
                  {renderQuestionInput(currentQuestion)}
                </div>
              </CardContent>

              <div className="mt-3 min-h-5">
                {submitError ? (
                  <p className="text-center text-sm text-destructive">{submitError}</p>
                ) : null}
              </div>

              <CardFooter className="mt-2 shrink-0 flex items-end justify-between gap-4 px-0 sm:mt-3 sm:gap-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentIndex((current) => Math.max(0, current - 1))}
                  disabled={isSubmitting || currentIndex === 0}
                  className="h-11 rounded-md px-3 text-lg font-medium text-[#3d3333] hover:bg-transparent sm:h-12 sm:text-xl"
                >
                  Previous
                </Button>

                {isLastQuestion ? (
                  <Button
                    type="button"
                    onClick={submitSurvey}
                    disabled={isSubmitting}
                    className="h-11 min-w-24 rounded-lg px-6 text-lg sm:h-12 sm:min-w-28 sm:px-7 sm:text-xl"
                  >
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                ) : (
                  <>
                   <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setCurrentIndex((current) => Math.min(totalQuestions - 1, current + 1))
                      }
                      disabled={isSubmitting}
                      className="h-11 rounded-md px-3 text-lg font-medium text-[#3d3333] hover:bg-transparent sm:h-12 sm:text-xl"
                    >
                      Skip
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((current) => Math.min(totalQuestions - 1, current + 1))
                      }
                      disabled={isSubmitting}
                      className="h-11 min-w-24 rounded-lg px-7 text-lg sm:h-12 sm:min-w-28 sm:px-8 sm:text-xl"
                    >
                      Next
                    </Button>    
                  </>
                )}
              </CardFooter>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-3 text-xs text-[#766a6a] sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pt-4 sm:text-sm">
              <p className="max-w-md leading-relaxed">
                By using our service you agree to our{" "}
                <span className="underline underline-offset-4">
                  Terms and Conditions
                </span>{" "}
                &{" "}
                <span className="underline underline-offset-4">
                  Privacy Policy
                </span>
                .
              </p>
              <p className="text-sm sm:text-base">© 2026</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
