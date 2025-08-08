"use client";

import { FollowerInfo } from "@/lib/types";
import useFollowerInfo from "@/hooks/useFollowerInfo";
import { useToast } from "@/hooks/use-toast";
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import kyInstance from "@/lib/ky";
import { formatNumber } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  initialState: FollowerInfo;
  showFollowerCount?: boolean;
}

export default function FollowButton({
  userId,
  initialState,
  showFollowerCount = false,
}: FollowButtonProps) {
  // console.log(
  //   "FollowButton rendering for userId:",
  //   userId,
  //   "showFollowerCount:",
  //   showFollowerCount,
  // );

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { data } = useFollowerInfo(userId, initialState);

  const queryKey: QueryKey = ["follower-info", userId];

  const { mutate } = useMutation({
    mutationFn: () =>
      data.isFollowedByUser
        ? kyInstance.delete(`/api/users/${userId}/followers`)
        : kyInstance.post(`/api/users/${userId}/followers`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<FollowerInfo>(queryKey);

      queryClient.setQueryData<FollowerInfo>(queryKey, () => ({
        followers:
          (previousState?.followers || 0) +
          (previousState?.isFollowedByUser ? -1 : 1),
        isFollowedByUser: !previousState?.isFollowedByUser,
      }));

      return { previousState };
    },
    onError(error, variables, context) {
      queryClient.setQueryData(queryKey, context?.previousState);
      console.error(error);
      toast({
        variant: "destructive",
        title: "An error occurred 😢",
        description: "Something went wrong while updating the follow status",
      });
    },
  });

  return (
    <div className="relative inline-block" data-follow-button={userId}>
      <Button
        variant={data.isFollowedByUser ? "secondary" : "default"}
        onClick={() => mutate()}
        className="group flex flex-col items-center px-4 py-2" // group for hover
      >
        <span className="text-sm">
          {data.isFollowedByUser ? "Unfollow" : "Follow"}
        </span>
      </Button>

      {showFollowerCount && (
        <div className="pointer-events-none absolute -right-2 -top-3 select-none whitespace-nowrap rounded-full bg-zinc-100 px-1 py-0.5 text-xs font-bold text-primary opacity-100">
          +{formatNumber(data.followers)}
        </div>
      )}
    </div>
  );
}
