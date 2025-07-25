import prisma from "@/db";
import { UTApi } from "uploadthing/server";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    console.log("Starting cleanup process...");

    const unusedMedia = await prisma.media.findMany({
      where: {
        postId: null,
      },
      select: { id: true, url: true },
    });

    console.log(`Found ${unusedMedia.length} unused media files`);

    if (unusedMedia.length === 0) {
      return NextResponse.json(
        { message: "No unused uploads found" },
        { status: 200 },
      );
    }

    const fileKeysToDelete = unusedMedia
      .map((file) => {
        const parts = file.url.split("/");
        const key = parts[parts.length - 1];
        console.log(`Extracting key from URL: ${file.url} -> ${key}`);
        return key;
      })
      .filter(Boolean);

    console.log(
      `Attempting to delete ${fileKeysToDelete.length} files from UploadThing:`,
      fileKeysToDelete,
    );

    // Fix: Properly instantiate UTApi
    if (fileKeysToDelete.length > 0) {
      const utapi = new UTApi();
      const deleteResult = await utapi.deleteFiles(fileKeysToDelete);
      console.log("UploadThing deletion result:", deleteResult);
    }

    console.log("Deleting media records from database...");
    const deleteResult = await prisma.media.deleteMany({
      where: {
        id: { in: unusedMedia.map((file) => file.id) },
      },
    });

    console.log(
      `Successfully deleted ${deleteResult.count} media records from database`,
    );

    return NextResponse.json(
      {
        message: "Unused uploads cleared successfully",
        deletedCount: unusedMedia.length,
        fileKeys: fileKeysToDelete,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error clearing uploads:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}
