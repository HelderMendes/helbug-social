import { google } from "@/lib/oauth";
import { lucia } from "@/auth";
import prisma from "@/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { generateIdFromEntropySize } from "lucia";
import { slugify } from "@/lib/utils";

interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const cookieStore = await cookies();
    const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
    const codeVerifier = cookieStore.get("google_code_verifier")?.value ?? null;

    if (
      !code ||
      !state ||
      !storedState ||
      state !== storedState ||
      !codeVerifier
    ) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_error", request.url),
      );
    }

    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const googleUserResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      },
    );

    if (!googleUserResponse.ok) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_error", request.url),
      );
    }

    const googleUser: GoogleUser = await googleUserResponse.json();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { googleId: googleUser.sub },
    });

    if (existingUser) {
      // User exists, log them in
      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Check if email is already taken by another account
    const emailTaken = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (emailTaken) {
      return NextResponse.redirect(
        new URL("/login?error=email_taken", request.url),
      );
    }

    // Generate username from email or name
    let username = slugify(googleUser.email.split("@")[0].toLowerCase());

    // Ensure username is unique
    let usernameExists = await prisma.user.findUnique({
      where: { username },
    });

    let counter = 1;
    while (usernameExists) {
      username = `${slugify(googleUser.email.split("@")[0].toLowerCase())}${counter}`;
      usernameExists = await prisma.user.findUnique({
        where: { username },
      });
      counter++;
    }

    // Create new user
    const userId = generateIdFromEntropySize(10);
    await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.sub,
        avatarUrl: googleUser.picture,
      },
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_error", request.url),
    );
  }
}

// Add runtime configuration to prevent execution during build
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
