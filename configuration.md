# Configuration & Migration Notes

This document outlines the current architecture of the application, which parts depend on Lovable and Supabase, and a recommended plan to transition authentication and server-side functionality to a Node.js backend with minimal breakage.

## Project overview
- Frontend: Vite + React + TypeScript (src/)
- UI: shadcn components + Tailwind CSS
- Auth + OAuth helper: Lovable (auto-generated integration)
- Backend-as-a-service: Supabase (auth, client, and serverless functions)

## Files & pieces that depend on Lovable
- `src/integrations/lovable/index.ts` — auto-generated wrapper around `@lovable.dev/cloud-auth-js`. Used by the UI to start OAuth flows (`signInWithOAuth`).
- `vite.config.ts` — includes `lovable-tagger` plugin in development (component tagging). Not necessary for runtime, but part of Lovable integration.
- `README.md` and project metadata reference Lovable project links.
- Any Lovable-managed build/deploy hooks or published project settings (external to repo) that handle OAuth redirects.

What this provides
- OAuth initiation and token exchange helpers that integrate with Lovable's auth host/service.
- (Possibly) hosted redirect endpoints like `/~oauth/initiate` mapped by Lovable's runtime.

## Files & pieces that depend on Supabase
- `src/integrations/supabase/client.ts` — Supabase client used across the app for auth (email/password flows) and data access.
- `.env` — contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` used by the client.
- `supabase/functions/*` — serverless functions (Deno) implementing server-side features (paystack, verify-document, property-chat, etc.).
- `migrations/` — database schema migrations for Supabase Postgres.

What this provides
- Email/password auth flows (via `supabase.auth.*`).
- Realtime DB, storage, server-side functions, and migrations.

## Other notable integrations
- `@lovable.dev/cloud-auth-js` — client library used in `src/integrations/lovable`.
- `@supabase/supabase-js` — client SDK.

## Why Google OAuth hit `/~oauth/initiate` 404
- Lovable may expect `/~oauth/*` routes to be proxied to Lovable's auth host (or available in Lovable runtime). Locally, the app attempted to call `/~oauth/initiate` and the SPA returned a 404 (NotFound page).
- A dev proxy or configuring `VITE_LOVABLE_AUTH_URL` (or using Lovable-hosted redirect endpoints) resolves this (see `vite.config.ts` proxy added earlier).

## Goals of migrating to a Node.js backend
- Replace Lovable-managed OAuth initiation and callback handling with a Node.js server that you control.
- Optionally replace Supabase Functions with Node endpoints, or keep Supabase for DB and use Node for auth and server logic.
- Keep frontend changes minimal and maintain current UX (email sign-up, sign-in, Continue with Google).

## Migration options (high level)

Option A — Minimal (Node handles OAuth only)
- Implement a small Node.js OAuth service to replace Lovable's OAuth host.
  - Endpoints: `/auth/oauth/initiate/:provider` (redirect to provider), `/auth/oauth/callback/:provider` (exchange code for tokens, create session).
  - After successful auth, issue a session token or set a cookie and redirect back to the frontend origin (same behavior as Lovable currently provides).
- Update `src/integrations/lovable/index.ts` or add a new wrapper (e.g., `src/integrations/auth/index.ts`) that calls your Node endpoints instead of `createLovableAuth()`.
- Keep Supabase client usage as-is. For server-side Supabase needs, have the Node server call Supabase with the service role key where appropriate.

Impact: minimal changes to the frontend UI. You must update env vars and the `lovable` wrapper.

Option B — Full (Node replaces Lovable + Supabase Functions)
- Implement Node endpoints to replace all Supabase Functions. Use Supabase Postgres directly (via `@supabase/postgres-js` or `pg`) or keep Supabase service APIs where appropriate.
- Migrate triggers, CRONs, and function logic to the Node codebase.

Impact: larger effort; requires testing of server-side logic and migration of environment secrets.

## Recommended step-by-step migration (safe, testable)
1. Create a Node.js auth service skeleton (Express, Fastify, or similar) and run locally.
2. Implement OAuth initiation and callback endpoints for Google:
   - Configure Google Cloud OAuth client (authorized redirect URIs must include your Node server callback URL and the frontend origin if applicable).
   - `/auth/oauth/initiate/google` redirects to Google authorization endpoint.
   - `/auth/oauth/callback/google` exchanges code for tokens, verifies identity, upserts user record in your DB (or call Supabase Admin API), creates a session, and redirects to frontend with session established.
3. Add environment variables to frontend and server:
   - Frontend: `VITE_AUTH_SERVER_ORIGIN` (e.g., http://localhost:3000)
   - Server: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase server APIs), `SESSION_SECRET`, etc.
4. Replace `src/integrations/lovable/index.ts` with a thin wrapper that calls your Node endpoints. Example behavior:
   - `signInWithOAuth('google')` performs a full-page navigation to `${VITE_AUTH_SERVER_ORIGIN}/auth/oauth/initiate/google?redirect_uri=${window.location.origin}` or opens a popup and waits for the callback to set a cookie.
5. Update development config:
   - Add or update `VITE_LOVABLE_AUTH_URL` / `VITE_AUTH_SERVER_ORIGIN` in `.env`.
   - Update `vite.config.ts` proxy rules to forward `/~oauth` (if you keep using that path) or proxy `/auth` to `http://localhost:3000` during dev.
6. Test flows locally: email/password (Supabase) and OAuth (Node server). Use browser devtools to watch redirects, cookies, and token exchanges.
7. Gradually migrate Supabase Functions to Node endpoints (only if desired). Keep both systems running behind feature flags during rollout.

## Files to change on the frontend
- `src/integrations/lovable/index.ts` — replace or wrap with calls to your Node endpoints.
- `src/pages/Auth.tsx` — currently calls `lovable.auth.signInWithOAuth('google', { redirect_uri })`. After wrapper change this should continue working without UI changes if wrapper preserves the same API.
- `vite.config.ts` — adjust dev `proxy` to forward auth paths to your Node server during development.
- `.env` — add `VITE_AUTH_SERVER_ORIGIN` (or update `VITE_LOVABLE_AUTH_URL`).

## Env variables you will likely need (server)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET` (for signing cookies/JWTs)
- `SUPABASE_SERVICE_ROLE_KEY` (if server calls Supabase admin APIs)
- `DATABASE_URL` (if you use Postgres directly)

## Testing checklist
- Verify authorized redirect URIs in Google Cloud Console match the Node callback URL and frontend origins.
- Confirm cookies or JWTs produced by Node are accepted by the frontend origin (CORS and cookie settings: `SameSite`, `Secure`, etc.).
- Verify Supabase email/password flows remain functional.
- Run full integration testing for flows that used Supabase Functions (chat, verify-document) if migrated.

## Risks & considerations
- Session model: if you switch to server-side sessions, ensure the frontend can read/validate session state (cookie vs localStorage). Supabase client expects to manage its own session when using `supabase.auth.*` — if you replace auth fully, adjust `supabase.auth.setSession()` usage accordingly.
- Token sync: If you keep Supabase as auth provider, ensure Node server can sync sessions or issue tokens Supabase accepts (or use Supabase Admin APIs to create/update sessions).
- Security: store secrets on server only; never expose client secrets in the frontend.

## Estimated effort (rough)
- Minimal Node auth server (Google OAuth only): 1–3 days (dev + testing).
- Full replacement of Supabase Functions + complete server migration: 1–3 weeks depending on complexity and tests.

If you want, I can:
- generate a starter Node Express auth server with Google OAuth callbacks and example endpoints, or
- create a replacement `src/integrations/auth/index.ts` wrapper that targets a configurable `VITE_AUTH_SERVER_ORIGIN` to simplify toggling between Lovable and your Node server.

---
Generated on 2026-03-15
