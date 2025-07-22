'use client'

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ErrorMessage } from '@/components/ui/errorMessage';
import { SocialLoginButton } from '@/components/ui/socialLoginButton';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingOverlay } from '@/components/loadingOverlay';
import { FaSpinner } from 'react-icons/fa';
import { EmailStep } from './components/emailStep';
import { PasswordStep } from './components/passwordStep';
import { useLoginForm } from './hooks/useLoginForm';

export function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    step,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    showPassword,
    setShowPassword,
    processingInvite,
    inviteShareId,
    handleNextStep,
    handleSubmit,
    handleGoogleSignIn
  } = useLoginForm();

  useEffect(() => {
    if (searchParams?.has('callbackUrl') && status === 'authenticated') {
      router.push('/');
    }
  }, [searchParams, status, router]);

  // Loading 覆蓋整個頁面當正在處理邀請時
  if (processingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FaSpinner className="animate-spin text-blue-600 mb-4" size={24} />
            <p className="text-gray-600">Joining workspace...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDescription = () => {
    if (inviteShareId) {
      return step === 1 
        ? 'Sign in to join the workspace' 
        : 'Enter your password to join the workspace';
    }
    return step === 1 
      ? 'Enter your email to continue' 
      : 'Enter your password to login';
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <AuthLayout
        title="Login"
        description={getDescription()}
      >
        <ErrorMessage message={error} />

        {step === 1 && (
          <EmailStep
            email={email}
            setEmail={setEmail}
            isLoading={isLoading}
            onSubmit={handleNextStep}
          />
        )}

        {step === 2 && (
          <PasswordStep
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        )}

        <SocialLoginButton
          provider="google"
          onClick={handleGoogleSignIn}
          isLoading={isLoading}
        />

        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </AuthLayout>
    </>
  );
}