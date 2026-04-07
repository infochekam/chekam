import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// CORS configuration - allow both local dev and production frontend
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      FRONTEND_ORIGIN, 
      "http://localhost:8080", 
      "http://localhost:8081", 
      "http://localhost:8082", 
      "https://chekam.onrender.com",
      "https://chekam.com",
      "https://www.chekam.com"
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Generic Supabase proxy - forward all API requests through backend to bypass DNS issues
app.all("/api/supabase/*", async (req, res) => {
  try {
    const supabasePath = req.params[0]; // Get the path after /api/supabase/
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    
    // Build the full URL with query params
    const queryString = new URLSearchParams(req.query).toString();
    const fullUrl = `${supabaseUrl}${supabasePath}${queryString ? '?' + queryString : ''}`;
    
    console.log(`[Proxy] ${req.method} ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": req.headers.authorization || `Bearer ${anonKey}`,
      },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("[Proxy] Supabase proxy error:", error.message);
    res.status(500).json({ error: "Supabase proxy failed" });
  }
});

// Specific auth token proxy (kept for backward compatibility)
app.post("/api/auth/token", async (req, res) => {
  try {
    const { grant_type, username, password, refresh_token } = req.body;
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=${grant_type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
      },
      body: JSON.stringify({
        email: username,
        password,
        refresh_token,
      }),
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("[Server] Supabase proxy error:", error.message);
    res.status(500).json({ error: "Auth proxy failed" });
  }
});

// Serve static frontend files
const publicPath = path.join(__dirname, "public");
console.log(`[Server] Serving static files from: ${publicPath}`);
console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);

app.use(express.static(publicPath));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Handle favicon.ico to prevent 404
app.get("/favicon.ico", (req, res) => {
  res.status(204).end(); // No Content
});

app.get("/", (req, res) => {
  const indexPath = path.join(publicPath, "index.html");
  console.log(`[Server] GET / - Attempting to serve index.html from: ${indexPath}`);
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[Server] Error serving index.html:`, err.message);
      res.status(200).send("Chekam Auth Server - Frontend not found at " + indexPath);
    }
  });
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

// SPA fallback - only for non-static routes
app.get("*", (req, res) => {
  // Don't serve index.html for static assets or API calls
  const staticExtensions = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/i;
  if (staticExtensions.test(req.path) || req.path.startsWith("/api") || req.path.startsWith("/auth")) {
    return res.status(404).json({ error: "Not found" });
  }

  const indexPath = path.join(publicPath, "index.html");
  // Only log for actual app routes, not bot probing attempts
  if (!req.path.includes("/.") && !req.path.includes("/config") && !req.path.includes("/admin") && !req.path.includes("storage")) {
    console.log(`[Server] Serving SPA fallback for ${req.path}`);
  }
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[Server] Error serving index.html:`, err.message);
      res.status(404).json({ error: "Frontend not found" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Auth server running on ${AUTH_ORIGIN}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
});
