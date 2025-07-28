import { validateRequest } from "@/auth";
import prisma from "@/db";
import streamServerClient from "@/lib/stream";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

const f = createUploadthing();

export const fileRouter = {
  avatar: f({ image: { maxFileSize: "512KB" } })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      return { user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Avatar upload complete, processing...", {
          userId: metadata.user.id,
          fileUrl: file.ufsUrl,
          fileName: file.name,
          fileSize: file.size,
        });

        const oldAvatarUrl = metadata.user.avatarUrl;

        if (oldAvatarUrl) {
          try {
            // Extract the file key from the old URL for deletion
            const urlParts = oldAvatarUrl.split("/");
            const key = urlParts[urlParts.length - 1];

            if (key && key.length > 0) {
              console.log(`Deleting old avatar with key: ${key}`);
              await new UTApi().deleteFiles([key]);
              console.log("Old avatar deleted successfully");
            }
          } catch (error) {
            console.error("Failed to delete old avatar:", error);
            // Continue with upload - don't fail the entire process
          }
        }

        // Use the correct UploadThing URL property
        const avatarUrl = file.ufsUrl;
        console.log("Updating user avatar URL:", avatarUrl);

        // Update user in database
        await prisma.user.update({
          where: { id: metadata.user.id },
          data: { avatarUrl: avatarUrl },
        });

        // Try to update Stream user, but don't fail if it doesn't work
        try {
          await streamServerClient.partialUpdateUser({
            id: metadata.user.id,
            set: { image: avatarUrl },
          });
          console.log("Stream user avatar updated successfully");
        } catch (streamError) {
          console.error(
            "Failed to update Stream user avatar (non-critical):",
            streamError,
          );
          // Don't throw here - the main avatar update was successful
        }

        console.log("Avatar update completed successfully");
        return { avatarUrl: avatarUrl };
      } catch (error) {
        console.error("Critical error in avatar upload:", error);
        throw new UploadThingError("Failed to process avatar upload");
      }
    }),

  attachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      return {};
    })
    .onUploadComplete(async ({ file }) => {
      const media = await prisma.media.create({
        data: {
          url: file.ufsUrl, // Use ufsUrl instead of deprecated file.url
          type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
        },
      });

      return { mediaId: media.id };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
