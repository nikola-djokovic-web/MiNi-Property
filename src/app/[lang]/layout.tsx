import type { Metadata } from "next";
import * as React from "react";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { i18n, Locale } from "@/i18n-config";
import { getDictionary } from "@/dictionaries";
// import { TranslationProvider } from "@/hooks/use-translation";
import { TranslationProvider } from "./translation-provider";
import {
  Inter,
  Lora,
  Roboto_Mono,
  Playfair_Display,
  Oswald,
  Lato,
} from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "TenantLink",
  description: "A modern property management platform.",
};

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}>) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={cn(
          "antialiased",
          inter.variable,
          lora.variable,
          robotoMono.variable,
          playfair.variable,
          oswald.variable,
          lato.variable
        )}
      >
        <TranslationProvider dict={dict}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
