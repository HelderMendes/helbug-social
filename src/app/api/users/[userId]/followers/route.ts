import { NextRequest, NextResponse } from "next/server";

// Lazy import ALL dependencies to prevent build-time initialization
async function getFollowerDependencies() {
  const [
    { validateRequest },
    { default: prisma },
    { getUserDataSelect },
    { Prisma },
  ] = await Promise.all([
    import("@/auth"),
    import("@/db"),
    import("@/lib/types"),
    import("@prisma/client"),
  ]);

  return { validateRequest, prisma, getUserDataSelect, Prisma };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // Ensure we're in runtime, not build time
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Lazy load all dependencies
    const { validateRequest, prisma, getUserDataSelect } =
      await getFollowerDependencies();

    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;

    const pageSize = 10;

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: getUserDataSelect(loggedInUser.id),
        },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor =
      followers.length > pageSize ? followers[pageSize].id : null;

    const data = {
      followers:
        followers.length > pageSize
          ? followers.slice(0, -1).map((follow) => follow.follower)
          : followers.map((follow) => follow.follower),
      nextCursor,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // Ensure we're in runtime, not build time
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Lazy load all dependencies
    const { validateRequest, prisma, Prisma } = await getFollowerDependencies();

    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userId === loggedInUser.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.$transaction(
      async (tx: InstanceType<typeof Prisma.TransactionClient>) => {
        await tx.follow.upsert({
          where: {
            followerId_followingId: {
              followerId: loggedInUser.id,
              followingId: userId,
            },
          },
          create: {
            followerId: loggedInUser.id,
            followingId: userId,
          },
          update: {},
        });

        await tx.notification.create({
          data: {
            issuerId: loggedInUser.id,
            recipientId: userId,
            type: "FOLLOW",
          },
        });
      },
    );

    return new NextResponse();
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // Ensure we're in runtime, not build time
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Lazy load all dependencies
    const { validateRequest, prisma, Prisma } = await getFollowerDependencies();

    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.$transaction(
      async (tx: InstanceType<typeof Prisma.TransactionClient>) => {
        await tx.follow.deleteMany({
          where: {
            followerId: loggedInUser.id,
            followingId: userId,
          },
        });

        await tx.notification.deleteMany({
          where: {
            issuerId: loggedInUser.id,
            recipientId: userId,
            type: "FOLLOW",
          },
        });
      },
    );

    return new NextResponse();
  } catch (error) {
    console.error("Error unfollowing user:", error);
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
