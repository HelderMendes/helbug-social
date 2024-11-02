"use server";

import { validateRequest } from "@/auth";
import prisma from "@/db";
import { getPostDataInclude } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";
// import { revalidatePath } from "next/cache";

export async function submitPost(input: string) {
  const { user } = await validateRequest();
  if (!user) throw Error("unauthorized - user is not authenticated");

  const { content } = createPostSchema.parse({ content: input });

  const newPost = await prisma.post.create({
    data: {
      content,
      userId: user.id,
    },
    include: getPostDataInclude(user.id),
  });
  return newPost;

  // //Only makes sense when this runs in a server Comp and we want to refresh the server Comp
  // // Here the feeds are on the client zo i need to update them through react queries API's
  // revalidatePath("/(route)/post/[slug]", "page");
}
