"use server";
import { validateRequest } from "@/auth";
import prisma from "@/db";
import { getUserDataSelect } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import UserAvatar from "./UserAvatar";
import { unstable_cache } from "next/cache";
import FollowButton from "./FollowButton";
import { formatNumber } from "@/lib/utils";
import UserTooltip from "./UserTooltip";

export default async function TrendsSidebar() {
  return (
    <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <WhoToFollow />
        <TrendingTopics />
      </Suspense>
    </div>
  );
}

async function WhoToFollow() {
  const { user } = await validateRequest();

  if (!user) return null;

  const usersToFollow = await prisma.user.findMany({
    where: {
      NOT: [
        { id: user.id },
        // { id: "vqoaoa37hh4eeppy" }, // Temporarily exclude António
      ],
      followers: {
        none: {
          followerId: user.id,
        },
      },
    },
    select: getUserDataSelect(user.id),
    take: 6, // Reduced to 6 to test
  });

  // Filter out any invalid users
  const validUsers = usersToFollow.filter(
    (userToFollow: (typeof usersToFollow)[number], index: number) => {
      return (
        userToFollow &&
        userToFollow.id &&
        userToFollow.username &&
        userToFollow.displayName
      );
    },
  );

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Who to follow</div>
      {validUsers.length > 0 ? (
        <>
          {validUsers.map(
            (userToFollow: (typeof usersToFollow)[number], index: number) => {
              return (
                <div
                  key={`user-${userToFollow.id}-${index}`}
                  className="flex items-center justify-between gap-3"
                  data-user-id={userToFollow.id}
                  data-index={index}
                >
                  <UserTooltip user={userToFollow}>
                    <Link
                      href={`/users/${userToFollow.username}`}
                      className="flex items-center gap-3"
                    >
                      <UserAvatar
                        avatarUrl={userToFollow.avatarUrl}
                        className="flex-none"
                      />
                      <div>
                        <p className="line-clamp-1 break-all font-semibold hover:underline">
                          {userToFollow.displayName}
                        </p>
                        <p className="line-clamp-1 break-all text-muted-foreground">
                          @{userToFollow.username}
                        </p>
                      </div>
                    </Link>
                  </UserTooltip>
                  <FollowButton
                    userId={userToFollow.id}
                    initialState={{
                      followers: userToFollow._count.followers,
                      isFollowedByUser: userToFollow.followers.some(
                        ({ followerId }: { followerId: string }) =>
                          followerId === user.id,
                      ),
                    }}
                    showFollowerCount={true}
                  />
                </div>
              );
            },
          )}
        </>
      ) : (
        <p className="text-muted-foreground">No users to follow</p>
      )}
    </div>
  );
}

const getTrendingTopics = unstable_cache(
  async () => {
    const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
            SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count
            FROM posts
            GROUP BY (hashtag)
            ORDER BY count DESC, hashtag ASC
            LIMIT 6
        `;

    interface TrendingTopicRow {
      hashtag: string;
      count: bigint;
    }

    interface TrendingTopic {
      hashtag: string;
      count: number;
    }

    return (result as TrendingTopicRow[]).map(
      (row: TrendingTopicRow): TrendingTopic => ({
        hashtag: row.hashtag,
        count: Number(row.count),
      }),
    );
  },
  ["trending_topics"],
  {
    revalidate: 3 * 60 * 60,
  },
);

async function TrendingTopics() {
  const trendingTopics: { hashtag: string; count: number }[] =
    await getTrendingTopics();

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Trending topics</div>
      {trendingTopics.map(
        ({ hashtag, count }: { hashtag: string; count: number }) => {
          const title = hashtag.split("#")[1];

          return (
            <Link key={title} href={`/hashtag/${title}`} className="block">
              <p
                className="line-clamp-1 break-all font-semibold hover:underline"
                title={hashtag}
              >
                {hashtag}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatNumber(count)} {count === 1 ? " post" : " posts"}
              </p>
            </Link>
          );
        },
      )}
    </div>
  );
}
