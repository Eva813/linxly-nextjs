import Image from "next/image";
import { Button } from "@/components/ui/button";

interface SocialLoginButtonProps {
  provider: string;
  onClick: () => void;
  isLoading: boolean;
}

export function SocialLoginButton({ provider, onClick, isLoading }: SocialLoginButtonProps) {
  const providerLogo: Record<string, string> = {
    google: "/assets/google-logo.svg",
    // 可以擴展其他 provider
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full text-gray-700 flex items-center justify-center gap-2"
      onClick={onClick}
      disabled={isLoading}
    >
      <Image src={providerLogo[provider]} alt={`${provider} logo`} width={20} height={20} className="w-5 h-5" />
      Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
    </Button>
  );
}
