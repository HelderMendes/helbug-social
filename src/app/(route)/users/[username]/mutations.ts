import { useToast } from "@/hooks/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { UpdateUserProfileValues } from "@/lib/validation";
import {
  InfiniteData,
  QueryFilters,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "./actions";
import { PostsPage } from "@/lib/types";

export function useUpdateProfileMutation() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { startUpload: startAvatarUpload } = useUploadThing("avatar");
  const mutation = useMutation({
    mutationFn: async ({
      values,
      avatar,
    }: {
      values: UpdateUserProfileValues;
      avatar?: File;
    }) => {
      // Always update the profile first
      const updatedUser = await updateUserProfile(values);

      // Then handle avatar upload if provided
      if (avatar) {
        try {
          console.log("Starting avatar upload...");
          const uploadResult = await startAvatarUpload([avatar]);
          console.log("Avatar upload result:", uploadResult);

          if (!uploadResult || uploadResult.length === 0 || !uploadResult[0]) {
            throw new Error("Avatar upload failed - no result returned");
          }

          // Return updated user with new avatar URL
          return {
            updatedUser: { ...updatedUser, avatarUrl: uploadResult[0].url },
            avatarUrl: uploadResult[0].url,
          };
        } catch (uploadError) {
          console.error("Avatar upload failed:", uploadError);
          // Return the profile update but indicate avatar failed
          const errorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : String(uploadError);
          throw new Error(`Avatar upload failed: ${errorMessage}`);
        }
      }

      // No avatar upload needed
      return { updatedUser, avatarUrl: null };
    },
    onSuccess: async ({ updatedUser, avatarUrl }) => {
      console.log("Profile update successful:", { updatedUser, avatarUrl });

      // Cancel any ongoing queries
      const postFeedFilter: QueryFilters = { queryKey: ["post-feed"] };
      const userDataFilter: QueryFilters = { queryKey: ["user-data"] };
      const followerInfoFilter: QueryFilters = { queryKey: ["follower-info"] };

      await Promise.all([
        queryClient.cancelQueries(postFeedFilter),
        queryClient.cancelQueries(userDataFilter),
        queryClient.cancelQueries(followerInfoFilter),
      ]);

      // Update post feed data with new user info
      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        postFeedFilter,
        (oldData) => {
          if (!oldData) return;

          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              posts: page.posts.map((post) => {
                if (post.user.id === updatedUser.id) {
                  return {
                    ...post,
                    user: {
                      ...updatedUser,
                      avatarUrl: avatarUrl || updatedUser.avatarUrl,
                    },
                  };
                }
                return post;
              }),
            })),
          };
        },
      );

      // Invalidate user-specific data to refetch fresh data
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["user-data", updatedUser.username],
        }),
        queryClient.invalidateQueries({
          queryKey: ["follower-info", updatedUser.id],
        }),
      ]);

      router.refresh();

      toast({
        title: "Profile updated",
        variant: "default",
        description: "Your profile has been updated.",
      });
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
      toast({
        title: "Profile update failed",
        variant: "destructive",
        description: `Your profile could not be updated: ${error.message}`,
      });
    },
  });

  return mutation;
}
