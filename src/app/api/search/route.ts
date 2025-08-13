import { validateRequest } from "@/auth";
import prisma from "@/db";
import { getPostDataInclude, PostsPage } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limitSearchItems = 10;

    const cursor = searchParams.get("cursor") || undefined;

    const { user } = await validateRequest();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!query.trim()) {
      return Response.json({ posts: [], nextCursor: null }, { status: 200 });
    }

    // For better search, split query into terms
    const searchTerms = query.trim().split(/\s+/);

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          {
            content: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            user: {
              displayName: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              username: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
          // {
          //   comments: {
          //     some: {
          //       content: {
          //         contains: query,
          //         mode: "insensitive",
          //       },
          //     },
          //   },
          // },
          // Additional: search for individual terms in content for better results
          ...searchTerms.map((term) => ({
            content: {
              contains: term,
              mode: "insensitive" as const,
            },
          })),
          // Search for individual terms in user names
          ...searchTerms.map((term) => ({
            user: {
              displayName: {
                contains: term,
                mode: "insensitive" as const,
              },
            },
          })),
          ...searchTerms.map((term) => ({
            user: {
              username: {
                contains: term,
                mode: "insensitive" as const,
              },
            },
          })),
          // ...searchTerms.map((term) => ({
          //   comments: {
          //     some: {
          //       content: {
          //         contains: term,
          //         mode: "insensitive" as const,
          //       },
          //     },
          //   },
          // })),
        ],
      },
      include: getPostDataInclude(user.id),
      orderBy: {
        createdAt: "desc",
      },
      take: limitSearchItems + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const nextCursor =
      posts.length > limitSearchItems ? posts[limitSearchItems].id : null;

    const data: PostsPage = {
      posts: posts.slice(0, limitSearchItems),
      nextCursor,
    };

    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/search:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const query = searchParams.get("q") || "";
//     const type = searchParams.get("type") || "posts"; // posts, comments, users
//     const cursor = searchParams.get("cursor") || undefined;
//     const limit = 5;

//     const { user } = await validateRequest();
//     if (!user) return new Response("Unauthorized", { status: 401 });
//     if (!query.trim()) return Response.json({ results: [], nextCursor: null });

//     let results: any[] = [];
//     let nextCursor: string | null = null;

//     if (type === "posts") {
//       const posts = await prisma.post.findMany({
//         where: {
//           content: { contains: query, mode: "insensitive" },
//         },
//         include: getPostDataInclude(user.id),
//         orderBy: { createdAt: "desc" },
//         take: limit + 1,
//         ...(cursor && { cursor: { id: cursor }, skip: 1 }),
//       });

//       results = posts.slice(0, limit);
//       nextCursor = posts.length > limit ? posts[limit].id : null;
//     }

//     if (type === "comments") {
//       const comments = await prisma.comment.findMany({
//         where: {
//           content: { contains: query, mode: "insensitive" },
//         },
//         include: { user: true, post: true },
//         orderBy: { createdAt: "desc" },
//         take: limit + 1,
//         ...(cursor && { cursor: { id: cursor }, skip: 1 }),
//       });

//       results = comments.slice(0, limit);
//       nextCursor = comments.length > limit ? comments[limit].id : null;
//     }

//     if (type === "users") {
//       const users = await prisma.user.findMany({
//         where: {
//           OR: [
//             { displayName: { contains: query, mode: "insensitive" } },
//             { username: { contains: query, mode: "insensitive" } },
//           ],
//         },
//         orderBy: { createdAt: "desc" },
//         take: limit + 1,
//         ...(cursor && { cursor: { id: cursor }, skip: 1 }),
//       });

//       results = users.slice(0, limit);
//       nextCursor = users.length > limit ? users[limit].id : null;
//     }

//     return Response.json({ results, nextCursor }, { status: 200 });
//   } catch (error) {
//     console.error("Error in GET /api/search:", error);
//     return new Response("Internal Server Error", { status: 500 });
//   }
// }
