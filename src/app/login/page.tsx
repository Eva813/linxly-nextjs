'use client'

import { Suspense } from 'react';
import { LoginContent } from './loginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}