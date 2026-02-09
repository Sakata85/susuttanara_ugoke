"use client";

import { useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/services/supabase-service/client";

export default function Page() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function isValid() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid()) return;
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setSuccessMessage("パスワード再設定用のメールを送信しました。");
    } catch {
      setErrorMessage("予期せぬエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <h2 className="mb-10 text-center text-xl font-bold text-black">パスワードをお忘れの方</h2>

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

          {errorMessage && (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
          )}
          {successMessage && (
            <div className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-700">{successMessage}</div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={!isValid() || submitting}
            className="h-12 w-60 rounded bg-black px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "送信中..." : "再設定メールを送信"}
          </button>
          <Link href="/auth/sign-in" className="text-sm underline">
            ログインに戻る
          </Link>
        </div>
      </form>
    </main>
  );
}
