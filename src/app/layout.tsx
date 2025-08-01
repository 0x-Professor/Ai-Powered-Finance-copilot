import type { Metadata, Viewport } from "next";
import "./globals.css";

// Font Awesome
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = true; // Let FontAwesome handle CSS automatically

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
      <body className="font-sans bg-gray-50 min-h-screen antialiased">
        <div id="root" className="min-h-screen">
          {children}
        </div>
        <div id="notifications" className="fixed top-4 right-4 z-50 space-y-2"></div>
      </body>
    </html>
  );
}
