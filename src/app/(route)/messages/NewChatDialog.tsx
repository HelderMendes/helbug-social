import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { DefaultStreamChatGenerics, useChatContext } from "stream-chat-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "../SessionProvider";
import { useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import { UserResponse } from "stream-chat";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, SearchIcon, X } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import LoadingButton from "@/components/LoadingButton";

interface NewChatDialogProps {
  onOpenChange: (open: boolean) => void;
  onChatCreated: () => void;
}

export default function NewChatDialog({
  onOpenChange,
  onChatCreated,
}: NewChatDialogProps) {
  const { client, setActiveChannel } = useChatContext();

  const { toast } = useToast();

  const { user: loggedInUser } = useSession();

  const [searchInput, setSearchInput] = useState("");
  const searchInputDebounced = useDebounce(searchInput);

  const [selectedUsers, setSelectedUsers] = useState<
    UserResponse<DefaultStreamChatGenerics>[]
  >([]);

  const { data, isFetching, isError, isSuccess } = useQuery({
    queryKey: ["stream-users", searchInputDebounced],
    queryFn: async () => {
      return client.queryUsers(
        {
          id: { $ne: loggedInUser.id },
          role: { $ne: "admin" },
          ...(searchInputDebounced
            ? {
                $or: [
                  { name: { $autocomplete: searchInputDebounced } },
                  { username: { $autocomplete: searchInputDebounced } },
                ],
              }
            : {}),
        },
        { name: 1, username: 1 },
        { limit: 15 },
      );
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const channel = client.channel("messaging", {
        members: [loggedInUser.id, ...selectedUsers.map((u) => u.id)],
        name:
          selectedUsers.length > 1
            ? loggedInUser.displayName +
              " and " +
              selectedUsers.map((u) => u.name).join(", ")
            : selectedUsers[0].name,
      });
      await channel.create();
      return channel;
    },
    onSuccess: (channel) => {
      setActiveChannel(channel);
      onChatCreated();
    },
    onError: (error) => {
      console.error("Error creating chat:", error);
      toast({
        title: "Error creating chat",
        description:
          "There was an error on starting the chat. Please try again later.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Create New Chat</DialogTitle>
        </DialogHeader>
        <div className="pb-6">
          <div className="group relative">
            <SearchIcon className="absolute left-5 top-1/2 size-5 -translate-y-1 text-muted-foreground group-focus-within:text-primary" />
            <input
              placeholder="Search users..."
              className="h-12 w-full pe-4 focus:outline-none focus:ring-0"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          {!!selectedUsers.length && (
            <div className="p2 mt-4 flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <SelectedUserTag
                  key={user.id}
                  user={user}
                  onRemove={() =>
                    setSelectedUsers((prev) =>
                      prev.filter((u) => u.id !== user.id),
                    )
                  }
                />
              ))}
            </div>
          )}
          {isSuccess && !data.users.length && (
            <p className="my-3 text-center text-muted-foreground">
              No users found. Try a different name search.
            </p>
          )}
          {isFetching && (
            <p className="my-8 text-center text-muted-foreground">
              <Loader2 className="mx-auto my-3 animate-spin" size={36} />
              Loading...
            </p>
          )}
          {isError && (
            <p className="my-3 text-center text-destructive">
              Error loading users. Please try again later.
            </p>
          )}

          <hr />
          <div className="max-h-96 overflow-y-auto">
            {isSuccess &&
              data.users.map((user) => (
                <UserResult
                  key={user.id}
                  user={user}
                  selected={selectedUsers.some((u) => u.id === user.id)}
                  onClick={() => {
                    setSelectedUsers(
                      (prev): UserResponse<DefaultStreamChatGenerics>[] => {
                        return prev.some((u) => u.id === user.id)
                          ? prev.filter((u) => u.id !== user.id)
                          : [...prev, user];
                      },
                    );
                  }}
                />
              ))}
          </div>
        </div>
        <DialogFooter className="px-6 pb-6">
          <LoadingButton
            loading={mutation.isPending}
            disabled={!selectedUsers.length}
            onClick={() => {
              mutation.mutate();
            }}
          >
            Start Chat
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
interface UserResultProps {
  user: UserResponse<DefaultStreamChatGenerics>;
  selected: boolean;
  onClick: () => void;
}

function UserResult({ user, selected, onClick }: UserResultProps) {
  return (
    <button
      className="flex w-full items-center px-4 py-2.5 transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <UserAvatar avatarUrl={user.image} size={40} className="rounded-full" />
        <div className="flex flex-col text-start">
          <p className="font-bold">{user.name}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      {selected && <Check className="ms-auto size-5 text-primary" />}
    </button>
  );
}

interface SelectedUserTagProps {
  user: UserResponse<DefaultStreamChatGenerics>;
  onRemove: () => void;
}
function SelectedUserTag({ user, onRemove }: SelectedUserTagProps) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-2 rounded-full border p-1 hover:bg-muted/50"
    >
      <UserAvatar avatarUrl={user.image} size={24} className="rounded-full" />
      <p className="font-bold">{user.name}</p>
      <X className="mx-2 size-5 text-muted-foreground hover:text-primary" />
    </button>
  );
}
