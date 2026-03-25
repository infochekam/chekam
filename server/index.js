import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_ORIGIN = process.env.AUTH_SERVER_ORIGIN || `http://localhost:${PORT}`;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:8080";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

app.get("/", (req, res) => {
  res.send("Chekam Auth Server");
});

app.get("/auth/oauth/initiate/:provider", (req, res) => {
  const { provider } = req.params;
  const redirectUri = `${AUTH_ORIGIN}/auth/oauth/callback/${provider}`;
  const frontendRedirect = req.query.redirect_uri || FRONTEND_ORIGIN;

  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state: JSON.stringify({ redirect_uri: frontendRedirect }),
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  res.status(400).send("Unsupported provider");
});

app.get("/auth/oauth/callback/:provider", async (req, res) => {
  const { provider } = req.params;
  const { code, state } = req.query;
  let parsedState = {};
  try {
    parsedState = state ? JSON.parse(String(state)) : {};
  } catch (e) {}

  const frontendRedirect = parsedState.redirect_uri || FRONTEND_ORIGIN;

  if (provider === "google") {
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: String(code),
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: `${AUTH_ORIGIN}/auth/oauth/callback/google`,
          grant_type: "authorization_code",
        }),
      });
      const tokenJson = await tokenRes.json();

      // Validate id_token with Google's tokeninfo endpoint
      const idToken = tokenJson.id_token;
      let userInfo = null;
      if (idToken) {
        const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (infoRes.ok) {
          userInfo = await infoRes.json();
        }
      }

      // userInfo contains fields like sub (id), email, name, picture
      const userId = userInfo?.sub || userInfo?.id || null;
      const email = userInfo?.email || null;
      const name = userInfo?.name || null;
      const avatar_url = userInfo?.picture || null;

      // Optional: you can use the Supabase service role client (`supabaseAdmin`) to
      // create or sync a Supabase auth user or profile here. This repo's `profiles`
      // table references `auth.users(id)` (UUID) so naive upserts using the Google
      // `sub` value will fail the FK constraint. Implement appropriate mapping
      // (create a Supabase auth user via admin API first) if you want Supabase
      // profiles/roles to be kept in sync.

      // Create JWT session and set cookie
      const sessionToken = jwt.sign({ sub: userId, email, name, avatar_url, provider: "google" }, SESSION_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("chekam_session", sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${frontendRedirect}#oauth=success`);
    } catch (err) {
      console.error(err);
      return res.redirect(`${frontendRedirect}#error=oauth_failed`);
    }
  }

  res.status(400).send("Unsupported provider");
});

app.get("/auth/me", async (req, res) => {
  const token = req.cookies?.chekam_session || req.headers?.cookie?.split("chekam_session=")?.[1];
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, SESSION_SECRET);

    // If we have the Supabase service-role client available, fetch roles for the user
    let roles = [];
    try {
      if (supabaseAdmin && payload?.sub) {
        const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", payload.sub);
        if (data) roles = data.map((r) => r.role);
      }
    } catch (err) {
      // ignore role-fetch errors; return user payload regardless
      console.error("failed fetching roles for /auth/me:", err);
    }

    return res.json({ user: payload, roles });
  } catch (e) {
    return res.status(401).json({ error: "Invalid session" });
  }
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("chekam_session");
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Auth server running on ${AUTH_ORIGIN}`);
});
