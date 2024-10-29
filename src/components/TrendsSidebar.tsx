import { validateRequest } from "@/auth";
import prisma from "@/db";
import { userDataSelect } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";
import UserAvatar from "./UserAvatar";
import { Button } from "./ui/button";
import { unstable_cache } from "next/cache";

const TrendsSidebar = () => {
  return (
    <div className="w-73 sticky top-[5.25rem] hidden h-fit flex-none space-y-5 md:block lg:w-80">
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <WhoToFollow />
        <TrendingTopics />
      </Suspense>
    </div>
  );
};

async function WhoToFollow() {
  const { user } = await validateRequest();

  if (!user) return null;

  // //Using artificial delay...
  // await new Promise((run) => setTimeout(run, 5000));

  const usersToFollow = await prisma.user.findMany({
    where: {
      NOT: {
        id: user.id,
      },
    },
    select: userDataSelect,
    take: 5,
  });
  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Who to follow</div>
      {usersToFollow.map((userToFollow) => (
        <div
          className="flex items-center justify-between gap-3"
          key={userToFollow.id}
        >
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
          <Button>Follow</Button>
        </div>
      ))}
    </div>
  );
}

export default TrendsSidebar;

const getTrendingTopics = unstable_cache(
  async () => {
    const result = await prisma.$queryRaw<
      { hashtag: string; count: bigint }[]
    >`SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count 
    FROM posts 
    GROUP BY (hashtag) 
    ORDER BY count DESC, hashtag ASC 
    LIMIT 5`;
    return result.map((row) => ({
      hashtag: row.hashtag,
      count: Number(row.count),
    }));
  },
  ["trending_topics"],
  {
    revalidate: 3 * 60 * 60,
  },
);

async function TrendingTopics() {
  const TrendingTopics = await getTrendingTopics();

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      {TrendingTopics.map(({ hashtag, count }) => {
        const title = hashtag.split("#")[1];

        return (
          <Link href={`/hashtag/${title}`} key={title} className="block">
            <p
              className="line-clamp-1 break-all font-semibold hover:underline"
              title={hashtag}
            >
              {hashtag}
            </p>
            <p className="text-sm text-muted-foreground">
              {/* 2,3 millions is 2,3 min. and 100.000 is 100K */}
              {formatNumber(count)} {count === 1 ? " post" : " posts"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat("nl-NL", {
    notation: "compact",
    maximunFractionDigits: 1,
  }).format(n);
}
