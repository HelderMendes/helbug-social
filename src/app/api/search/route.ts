import { validateRequest } from "@/auth";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest } from "next/server";

// Lazy import prisma to prevent build-time initialization
async function getPrisma() {
  const { default: prisma } = await import("@/db");
  return prisma;
}

export async function GET(req: NextRequest) {
  try {
    // Ensure we're in runtime, not build time
    if (!process.env.DATABASE_URL) {
      return Response.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    const q = req.nextUrl.searchParams.get("q") || "";
    const type = req.nextUrl.searchParams.get("type") || "posts";

    const searchQuery = q.trim();

    if (!searchQuery) {
      return Response.json(
        { error: "Search query is required" },
        { status: 400 },
      );
    }

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();

    if (type === "users") {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchQuery, mode: "insensitive" } },
            { displayName: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
        select: getUserDataSelect(user.id),
        take: 10,
      });

      return Response.json({ users });
    }

    // Default to posts search
    const posts = await prisma.post.findMany({
      where: { content: { contains: searchQuery, mode: "insensitive" } },
      include: {
        user: {
          select: getUserDataSelect(user.id),
        },
        attachments: true,
        likes: {
          where: { userId: user.id },
          select: { userId: true },
        },
        bookmarks: {
          where: { userId: user.id },
          select: { userId: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return Response.json({ posts });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Add runtime configuration to prevent execution during build
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
