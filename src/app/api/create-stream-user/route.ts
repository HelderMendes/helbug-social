// src/app/api/create-stream-user/route.ts
import { validateRequest } from "@/auth";
import streamServerClient from "@/lib/stream";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // console.log(
    //   "Creating Stream user for:",
    //   user.id,
    //   user.username,
    //   user.displayName,
    // );

    // Create Stream user with fallbacks
    const streamUserData = {
      id: user.id,
      name: user.displayName || user.username || `User ${user.id}`,
      username: user.username || user.id,
      image: user.avatarUrl || undefined,
      role: "user",
    };

    // console.log("Stream user data:", streamUserData);

    const result = await streamServerClient.upsertUser(streamUserData);

    // console.log("Stream user upserted successfully");

    return Response.json({ success: true, user: result.users[user.id] });
  } catch (error) {
    console.error("Error creating Stream user:", error);
    return Response.json(
      {
        error: "Failed to create Stream user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
