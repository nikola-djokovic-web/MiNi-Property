
'use client';

// This is the root layout of the app.
// It is responsible for rendering the html and body tags.
// Since we are using i18n routing, the actual layout for the pages is in app/[lang]/layout.tsx.
// This file is required by Next.js and should not be removed.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
