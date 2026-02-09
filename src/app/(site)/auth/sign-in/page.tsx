"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, FormEvent } from "react";
import { createClient } from "@/services/supabase-service/client";

export default function Page() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function isValid() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (password.length < 8) return false;
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid()) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          setErrorMessage("メールアドレスまたはパスワードが正しくありません。");
        } else if (/Email not confirmed/i.test(error.message)) {
          setErrorMessage("メール認証が未完了です。届いたメールのリンクを開いてください。");
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      router.replace("/record");
      router.refresh();
    } catch {
      setErrorMessage("予期せぬエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <h2 className="mb-10 text-center text-xl font-bold text-black">ログイン</h2>

      <form onSubmit={onSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 rounded-md border border-black bg-[#ffeb00] p-6">
          <section className="flex flex-col gap-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-bold">メールアドレス</span>
              <span className="rounded bg-[#E84119] px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
            </div>
            <input
              className="h-12 w-full rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black"
              placeholder="sample@sample.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="text"
              autoComplete="email"
            />
          </section>

          <section className="flex flex-col gap-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-bold">パスワード</span>
              <span className="rounded bg-[#E84119] px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
            </div>
            <div className="relative">
              <input
                className="h-12 w-full rounded border border-neutral-300 bg-white px-3 pr-10 text-sm outline-none focus:border-black"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-xs text-neutral-700 hover:bg-neutral-100"
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showPassword ? <Eye size={20} aria-hidden /> : <EyeOff size={20} aria-hidden />}
              </button>
            </div>
          </section>

          {errorMessage && (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
          )}

          <div className="flex items-center justify-between text-xs">
            <Link href="/auth/forgot-password" className="underline">
              パスワードをお忘れの方
            </Link>
            <Link href="/auth/sign-up" className="underline">
              新規登録はこちら
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={!isValid() || submitting}
            className="h-12 w-60 rounded bg-black px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "ログイン中..." : "ログイン"}
          </button>

        </div>
      </form>
    </main>
  );
}
