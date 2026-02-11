import type { FormEvent } from "react";
import { Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SurveyIntroViewProps {
  title: string;
  description: string;
  totalQuestions: number;
  email: string;
  emailError: string;
  onEmailChange: (value: string) => void;
  onStartSurvey: (event: FormEvent<HTMLFormElement>) => void;
}

export function SurveyIntroView({
  title,
  description,
  totalQuestions,
  email,
  emailError,
  onEmailChange,
  onStartSurvey,
}: SurveyIntroViewProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-3xl border border-white/80 bg-[#f4efef]">
        <CardHeader className="space-y-5">
          <Badge variant="secondary" className="w-fit bg-[#ebdddd] text-[#4c4040]">
            Survey Portal
          </Badge>
          <CardTitle className="text-4xl leading-tight">{title}</CardTitle>
          <CardDescription className="max-w-xl text-base text-[#867878]">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={onStartSurvey}>
            <div className="space-y-3">
              <Label htmlFor="survey-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#988a8a]" />
                <Input
                  id="survey-email"
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="you@company.com"
                  className="h-12 border-[#e2d7d7] bg-[#faf7f7] pl-9"
                />
              </div>
              {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
            </div>

            <div className="rounded-xl border border-[#e4d8d8] bg-[#ece2e2] px-4 py-3 text-sm text-[#6f6161]">
              {totalQuestions} questions, step-by-step navigation, and required completion at final
              submission.
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
