
'use client';
import { redirect } from 'next/navigation';

// This is the root page of the app. It redirects to the default locale's dashboard.
export default function RootPage() {
  redirect('/en');
}
