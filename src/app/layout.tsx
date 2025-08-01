import type { Metadata, Viewport } from "next";
import "./globals.css";

// Font Awesome
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;

export const metadata: Metadata = {
  title: "FinanceAI Co-Pilot - AI-Powered Personal Finance Assistant",
  description: "Get personalized financial advice, track your spending, and achieve your financial goals with AI-powered insights.",
  keywords: "finance, AI, personal finance, budgeting, savings, investment",
  authors: [{ name: "FinanceAI Team" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          rel="stylesheet" 
          crossOrigin="anonymous"
        />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans bg-gray-50 min-h-screen antialiased">
        <div id="root" className="min-h-screen">
          {children}
        </div>
        <div id="notifications" className="fixed top-4 right-4 z-50 space-y-2"></div>
      </body>
    </html>
  );
}
