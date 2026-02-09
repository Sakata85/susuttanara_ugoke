"use client";

import { createClient } from "@/services/supabase-service/client";
import { History, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <header className="border-b border-black bg-background">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-4 text-black">
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-bold text-black sm:text-base">
          すすったなら動け！
        </h1>
        {!loading && pathname?.startsWith("/auth") && (
          <Link
            href="/auth/sign-in"
            className="ml-auto flex flex-col items-center gap-0.5 text-black"
            aria-label="Login"
          >
            <LogIn size={24} aria-hidden />
            <span className="text-[0.625rem] leading-none tracking-wide">LOGIN</span>
          </Link>
        )}
        {!loading && pathname?.startsWith("/record") && isAuthenticated && (
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/record/history"
              className="flex flex-col items-center gap-0.5 text-black"
              aria-label="History"
            >
              <History size={24} aria-hidden />
              <span className="text-[0.625rem] leading-none tracking-wide">HISTORY</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                setSigningOut(true);
                try {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.replace("/auth/sign-in");
                  router.refresh();
                } finally {
                  setSigningOut(false);
                }
              }}
              className="flex flex-col items-center gap-0.5 text-black disabled:opacity-60"
              aria-label="Logout"
              disabled={signingOut}
            >
              <LogOut size={24} aria-hidden />
              <span className="text-[0.625rem] leading-none tracking-wide">LOGOUT</span>
            </button>
          </div>
        )}
        {!loading && !pathname?.startsWith("/auth") && !pathname?.startsWith("/record") && !isAuthenticated && (
          <Link
            href="/auth/sign-in"
            className="ml-auto flex flex-col items-center gap-0.5 text-black"
            aria-label="Login"
          >
            <LogIn size={24} aria-hidden />
            <span className="text-[0.625rem] leading-none tracking-wide">LOGIN</span>
          </Link>
        )}
        {!loading && !pathname?.startsWith("/auth") && !pathname?.startsWith("/record") && isAuthenticated && (
          <button
            type="button"
            onClick={async () => {
              setSigningOut(true);
              try {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.replace("/auth/sign-in");
                router.refresh();
              } finally {
                setSigningOut(false);
              }
            }}
            className="ml-auto flex flex-col items-center gap-0.5 text-black disabled:opacity-60"
            aria-label="Logout"
            disabled={signingOut}
          >
            <LogOut size={24} aria-hidden />
            <span className="text-[0.625rem] leading-none tracking-wide">LOGOUT</span>
          </button>
        )}
      </div>
    </header>
  );
}
