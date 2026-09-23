'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

// Wraps detail sections that only signed-in users see (salary, area,
// poster, reviews...). Without a session nothing is rendered: the anonymous
// visitor only sees the top of the listing and the AdActions sign-in
// prompt. It is a presentation gate (like the description cutoff); the
// phone and location remain protected in the API.
export function AuthOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  return <>{children}</>;
}
