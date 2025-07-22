import { Card, CardContent } from '@/components/ui/card';
import { FaSpinner } from 'react-icons/fa';

interface FullScreenCardSpinnerProps {
  message: string;
}

export function FullScreenCardSpinner({ message }: FullScreenCardSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FaSpinner className="animate-spin text-blue-600 mb-4" size={24} />
          <p className="text-gray-600 dark:text-gray-300">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}