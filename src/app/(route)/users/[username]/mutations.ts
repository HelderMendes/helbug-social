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

          const uploadData = uploadResult[0];
          console.log("Upload data:", uploadData);
          console.log("Upload serverData:", uploadData.serverData);

          const newAvatarUrl = uploadData.serverData?.avatarUrl;
          console.log("New avatar URL from upload:", newAvatarUrl);

          if (!newAvatarUrl) {
            throw new Error("Avatar URL not returned from upload");
          }

          // Return updated user with new avatar URL from UploadThing response
          return {
            updatedUser: {
              ...updatedUser,
              avatarUrl: newAvatarUrl,
            },
            avatarUrl: newAvatarUrl,
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

      // Use the updated user data with the new avatar URL
      const finalUserData = avatarUrl
        ? { ...updatedUser, avatarUrl }
        : updatedUser;

      console.log("Final user data for cache update:", finalUserData);

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

          console.log("Updating post feed cache with user:", finalUserData);

          const updatedData = {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              posts: page.posts.map((post) => {
                if (post.user.id === finalUserData.id) {
                  console.log(
                    "Updating post user from:",
                    post.user.avatarUrl,
                    "to:",
                    finalUserData.avatarUrl,
                  );
                  return {
                    ...post,
                    user: finalUserData,
                  };
                }
                return post;
              }),
            })),
          };

          console.log("Post feed cache updated");
          return updatedData;
        },
      );

      // Invalidate user-specific data to refetch fresh data
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["user-data", finalUserData.username],
        }),
        queryClient.invalidateQueries({
          queryKey: ["follower-info", finalUserData.id],
        }),
        // Also update user data cache directly for immediate UI updates
        queryClient.setQueryData(
          ["user-data", finalUserData.username],
          finalUserData,
        ),
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
