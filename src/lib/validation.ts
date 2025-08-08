import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required");

export const signUpSchema = z.object({
  email: requiredString.email("Invalid email address"),
  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Only letters, numbers, - and _ allowed",
  ),
  password: requiredString.min(8, "Must be at least 8 characters"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  content: requiredString.min(1, "Content is required"),
  mediaIds: z.array(z.string()).max(5, "There is a maximum of 5 uploads"),
});

export const updateUserProfileSchema = z.object({
  displayName: requiredString,
  bio: z.string().max(1000, "Bio must be less than 1000 characters"),
  avatarUrl: z.string().url().optional(),
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

export const forgotPasswordSchema = z.object({
  email: requiredString.email("Invalid email address"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: requiredString,
    password: requiredString.min(8, "Must be at least 8 characters"),
    confirmPassword: requiredString,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// Utility function to convert username to display name
export function generateDisplayName(username: string): string {
  return (
    username
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, " ")
      // Split into words and capitalize each word
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
      // Clean up any double spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

export const createCommentSchema = z.object({
  content: requiredString.min(1, "Content is required"),
});
