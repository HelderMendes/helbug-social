"use client";

import { Button } from "@/components/ui/button";
import kyInstance from "@/lib/ky";
import { MessagesCountInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Bell, Mail } from "lucide-react";
import Link from "next/link";

interface MessagesButtonProps {
  initialState: MessagesCountInfo;
}

export default function MessagesButton({ initialState }: MessagesButtonProps) {
  const { data } = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: () =>
      kyInstance.get("/api/messages/unread-count").json<MessagesCountInfo>(),
    initialData: initialState,
    refetchInterval: 60 * 1000, // 1 minute
  });

  return (
    <Button
      variant={"ghost"}
      className="flex items-center justify-center gap-3"
      title="Messages"
      asChild
    >
      <Link href={"/messages"}>
        <div className="relative">
          <Mail className="size-5" />
          {!!data.unreadCount && (
            <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
              {data.unreadCount}
            </span>
          )}
        </div>
        <span className="hidden lg:inline">Messages</span>
      </Link>
    </Button>
  );
}
