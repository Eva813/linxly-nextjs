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
  description: "Advanced prompt management platform with smart organization, team collaboration, parameterized prompts, visual flow editor, and browser extension. Streamline your AI workflow with powerful search, shortcuts, and instant access.",
  keywords: [
    "prompt management", 
    "AI prompts", 
    "team collaboration", 
    "prompt organization", 
    "AI tools",
    "browser extension",
    "visual flow editor",
    "parameterized prompts",
    "prompt shortcuts",
    "AI workflow"
  ],
  authors: [{ name: "PromptBear Team" }],
  creator: "PromptBear",
  publisher: "PromptBear",
  openGraph: {
    title: "PromptBear - Organize Your Prompts Like a Pro",
    description: "Advanced prompt management platform with smart organization, team collaboration, parameterized prompts, and visual flow editor. Streamline your AI workflow.",
    type: "website",
    locale: "en_US",
    siteName: "PromptBear",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptBear - Organize Your Prompts Like a Pro",
    description: "Advanced prompt management platform with smart organization, team collaboration, parameterized prompts, and visual flow editor.",
    creator: "@promptbear",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
