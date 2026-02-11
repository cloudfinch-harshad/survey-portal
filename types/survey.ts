export type SurveyQuestionType =
  | "text"
  | "textarea"
  | "single_choice"
  | "multi_choice"
  | "rating";

interface SurveyQuestionBase {
  id: string;
  prompt: string;
  required?: boolean;
  helperText?: string;
}

export interface TextQuestion extends SurveyQuestionBase {
  type: "text";
  placeholder?: string;
}

export interface TextAreaQuestion extends SurveyQuestionBase {
  type: "textarea";
  placeholder?: string;
}

export interface SingleChoiceQuestion extends SurveyQuestionBase {
  type: "single_choice";
  options: string[];
}

export interface MultiChoiceQuestion extends SurveyQuestionBase {
  type: "multi_choice";
  options: string[];
}

export interface RatingQuestion extends SurveyQuestionBase {
  type: "rating";
  min?: number;
  max?: number;
}

export type SurveyQuestion =
  | TextQuestion
  | TextAreaQuestion
  | SingleChoiceQuestion
  | MultiChoiceQuestion
  | RatingQuestion;

export interface SurveyDefinition {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

export type SurveyAnswer = string | string[] | number;
export type SurveyAnswers = Record<string, SurveyAnswer>;
