import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSync = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Business Intelligence Platform",
  description: "Advanced market analytics and strategic intelligence for enterprise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${plusJakartaSync.variable} ${inter.variable} antialiased font-sans bg-background cosmic-gradient selection:bg-primary/20`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
