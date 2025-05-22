import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error) {
      setError('Google 登入失敗，請重試');
      setIsLoading(false);
    }
  }, [searchParams, setError, setIsLoading]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/');

      // 通知內容腳本 (Content Script)
      window.postMessage({
        type: 'FROM_LOGIN_PAGE', // 自訂訊息類型
        action: 'USER_LOGGED_IN',
        data: {
          // 傳遞一些使用者資訊，注意不要洩漏敏感資訊
          // 例如：status: 'loggedIn' 或部分使用者 ID
          status: 'loggedIn'
        }
      }, window.location.origin)
      }
    } catch {
      setError('Login failed');
    } finally {
      setIsLoading(false);
      
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    signIn('google', { callbackUrl: '/login?callbackUrl=/' });

      // 通知內容腳本 (Content Script)
      window.postMessage({
        type: 'FROM_LOGIN_PAGE', // 自訂訊息類型
        action: 'USER_LOGGED_IN',
        data: {
          // 傳遞一些使用者資訊，注意不要洩漏敏感資訊
          // 例如：status: 'loggedIn' 或部分使用者 ID
          status: 'loggedIn'
        }
      }, window.location.origin)
  };

  return {
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
  };
}