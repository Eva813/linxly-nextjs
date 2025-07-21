"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaSpinner } from "react-icons/fa";
import { CheckCircle, AlertCircle, UserPlus, Eye, Edit } from "lucide-react";

interface InviteInfo {
  spaceId: string;
  spaceName: string;
  ownerName: string;
  permission: 'view' | 'edit';
  needsRegistration: boolean;
  isValid: boolean;
  isUniversal: boolean;
  expiresAt: string;
  createdAt: string;
}

function InvitePage() {
  const params = useParams();
  const shareId = params?.shareId as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);

  useEffect(() => {
    const validateInvite = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/v1/invites/${shareId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Invalid or expired invite link');
        }

        const data = await response.json();
        
        if (!data.isValid) {
          throw new Error(data.error || 'Invalid invite');
        }
        
        setInviteInfo(data);
        
      } catch (error) {
        console.error('Failed to validate invite:', error);
        setError(error instanceof Error ? error.message : 'Failed to validate invite');
      } finally {
        setLoading(false);
      }
    };

    // Only validate once when component mounts with shareId
    if (shareId && !inviteInfo && !validationAttempted) {
      setValidationAttempted(true);
      validateInvite();
    }
  }, [shareId, inviteInfo, validationAttempted]); // Add validationAttempted to prevent duplicate calls

  const acceptInvite = async () => {
    if (!session?.user?.id) {
      setError('You must be signed in to accept this invite');
      return;
    }

    try {
      setJoining(true);
      setError(null);
      
      const response = await fetch(`/api/v1/invites/${shareId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invite');
      }

      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        
        // Redirect to prompt space after a shorter delay
        setTimeout(() => {
          router.push(result.redirectUrl || `/prompts?space=${inviteInfo?.spaceId}`);
        }, 1000); // Reduced from 2000ms to 1000ms
      } else {
        throw new Error(result.error || 'Failed to accept invite');
      }
    } catch (error) {
      console.error('Failed to accept invite:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept invite');
    } finally {
      setJoining(false);
    }
  };

  const handleSignInAndJoin = () => {
    signIn('google', { 
      callbackUrl: `/invite/${shareId}` 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FaSpinner className="animate-spin text-primary mb-4" size={32} />
            <p className="text-gray-600">Validating invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="text-rose-600" size={48} />
            </div>
            <CardTitle className="text-rose-600">Invalid Invite</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              onClick={() => router.push('/prompts')}
              variant="outline"
            >
              Go to Prompts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <CardTitle className="text-green-600">Successfully Joined!</CardTitle>
            <CardDescription>
              You now have access to &quot;{inviteInfo?.spaceName}&quot;
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Redirecting to the workspace...
            </p>
            <FaSpinner className="animate-spin text-blue-600 mx-auto" size={24} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteInfo) {
    return null;
  }

  // Check if invite is expired
  const isExpired = inviteInfo && new Date() > new Date(inviteInfo.expiresAt);
  
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="text-amber-500" size={48} />
            </div>
            <CardTitle className="text-amber-600">Invite Expired</CardTitle>
            <CardDescription>
              This invite link has expired. Please request a new one from the space owner.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              onClick={() => router.push('/prompts')}
              variant="outline"
            >
              Go to Prompts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserPlus className="text-blue-600" size={48} />
          </div>
          <CardTitle>Join Workspace</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join &quot;{inviteInfo.spaceName}&quot;
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Space Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {inviteInfo.permission === 'edit' ? (
                  <Edit className="text-blue-600" size={20} />
                ) : (
                  <Eye className="text-green-600" size={20} />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{inviteInfo.spaceName}</h3>
                <p className="text-sm text-gray-600">
                  Shared by {inviteInfo.ownerName}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Permission: <span className="font-medium capitalize">{inviteInfo.permission}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Permission Description */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-900 mb-1">
              {inviteInfo.permission === 'edit' ? 'Edit Access' : 'View Access'}
            </p>
            <p>
              {inviteInfo.permission === 'edit' 
                ? 'You can view and modify prompts in this workspace.'
                : 'You can view prompts in this workspace but cannot make changes.'
              }
            </p>
          </div>

          {/* Universal Link Notice */}
          {inviteInfo.isUniversal && (
            <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="font-medium mb-1">📧 Invitation Required</p>
              <p>
                This link is only for invited users. Please sign in with the email address 
                that received this invitation to join the workspace.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'loading' ? (
              <div className="flex justify-center py-4">
                <FaSpinner className="animate-spin text-blue-600" size={24} />
              </div>
            ) : !session?.user ? (
              <>
                <Button 
                  onClick={handleSignInAndJoin}
                  className="w-full"
                  size="lg"
                >
                  {inviteInfo.isUniversal ? 'Sign In with Invited Email' : 'Sign In to Join'}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  {inviteInfo.isUniversal 
                    ? 'Sign in with the email address that received this invitation.'
                    : 'Sign in with your Google account to join this workspace.'
                  }
                </p>
              </>
            ) : (
              <>
                <Button 
                  onClick={acceptInvite}
                  disabled={joining}
                  className="w-full"
                  size="lg"
                >
                  {joining ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Joining...
                    </>
                  ) : (
                    'Accept Invitation'
                  )}
                </Button>
                <Button 
                  onClick={() => router.push('/prompts')}
                  variant="outline"
                  className="w-full"
                  disabled={joining}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InvitePage;