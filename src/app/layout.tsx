import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { THEME_STORAGE_KEY } from "@/lib/themes";
import { TEXT_SIZE_STORAGE_KEY } from "@/lib/text-size";
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
  title: "Vault Desk",
  description: "Minimal reading surface for your Obsidian vault",
};

const themeBootScript = `(function(){try{var tk=${JSON.stringify(THEME_STORAGE_KEY)};var sk=${JSON.stringify(TEXT_SIZE_STORAGE_KEY)};var t=localStorage.getItem(tk);if(t==='midnight'||t==='paper'||t==='datapad'){document.documentElement.setAttribute('data-theme',t);}var s=localStorage.getItem(sk);if(s==='medium'||s==='large'){document.documentElement.setAttribute('data-text-size',s);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
