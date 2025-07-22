import { useState, useEffect, useCallback } from 'react';
import { InputField } from '@/components/ui/InputField';
import { LoadingButton } from '@/components/ui/loadingButton';
import { ErrorMessage } from "@/components/ui/errorMessage";
import { validateEmail } from '@/utils/validation';

interface EmailStepProps {
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function EmailStep({ email, setEmail, isLoading, onSubmit }: EmailStepProps) {
  const [error, setError] = useState<string | null>(null);


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
    [email, onSubmit]
  );

  // 當電子郵件清空或有效時清除錯誤
  useEffect(() => {
    if (error && (!email.trim() || validateEmail(email))) {
      setError(null);
    }
  }, [email, error]);

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
      <LoadingButton type="submit" className="w-full  dark:text-gray-300" isLoading={isLoading}>
        Continue with email
      </LoadingButton>
    </form>
  );
}