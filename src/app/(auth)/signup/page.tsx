import { Metadata } from "next";
import signUpImage from "@/assets/signup-image.jpg";
import Image from "next/image";
import Link from "next/link";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return (
    <main className="flex h-screen items-center justify-center p-5">
      <div className="gb-card flex h-full max-h-[40rem] w-full max-w-[64rem] overflow-hidden rounded-2xl shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-bold">Sign up to Helbook</h1>
            <p className="text-muted-foreground">
              A place where <span className="italic">you</span> can find a
              friend
            </p>
          </div>
          <div className="space-y-5">
            <SignUpForm />
            <Link href={"/login"} className="block text-center hover:underline">
              Already have an account? Log in
            </Link>
          </div>
        </div>
        <Image
          src={signUpImage}
          alt="sign up image"
          className="hidden w-1/2 object-cover md:block"
        />
      </div>
    </main>
  );
}
