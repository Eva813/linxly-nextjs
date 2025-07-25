'use client'
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/api/auth";
import { signIn } from "next-auth/react";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { InputField } from "@/components/ui/InputField";
import { LoadingButton } from "@/components/ui/loadingButton";
import { ErrorMessage } from "@/components/ui/errorMessage";
import { SocialLoginButton } from "@/components/ui/socialLoginButton";
import { Eye, EyeOff } from "lucide-react";

const ERROR_MESSAGES = {
  INVALID_EMAIL: "Invalid email address",
  EMPTY_FIELDS: "Please fill in all fields",
  SIGN_UP_FAILED: "Sign up failed",
};

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 追蹤當前步驟
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 驗證電子郵件的函式
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }, []);

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
        router.push("/");
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
  }, [email, error, validateEmail]);

  return (
    <AuthLayout
      title="Sign up"
      description={step === 1 ? "Enter your name and email to continue" : "Enter your password to complete registration"}
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
