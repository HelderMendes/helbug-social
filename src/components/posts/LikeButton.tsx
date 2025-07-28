import { useToast } from "@/hooks/use-toast";
import kyInstance from "@/lib/ky";
import { LikeInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  postId: string;
  initialState: LikeInfo;
  isOwnPost?: boolean;
}

export default function LikeButton({
  postId,
  initialState,
  isOwnPost,
}: LikeButtonProps) {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const queryKey: QueryKey = ["like-info", postId];

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      kyInstance.get(`/api/posts/${postId}/likes`).json<LikeInfo>(),
    initialData: initialState,
    staleTime: Infinity,
  });

  const { mutate } = useMutation({
    mutationFn: () =>
      data.isLikedByUser
        ? kyInstance.delete(`/api/posts/${postId}/likes`)
        : kyInstance.post(`/api/posts/${postId}/likes`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<LikeInfo>(queryKey);
      queryClient.setQueryData<LikeInfo>(queryKey, () => ({
        likes:
          (previousData?.likes || 0) + (previousData?.isLikedByUser ? -1 : 1),
        isLikedByUser: !previousData?.isLikedByUser,
      }));
      return { previousData };
    },
    onError(error, variables, context) {
      queryClient.setQueryData(queryKey, context?.previousData);
      console.error("Error updating like status:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the like status.",
        variant: "destructive",
      });
    },
  });

  return (
    <button
      onClick={() => mutate()}
      className="flex items-center gap-2"
      disabled={isOwnPost}
      style={isOwnPost ? { opacity: 0.5, cursor: "not-allowed" } : {}}
      title={isOwnPost ? "You cannot like your own post" : "Like"}
    >
      <Heart
        className={cn(
          "size-5",
          data.isLikedByUser ? "fill-red-500 text-red-500" : "text-gray-200",
        )}
      />
      <span className="text-sm font-medium tabular-nums">
        {data.likes} <span className="hidden sm:inline">Likes</span>
      </span>
    </button>
  );
}
