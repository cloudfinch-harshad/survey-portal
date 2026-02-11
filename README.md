# Survey Portal

Modern survey flow (SurveyMonkey-style) built with:

- Next.js App Router
- Shadcn-style UI components
- Prisma for persistence
- JSON-based survey definition

## What It Does

- User starts by entering email (no login).
- Questions are shown one-by-one.
- User can navigate back and forward.
- Final submit is blocked until all questions are answered.
- Responses are saved as JSON:
  - Primary: Prisma JSON column in DB (`SurveyResponse.answers`)
  - Fallback: local file `data/survey-responses.json` when DB is not configured

## Survey Configuration

Edit `data/survey.json` to change:

- Survey title/description
- Question list and order
- Question types:
  - `text`
  - `textarea`
  - `single_choice`
  - `multi_choice`
  - `rating`

## Database Setup

If you want to test without DB first, skip this section and responses will go to `data/survey-responses.json`.

1. Copy env file:

```bash
cp .env.example .env
```

2. Put your DB connection string into `DATABASE_URL` in `.env`.

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Create migration (after DB creds are set):

```bash
npm run prisma:migrate -- --name init
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API

`POST /api/survey-responses`

Payload:

```json
{
  "email": "user@example.com",
  "answers": {
    "question_id": "value"
  }
}
```

Behavior:

- Validates email.
- Validates that all required questions are answered.
- Validates answer shapes/options on the server.
- Persists response in `SurveyResponse` table (DB mode) or `data/survey-responses.json` (file mode).
