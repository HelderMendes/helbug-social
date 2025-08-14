import { google } from "@/lib/oauth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Ensure we're in runtime, not build time
    if (!process.env.GOOGLE_CLIENT_ID) {
      return Response.json(
        { error: "OAuth service temporarily unavailable" },
        { status: 503 },
      );
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = await google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "profile",
      "email",
    ]);

    const cookieStore = await cookies();
    cookieStore.set("google_oauth_state", state, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      sameSite: "lax",
    });

    cookieStore.set("google_code_verifier", codeVerifier, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      sameSite: "lax",
    });

    return Response.redirect(url);
  } catch (error) {
    console.error("Google OAuth initiation error:", error);
    return Response.redirect("/login?error=oauth_error");
  }
}

// Add runtime configuration to prevent execution during build
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
