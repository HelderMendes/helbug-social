import { NextRequest, NextResponse } from "next/server";
import { generateIdFromEntropySize } from "lucia";
import { z } from "zod";

// Lazy import prisma to prevent build-time initialization
async function getPrisma() {
  const { default: prisma } = await import("@/db");
  return prisma;
}

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Lazy import for email function to prevent build-time execution
async function sendResetEmail(email: string, token: string) {
  try {
    const { sendPasswordResetEmail } = await import("@/lib/email");
    await sendPasswordResetEmail(email, token);
  } catch (error) {
    console.error("Failed to send reset email:", error);
    // Don't throw to prevent enumeration
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure we're in runtime, not build time
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { email } = requestSchema.parse(body);

    // Get Prisma instance
    const prisma = await getPrisma();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    }

    // Check if user has a password (not OAuth-only account)
    if (!user.passwordHash) {
      return NextResponse.json({
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    }

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new reset token
    const token = generateIdFromEntropySize(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Send email with lazy loading
    await sendResetEmail(email, token);

    return NextResponse.json({
      message:
        "If an account with this email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}

// Add runtime configuration to prevent execution during build
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
