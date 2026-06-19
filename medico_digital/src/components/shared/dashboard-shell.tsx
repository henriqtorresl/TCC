"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  LogOut,
  Menu,
  MessageSquareText,
  Sparkles,
  UserRound,
} from "lucide-react";
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
  {
    href: "/chat",
    label: "Chat",
    icon: <MessageSquareText className="size-4" />,
  },
  { href: "/patients", label: "Perfil", icon: <UserRound className="size-4" /> },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? "border border-primary/20 bg-primary/12 text-primary"
                : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span
              className={`flex size-8 items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "bg-white/5 text-slate-300 group-hover:bg-white/8 group-hover:text-white"
              }`}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
            {isActive && <ArrowRight className="ml-auto size-4 text-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const currentSection = useMemo(
    () => navItems.find((item) => item.href === pathname)?.label ?? "Dashboard",
    [pathname],
  );

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("md_user_id");
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
      setIsMobileMenuOpen(false);
    }
  }

  return (
    <div className="relative h-dvh overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.35),_transparent_30%)]" />

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl md:hidden">
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
            Médico Digital
          </p>
          <h1 className="text-base font-semibold tracking-tight">{currentSection}</h1>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-white/10 bg-white/6 text-foreground hover:bg-white/10"
              aria-label="Abrir menu"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(22rem,92vw)] p-4">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            </SheetHeader>
            <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
                Navegação
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Seu painel clínico
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground/65">
                Acesso rápido ao chat e ao cadastro do paciente.
              </p>
            </div>
            <div className="pt-2">
              <NavLinks
                pathname={pathname}
                onNavigate={() => setIsMobileMenuOpen(false)}
              />
            </div>
            <div className="mt-6 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start border-white/10 bg-white/5 text-foreground hover:bg-white/10"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
              >
                <LogOut className="size-4" />
                {isLoggingOut ? "Saindo..." : "Sair"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="relative flex h-[calc(100dvh-57px)] w-full min-w-0 min-h-0 overflow-hidden md:h-dvh">
        <aside className="hidden w-72 min-w-0 flex-col border-r border-white/10 bg-slate-950/40 p-4 backdrop-blur-xl md:flex">
          <div className="surface-card rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_12px_30px_rgba(45,212,191,0.15)]">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
                  Médico Digital
                </p>
                <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                  Painel clínico
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-foreground/70">
              Acompanhe conversas, refine anamnese e gere relatórios com uma
              experiência mais limpa e profissional.
            </p>
          </div>

          <div className="mt-4 flex-1 rounded-3xl border border-white/10 bg-white/4 p-3">
            <NavLinks pathname={pathname} />
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start border-white/10 bg-white/5 text-foreground hover:bg-white/10"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
            >
              <LogOut className="size-4" />
              {isLoggingOut ? "Saindo..." : "Sair"}
            </Button>
          </div>
        </aside>
        <main className="relative h-full w-full min-w-0 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
