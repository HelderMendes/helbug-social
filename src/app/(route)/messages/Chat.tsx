"use client";

import { Loader2 } from "lucide-react";
import useInitializeChatClient from "./useInitializeChatClient";
import { Chat as StreamChat } from "stream-chat-react";
import ChatSidebar from "./ChatSidebar";
import ChatChannel from "./ChatChannel";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function Chat() {
  const chatClient = useInitializeChatClient();
  const { resolvedTheme, systemTheme } = useTheme();
  const [themeClass, setThemeClass] = useState("str-chat__theme-light");

  useEffect(() => {
    const currentTheme =
      resolvedTheme === "system" ? systemTheme : resolvedTheme;
    if (currentTheme === "dark") {
      setThemeClass("str-chat__theme-dark");
    } else {
      setThemeClass("str-chat__theme-light");
    }
  }, [resolvedTheme, systemTheme]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!chatClient) return <Loader2 className="mx-auto my-3 animate-spin" />;

  return (
    <main className="relative w-full overflow-hidden rounded-2xl bg-card shadow-sm">
      <div className="absolute bottom-0 top-0 flex w-full">
        <StreamChat client={chatClient} theme={themeClass}>
          <ChatSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <ChatChannel
            open={!sidebarOpen}
            openSidebar={() => setSidebarOpen(true)}
          />
        </StreamChat>
      </div>
    </main>
  );
}
