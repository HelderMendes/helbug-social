import { validateRequest } from "@/auth";
import prisma from "@/db";
import { getPostDataInclude, UserData, UserWithFollowers } from "@/lib/types";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import Post from "@/components/posts/Post";
import UserTooltip from "@/components/UserTooltip";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { Loader2 } from "lucide-react";
import Linkify from "@/components/Linkify";
import FollowButton from "@/components/FollowButton";

interface PageProps {
  params: Promise<{ postId: string }>;
}

const getPost = cache(async (postId: string, loggedInUserId: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: getPostDataInclude(loggedInUserId),
  });

  if (!post) notFound();

  return post;
});

export async function generateMetadata({ params }: PageProps) {
  const { postId } = await params;
  const { user } = await validateRequest();

  if (!user) return {};

  const post = await getPost(postId, user.id);

  if (!post) return {};

  // Generate metadata for the post
  return { title: `${post.user.displayName}: ${post.content.slice(0, 50)}...` };
}

export default async function Page({ params }: PageProps) {
  const { postId } = await params;
  const { user } = await validateRequest();

  if (!user) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const post = await getPost(postId, user.id);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <Post post={post} />
      </div>
      <div className="sticky top-[5.25rem] hidden h-fit w-80 flex-none space-y-5 lg:block">
        <Suspense
          fallback={<Loader2 className="mx-auto size-5 animate-spin" />}
        >
          <UserInfoSidebar user={post.user} />
        </Suspense>
      </div>
    </main>
  );
}

interface UserInfoSidebarProps {
  // user: UserData;
  user: UserWithFollowers;
  loggedInUser: { id: string };
}

async function UserInfoSidebar({ user }: UserInfoSidebarProps) {
  const { user: loggedInUser } = await validateRequest();

  // Simulate loading delay
  // await new Promise((resolve) => setTimeout(resolve, 2000));

  if (!loggedInUser) return null;

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">
        <UserTooltip user={user}>
          <Link
            href={`/users/${user.username}`}
            className="flex items-center gap-3"
          >
            <UserAvatar avatarUrl={user.avatarUrl} className="flex-none" />
            <div>
              <p className="line-clamp-1 break-all font-semibold hover:underline">
                {user.displayName}
              </p>
              <p className="break-al line-clamp-1 text-muted-foreground/70 hover:text-primary">
                @{user.username}
              </p>
            </div>
          </Link>
        </UserTooltip>
        <Linkify>
          <div className="mt-1 line-clamp-6 whitespace-pre-line break-words text-sm text-muted-foreground/80">
            {user.bio || "This user hasn't set a bio yet."}
          </div>
        </Linkify>
        <div className="mt-3">
          <FollowButton
            userId={user.id}
            initialState={{
              followers: user._count.followers,
              isFollowedByUser: user.followers.some(
                (f) => f.followerId === loggedInUser.id,
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
