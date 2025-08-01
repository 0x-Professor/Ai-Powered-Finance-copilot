import type { Metadata } from "next";
// Using local system fonts instead of Google Fonts to avoid connectivity issues
// import { Inter } from "next/font/google";
import "./globals.css";

// Font Awesome
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false; // Tell Font Awesome to skip adding CSS automatically since it's imported above

// Define a CSS variable for font fallback instead of using Google Fonts
const fontFallbackClass = 'font-sans'; // Using system font stack

export const metadata: Metadata = {
  title: "FinanceAI Co-Pilot",
  description: "AI-Powered Personal Finance Co-Pilot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body className={`${fontFallbackClass} bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
