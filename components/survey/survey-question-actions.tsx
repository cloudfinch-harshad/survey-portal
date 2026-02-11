import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

interface SurveyQuestionActionsProps {
  isSubmitting: boolean;
  isLastQuestion: boolean;
  canGoPrevious: boolean;
  onPrevious: () => void;
  onSkip: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function SurveyQuestionActions({
  isSubmitting,
  isLastQuestion,
  canGoPrevious,
  onPrevious,
  onSkip,
  onNext,
  onSubmit,
}: SurveyQuestionActionsProps) {
  return (
    <CardFooter className="mt-2 shrink-0 flex items-end justify-between gap-4 px-0 sm:mt-3 sm:gap-6">
      <Button
        type="button"
        variant="ghost"
        onClick={onPrevious}
        disabled={isSubmitting || !canGoPrevious}
        className="h-11 rounded-md px-3 text-lg font-medium text-[#3d3333] hover:bg-transparent sm:h-12 sm:text-xl"
      >
        Previous
      </Button>

      {isLastQuestion ? (
        <Button
          type="button"
          onClick={onSubmit}
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
            onClick={onSkip}
            disabled={isSubmitting}
            className="h-11 rounded-md px-3 text-lg font-medium text-[#3d3333] hover:bg-transparent sm:h-12 sm:text-xl"
          >
            Skip
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={isSubmitting}
            className="h-11 min-w-24 rounded-lg px-7 text-lg sm:h-12 sm:min-w-28 sm:px-8 sm:text-xl"
          >
            Next
          </Button>
        </>
      )}
    </CardFooter>
  );
}
