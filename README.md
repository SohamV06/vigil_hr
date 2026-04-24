# Vigil HR Hub

Technical documentation for a React + Supabase admin dashboard used to manage jobs, applications, enquiries, and admin authentication workflows.

## Project Overview

This is a frontend SPA built with Vite, React, TypeScript, Tailwind CSS, and shadcn/ui.

Core capabilities:

- Admin authentication and session persistence in local storage.
- Protected routes for dashboard and management pages.
- Job CRUD workflows.
- Application listing and detail views.
- Enquiry listing and detail views.
- Dashboard metrics driven by query hooks.
- Admin account/security actions via Supabase RPC.

## Architecture

Frontend structure:

- `src/pages/`: route-level screens (Dashboard, Jobs, Applications, Enquiries, Auth, Settings).
- `src/components/`: reusable UI and feature components.
- `src/hooks/`: data access hooks for jobs, applications, and enquiries.
- `src/contexts/`: auth/session context.
- `src/services/`: RPC-oriented service layer (admin auth and security actions).
- `src/integrations/supabase/`: Supabase client initialization.

Routing and auth:

- Routes are defined in `src/App.tsx`.
- Protected routes are wrapped by `ProtectedRoute` and `AuthProvider`.
- Admin login and account operations are implemented via Supabase RPC functions.

## Tech Stack

- React 18 + TypeScript
- Vite 5
- React Router 6
- TanStack Query 5
- Tailwind CSS + shadcn/ui + Radix UI
- Supabase JavaScript client (`@supabase/supabase-js`)
- Vitest + Testing Library
- ESLint 9

## Prerequisites

- Node.js 18+
- npm 9+ (or compatible package manager)
- Supabase project (local or hosted)

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in this directory:

```bash
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-or-publishable-key>
```

3. Run the app:

```bash
npm run dev
```

4. Open the local Vite URL shown in terminal output (typically `http://localhost:5173`).

## Scripts

- `npm run dev`: start dev server
- `npm run build`: production build
- `npm run build:dev`: development-mode build
- `npm run preview`: preview production build locally
- `npm run lint`: lint source files
- `npm run test`: run tests once
- `npm run test:watch`: run tests in watch mode

## Database and Migrations

Supabase migration files are located at `supabase/migrations/`.

The migration set includes:

- Admin auth-related SQL and RPC functions
- Jobs, applications, and enquiries schema updates
- Row-level security and policy adjustments

Apply migrations with your standard Supabase workflow (`supabase db push` for local/linked projects, or your CI pipeline process).

## Testing

- Test setup: `src/test/setup.ts`
- Example spec: `src/test/example.test.ts`
- Runner: Vitest (`npm run test`)

## Notes

- This README intentionally focuses on technical implementation details only.
