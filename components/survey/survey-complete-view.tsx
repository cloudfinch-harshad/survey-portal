import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StorageMode } from "@/components/survey/types";

interface SurveyCompleteViewProps {
  submissionId: string;
  storageMode: StorageMode | null;
  onResetSurvey: () => void;
}

export function SurveyCompleteView({
  submissionId,
  storageMode,
  onResetSurvey,
}: SurveyCompleteViewProps) {
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
          <Button variant="secondary" onClick={onResetSurvey}>
            Submit Another Response
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
