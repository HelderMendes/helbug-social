import { validateRequest } from "@/auth";
import prisma from "@/db";
import { FollowerInfo } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    // Await the params to ensure they are properly resolved
    const { userId } = await context.params;
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        followers: {
          where: { followerId: loggedInUser.id },
          select: { followerId: true },
        },
        _count: { select: { followers: true } },
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const data: FollowerInfo = {
      followers: user._count.followers,
      isFollowedByUser: !!user.followers.length,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  // const { params } = await context;
  const { userId } = await context.params;

  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: loggedInUser.id,
            followingId: userId,
          },
        },
        create: { followerId: loggedInUser.id, followingId: userId },
        update: {},
      }),
    ]);

    // return new Response();
    return Response.json({ message: "Followed successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;

  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.follow.deleteMany({
        where: { followerId: loggedInUser.id, followingId: userId },
      }),
    ]);

    // return new Response();
    return Response.json(
      { message: "Un followed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
