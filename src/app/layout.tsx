import {  ReactNode } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from '@/components/site-header';
import PromptDialog from '@/app/components/promptDialog';
import { Providers } from '@/providers';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PromptBear - Organize Your Prompts Like a Pro",
  description: "Smart prompt management platform with team collaboration, parameterized prompts, and instant access. Organize, share, and optimize your AI prompts efficiently.",
  keywords: ["prompt management", "AI prompts", "team collaboration", "prompt organization", "AI tools"],
  authors: [{ name: "PromptBear Team" }],
  creator: "PromptBear",
  publisher: "PromptBear",
  openGraph: {
    title: "PromptBear - Organize Your Prompts Like a Pro",
    description: "Smart prompt management platform with team collaboration, parameterized prompts, and instant access.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptBear - Organize Your Prompts Like a Pro",
    description: "Smart prompt management platform with team collaboration, parameterized prompts, and instant access.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <SiteHeader />
          {children}
          <PromptDialog />
        </Providers>
      </body>
    </html>
  );
}
