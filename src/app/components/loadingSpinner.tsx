import React from 'react';

interface LoadingSpinnerProps {
  size?: string;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'w-12 h-12', 
  color = 'border-primary' 
}) => {
  return (
    <div className={`animate-spin inline-block ${size} border-2 rounded-full border-t-transparent ${color}`} />
  );
};

export default LoadingSpinner;