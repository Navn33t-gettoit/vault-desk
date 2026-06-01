"use client";

import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TextSizeProvider } from "@/components/TextSizeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TextSizeProvider>
        <div className="flex min-h-full flex-col">
          <header className="silence-app-header sticky top-0 z-50">
            <Link
              href="/"
              prefetch={false}
              className="silence-meta transition-opacity hover:opacity-80"
            >
              Vault Desk
            </Link>
            <ThemeToggle />
          </header>
          <div className="flex-1">{children}</div>
        </div>
      </TextSizeProvider>
    </ThemeProvider>
  );
}
