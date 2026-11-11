import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/google
 * Custom Google OAuth2 initiation — bypasses NextAuth cookie/state issues.
 * Accepts query params:
 *   - callbackUrl: where to redirect after successful login (default: /panel)
 *   - portal: 'user' | 'artist' | 'admin' (affects post-login destination)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const rawProto = req.headers.get("x-forwarded-proto");
  const proto = rawProto || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(`${origin}/login?error=google_misconfigured`);
  }

  const callbackUrl = url.searchParams.get("callbackUrl") || "/panel";
  const portal = url.searchParams.get("portal") || "user";

  // Build the Google OAuth redirect URI (must match Google Cloud Console)
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Encode state to pass callbackUrl and portal through the OAuth flow
  const state = Buffer.from(JSON.stringify({ callbackUrl, portal })).toString("base64url");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "online");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(googleAuthUrl.toString());
}
