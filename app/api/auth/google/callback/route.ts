import { NextRequest, NextResponse } from "next/server";
import prisma, { ensureDatabaseSchema } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/auth";
import { encode } from "next-auth/jwt";

/**
 * GET /api/auth/google/callback
 * Custom Google OAuth2 callback handler — bypasses NextAuth's OAuthCallback issues.
 * 1. Exchanges authorization code for tokens with Google
 * 2. Fetches Google user profile
 * 3. Creates or finds user in DB
 * 4. Issues a NextAuth-compatible JWT session cookie directly
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const rawProto = req.headers.get("x-forwarded-proto");
  const proto = rawProto || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const stateParam = url.searchParams.get("state");

  // Decode state (callbackUrl + portal)
  let callbackUrl = "/panel";
  let portal = "user";
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf-8"));
      callbackUrl = decoded.callbackUrl || "/panel";
      portal = decoded.portal || "user";
    } catch {
      // ignore malformed state
    }
  }

  // Determine error redirect based on portal
  const errorRedirect = portal === "admin"
    ? `${origin}/admin/login`
    : portal === "artist"
    ? `${origin}/artist-panel/login`
    : `${origin}/login`;

  if (errorParam || !code) {
    const msg = errorParam === "access_denied"
      ? "انصراف از ورود با گوگل"
      : errorParam || "کد احراز هویت گوگل دریافت نشد";
    return NextResponse.redirect(`${errorRedirect}?error=${encodeURIComponent(msg)}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  if (!clientId || !clientSecret || !nextAuthSecret) {
    return NextResponse.redirect(`${errorRedirect}?error=${encodeURIComponent("پیکربندی سرور ناقص است")}`);
  }

  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${origin}/api/auth/google/callback`;

  try {
    // ── Step 1: Exchange code for tokens ─────────────────────────────────────
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[GOOGLE_OAUTH_TOKEN_ERROR]", errBody);
      return NextResponse.redirect(
        `${errorRedirect}?error=${encodeURIComponent("خطا در تبادل کد با سرور گوگل")}`
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;
    const idToken: string = tokenData.id_token;

    // ── Step 2: Fetch user profile from Google ────────────────────────────────
    let googleEmail = "";
    let googleName = "";
    let googlePicture = "";
    let googleSub = "";

    if (accessToken) {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        googleEmail = (userInfo.email || "").toLowerCase().trim();
        googleName = userInfo.name || "";
        googlePicture = userInfo.picture || "";
        googleSub = userInfo.id || "";
      }
    }

    // Fallback: parse ID token payload
    if (!googleEmail && idToken) {
      try {
        const parts = idToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          googleEmail = (payload.email || "").toLowerCase().trim();
          googleName = payload.name || "";
          googlePicture = payload.picture || "";
          googleSub = payload.sub || "";
        }
      } catch {
        // ignore
      }
    }

    if (!googleEmail) {
      return NextResponse.redirect(
        `${errorRedirect}?error=${encodeURIComponent("ایمیل از حساب گوگل دریافت نشد")}`
      );
    }

    // ── Step 3: Ensure DB is migrated ─────────────────────────────────────────
    await ensureDatabaseSchema();

    const isAdmin = isAdminEmail(googleEmail);

    // ── Step 4: Find or create user ───────────────────────────────────────────
    let dbUser = await prisma.user.findUnique({
      where: { email: googleEmail },
      include: { artistProfile: true },
    });

    if (!dbUser) {
      // New user — create in DB
      const role = isAdmin ? "ADMIN" : "USER";
      dbUser = await prisma.user.create({
        data: {
          email: googleEmail,
          name: googleName || (isAdmin ? "مدیر سیستم" : "کاربر هنرهاب"),
          image: googlePicture || null,
          role,
          emailVerified: new Date(),
        },
        include: { artistProfile: true },
      }) as any;

      if (isAdmin && dbUser) {
        await prisma.artistProfile.create({
          data: {
            userId: dbUser.id,
            isApproved: true,
            isActive: true,
            bio: "مدیر کل سیستم (Master Admin)",
          },
        });
        dbUser = await prisma.user.findUnique({
          where: { id: dbUser.id },
          include: { artistProfile: true },
        }) as any;
      }
    } else {
      // Existing user — sync name/image if needed
      if (googleName && (!dbUser.name || dbUser.name === "کاربر هنرهاب")) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { name: googleName, image: googlePicture || dbUser.image },
        });
        dbUser.name = googleName;
      }

      // Enforce admin role on admin emails
      if (isAdmin && dbUser.role !== "ADMIN") {
        await prisma.user.update({ where: { id: dbUser.id }, data: { role: "ADMIN" } });
        dbUser.role = "ADMIN";
      }

      // Ensure admin has an artist profile
      if (isAdmin && !dbUser.artistProfile) {
        await prisma.artistProfile.create({
          data: {
            userId: dbUser.id,
            isApproved: true,
            isActive: true,
            bio: "مدیر کل سیستم (Master Admin)",
          },
        });
        dbUser = await prisma.user.findUnique({
          where: { id: dbUser.id },
          include: { artistProfile: true },
        }) as any;
      }

      // Block deleted/deactivated ARTIST accounts
      if (!isAdmin && dbUser.role === "ARTIST") {
        if (dbUser.artistProfile?.isDeleted) {
          return NextResponse.redirect(`${errorRedirect}?error=${encodeURIComponent("حساب هنرمندی شما بایگانی شده است")}`);
        }
        if (dbUser.artistProfile && !dbUser.artistProfile.isActive) {
          return NextResponse.redirect(`${errorRedirect}?error=${encodeURIComponent("حساب هنرمندی شما غیرفعال شده است")}`);
        }
      }
    }

    if (!dbUser) {
      return NextResponse.redirect(`${errorRedirect}?error=${encodeURIComponent("خطای سیستمی در ایجاد کاربر")}`);
    }

    // Also link Google account in the Account table (for NextAuth compatibility)
    if (googleSub) {
      try {
        const existingAccount = await prisma.account.findFirst({
          where: { provider: "google", providerAccountId: googleSub },
        });
        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              type: "oauth",
              provider: "google",
              providerAccountId: googleSub,
              access_token: accessToken,
              id_token: idToken || null,
              token_type: "Bearer",
              scope: "openid email profile",
            },
          });
        } else if (existingAccount.userId !== dbUser.id) {
          // Re-link to current user
          await prisma.account.update({
            where: { id: existingAccount.id },
            data: { userId: dbUser.id, access_token: accessToken },
          });
        }
      } catch (accErr) {
        // Non-fatal: account linking is best-effort
        console.warn("[GOOGLE_OAUTH_ACCOUNT_LINK_WARN]", accErr);
      }
    }

    // ── Step 5: Issue NextAuth JWT session cookie ─────────────────────────────
    const isSecure = proto === "https";
    const cookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";

    const tokenPayload = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      picture: dbUser.image || googlePicture || null,
      role: dbUser.role,
      hasPassword: Boolean((dbUser as any).password),
      sub: dbUser.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      jti: crypto.randomUUID(),
    };

    const sessionToken = await encode({
      token: tokenPayload,
      secret: nextAuthSecret,
      maxAge: 30 * 24 * 60 * 60,
    });

    // ── Step 6: Determine redirect destination ────────────────────────────────
    let destination = callbackUrl;
    if (!destination || destination === "/") {
      if (dbUser.role === "ADMIN") destination = "/admin";
      else if (dbUser.role === "ARTIST") destination = "/artist-panel/dashboard";
      else destination = "/panel";
    }

    // Safety: ensure destination is a relative path (no open redirect)
    if (!destination.startsWith("/")) {
      destination = "/panel";
    }

    // ── Step 7: Set session cookie and redirect ───────────────────────────────
    const response = NextResponse.redirect(`${origin}${destination}`);
    response.cookies.set(cookieName, sessionToken, {
      path: "/",
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error("[GOOGLE_OAUTH_CALLBACK_EXCEPTION]", err);
    return NextResponse.redirect(
      `${errorRedirect}?error=${encodeURIComponent("خطای سیستمی در احراز هویت گوگل")}`
    );
  }
}
