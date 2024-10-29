import PostEditor from "@/components/posts/editor/PostEditor";
import TrendsSidebar from "@/components/TrendsSidebar";
import ForYouFeed from "./ForYouFeed";

// export default async function HomePage() {
//   const posts = await prisma.post.findMany({
//     include: postDataInclude,
//     orderBy: { createdAt: "desc" },
//   });

export default function HomePage() {
  return (
    <article className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <PostEditor />
        <h1 className="text-red-300">Old Posts</h1>
        <div className="post-list">
          <ForYouFeed />
        </div>
      </div>
      <TrendsSidebar />
    </article>
  );
}
