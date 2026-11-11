import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

function syncNextAuthUrl(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) return;

  const rawProto = req.headers.get("x-forwarded-proto");
  const proto = rawProto || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  
  process.env.NEXTAUTH_URL = `${proto}://${host}`;
}

export async function GET(req: NextRequest, ctx: any) {
  syncNextAuthUrl(req);
  return NextAuth(authOptions)(req, ctx);
}

export async function POST(req: NextRequest, ctx: any) {
  syncNextAuthUrl(req);
  return NextAuth(authOptions)(req, ctx);
}
