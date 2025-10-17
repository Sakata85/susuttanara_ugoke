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
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/LogoBlack.svg"
            alt="Flux Reservation"
            width={133}
            height={32}
            priority
          />
        </Link>
        {!loading &&
          (isAuthenticated ? (
            <Link
              href="/mypage"
              className="flex flex-col items-center gap-0.5"
              aria-label="My Page"
            >
              <Image src="/images/user-icon.svg" alt="My Page" width={24} height={24} />
              <span className="text-[10px] leading-none tracking-wide">MY PAGE</span>
            </Link>
          ) : (
            <Link
              href="/auth/sign-in"
              className="flex flex-col items-center gap-0.5"
              aria-label="Login"
            >
              <Image src="/images/login.svg" alt="Login" width={24} height={24} />
              <span className="text-[10px] leading-none tracking-wide">LOGIN</span>
            </Link>
          ))}
      </div>
    </header>
  );
}