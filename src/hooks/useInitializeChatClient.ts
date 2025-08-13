import { useSession } from "@/app/(route)/SessionProvider";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";

// src/hooks/useInitializeChatClient.ts
export default function useInitializeChatClient() {
  const { user } = useSession();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let isInterrupted = false;
    const client = new StreamChat(process.env.NEXT_PUBLIC_STREAM_KEY!);

    const connectUser = async () => {
      try {
        // First, try to connect normally
        const response = await fetch("/api/get-token");
        if (!response.ok) throw new Error("Failed to get token");

        const { token } = await response.json();
        await client.connectUser(
          {
            id: user.id,
            name: user.displayName,
            username: user.username,
            image: user.avatarUrl || undefined,
          },
          token,
        );

        if (!isInterrupted) {
          setChatClient(client);
        }
      } catch (error) {
        console.error("Error connecting to Stream:", error);

        // If user doesn't exist in Stream, create them
        if (
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: string }).message === "string" &&
          (error as { message: string }).message.includes("does not exist")
        ) {
          try {
            await fetch("/api/create-stream-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id }),
            });

            // Retry connection after creating user
            const retryResponse = await fetch("/api/get-token");
            const { token } = await retryResponse.json();

            await client.connectUser(
              {
                id: user.id,
                name: user.displayName,
                username: user.username,
                image: user.avatarUrl || undefined,
              },
              token,
            );

            if (!isInterrupted) {
              setChatClient(client);
            }
          } catch (retryError) {
            console.error("Failed to create Stream user:", retryError);
          }
        }
      }
    };

    connectUser();

    return () => {
      isInterrupted = true;
      setChatClient(null);
      client.disconnectUser();
    };
  }, [user?.id, user?.displayName, user?.username, user?.avatarUrl]);

  return chatClient;
}
