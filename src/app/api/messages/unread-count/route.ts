import { validateRequest } from "@/auth";
import streamServerClient from "@/lib/stream";
import { MessagesCountInfo } from "@/lib/types";

export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }
    const { total_unread_count } = await streamServerClient.getUnreadCount(
      user.id,
    );

    const data: MessagesCountInfo = {
      unreadCount: total_unread_count,
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in GET /messages/unread-count:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
