"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "ダッシュボード" },
    { href: "/sources", label: "データソース" },
    { href: "/settings", label: "設定" },
  ];

  return (
    <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md transition-colors"
            aria-label="siftr ホームページへ"
          >
            <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-bold text-foreground">siftr</h1>
          </Link>

          <nav
            className="flex items-center gap-2"
            aria-label="メインナビゲーション"
          >
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Button
                  key={href}
                  variant={isActive ? "default" : "ghost"}
                  asChild
                  className="min-h-[44px] min-w-[44px]"
                >
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
