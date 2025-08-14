import { NextRequest, NextResponse } from "next/server";

// Lazy import ALL dependencies to prevent build-time initialization
async function getTokenDependencies() {
  const [{ validateRequest }, { default: streamServerClient }] =
    await Promise.all([import("@/auth"), import("@/lib/stream")]);

  return { validateRequest, streamServerClient };
}

export async function GET(req: NextRequest) {
  try {
    // Ensure we're in runtime, not build time
    if (!process.env.STREAM_SECRET || !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Lazy load all dependencies
    const { validateRequest, streamServerClient } =
      await getTokenDependencies();

    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now
    const issuedAt = Math.floor(Date.now() / 1000) - 60; // 1 minute ago

    const token = streamServerClient.createToken(
      user.id,
      expirationTime,
      issuedAt,
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error creating Stream token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Add runtime configuration to prevent execution during build
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
