'use client'

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ErrorMessage } from '@/components/ui/errorMessage';
import { SocialLoginButton } from '@/components/ui/socialLoginButton';
import { LoadingOverlay } from '@/components/loadingOverlay';
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
    handleNextStep,
    handleSubmit,
    handleGoogleSignIn
  } = useLoginForm();

  useEffect(() => {
    if (searchParams?.has('callbackUrl') && status === 'authenticated') {
      router.push('/');
    }
  }, [searchParams, status, router]);

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <AuthLayout
        title="Login"
        description={step === 1 ? 'Enter your email to continue' : 'Enter your password to login'}
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