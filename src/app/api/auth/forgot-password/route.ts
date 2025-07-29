import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db";
import { generateIdFromEntropySize } from "lucia";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

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

    // Send email
    try {
      await sendPasswordResetEmail(email, token);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      // Don't reveal email sending failure to prevent enumeration
    }

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
