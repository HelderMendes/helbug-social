import { validateRequest } from "@/auth";
import prisma from "@/db";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    // Await the params to ensure they are properly resolved
    const { userId } = await context.params;

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    // //Test timeOut()
    // await new Promise((r) => setTimeout(r, 2000));

    const pageSize = 10; //fetch pageSize posts

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: { userId },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = { posts: posts.slice(0, pageSize), nextCursor };

    // return Response.json(data);
    return new Response(JSON.stringify(data));
  } catch (error) {
    console.error(error);
    // return Response.json({ error: "Internal Server Error" }, { status: 500 });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
