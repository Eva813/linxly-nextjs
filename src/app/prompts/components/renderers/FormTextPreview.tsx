import React, { useContext } from 'react';
import { PreviewContext } from './PreviewContext';

interface FormTextPreviewProps {
  name: string;
  defaultValue?: string;
}

export default function FormTextPreview({ name, defaultValue: def }: FormTextPreviewProps) {
  const { values, setValues } = useContext(PreviewContext);
  return (
    <input
      value={values[name] ?? def}
      onChange={e => setValues(prev => ({ ...prev, [name]: e.target.value }))}
      className="border border-gray-400 bg-light px-2 py-1 rounded"
    />
  );
}