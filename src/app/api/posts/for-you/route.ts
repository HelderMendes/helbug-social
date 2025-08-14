import { NextRequest, NextResponse } from "next/server";

// Lazy import ALL dependencies to prevent build-time initialization
async function getForYouDependencies() {
  const [{ validateRequest }, { default: prisma }, { getPostDataInclude }] =
    await Promise.all([
      import("@/auth"),
      import("@/db"),
      import("@/lib/types"),
    ]);

  return { validateRequest, prisma, getPostDataInclude };
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
    const { validateRequest, prisma, getPostDataInclude } =
      await getForYouDependencies();

    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;

    const pageSize = 10;

    const posts = await prisma.post.findMany({
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data = {
      posts: posts.length > pageSize ? posts.slice(0, -1) : posts,
      nextCursor,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching for you posts:", error);
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
