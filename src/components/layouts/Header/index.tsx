"use client";

import { createClient } from "@/services/supabase-service/client";
import Image from "next/image";
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

    // 初期セッション取得
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
      setLoading(false);
    });

    // 認証状態の変化を購読
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <header className="border-b border-black bg-[#ffeb00]">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-4 text-black">
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-bold text-black sm:text-base">
          すすったなら動け！
        </h1>
        {/* auth配下: ログインボタンのみ表示 */}
        {!loading && pathname?.startsWith("/auth") && (
          <Link
            href="/auth/sign-in"
            className="ml-auto flex flex-col items-center gap-0.5 text-black"
            aria-label="Login"
          >
            <Image src="/login.svg" alt="Login" width={24} height={24} />
            <span className="text-[0.625rem] leading-none tracking-wide">LOGIN</span>
          </Link>
        )}
        {/* record配下: HISTORY + LOGOUT を表示（想定として認証済み） */}
        {!loading && pathname?.startsWith("/record") && isAuthenticated && (
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/record/history"
              className="flex flex-col items-center gap-0.5 text-black"
              aria-label="History"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12a9 9 0 1 1 3.87 7.44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
              <Image src="/logout.svg" alt="Logout" width={24} height={24} />
              <span className="text-[0.625rem] leading-none tracking-wide">LOGOUT</span>
            </button>
          </div>
        )}
        {/* その他ページ: 既存の挙動（未ログイン: LOGIN、ログイン: LOGOUT） */}
        {!loading && !pathname?.startsWith("/auth") && !pathname?.startsWith("/record") && !isAuthenticated && (
          <Link
            href="/auth/sign-in"
            className="ml-auto flex flex-col items-center gap-0.5 text-black"
            aria-label="Login"
          >
            <Image src="/login.svg" alt="Login" width={24} height={24} />
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
            <Image src="/logout.svg" alt="Logout" width={24} height={24} />
            <span className="text-[0.625rem] leading-none tracking-wide">LOGOUT</span>
          </button>
        )}
      </div>
    </header>
  );
}
