import { SurveyRunner } from "@/components/survey-runner";
import surveyDefinitionJson from "@/data/survey.json";
import type { SurveyDefinition } from "@/types/survey";

export default function Home() {
  const surveyDefinition = surveyDefinitionJson as SurveyDefinition;
  return <SurveyRunner survey={surveyDefinition} />;
}
