import localFont from "next/font/local";
import type { Metadata } from "next";
import "./globals.css";

const body = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    {
      path: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
      weight: "400 800",
      style: "normal",
    },
  ],
});

const display = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    {
      path: "../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "MindProfile — Map how you think with AI",
  description:
    "Analyze your AI chats to uncover thinking style, communication patterns, strengths, and blind spots.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
