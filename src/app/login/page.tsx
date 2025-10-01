
'use client';
import { redirect } from 'next/navigation';

// This page just redirects to the default locale's login page.
export default function LoginRedirectPage() {
  redirect('/en/login');
}
