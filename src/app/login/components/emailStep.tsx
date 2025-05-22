import { useState, useEffect, useCallback } from 'react';
import { InputField } from '@/components/ui/InputField';
import { LoadingButton } from '@/components/ui/loadingButton';
import { ErrorMessage } from "@/components/ui/errorMessage";

interface EmailStepProps {
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function EmailStep({ email, setEmail, isLoading, onSubmit }: EmailStepProps) {
  const [error, setError] = useState<string | null>(null);

  // 驗證電子郵件的函式
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }, []);

  // 處理表單提交
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }

      if (!validateEmail(email)) {
        setError('Invalid email address');
        return;
      }

      setError(null);
      onSubmit(e);
    },
    [email, validateEmail, onSubmit]
  );

  // 當電子郵件清空或有效時清除錯誤
  useEffect(() => {
    if (error && (!email.trim() || validateEmail(email))) {
      setError(null);
    }
  }, [email, error, validateEmail]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
      <LoadingButton type="submit" className="w-full" isLoading={isLoading}>
        Continue with email
      </LoadingButton>
    </form>
  );
}