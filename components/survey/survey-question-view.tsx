import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SurveyQuestionActions } from "@/components/survey/survey-question-actions";

interface SurveyQuestionViewProps {
  totalQuestions: number;
  currentIndex: number;
  prompt: string;
  subtitle: string;
  completion: number;
  submitError: string;
  isSubmitting: boolean;
  isLastQuestion: boolean;
  canGoPrevious: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onNext: () => void;
  onSubmit: () => void;
  children: ReactNode;
}

export function SurveyQuestionView({
  totalQuestions,
  currentIndex,
  prompt,
  subtitle,
  completion,
  submitError,
  isSubmitting,
  isLastQuestion,
  canGoPrevious,
  onClose,
  onPrevious,
  onSkip,
  onNext,
  onSubmit,
  children,
}: SurveyQuestionViewProps) {
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
                onClick={onClose}
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
                  {prompt}
                </CardTitle>
                <CardDescription className="max-w-xl text-lg leading-relaxed text-[#837676] sm:text-xl">
                  {subtitle}
                </CardDescription>
                <Badge variant="secondary" className="bg-[#ece1e1] text-[#5c5050]">
                  {completion}% completed
                </Badge>
              </CardHeader>

              <CardContent className="mx-auto mt-1 flex-1 w-full max-w-2xl min-h-0 px-0">
                <div className="h-full w-full overflow-y-auto pr-1">{children}</div>
              </CardContent>

              <div className="mt-3 min-h-5">
                {submitError ? (
                  <p className="text-center text-sm text-destructive">{submitError}</p>
                ) : null}
              </div>

              <SurveyQuestionActions
                isSubmitting={isSubmitting}
                isLastQuestion={isLastQuestion}
                canGoPrevious={canGoPrevious}
                onPrevious={onPrevious}
                onSkip={onSkip}
                onNext={onNext}
                onSubmit={onSubmit}
              />
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
