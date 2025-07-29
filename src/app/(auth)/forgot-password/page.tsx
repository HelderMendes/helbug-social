import { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";
import Link from "next/link";
import loginImage from "@/assets/login-image.jpg";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Forgot Password",
};

const ForgotPasswordPage = () => {
  return (
    <main className="flex h-screen items-center justify-center p-5">
      <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-bold">Forgot Password</h1>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>
          <div className="space-y-5">
            <ForgotPasswordForm />
            <Link href="/login" className="block text-center hover:underline">
              Back to login
            </Link>
          </div>
        </div>
        <Image
          src={loginImage}
          alt="forgot password image"
          className="hidden w-1/2 object-cover md:block"
        />
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
