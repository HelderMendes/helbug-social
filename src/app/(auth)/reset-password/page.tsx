import { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";
import Link from "next/link";
import loginImage from "@/assets/login-image.jpg";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Reset Password",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

const ResetPasswordPage = async ({ searchParams }: ResetPasswordPageProps) => {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex h-screen items-center justify-center p-5">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold text-destructive">
            Invalid Reset Link
          </h1>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-blue-600 hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen items-center justify-center p-5">
      <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your new password below.
            </p>
          </div>
          <div className="space-y-5">
            <ResetPasswordForm token={token} />
            <Link href="/login" className="block text-center hover:underline">
              Back to login
            </Link>
          </div>
        </div>
        <Image
          src={loginImage}
          alt="reset password image"
          className="hidden w-1/2 object-cover md:block"
        />
      </div>
    </main>
  );
};

export default ResetPasswordPage;
