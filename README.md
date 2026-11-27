# PARTHA — KLS VDIT Alumni Mentorship & Opportunity Platform

PARTHA is a full-stack alumni mentorship, explainable mentor discovery, career opportunity, and engineering knowledge-sharing platform built for **KLS VDIT**. It connects students with verified alumni mentors through privacy-gated workflows, transparent skill/domain matching, structured mentorship sessions, and Placement Cell administration tools.

---

## Key Features

### 1. Role-Based Portals & Authentication
- **Three Distinct Roles**: Separate workflows and permissions for **Students**, **Alumni**, and **Placement Cell Admins**.
- **Secure Auth & Sessions**: Password hashing via Node `crypto.scryptSync`, HMAC-signed bearer tokens, rate-limited auth endpoints, and OTP-based password reset (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`).
- **Admin Bootstrap Claim**: First-time Placement Cell admin setup protected by `ADMIN_PASSCODE` (`POST /api/auth/claim-admin`).

### 2. Explainable Alumni Discovery
- **Transparent Match Scoring** (`src/utils/matchingEngine.ts`): Ranks alumni mentors against a student's target skills, company, role, engineering domain, branch, mentorship goals, internship/project availability, and published project guides.
- **Human-Readable Match Reasons**: Displays both a match score and clear explanations for why each mentor fits.
- **Faceted Filtering & Pagination**: Filter verified alumni by skill, company, role, domain, and search query via `GET /api/alumni`.

### 3. Privacy-Gated Mentorship & 1:1 Sessions
- **Protected Alumni Contact Info**: Alumni contact details (`email`, `phone`, `linkedinUrl` stored in `alumni_private_contacts`) remain hidden until an alumnus explicitly accepts a student's mentorship request.
- **Threaded Messaging & Read Tracking**: Built-in mentorship conversation threads (`GET/POST /api/mentorships/:id/messages`, `PATCH /api/mentorships/:id/mark-read`).
- **Session Scheduling**: Students request 1:1 slots and alumni confirm sessions with meeting links (`POST /api/mentorships/:id/book-session`, `POST /api/mentorships/:id/confirm-session`).

### 4. Career Opportunities & Resume Applications
- **Opportunity Board**: Alumni and admins publish internships, full-time roles, and project opportunities filtered by type, domain, and remote status (`GET/POST /api/opportunities`).
- **Resume Storage & Applications**: Students upload resumes (stored as binary `bytea` in PostgreSQL alongside extracted structured data), apply to opportunities, and track application states (`pending`, reviewed/updated by posters/admins).

### 5. Engineering Knowledge Hub
- **Alumni Guides**: Verified alumni publish domain guides and technical write-ups with estimated read times, domain filtering, and upvoting (`GET/POST /api/guides`, `POST /api/guides/:id/upvote`).

### 6. Placement Cell Admin Console & Google Forms Intake
- **Mentor Verification Queue**: Admins review, verify, or reject alumni mentor registrations and manage user active/inactive statuses.
- **Google Forms Senior Intake** (`src/services/googleForms.ts`, `src/lib/firebase.ts`): Admins authenticate via Firebase Google OAuth (token kept strictly in memory) to generate standardized alumni intake Google Forms, preview submitted responses, and import alumni mentors directly into PostgreSQL without duplicate imports.
- **Metrics & Student Directory**: View platform-wide metrics, student profiles, and uploaded student resumes.

### 7. Notifications & Transactional Email
- **In-App Notifications**: Activity alerts for mentorship updates, messages, and platform events (`GET /api/notifications`).
- **Optional Email Delivery**: Integrates with the Resend HTTPS API (`server/email.ts`) for mentorship acceptance notifications and password-reset OTP delivery.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Base UI / shadcn components
- **Backend**: Express 4, Node.js (`tsx`), PostgreSQL (`pg`) with Drizzle ORM (`drizzle-orm`)
- **Integrations**: Firebase Auth (Google Workspace OAuth for Google Forms API), Google Forms REST API, Resend Email API
- **Testing & Quality**: Vitest, Testing Library (`@testing-library/react`, `@testing-library/dom`), Playwright, TypeScript (`tsc --noEmit`)

---

## Project Structure

```text
├── server.ts                  # Express API server & Vite dev/static entrypoint
├── server/
│   ├── db/
│   │   ├── client.ts          # PostgreSQL pool & Drizzle instance
│   │   └── schema.ts          # Drizzle database schema (users, profiles, mentorships, opportunities, guides, forms)
│   ├── email.ts               # Resend transactional email helper
│   ├── postgresStore.ts       # Auth, token verification, queries, and transactional store logic
│   ├── rateLimit.ts           # In-memory request rate limiter for auth & sensitive endpoints
│   └── validation.ts          # Pagination and request validation helpers
├── src/
│   ├── App.tsx                # Main authenticated portal & state orchestration
│   ├── components/            # Role dashboards, discovery, mentorship, opportunities, guides, admin & intake views
│   ├── lib/firebase.ts        # Firebase Google OAuth helper (in-memory Workspace token)
│   ├── services/
│   │   ├── api.ts             # Typed frontend API client
│   │   └── googleForms.ts     # Google Forms creation & response import service
│   ├── types/index.ts         # Shared TypeScript domain interfaces
│   └── utils/matchingEngine.ts# Explainable student-to-alumni matching logic
└── tests/                     # Vitest test suites
```

---

## Getting Started

### Prerequisites
- **Node.js** 20+ (with `npm`)
- **PostgreSQL** database (e.g., Supabase PostgreSQL or local Postgres)

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure the variables for your environment:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (e.g. Supabase transaction/session pooler URI) |
| `PORT` | No | Server port (defaults to `3000`) |
| `AUTH_SECRET` | Recommended (Prod) | Secret key for signing bearer auth tokens (auto-generates an ephemeral secret in dev if omitted) |
| `ADMIN_PASSCODE` | No | Server-side passcode required to claim Placement Cell Admin access |
| `RESEND_API_KEY` | No | Resend API key for transactional emails (password reset OTPs, mentorship updates) |
| `RESEND_FROM_EMAIL` | No | Sender address for Resend emails (defaults to `PARTHA <onboarding@resend.dev>`) |

> **Note:** Never commit `.env` files or database credentials. `.env*` is ignored by `.gitignore`.

### 3. Run in Development

```bash
npm run dev
```

Starts the Express API server with Vite middleware on `http://localhost:3000` (or the configured `PORT`).

### 4. Build & Run in Production

```bash
npm run build
NODE_ENV=production npm start
```

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Express + Vite dev server on port `3000` |
| `npm run build` | Build production client bundle into `dist/` |
| `npm start` | Run the server in Node (`server.ts`) |
| `npm run preview` | Preview the built Vite bundle |
| `npm run lint` | Run TypeScript type-checking (`tsc --noEmit`) |
| `npm test` | Run Vitest unit and DOM tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |

---

## Health Check

Verify the server and PostgreSQL connection at:

```text
GET /api/health
```
