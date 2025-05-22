import { InputField } from '@/components/ui/InputField';
import { LoadingButton } from '@/components/ui/loadingButton';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordStepProps {
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function PasswordStep({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  onSubmit
}: PasswordStepProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <InputField
        id="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
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
  );
}