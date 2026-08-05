import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinWise — Your AI Powered Personal Finance Companion",
  description:
    "FinWise helps you understand, track, analyze and improve your finances using modern analytics and AI. Smart budgeting, expense tracking, goal setting, and AI-powered financial insights.",
  keywords: [
    "FinWise",
    "personal finance",
    "budgeting",
    "expense tracking",
    "financial analytics",
    "AI finance",
    "savings goals",
    "subscription management",
  ],
  authors: [{ name: "FinWise Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "FinWise — AI Powered Personal Finance",
    description: "Track, analyze, and improve your finances with AI-powered insights",
    siteName: "FinWise",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
