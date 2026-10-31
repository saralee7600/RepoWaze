import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginContent } from '@/components/auth/LoginContent';
import { LoginCard } from '@/components/auth/LoginCard';

export const metadata: Metadata = {
  title: 'Sign in · AST Inspector',
};

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <Suspense fallback={<LoginCard callbackUrl="/" disabled />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
