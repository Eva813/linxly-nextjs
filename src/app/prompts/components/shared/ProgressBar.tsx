import React from 'react';

interface ProgressBarProps {
  completed: number;
  total: number;
  isVisible: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ completed, total, isVisible }) => {
  if (!isVisible || total === 0) return null;

  const percentage = (completed / total) * 100;

  return (
    <div className="space-y-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-gray-500">
        Processing {completed}/{total} emails...
      </p>
    </div>
  );
};

export default ProgressBar;