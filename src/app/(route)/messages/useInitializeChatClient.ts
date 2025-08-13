import { useEffect, useState } from "react";
import { useSession } from "../SessionProvider";
import { StreamChat } from "stream-chat";
import kyInstance from "@/lib/ky";

export default function useInitializeChatClient() {
  const { user } = useSession();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    if (!user) return;

    const client = new StreamChat(process.env.NEXT_PUBLIC_STREAM_KEY!);

    const connectUser = async () => {
      try {
        // console.log("Starting Stream Chat connection for user:", user.id);

        // First, ensure the user exists in Stream
        // console.log("Creating/updating Stream user...");
        const userResponse = await kyInstance.post("/api/create-stream-user");
        // console.log("Stream user creation response:", userResponse.status);

        // Then get the token
        const response = await kyInstance.get("/api/get-token");
        const data = await response.json<{ token: string }>();

        // console.log("Token received, connecting user...");

        // Finally connect with the token
        await client.connectUser(
          {
            id: user.id,
            username: user.username || user.id,
            name: user.displayName || user.username || `User ${user.id}`,
            image: user.avatarUrl || undefined,
          },
          data.token,
        );

        // console.log("Stream Chat connection successful");
        setChatClient(client);
      } catch (error) {
        console.error("Failed to connect to Stream Chat:", error);
        // If it's a user_details error, let's try to retry after a short delay
        if (error instanceof Error && error.message.includes("user_details")) {
          console.log("Retrying connection after user_details error...");
          setTimeout(() => connectUser(), 1000);
        }
      }
    };

    connectUser();

    return () => {
      setChatClient(null);
      client
        .disconnectUser()
        .catch((error) =>
          console.error("Failed to disconnect from Stream Chat:", error),
        )
        .then(() =>
          console.log("Disconnected from Stream Chat _ Connection Closed"),
        );
    };
  }, [user]);

  return user ? chatClient : null;
}
