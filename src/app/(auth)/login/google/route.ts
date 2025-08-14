import { google } from "@/auth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "profile",
    "email",
    "openid",
  ]);

  const cookiesStore = await cookies();

  cookiesStore.set("google_oauth_state", state, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5, // 5 minutes
    sameSite: "lax", // cookie configuration
  });
  cookiesStore.set("google_code_verifier", codeVerifier, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5,
    sameSite: "lax",
  });
  return Response.redirect(url.toString(), 302);
}

// Add runtime configuration to prevent execution during build
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
