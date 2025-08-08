import { Metadata } from "next";
import Chat from "./Chat";

export const metadata: Metadata = {
  title: "Messages",
  description: "Your messages and conversations",
};

export default function MessagesPage() {
  return <Chat />;
}
