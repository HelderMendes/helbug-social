"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import UserAvatar from "@/components/UserAvatar";
import { useSession } from "@/app/(route)/SessionProvider";
import "./styles.css";
import { useSubmitPostMutation } from "./mutations";
import LoadingButton from "@/components/LoadingButton";

export default function PostEditor() {
  const { user } = useSession();
  const mutation = useSubmitPostMutation();

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          bold: false,
          italic: false,
        }),
        Placeholder.configure({
          placeholder: "What's in your mind?",
        }),
      ],
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none",
        },
      },
      immediatelyRender: false,
      enablePasteRules: true,

      content: `
          <h2>
            Hi there,
          </h2>
          <p>
            this is a basic <em>basic</em> example of <strong>Tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
          </p>
          <p>
            I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
          </p>
          <blockquote>
            Wow, that’s amazing. Good work, boy! 👏
            <br />
            — Mom
          </blockquote>
        `,
    },
    [],
  );

  const input =
    editor?.getText({
      blockSeparator: "\n",
    }) || "";

  // async function onSubmit() {
  //   await submitPost(input);
  //   editor?.commands.clearContent();
  // }
  function onSubmit() {
    mutation.mutate(input, {
      onSuccess: () => {
        editor?.commands.clearContent();
      },
    });
  }

  return (
    <div className="p- flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex gap-5">
        <UserAvatar avatarUrl={user.avatarUrl} className="hidden sm:inline" />
        <EditorContent
          editor={editor}
          className="pv-3 max-h-[20rem] w-full overflow-y-auto rounded-2xl bg-zinc-100 px-5 text-gray-800"
        />
      </div>
      <div className="flex justify-end">
        <LoadingButton
          loading={mutation.isPending}
          disabled={!input.trim()}
          className="min-w-20"
          onClick={onSubmit}
        >
          Save Post
        </LoadingButton>
      </div>
    </div>
  );
}
