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

    // Create Stream user
    await streamServerClient.upsertUser({
      id: user.id,
      name: user.displayName,
      username: user.username,
      image: user.avatarUrl,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error creating Stream user:", error);
    return Response.json(
      { error: "Failed to create Stream user" },
      { status: 500 },
    );
  }
}
