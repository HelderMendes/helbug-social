"use server";

import { validateRequest } from "@/auth";
import prisma from "@/db";
import streamServerClient from "@/lib/stream";
import { getUserDataSelect } from "@/lib/types";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";
import { Prisma } from "@prisma/client";

export async function updateUserProfile(values: UpdateUserProfileValues) {
  const validateValues = updateUserProfileSchema.parse(values);

  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const updatedUser = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: validateValues,
        select: getUserDataSelect(user.id),
      });
      await streamServerClient.partialUpdateUser({
        id: user.id,
        set: {
          name: validateValues.displayName,
        },
      });
      return updatedUser;
    },
  );

  return updatedUser;
}
