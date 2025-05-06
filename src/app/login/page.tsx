'use client'
import Link from "next/link";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { LoadingOverlay } from "@/components/loadingOverlay";

export default function Login() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1); // 追蹤當前步驟
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // 檢查是否從 Google 登入跳轉回來
  useEffect(() => {
    const error = searchParams?.get('error');
    if (error) {
      setError("Google 登入失敗，請重試");
      setIsLoading(false);
    }
    
    // 從 Google 認證回來並且登入成功時，重定向到首頁
    if (searchParams?.has('callbackUrl') && status === 'authenticated') {
      router.push('/');
    }
  }, [searchParams, status, router]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/");
      }
    } catch {
      setError("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // 使用自定義回調 URL，將重定向回登入頁面，然後在登入頁面檢查認證狀態
    signIn("google", { callbackUrl: "/login?callbackUrl=/" });
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <div className="flex items-center justify-center bg-gray-50 min-h-[calc(100vh-4rem-1px)]">
        <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-900">Login</h2>
          <p className="text-center text-gray-600">
            {step === 1
              ? "Enter your email to continue"
              : "Enter your password to login"}
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {step === 1 && (
            <form className="space-y-4" onSubmit={handleNextStep}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  className="mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Loading..." : "Continue with email"}
              </Button>
            </form>
          )}
          {step === 2 && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Loading..." : "Login"}
              </Button>
            </form>
          )}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full text-gray-700 flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Image
              src="/assets/google-logo.svg"
              alt="Google logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            使用 Google 登入
          </Button>
          <p className="text-sm text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}