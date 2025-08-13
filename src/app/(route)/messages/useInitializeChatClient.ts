import { useEffect, useState } from "react";
import { useSession } from "../SessionProvider";
import { StreamChat } from "stream-chat";
import kyInstance from "@/lib/ky";

export default function useInitializeChatClient() {
  const { user } = useSession();
  if (!user) return null;
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    const client = new StreamChat(process.env.NEXT_PUBLIC_STREAM_KEY!);

    const connectUser = async () => {
      try {
        await client.connectUser(
          {
            id: user.id,
            username: user.username || user.id,
            name: user.displayName || user.username || `User ${user.id}`,
            image: user.avatarUrl || undefined,
          },
          async () => {
            const response = await kyInstance.get("/api/get-token");
            const data = await response.json<{ token: string }>();
            return data.token;
          },
        );
        setChatClient(client);
      } catch (error) {
        console.error("Failed to connect to Stream Chat:", error);
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
  }, [user.id, user.username, user.displayName, user.avatarUrl]);

  return chatClient;
}
