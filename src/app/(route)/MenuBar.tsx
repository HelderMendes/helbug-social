import { validateRequest } from "@/auth";
import { Button } from "@/components/ui/button";
import prisma from "@/db";
import { Bell, Bookmark, Home, Mail } from "lucide-react";
import Link from "next/link";
import NotificationsButton from "./NotificationsButton";
import MessagesButton from "./MessagesButton";
import { UnreadMessagesNotification } from "stream-chat-react";
import streamServerClient from "@/lib/stream";

interface MenuBarProps {
  className?: string;
}
export default async function MenuBar({ className }: MenuBarProps) {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) return null;

  const [unreadNotificationsCount, unreadMessagesCount] = await Promise.all([
    prisma.notification.count({
      where: {
        recipientId: loggedInUser.id,
        read: false,
      },
    }),
    (await streamServerClient.getUnreadCount(loggedInUser.id))
      .total_unread_count,
  ]);

  return (
    <div className={className}>
      <Button
        variant={"ghost"}
        className="flex items-center justify-center gap-3"
        title="Home"
        asChild
      >
        <Link href={"/"}>
          <Home />
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>
      <NotificationsButton
        initialState={{
          unreadCount: unreadNotificationsCount,
        }}
      />
      <MessagesButton
        initialState={{
          unreadCount: unreadMessagesCount,
        }}
      />
      <Button
        variant={"ghost"}
        className="flex items-center justify-center gap-3"
        title="Bookmarks"
        asChild
      >
        <Link href={"/bookmarks"}>
          <Bookmark />
          <span className="hidden lg:inline">Bookmarks</span>
        </Link>
      </Button>
    </div>
  );
}
