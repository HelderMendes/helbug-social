"use client";

import { Button } from "@/components/ui/button";
import kyInstance from "@/lib/ky";
import { NotificationCountInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";

interface NotificationsButtonProps {
  initialState: NotificationCountInfo;
}

export default function NotificationsButton({
  initialState,
}: NotificationsButtonProps) {
  const { data } = useQuery({
    queryKey: ["unread-notification-count"],
    queryFn: () =>
      kyInstance
        .get("/api/notifications/unread-count")
        .json<NotificationCountInfo>(),
    // retry: false,
    initialData: initialState,
    refetchInterval: 1000 * 60,
    // refetchOnWindowFocus: false,
  });

  return (
    <Button
      variant="ghost"
      className="flex items-center justify-center gap-3"
      asChild
      title="Notifications"
    >
      <Link href="/notifications">
        <div className="relative">
          <Bell className="size-5" />
          {!!data.unreadCount && (
            <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
              {data.unreadCount}
            </span>
          )}
        </div>
        <span className="hidden lg:inline">Notifications</span>
      </Link>
    </Button>
  );
}
