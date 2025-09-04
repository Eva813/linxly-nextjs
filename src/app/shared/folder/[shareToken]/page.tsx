import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FolderX, ExternalLink } from 'lucide-react';
import { SharedFolderResponse } from '@/shared/types/sharedFolder';
import SharedFolderView from './components/sharedFolderView';

interface PageProps {
  params: { shareToken: string };
}

// 使用共用類型定義
type PublicFolderResponse = SharedFolderResponse;

async function fetchPublicFolder(shareToken: string): Promise<PublicFolderResponse> {
  try {
    // For server-side API calls, use internal URL or relative path
    const apiUrl = process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/v1/shared/folder/${shareToken}`
      : `http://localhost:3000/api/v1/shared/folder/${shareToken}`;
    
    // 記錄請求資訊
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SHARE_FOLDER_API] Fetching URL:`, apiUrl);
    console.log(`[${timestamp}] [SHARE_FOLDER_API] ShareToken:`, shareToken);
    
    const response = await fetch(apiUrl, {
      cache: 'no-store', // 確保每次都獲取最新數據
    });
    const json = await response.json();
    
    return json;
  } catch {
    return {
      available: false,
      error: {
        code: 'NOT_FOUND',
        message: 'An error occurred while loading this folder',
        cta: { text: "Create your own workspace", link: "/sign-up" }
      }
    };
  }
}

// 生成頁面 metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareToken } = params;
  const folderData = await fetchPublicFolder(shareToken);
  
  if (folderData.available && folderData.data) {
    const { folder } = folderData.data;
    return {
      title: `${folder.name} - Shared Folder | PromptBear`,
      description: folder.description || `Check out this shared folder: ${folder.name}`,
      openGraph: {
        title: `${folder.name} - Shared Folder`,
        description: folder.description || `Check out this shared folder: ${folder.name}`,
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `${folder.name} - Shared Folder`,
        description: folder.description || `Check out this shared folder: ${folder.name}`,
      },
    };
  }
  
  return {
    title: 'Shared Folder | PromptBear',
    description: 'Access shared prompt collections on PromptBear',
  };
}

// 錯誤狀態組件
function ErrorState({ error }: { error: NonNullable<PublicFolderResponse['error']> }) {
  return (
    <div className="h-[calc(100vh-65px)] bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="flex items-center gap-3 justify-center mb-4">
          <FolderX className="w-10 h-10 text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900">
            Folder Not Available
          </h1>
        </div>
        
        <div>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            {error.message}
          </p>
        </div>
        
        <Link href={error.cta.link}>
          <Button size="lg" className="px-8 py-3 text-base font-medium transition-all duration-200 hover:scale-105">
            {error.cta.text}
            <ExternalLink className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FolderContent({ data }: { data: NonNullable<PublicFolderResponse['data']> }) {
  return <SharedFolderView data={data} />;
}

// 主頁面組件
export default async function PublicFolderPage({ params }: PageProps) {
  const { shareToken } = params;
  const folderData = await fetchPublicFolder(shareToken);
  
  if (!folderData.available || !folderData.data) {
    return <ErrorState error={folderData.error!} />;
  }
  
  return <FolderContent data={folderData.data} />;
}