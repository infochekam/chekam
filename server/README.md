# Chekam Auth Server (starter)

This is a minimal Express-based auth server scaffold to handle OAuth initiation and callback for Google.

Environment
- Create `.env` in `server/` (you can copy from `.env.example`) and set these values:

```
PORT=3000
AUTH_SERVER_ORIGIN=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:8081
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=some-long-random-string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Run locally

```bash
cd server
npm install
npm run dev
```

Notes
- This server now creates a signed JWT session cookie (`chekam_session`) after Google OAuth and upserts a minimal `profiles` row in Supabase using the service role key.
- The frontend can call the auth server's `/auth/me` endpoint (with credentials) to obtain the current user session. The cookie is HttpOnly and cannot be read from JavaScript.
- For production you should:
	- Use HTTPS and set `secure` cookies.
	- Verify ID tokens more strictly.
	- Use a persistent session store or integrate with Supabase Auth admin APIs if you want Supabase-native sessions.

