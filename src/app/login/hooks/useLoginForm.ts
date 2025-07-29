import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { acceptInvite } from '@/api/spaceShares';

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  // 取得邀請參數
  const inviteShareId = searchParams?.get('invite');
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [processingInvite, setProcessingInvite] = useState(false);

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error) {
      setError('Google 登入失敗，請重試');
      setIsLoading(false);
    }
  }, [searchParams, setError, setIsLoading]);

  // 監聽登入狀態，自動處理邀請
  useEffect(() => {
    if (!session?.user?.id || !inviteShareId || processingInvite) {
      return;
    }

    const handleAutoAcceptInvite = async () => {
      try {
        setProcessingInvite(true);
        const result = await acceptInvite(inviteShareId, session.user.id);
        
        if (result.success) {
          router.push(result.redirectUrl || `/prompts?space=${result.spaceId}`);
        } else {
          console.error('Auto accept invite failed:', result);
          router.push('/');
        }
      } catch (error) {
        console.error('Auto accept invite error:', error);
        router.push('/');
      } finally {
        setProcessingInvite(false);
      }
    };

    handleAutoAcceptInvite();
  }, [session?.user?.id, inviteShareId, processingInvite, router]);

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
        // 登入成功後，如果有邀請參數，useEffect 會自動處理
        // 如果沒有邀請參數，則正常跳轉首頁
        if (!inviteShareId) {
          router.push('/');
        }
        // 如果有邀請參數，等待 useEffect 中的邀請處理邏輯

        // 通知內容腳本 (Content Script)
        window.postMessage({
          type: 'FROM_LOGIN_PAGE',
          action: 'USER_LOGGED_IN',
          data: {
            status: 'loggedIn'
          }
        }, window.location.origin);
      }
    } catch {
      setError('Login failed');
    } finally {
      setIsLoading(false);
      
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    // 如果有邀請參數，帶上邀請參數到 callbackUrl
    const callbackUrl = inviteShareId 
      ? `/login?invite=${inviteShareId}&callbackUrl=/` 
      : '/login?callbackUrl=/';
    
    signIn('google', { callbackUrl });

    // 通知內容腳本 (Content Script) - 保持原本功能
    window.postMessage({
      type: 'FROM_LOGIN_PAGE', // 自訂訊息類型
      action: 'USER_LOGGED_IN',
      data: {
        // 傳遞一些使用者資訊，注意不要洩漏敏感資訊
        // 例如：status: 'loggedIn' 或部分使用者 ID
        status: 'loggedIn'
      }
    }, window.location.origin);
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
    processingInvite,
    inviteShareId,
    handleNextStep,
    handleSubmit,
    handleGoogleSignIn
  };
}