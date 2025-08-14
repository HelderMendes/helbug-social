import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Lazy import ALL dependencies to prevent build-time initialization
async function getCommentDependencies() {
  const [{ validateRequest }, { default: prisma }, { getCommentDataInclude }] =
    await Promise.all([
      import("@/auth"),
      import("@/db"),
      import("@/lib/types"),
    ]);

  return {
    validateRequest,
    prisma,
    getCommentDataInclude,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;

    // Ensure we're in runtime, not build time
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Lazy load all dependencies
    const { validateRequest, prisma, getCommentDataInclude } =
      await getCommentDependencies();

    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;

    const pageSize = 5;

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: getCommentDataInclude(loggedInUser.id),
      orderBy: { createdAt: "asc" },
      take: -pageSize - 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const previousCursor = comments.length > pageSize ? comments[0].id : null;

    const data = {
      comments: comments.length > pageSize ? comments.slice(1) : comments,
      previousCursor,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;

    // Ensure we're in runtime, not build time
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Lazy load all dependencies
    const { validateRequest, prisma, getCommentDataInclude } =
      await getCommentDependencies();

    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 },
      );
    }

    const [createdComment] = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const comment = await tx.comment.create({
          data: {
            content: content.trim(),
            postId,
            userId: loggedInUser.id,
          },
          include: getCommentDataInclude(loggedInUser.id),
        });

        const post = await tx.post.findUnique({
          where: { id: postId },
          select: { userId: true },
        });

        if (post && post.userId !== loggedInUser.id) {
          await tx.notification.create({
            data: {
              issuerId: loggedInUser.id,
              recipientId: post.userId,
              postId,
              type: "COMMENT",
            },
          });
        }

        return [comment];
      },
    );

    return NextResponse.json(createdComment);
  } catch (error) {
    console.error("Error creating comment:", error);
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
