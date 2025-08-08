import { validateRequest } from "@/auth";
import streamServerClient from "@/lib/stream";

export async function GET() {
  try {
    const { user } = await validateRequest();

    console.log("Calling get-token route for user:", user?.id);

    if (!user) return new Response("Unauthorized", { status: 401 });

    if (!process.env.NEXT_PUBLIC_STREAM_KEY || !process.env.STREAM_SECRET) {
      console.error(
        "Stream API keys are not set in the environment variables.",
      );
      return new Response("Internal Server Error", { status: 500 });
    }

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now
    const issuedAt = Math.floor(Date.now() / 1000) - 60; // 1 minute ago

    const token = streamServerClient.createToken(
      user.id,
      expirationTime,
      issuedAt,
    );
    console.log("Generated token for user:", user.id);
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching token:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
