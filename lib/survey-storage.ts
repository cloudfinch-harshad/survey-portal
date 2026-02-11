import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { Prisma } from "@prisma/client";

import { getPrismaClient } from "@/lib/prisma";
import type { SurveyAnswers } from "@/types/survey";

const RESPONSES_FILE_PATH = path.join(process.cwd(), "data", "survey-responses.json");

export type StorageMode = "database" | "file";

interface SaveSurveyResponseInput {
  surveyId: string;
  email: string;
  answers: SurveyAnswers;
}

interface StoredSurveyResponse {
  id: string;
  createdAt: Date;
  storage: StorageMode;
}

interface FileSurveyResponseRecord {
  id: string;
  surveyId: string;
  email: string;
  answers: SurveyAnswers;
  createdAt: string;
}

async function saveToFile({
  surveyId,
  email,
  answers,
}: SaveSurveyResponseInput): Promise<StoredSurveyResponse> {
  await mkdir(path.dirname(RESPONSES_FILE_PATH), { recursive: true });

  let existingRecords: FileSurveyResponseRecord[] = [];
  try {
    const fileContents = await readFile(RESPONSES_FILE_PATH, "utf8");
    const parsed = JSON.parse(fileContents) as unknown;
    existingRecords = Array.isArray(parsed) ? (parsed as FileSurveyResponseRecord[]) : [];
  } catch {
    existingRecords = [];
  }

  const record: FileSurveyResponseRecord = {
    id: randomUUID(),
    surveyId,
    email,
    answers,
    createdAt: new Date().toISOString(),
  };

  existingRecords.push(record);
  await writeFile(RESPONSES_FILE_PATH, JSON.stringify(existingRecords, null, 2), "utf8");

  return {
    id: record.id,
    createdAt: new Date(record.createdAt),
    storage: "file",
  };
}

export async function saveSurveyResponse(
  input: SaveSurveyResponseInput,
): Promise<StoredSurveyResponse> {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const createdResponse = await prisma.surveyResponse.create({
        data: {
          surveyId: input.surveyId,
          email: input.email,
          answers: input.answers as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          createdAt: true,
        },
      });

      return {
        ...createdResponse,
        storage: "database",
      };
    } catch (error) {
      console.error("Failed to persist with Prisma. Falling back to file storage.", error);
    }
  }

  return saveToFile(input);
}
