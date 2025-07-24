import { validateRequest } from "@/auth";
import prisma from "@/db";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

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

    const pageSize = 10;

    const posts = await prisma.post.findMany({
      where: { content: { contains: searchQuery, mode: "insensitive" } },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = { posts: posts.slice(0, pageSize), nextCursor };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
