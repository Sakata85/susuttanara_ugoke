"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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
    <header className="border-b bg-white">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-bold text-black sm:text-base">
          すすったなら動け！
        </h1>
        {!loading && !isAuthenticated && (
          <Link
            href="/auth/sign-in"
            className="flex flex-col items-center gap-0.5"
            aria-label="Login"
          >
            <Image src="/login.svg" alt="Login" width={24} height={24} />
            <span className="text-[10px] leading-none tracking-wide">LOGIN</span>
          </Link>
        )}
      </div>
    </header>
  );
}