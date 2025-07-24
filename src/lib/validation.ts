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
  content: requiredString.min(10, "Must be at least 10 characters"),
  mediaIds: z.array(z.string()).max(5, "There is a maximum of 5 uploads"),
});

export const updateUserProfileSchema = z.object({
  displayName: requiredString,
  bio: z.string().max(1000, "Bio must be less than 1000 characters"),
  avatarUrl: z.string().url().optional(),
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;
