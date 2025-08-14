import { NextRequest, NextResponse } from "next/server";

// Lazy import ALL dependencies to prevent build-time initialization
async function getUploadThingDependencies() {
  const [{ createRouteHandler }, { default: ourFileRouter }] =
    await Promise.all([import("uploadthing/next"), import("./core")]);

  return { createRouteHandler, ourFileRouter };
}

async function handleRequest(req: NextRequest) {
  try {
    // Ensure we're in runtime, not build time
    if (!process.env.UPLOADTHING_SECRET) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Lazy load all dependencies
    const { createRouteHandler, ourFileRouter } =
      await getUploadThingDependencies();

    const { GET: handleGET, POST: handlePOST } = createRouteHandler({
      router: ourFileRouter,
    });

    if (req.method === "GET") {
      return handleGET(req);
    } else if (req.method === "POST") {
      return handlePOST(req);
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }
  } catch (error) {
    console.error("UploadThing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

// Add runtime configuration to prevent execution during build
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
