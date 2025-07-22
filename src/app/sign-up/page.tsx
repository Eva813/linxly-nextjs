'use client'
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { signup } from "@/api/auth";
import { signIn } from "next-auth/react";
import { acceptInvite } from "@/api/spaceShares";
import { validateEmail } from "@/utils/validation";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { LoadingButton } from "@/components/ui/loadingButton";
import { ErrorMessage } from "@/components/ui/errorMessage";
import { SocialLoginButton } from "@/components/ui/socialLoginButton";
import { Eye, EyeOff } from "lucide-react";
import { FullScreenCardSpinner } from "@/components/fullScreenCardSpinner";

const ERROR_MESSAGES = {
  INVALID_EMAIL: "Invalid email address",
  EMPTY_FIELDS: "Please fill in all fields",
  SIGN_UP_FAILED: "Sign up failed",
};

export default function SignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  // 取得邀請參數
  const inviteShareId = searchParams?.get('invite');
  
  const [step, setStep] = useState(1); // 追蹤當前步驟
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [processingInvite, setProcessingInvite] = useState(false);


  // 監聽登入狀態，自動處理邀請
  useEffect(() => {
    // 避免重複處理或無限循環
    if (!session?.user?.id || !inviteShareId || processingInvite) {
      return;
    }

    const handleAutoAcceptInvite = async () => {
      try {
        setProcessingInvite(true);
        const result = await acceptInvite(inviteShareId, session.user.id);
        
        if (result.success) {
          // 跳轉到工作空間
          router.push(result.redirectUrl || `/prompts?space=${result.spaceId}`);
        } else {
          // 如果邀請接受失敗，回退到正常流程
          console.error('Auto accept invite failed:', result);
          router.push("/");
        }
      } catch (error) {
        console.error('Auto accept invite error:', error);
        // 出錯時回退到正常流程
        router.push("/");
      } finally {
        setProcessingInvite(false);
      }
    };

    handleAutoAcceptInvite();
  }, [session?.user?.id, inviteShareId, processingInvite, router]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError(ERROR_MESSAGES.EMPTY_FIELDS);
      return;
    }

    if (!validateEmail(email)) {
      setError(ERROR_MESSAGES.INVALID_EMAIL);
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError(ERROR_MESSAGES.EMPTY_FIELDS);
      return;
    }
    setIsLoading(true);

    try {
      await signup(name, email, password);

      // 自動登入
      const signInRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInRes?.error) {
        setError(signInRes.error);
      } else {
        // 註冊登入成功後，如果有邀請參數，useEffect 會自動處理
        // 如果沒有邀請參數，則正常跳轉首頁
        if (!inviteShareId) {
          router.push("/");
        }
        // 如果有邀請參數，等待 useEffect 中的邀請處理邏輯
      }
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.SIGN_UP_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (error === ERROR_MESSAGES.INVALID_EMAIL && validateEmail(email)) {
      setError("");
    }
  }, [email, error]);

  // Loading 覆蓋整個頁面當正在處理邀請時
  if (processingInvite) {
    return <FullScreenCardSpinner message="Joining workspace..." />;
  }

  const getDescription = () => {
    if (inviteShareId) {
      return step === 1 
        ? "Create your account to join the workspace" 
        : "Complete your registration to join the workspace";
    }
    return step === 1 
      ? "Enter your name and email to continue" 
      : "Enter your password to complete registration";
  };

  return (
    <AuthLayout
      title="Sign up"
      description={getDescription()}
    >
      {step === 1 && (
        <form className="space-y-4" onSubmit={handleNextStep} noValidate>
          <InputField
            id="name"
            label="Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <InputField
            id="email"
            label="Email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
            aria-describedby="email-error"
          />
          {error && <ErrorMessage message={error} id="email-error" />}
          <LoadingButton type="submit" className="w-full dark:text-gray-300" isLoading={isLoading}>
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
            Sign up
          </LoadingButton>
        </form>
      )}
      <SocialLoginButton
        provider="google"
        onClick={() => signIn('google', { callbackUrl: '/' })}
        isLoading={isLoading}
      />
      <p className="text-sm text-center text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
