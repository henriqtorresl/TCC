"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageSquareText, Users } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type DashboardShellProps = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { href: "/chat", label: "Chat", icon: <MessageSquareText className="size-4" /> },
  { href: "/patients", label: "Pacientes", icon: <Users className="size-4" /> },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              isActive
                ? "bg-emerald-900/30 text-emerald-200"
                : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentSection = useMemo(
    () => navItems.find((item) => item.href === pathname)?.label ?? "Dashboard",
    [pathname],
  );

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur md:hidden">
        <div>
          <p className="text-sm text-zinc-300">Médico Virtual</p>
          <h1 className="text-base font-semibold">{currentSection}</h1>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
              aria-label="Abrir menu"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-zinc-800 bg-zinc-950 p-4">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            </SheetHeader>
            <p className="pb-4 text-xs text-zinc-400">Navegação</p>
            <NavLinks
              pathname={pathname}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </header>

      <div className="mx-auto flex min-h-[calc(100dvh-57px)] w-full max-w-[1600px] md:min-h-dvh">
        <aside className="hidden w-64 border-r border-zinc-800 bg-zinc-950 p-4 md:block">
          <div className="mb-6">
            <p className="text-sm text-zinc-300">Médico Virtual</p>
            <h2 className="text-base font-semibold text-zinc-100">Painel</h2>
          </div>
          <NavLinks pathname={pathname} />
        </aside>
        <main className="min-h-dvh w-full">{children}</main>
      </div>
    </div>
  );
}
