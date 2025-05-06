'use client'
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { LoadingButton } from "@/components/ui/loadingButton";
import { ErrorMessage } from "@/components/ui/errorMessage";
import { SocialLoginButton } from "@/components/ui/socialLoginButton";
import { LoadingOverlay } from "@/components/loadingOverlay";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1); // 追蹤當前步驟
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  
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
      <AuthLayout
        title="Login"
        description={step === 1 ? "Enter your email to continue" : "Enter your password to login"}
      >
        <ErrorMessage message={error} />
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleNextStep}>
            <InputField
              id="email"
              label="Email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <LoadingButton type="submit" className="w-full" isLoading={isLoading}>
              Continue with email
            </LoadingButton>
          </form>
        )}
        {step === 2 && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <InputField
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              }
            />
            <LoadingButton type="submit" className="w-full" isLoading={isLoading}>
              Login
            </LoadingButton>
          </form>
        )}
        <SocialLoginButton
          provider="google"
          onClick={handleGoogleSignIn}
          isLoading={isLoading}
        />
        <p className="text-sm text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </AuthLayout>
    </>
  );
}