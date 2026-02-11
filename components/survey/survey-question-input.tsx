import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SurveyAnswer, SurveyQuestion } from "@/types/survey";

interface SurveyQuestionInputProps {
  question: SurveyQuestion;
  currentValue: SurveyAnswer | undefined;
  isSubmitting: boolean;
  onAnswerChange: (questionId: string, value: string | number | string[]) => void;
  onToggleMultiChoice: (questionId: string, option: string) => void;
}

export function SurveyQuestionInput({
  question,
  currentValue,
  isSubmitting,
  onAnswerChange,
  onToggleMultiChoice,
}: SurveyQuestionInputProps) {
  switch (question.type) {
    case "text":
      return (
        <Input
          value={typeof currentValue === "string" ? currentValue : ""}
          onChange={(event) => onAnswerChange(question.id, event.target.value)}
          placeholder={question.placeholder ?? "Type your response"}
          disabled={isSubmitting}
          autoFocus
        />
      );

    case "textarea":
      return (
        <Textarea
          value={typeof currentValue === "string" ? currentValue : ""}
          onChange={(event) => onAnswerChange(question.id, event.target.value)}
          placeholder={question.placeholder ?? "Type your response"}
          disabled={isSubmitting}
          autoFocus
        />
      );

    case "single_choice":
      return (
        <RadioGroup
          value={typeof currentValue === "string" ? currentValue : ""}
          onValueChange={(value) => onAnswerChange(question.id, value)}
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
                onClick={() => onToggleMultiChoice(question.id, option)}
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
              onClick={() => onAnswerChange(question.id, option)}
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
