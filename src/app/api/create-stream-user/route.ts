// src/app/api/create-stream-user/route.ts
import { NextRequest, NextResponse } from "next/server";

// Lazy import ALL dependencies to prevent build-time initialization
async function getStreamDependencies() {
  const [{ validateRequest }, { default: streamServerClient }] =
    await Promise.all([import("@/auth"), import("@/lib/stream")]);

  return { validateRequest, streamServerClient };
}

export async function POST(req: NextRequest) {
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
      await getStreamDependencies();

    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await streamServerClient.upsertUser({
      id: user.id,
      username: user.username,
      name: user.displayName,
      image: user.avatarUrl || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating Stream user:", error);
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
