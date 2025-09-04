import { FolderOpen } from 'lucide-react';

interface FolderHeaderProps {
  folderName: string;
  folderDescription?: string;
}

export default function FolderHeader({ folderName, folderDescription }: FolderHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center justify-center flex-shrink-0">
        <FolderOpen className="w-8 h-8" />
      </div>
      
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {folderName}
        </h1>
        <p className="text-base text-blue-600 mt-1">
          Shared Folder
        </p>
        {folderDescription && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {folderDescription}
          </p>
        )}
      </div>
    </div>
  );
}