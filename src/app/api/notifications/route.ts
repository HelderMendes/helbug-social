import { NextRequest, NextResponse } from "next/server";

// Lazy import ALL dependencies to prevent build-time initialization
async function getNotificationDependencies() {
  const [{ validateRequest }, { default: prisma }] = await Promise.all([
    import("@/auth"),
    import("@/db"),
  ]);

  return { validateRequest, prisma };
}

// Lazy import types to prevent build-time initialization
async function getNotificationTypes() {
  const { notificationsInclude } = await import("@/lib/types");
  return { notificationsInclude };
}

export async function GET(req: NextRequest) {
  try {
    // Ensure we're in runtime, not build time
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Lazy load all dependencies
    const { validateRequest, prisma } = await getNotificationDependencies();
    const { notificationsInclude } = await getNotificationTypes();

    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;

    const pageSize = 10;

    const notifications = await prisma.notification.findMany({
      where: { recipientId: user.id },
      include: notificationsInclude,
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor =
      notifications.length > pageSize ? notifications[pageSize].id : null;

    const data = {
      notifications:
        notifications.length > pageSize
          ? notifications.slice(0, -1)
          : notifications,
      nextCursor,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
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
