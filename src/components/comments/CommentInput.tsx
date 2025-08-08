import { PostData } from "@/lib/types";
import { useState } from "react";
import { useSubmitCommentMutation } from "./mutation";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, SendHorizonal } from "lucide-react";

interface CommentInputPros {
  post: PostData;
}

export default function CommentInput({ post }: CommentInputPros) {
  const [input, setInput] = useState("");

  const mutation = useSubmitCommentMutation(post.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input) return;

    mutation.mutate(
      {
        post,
        content: input,
      },
      {
        onSuccess: () => setInput(""),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Write your comment..."
        autoFocus
        name="comment"
      />
      <Button
        type="submit"
        variant={"ghost"}
        size={"icon"}
        disabled={!input.trim() || mutation.isPending}
      >
        {!mutation.isPending ? (
          <SendHorizonal className="size-5" />
        ) : (
          <Loader2 className="size-7 animate-spin" />
        )}
      </Button>
    </form>
  );
}
