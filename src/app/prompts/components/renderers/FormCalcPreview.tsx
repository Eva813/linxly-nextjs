import React, { useContext } from 'react';
import { PreviewContext } from './PreviewContext';

interface FormCalcPreviewProps {
  name: string;
  default?: string;
}

export default function FormCalcPreview({ name, default: def }: FormCalcPreviewProps) {
  const { values } = useContext(PreviewContext);
  const val = values[name] ?? def;
  // 多重選項時，若為陣列且長度 >= 2，採用逗點加空格串接
  const displayVal = Array.isArray(val)
    ? val.length >= 2
      ? val.join(", ")
      : val[0] || ''
    : val;
  return <span className='bg-light p-1'>{displayVal}</span>;
}
