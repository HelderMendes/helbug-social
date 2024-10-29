"use client";

import Post from "@/components/posts/Post";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
// import DeletePostDialog from "@/components/posts/DeletePostDialog";

export default function ForYouFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "for-you"],
    // queryFn: async () => {
    //   const res = await fetch("/api/posts/for-you");
    //   if (!res.ok) {
    //     throw Error(`Request failed with status code ${res.status}`);
    //   }
    //   return res.json();
    // },
    // queryFn: kyInstance.get("/api/posts/for-you").json<PostData[]>,
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          "/api/posts/for-you",
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        )
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  // if (status === "pending") return <Loader2 className="mx-auto animate-spin" />;
  if (status === "pending") return <PostsLoadingSkeleton />;
  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        There are no posts yet...
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An error as occurred while attempting loading the posts.
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
      {/* <Button onClick={() => fetchNextPage()}>Load more pages</Button> */}

      {/* <DeletePostDialog open onClose={() => {}} post={posts[0]} /> */}
    </InfiniteScrollContainer>
  );
}
