import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FinWise — Intelligent Personal Finance",
    template: "%s | FinWise",
  },
  description:
    "A premium AI-powered personal finance platform. Track spending, optimize budgets, and build wealth with intelligent analytics and elegant design.",
  keywords: [
    "FinWise",
    "personal finance",
    "budgeting",
    "expense tracking",
    "financial analytics",
    "AI finance",
    "savings goals",
    "subscription management",
    "wealth management",
    "financial insights",
  ],
  authors: [{ name: "FinWise" }],
  creator: "FinWise",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "FinWise — Intelligent Personal Finance",
    description:
      "Track, analyze, and optimize your finances with AI-powered insights and a premium experience.",
    siteName: "FinWise",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinWise — Intelligent Personal Finance",
    description:
      "Track, analyze, and optimize your finances with AI-powered insights and a premium experience.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
