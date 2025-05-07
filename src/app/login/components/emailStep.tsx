import { InputField } from '@/components/ui/InputField';
import { LoadingButton } from '@/components/ui/loadingButton';

interface EmailStepProps {
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function EmailStep({ email, setEmail, isLoading, onSubmit }: EmailStepProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
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
  );
}