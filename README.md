# Udemy Clone — Full-Stack Online Learning Platform

[![CI/CD](https://img.shields.io/badge/CI%2FCD-Passing-brightgreen?style=flat-square)]()
[![Node](https://img.shields.io/badge/Node-≥20-blue?style=flat-square)]()
[![Next](https://img.shields.io/badge/Next-16.2.10-black?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)]()

---

## TL;DR / Mission

This is a production-grade, server-rendered online learning platform where **teachers** author multi-chapter courses (with video, attachments, and metadata) and **students** discover, purchase, and consume them with tracked progress. The platform integrates **Clerk** for authentication, **Stripe** for payment processing, **Mux** for adaptive-bitrate video streaming, and **UploadThing** for file attachments. It is designed as a monorepo-style Next.js application backed by a **Prisma ORM** connecting to a **MariaDB** (MySQL-compatible) database.

---

## System Architecture & Data Flow

### Architectural Overview

The application follows the **Next.js App Router** paradigm — a hybrid React server/client rendering model. All pages default to **React Server Components (RSC)**; interactivity is explicitly marked with `"use client"`. The system is decomposed into:

| Layer | Technology | Responsibility |
|---|---|---|
| **Presentation** | React 19 + Tailwind CSS v4 + shadcn/ui (Base UI) | Server-rendered pages, client-side interactivity, responsive design |
| **API / BFF** | Next.js Route Handlers (Edge-compatible) | REST endpoints behind Clerk auth middleware; all business logic lives in handlers |
| **Auth** | Clerk (`@clerk/nextjs`) | Session management, JWT tokens, protected routes, teacher role gating |
| **Payments** | Stripe | Checkout sessions, webhook event processing, purchase ledger |
| **Video** | Mux (`@mux/mux-node`, `@mux/mux-player-react`) | Video upload, encoding, adaptive-bitrate HLS streaming |
| **File Storage** | UploadThing | Image, document, and video file uploads with signed URLs |
| **ORM** | Prisma 7 (MariaDB adapter) | Type-safe database access, migrations, generated client |
| **Database** | MariaDB (MySQL wire-protocol) | Relational store for courses, chapters, users, purchases, progress |
| **State (Client)** | Zustand + react-hook-form | Lightweight client stores (confetti), form state management |
| **DnD** | `@hello-pangea/dnd` | Drag-and-drop chapter reordering |

### Request Lifecycle

```mermaid
flowchart TD
    User(["👤 User (Browser)"])
    CDN["🌐 CDN / Next.js Edge"]

    subgraph Next_App ["Next.js 16 Server"]
        direction TB
        RSC["React Server Component<br/>(SSR / RSC Payload)"]
        RH["Route Handler<br/>(API Endpoint)"]
        MW["Middleware<br/>(Clerk auth guard)"]
        A1["actions/get-courses.ts<br/>actions/get-chapter.ts<br/>(Server Actions)"]
    end

    subgraph Services ["External Services"]
        Clerk["Clerk<br/>(Auth / JWT)"]
        Stripe_SDK["Stripe API<br/>(Checkout / Webhook)"]
        Mux["Mux<br/>(Video Encoding / HLS)"]
        UT["UploadThing<br/>(File Uploads)"]
    end

    subgraph Data ["Data Layer"]
        DB[("MariaDB<br/>(Prisma ORM)")]
        Prisma["Prisma Client<br/>(Generated, Type-Safe)"]
    end

    User -->|HTTP Request| CDN
    CDN -->|Page / API| Next_App
    Next_App --> MW
    MW -->|Auth Check| Clerk
    MW -->|Pass / Redirect| RSC
    RSC -->|Server Data Fetch| A1
    A1 -->|Prisma Query| Prisma --> DB
    RH -->|Auth Verify| Clerk
    RH -->|CRUD| Prisma --> DB
    RH -->|Stripe Session| Stripe_SDK
    RH -->|Upload Token| UT
    RH -->|Mux Asset| Mux

    RSC -->|HTML / RSC Payload| User
    User -->|Client Interaction| RH
    Stripe_SDK -->|Webhook: checkout.session.completed| RH
```

### Component Hierarchy (Key Pages)

```mermaid
flowchart LR
    Root["RootLayout<br/>(ClerkProvider, Toaster, Confetti)"]
    Auth["(auth)/layout<br/>(Clerk UI — Sign-in / Sign-up)"]
    Dash["(dashboard)/layout<br/>(Sidebar + Navbar)"]
    DashSearch["search/page<br/>(Browse + Filter Courses)"]
    DashTeacher["teacher/courses/page<br/>(DataTable)"]
    TeacherCourse["teacher/courses/[courseId]/page<br/>(Course Editor Form)"]
    TeacherChapter["teacher/…/chapters/[chapterId]/page<br/>(Chapter Editor Form)"]
    CourseView["(course)/courses/[courseId]/page<br/>(Student Course View)"]
    ChapterView["(course)/courses/[courseId]/chapters/[chapterId]/page<br/>(Video Player + Progress)"]
    TeacherAnalytics["teacher/analytics/page<br/>(Revenue Chart + Data Cards)"]

    Root --> Auth
    Root --> Dash
    Dash --> DashSearch
    Dash --> DashTeacher
    Dash --> TeacherAnalytics
    DashTeacher --> TeacherCourse
    TeacherCourse --> TeacherChapter
    Dash --> CourseView
    CourseView --> ChapterView
```

---

## Tech Stack & Rationale

### Languages & Runtimes

| Dependency | Version | Why |
|---|---|---|
| **Node.js** | ≥20 | Required by Next.js 16; native fetch, modern ESM, and built-in test runner. |
| **TypeScript** | 5.x | Strict mode enabled (`strict: true`); mandatory for production-scale React. |
| **React** | 19.2.4 | Latest concurrent features, React Compiler support, and `"use client"` boundaries. |
| **Next.js** | 16.2.10 | App Router with RSC, streaming, server actions, and automatic code-splitting. |

### Framework & UI

| Package | Purpose |
|---|---|
| **Tailwind CSS v4** | Utility-first CSS with `@tailwindcss/postcss` plugin; v4 uses CSS-first configuration, no `tailwind.config.js`. |
| **shadcn/ui** (`@base-ui/react`) | Accessible, unstyled headless UI primitives (Radix replacement) from Base UI. Components are copied into `/components/ui` for full control. |
| **lucide-react** | Lightweight, tree-shakable icon library. |
| **react-hook-form + Zod** | Performant form state management with schema-based validation; `@hookform/resolvers` bridges Zod schemas to RHF. |
| **Zustand** | Minimal client store for ephemeral UI state (e.g., confetti animation trigger). |
| **@tanstack/react-table** | Headless table with sorting, filtering, and pagination for the teacher courses view. |
| **@hello-pangea/dnd** | Maintained fork of `react-beautiful-dnd` for drag-and-drop chapter reordering. |
| **recharts** | Composable charting library for the teacher analytics dashboard (revenue bar chart). |
| **react-quill-new** | React 19–compatible rich text editor (fork of `react-quill` that removes `findDOMNode` usage). |
| **react-confetti** | Celebratory confetti animation on course publish. |
| **query-string** | URL query parsing for search/filter pages. |

### Backend & Data

| Package | Purpose |
|---|---|
| **Prisma 7** | Type-safe ORM with `prisma-client` generator; the client is output to `lib/generated/prisma`. |
| **@prisma/adapter-mariadb** | MariaDB-specific driver adapter for Prisma — the app connects to MySQL/MariaDB databases. |
| **Clerk (`@clerk/nextjs`)** | End-to-end auth: sign-up, sign-in, session tokens, JWT verification, and middleware protection. Teacher role is derived from a `NEXT_PUBLIC_TEACHER_ID` env var. |
| **Stripe** | Payment checkout sessions (one-time purchase per course); webhook (`/api/webhook`) records purchases. |
| **Mux (`@mux/mux-node`)** | Video upload, encoding pipeline, and playback ID generation for adaptive HLS streaming. |
| **Mux Player React** | Pre-built React video player component wrapping `@mux/mux-player`. |
| **UploadThing** | File upload service for course images, attachments, and chapter videos; configured with file-type and size limits per upload endpoint. |
| **Axios** | HTTP client used in client components for `PATCH`/`DELETE`/`POST` to API routes. |
| **react-hot-toast** | Toast notifications for success/error feedback on mutations. |

---

## Database Schema / ERD

**Assumptions:** The schema is defined in `prisma/schema.prisma`. The database is MariaDB (MySQL-compatible). All IDs are UUIDs generated at the application level (`@default(uuid())`).

```mermaid
erDiagram
    Category ||--o{ Course : "has many"
    Course ||--o{ Chapter : "has many"
    Course ||--o{ Attachment : "has many"
    Course ||--o{ Purchase : "has many"
    Chapter ||--o| MuxData : "has one"
    Chapter ||--o{ UserProgress : "has many"

    Category {
        string id PK "uuid"
        string name UK "unique"
        datetime createdAt
        datetime updatedAt
    }

    Course {
        string id PK "uuid"
        string userId FK "teacher Clerk user ID"
        string title
        string description "nullable, Text"
        string imageUrl "nullable, Text"
        float price "nullable"
        boolean isPublished "default false"
        string categoryId FK "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Chapter {
        string id PK "uuid"
        string title
        string description "nullable, Text"
        string videoUrl "nullable, Text"
        int position
        boolean isPublished "default false"
        boolean isFree "default false"
        string courseId FK
        datetime createdAt
        datetime updatedAt
    }

    MuxData {
        string id PK "uuid"
        string assetId
        string playbackId "nullable"
        string chapterId FK "unique"
    }

    Attachment {
        string id PK "uuid"
        string name
        string url "Text"
        string courseId FK
        datetime createdAt
        datetime updatedAt
    }

    UserProgress {
        string id PK "uuid"
        string userId
        string chapterId FK
        boolean isCompleted "default false"
        datetime createdAt
        datetime updatedAt
    }

    Purchase {
        string id PK "uuid"
        string userId
        string courseId FK
        datetime createdAt
        datetime updatedAt
    }

    StripeCustomer {
        string id PK "uuid"
        string userId UK
        string stripeCustomerId UK
        datetime createdAt
        datetime updatedAt
    }
```

### Key Constraints

| Constraint | Description |
|---|---|
| `@@unique([userId, chapterId])` on **UserProgress** | One progress record per user per chapter. |
| `@@unique([userId, courseId])` on **Purchase** | A user can purchase a course only once. |
| `@@index([courseId])` on Chapter, Attachment, Purchase | Query performance for course-scoped lookups. |
| `@@index([userId])` on UserProgress | Fast user-scoped progress queries. |
| `@@fulltext([title])` on **Course** | Full-text search on course titles (MariaDB/MySQL). |
| `Chapter.isFree` | If `true`, the chapter is accessible without purchase. |
| `Course.isPublished` / `Chapter.isPublished` | Only published content is visible to students. |

---

## Getting Started (Local Dev)

### Prerequisites

| Tool | Version | Verification |
|---|---|---|
| **Node.js** | ≥20.x | `node --version` |
| **Yarn** | 1.22.x (Classic) | `yarn --version` |
| **MariaDB** | ≥10.6 (or MySQL 8) | `mysql --version` |
| **Stripe CLI** | Latest | `stripe --version` (optional, for webhook testing) |

### Environment Setup

Copy the sample environment file and fill in every variable:

```bash
cp .env.sample .env.local
```

Required environment variables:

| Variable | Source | Description |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) | Clerk front-end API key |
| `CLERK_SECRET_KEY` | Clerk Dashboard | Clerk secret key (server-side) |
| `DATABASE_URL` | Your MariaDB instance | `mysql://user:password@localhost:3306/db_udemy` |
| `UPLOADTHING_TOKEN` | [UploadThing Dashboard](https://uploadthing.com) | File upload service token |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | [Mux Dashboard](https://dashboard.mux.com) | Video encoding service credentials |
| `STRIPE_API_KEY` | [Stripe Dashboard](https://dashboard.stripe.com) | Stripe secret key (sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI or Dashboard | Webhook signing secret (whsec_...) |
| `NEXT_PUBLIC_APP_URL` | Your dev server | `http://localhost:3000` |
| `NEXT_PUBLIC_TEACHER_ID` | Clerk user ID | The Clerk user ID designated as teacher |

### Install & Build

```bash
# Install dependencies
yarn install

# Generate Prisma client (run after every schema change)
yarn prisma:generate

# Push schema to database (dev only — creates tables without migration history)
yarn prisma:push

# Or create a migration (preferred for version control)
yarn prisma:migrate
```

### Seed the Database

```bash
yarn db:seed
```

This populates the `Category` table with nine categories: Computer Science, Music, Health & Fitness, Photography & Video, Accounting, Engineering, Personal Development, Marketing, and Lifestyle.

### Run the Dev Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). The app uses **Clerk** — sign up or sign in to access routes.

### Stripe Webhook (Local Testing)

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the webhook signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### Lint

```bash
yarn lint
```

Uses `eslint-config-next` with TypeScript and Core Web Vitals rules.

---

## API Reference / Core Interfaces

### REST Endpoints

All routes are under `/api/`. Requests require a valid Clerk session (JWT) unless noted. Teacher-only routes verify `userId === NEXT_PUBLIC_TEACHER_ID`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/courses` | Teacher | Create a course (body: `{ title }`) |
| `PATCH` | `/api/courses/[courseId]` | Teacher | Update course fields |
| `DELETE` | `/api/courses/[courseId]` | Teacher | Delete course & cleanup Mux assets |
| `PATCH` | `/api/courses/[courseId]/publish` | Teacher | Publish course (validates required fields + ≥1 published chapter) |
| `PATCH` | `/api/courses/[courseId]/unpublish` | Teacher | Unpublish course |
| `POST` | `/api/courses/[courseId]/attachments` | Teacher | Add attachment (body: `{ url, name }`) |
| `DELETE` | `/api/courses/[courseId]/attachments/[attachmentId]` | Teacher | Remove attachment |
| `POST` | `/api/courses/[courseId]/chapters` | Teacher | Create chapter (auto-calculates position) |
| `PATCH` | `/api/courses/[courseId]/chapters/[chapterId]` | Teacher | Update chapter (handles Mux asset lifecycle on video change) |
| `DELETE` | `/api/courses/[courseId]/chapters/[chapterId]` | Teacher | Delete chapter & cleanup Mux asset |
| `PUT` | `/api/courses/[courseId]/chapters/reorder` | Teacher | Bulk-update chapter positions (body: `{ list: [{id, position}] }`) |
| `PATCH` | `/api/courses/[courseId]/chapters/[chapterId]/publish` | Teacher | Publish chapter (validates title, description, videoUrl, muxData) |
| `PATCH` | `/api/courses/[courseId]/chapters/[chapterId]/unpublish` | Teacher | Unpublish chapter |
| `PUT` | `/api/courses/[courseId]/chapters/[chapterId]/progress` | User | Upsert `UserProgress` (body: `{ isCompleted }`) |
| `POST` | `/api/courses/[courseId]/checkout` | User | Create Stripe checkout session; returns `{ url }` |
| `POST` | `/api/webhook` | Public | Stripe event webhook (signature-verified); handles `checkout.session.completed` |
| `GET` | `/api/uploadthing` | Teacher | UploadThing server route |
| `POST` | `/api/uploadthing` | Teacher | UploadThing server route |

### Server Actions (Data Access Layer)

Located in `actions/`. These are async functions called from Server Components (RSCs):

| Action | Returns | Purpose |
|---|---|---|
| `getCourses({ userId, title?, categoryId? })` | `CourseWithProgress[]` | Browse/search published courses with user's progress (or `null` if not purchased) |
| `getDashboardCourses(userId)` | `{ completedCourses, coursesInProgress }` | User's purchased courses partitioned by completion status |
| `getChapter({ userId, courseId, chapterId })` | `{ chapter, course, muxData?, attachments?, nextChapter?, userProgress?, purchase? }` | Full chapter page data — video/attachments/nextChapter only returned if purchased or chapter is free |
| `getProgress(userId, courseId)` | `number` (0–100) | Percentage of published chapters marked complete |
| `getAnalytics(userId)` | `{ data, totalRevenue, totalSales }` | Teacher revenue grouped by course title |

### UploadThing File Router

Defined in `app/api/uploadthing/core.ts`:

| Upload Endpoint | MIME Types | Max Size |
|---|---|---|
| `courseImage` | `image/*` | 4 MB |
| `courseAttachment` | `text`, `image`, `video`, `audio`, `pdf` | — (unspecified) |
| `chapterVideo` | `video/*` | 1 GB |

All endpoints require the authenticated user to be the designated teacher (`isTeacher` guard).

---

## Dev Workflow & Code Quality

### Linting & Formatting

- **ESLint** (`yarn lint`): Uses `eslint-config-next` with two presets — `core-web-vitals` and `typescript`. Configuration is in `eslint.config.mjs` (flat config format, ESLint v9).
- **No Prettier (default)**: Tailwind CSS v4 handles class ordering; the project relies on ESLint's built-in formatting rules.
- **TypeScript**: Strict mode (`strict: true`). Path alias `@/*` maps to project root.

### Project Conventions

| Convention | Rule |
|---|---|
| **File naming** | `kebab-case` for files, `PascalCase` for components, `camelCase` for utilities |
| **Client boundary** | Every file using hooks, event handlers, or browser APIs gets `"use client"` |
| **Route colocation** | Page components live in route groups: `(dashboard)`, `(course)`, `(auth)` |
| **API handlers** | Colocated in `app/api/` following the route hierarchy |
| **Shared components** | Reusable UI in `components/ui/` (shadcn); business-logic components in `components/` |
| **Actions** | Server data-fetching functions in `actions/` — imported by RSCs |
| **Environment** | All secrets in `.env.local`; `.env.sample` documents required variables |
| **Teacher guard** | Checked via `isTeacher(userId)` utility comparing against `NEXT_PUBLIC_TEACHER_ID` |
| **Video cleanup** | On chapter `DELETE` or video change, the previous Mux asset is explicitly deleted |


---

## Deployment Strategy

### Environment Tiers

| Tier | Database | Features |
|---|---|---|
| **Local** (`localhost:3000`) | Local MariaDB | Full dev experience; Stripe CLI for webhooks |
| **Preview** (Vercel Preview) | Ephemeral DB or staging | Per-branch deploy with Clerk test keys |
| **Production** (Vercel Production) | Managed MariaDB / MySQL | Production Stripe keys, Clerk prod instances |

### Deployment Flow (Vercel)

1. Push to `main` (or merge PR).
2. Vercel detects the Next.js project and runs `next build`.
3. `DATABASE_URL` and all secrets are injected via Vercel Environment Variables.
4. Production migrations are run manually or via CI: `yarn prisma:migrate deploy`.
5. UploadThing, Mux, Stripe, and Clerk are configured with production API keys.

---

## Observability

### Current Implementation

| Concern | Mechanism |
|---|---|
| **Server errors** | `console.log("[COURSE]", error)` in actions; `console.log("🚀 ~ error:", error)` in client handlers |
| **Client errors** | `react-hot-toast` for user-facing error/success messages |
| **Stripe webhook** | Returns `400` with error message on invalid signature or missing metadata |
| **Auth debugging** | Clerk middleware has `{ debug: true }` flag active (disable in production) |
| **Prisma logging** | Log levels `["warn", "error"]` configured in `lib/db.ts` |

### Recommended Additions

- **Structured logging**: Replace `console.log` with `pino` or `winston`, exporting JSON logs to stdout.
- **APM / Tracing**: Integrate OpenTelemetry with Sentry or DataDog for route-level traces.
- **Health check**: Add `GET /api/health` returning `{ status: "ok", db: true/false }` that runs a `SELECT 1` via Prisma.
- **Rate limiting**: Apply to `/api/checkout` and `/api/courses` using Vercel WAF or Upstash Redis.
- **Error aggregation**: Send 5xx errors to Sentry via `instrumentation.ts`.

---

## License

**MIT License** — see [LICENSE](./LICENSE) (not yet created) for details.

## 📧 Contact

For questions or suggestions, feel free to open an issue or reach out!

---

<div align="center">

**Built with ❤️ by [Micael Dié](https://micaeldie.com) for learning and education**

Made with Next.js, Typescript and Prisma

</div>