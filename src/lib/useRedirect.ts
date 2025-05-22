// src/hooks/useRedirect.ts
import { useRouter } from 'next/navigation';

export const useRedirect = () => {
  const router = useRouter();

  const redirectToLogin = () => {
    router.push('/login');
  };

  return { redirectToLogin };
};
