// Minimal front-end auth wrapper to use the new Node auth server.
// This preserves a similar `signInWithOAuth(provider, opts)` signature as the Lovable wrapper.

type SignInOptions = { redirect_uri?: string; extraParams?: Record<string, string> };

const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER_ORIGIN || import.meta.env.VITE_LOVABLE_AUTH_URL || "http://localhost:3000";

export const auth = {
  signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
    const redirectUri = opts?.redirect_uri ?? window.location.origin;
    const url = `${AUTH_SERVER.replace(/\/$/, "")}/auth/oauth/initiate/${provider}?redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
    // Perform a full navigation to the auth server to start the OAuth flow.
    window.location.href = url;
    return { redirected: true };
  },
};

export default auth;
