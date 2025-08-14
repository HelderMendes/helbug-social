import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Lazy import ALL dependencies to prevent build-time initialization
async function getAuthDependencies() {
  const [{ lucia }, { default: prisma }, { hash }, { Prisma }] =
    await Promise.all([
      import("@/auth"),
      import("@/db"),
      import("@node-rs/argon2"),
      import("@prisma/client"),
    ]);

  return { lucia, prisma, hash, Prisma };
}

const requestSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    // Ensure we're in runtime, not build time
    if (!process.env.DATABASE_URL || !process.env.LUCIA_SESSION_SECRET) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { token, password } = requestSchema.parse(body);

    // Lazy load all dependencies
    const { lucia, prisma, hash, Prisma } = await getAuthDependencies();

    // Find and validate reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    // Hash the new password
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Update user password and delete reset token
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.delete({
        where: { token },
      });

      // Invalidate all existing sessions for this user
      await tx.session.deleteMany({
        where: { userId: resetToken.userId },
      });
    });

    // Create new session for the user
    const session = await lucia.createSession(resetToken.userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    const response = NextResponse.json({
      message: "Password reset successfully",
    });

    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return response;
  } catch (error) {
    console.error("Password reset error:", error);
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
