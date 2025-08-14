import { NextRequest, NextResponse } from "next/server";

// Lazy import ALL dependencies to prevent build-time initialization
async function getDeleteDependencies() {
  const [{ validateRequest }, { default: prisma }, { UTApi }] =
    await Promise.all([
      import("@/auth"),
      import("@/db"),
      import("uploadthing/server"),
    ]);

  return { validateRequest, prisma, UTApi };
}

export async function DELETE(req: NextRequest) {
  try {
    // Ensure we're in runtime, not build time
    if (!process.env.DATABASE_URL || !process.env.UPLOADTHING_SECRET) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Lazy load all dependencies
    const { validateRequest, prisma, UTApi } = await getDeleteDependencies();

    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all media that are not attached to any post (older than 24 hours)
    const unusedMedia = await prisma.media.findMany({
      where: {
        postId: null,
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      },
    });

    if (unusedMedia.length === 0) {
      return NextResponse.json({ message: "No unused media found" });
    }

    // Delete from UploadThing
    const utapi = new UTApi();
    await utapi.deleteFiles(
      unusedMedia.map(
        (mediaFile: { url: string }) =>
          mediaFile.url.split(
            `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
          )[1],
      ),
    );

    // Delete from database
    await prisma.media.deleteMany({
      where: {
        id: {
          in: unusedMedia.map((media: { id: string }) => media.id),
        },
      },
    });

    return NextResponse.json({
      message: `Deleted ${unusedMedia.length} unused media files`,
    });
  } catch (error) {
    console.error("Error deleting unused files:", error);
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
