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
        const oldAvatarUrl = metadata.user.avatarUrl;

        if (oldAvatarUrl) {
          try {
            // Extract the file key from the old URL for deletion
            const urlParts = oldAvatarUrl.split("/");
            const key = urlParts[urlParts.length - 1];

            if (key && key.length > 0) {
              await new UTApi().deleteFiles([key]);
            }
          } catch (error) {
            console.error("Failed to delete old avatar:", error);
            // Continue with upload - don't fail the entire process
          }
        }

        // Use the correct UploadThing URL property
        const avatarUrl = file.ufsUrl;

        await Promise.all([
          // Update user in database
          await prisma.user.update({
            where: { id: metadata.user.id },
            data: { avatarUrl: avatarUrl },
          }),
          // Update Stream user avatar
          streamServerClient.partialUpdateUser({
            id: metadata.user.id,
            set: { image: avatarUrl },
          }),
        ]);

        // Try to update Stream user, but don't fail if it doesn't work
        try {
          await streamServerClient.partialUpdateUser({
            id: metadata.user.id,
            set: { image: avatarUrl },
          });
        } catch (streamError) {
          console.error(
            "Failed to update Stream user avatar (non-critical):",
            streamError,
          );
          // Don't throw here - the main avatar update was successful
        }

        return { avatarUrl: avatarUrl };
      } catch (error) {
        console.error("Critical error in avatar upload:", error);
        throw new UploadThingError("Failed to process avatar upload");
      }
    }),

  attachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 2 },
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
