import { notFound } from 'next/navigation';

// Any unknown path under a locale renders the localized 404 (not-found.tsx)
// inside the site chrome instead of the bare global one.
export default function CatchAll() {
  notFound();
}
