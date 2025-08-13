"use server";

import {
  signUpSchema,
  SignUpValues,
  generateDisplayName,
} from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import prisma from "@/db";
import { lucia } from "@/auth";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { cookies } from "next/headers";
import { generateIdFromEntropySize } from "lucia";
import streamServerClient from "@/lib/stream";

export async function signUp(
  credentials: SignUpValues,
): Promise<{ error: string }> {
  try {
    const { username, email, password } = signUpSchema.parse(credentials);
    const passwordHash = await hash(password, {
      // recommended minimum parameters
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10); // 16 characters long

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });
    if (existingUsername) {
      return { error: "Username already taken" };
    }

    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });
    if (existingEmail) {
      return {
        error: "This email already exists",
      };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: generateDisplayName(username),
          email,
          passwordHash,
        },
      });

      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: username,
      });
    });

    // await prisma.user.create({
    //   data: {
    //     id: userId,
    //     username,
    //     displayName: generateDisplayName(username),
    //     email,
    //     passwordHash,
    //   },
    // });

    // await streamServerClient.upsertUser({
    //   id: userId,
    //   username,
    //   name: username,
    // });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: "Something went very wrong. Try once more... Please! ",
    };
  }
}
