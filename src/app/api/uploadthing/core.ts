import { validateRequest } from "@/auth";
import prisma from "@/db";
import streamServerClient from "@/lib/stream";
import { createUploadthing, FileRouter } from "uploadthing/next";
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
      // Don't modify the URL - use the original UploadThing URL
      const avatarUrl = file.url;

      await prisma.user.update({
        where: { id: metadata.user.id },
        data: { avatarUrl: avatarUrl },
      });

      return { avatarUrl: avatarUrl };
    }),
  attachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Attachment uploaded:", file.url);
      // Create a media record in the database and return the ID
      const media = await prisma.media.create({
        data: {
          url: file.url,
          type: file.type.includes("image") ? "IMAGE" : "VIDEO",
        },
      });
      return { mediaId: media.id };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
