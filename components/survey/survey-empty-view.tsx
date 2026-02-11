import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface SurveyEmptyViewProps {
  onResetSurvey: () => void;
}

export function SurveyEmptyView({ onResetSurvey }: SurveyEmptyViewProps) {
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
          <Button variant="secondary" onClick={onResetSurvey}>
            Back to Start
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
