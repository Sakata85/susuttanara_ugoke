"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, FormEvent } from "react";
import { createClient } from "@/services/supabase-service/client";

export default function Page() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (!error && data?.session) {
          setIsRecovery(true);
        }
      } catch {
        // noop
      }
    })();

    const { data } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  function isValid() {
    if (password.length < 8) return false;
    if (password !== confirmPassword) return false;
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid()) return;
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setSuccessMessage("パスワードを更新しました。ログイン画面へ移動します。");
      setTimeout(() => {
        router.replace("/auth/sign-in");
        router.refresh();
      }, 1200);
    } catch {
      setErrorMessage("予期せぬエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <h2 className="mb-10 text-center text-xl font-bold text-black">パスワード再設定</h2>

      <form onSubmit={onSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 rounded-md border border-black bg-[#ffeb00] p-6">
          {!isRecovery && (
            <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-700">
              メール内のリンクからこのページにアクセスしてください。
            </div>
          )}

          <section className="flex flex-col gap-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-bold">新しいパスワード</span>
              <span className="rounded bg-[#E84119] px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
            </div>
            <div className="relative">
              <input
                className="h-12 w-full rounded border border-neutral-300 bg-white px-3 pr-10 text-sm outline-none focus:border-black"
                placeholder="新しいパスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          <section className="flex flex-col gap-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-bold">新しいパスワード（確認）</span>
              <span className="rounded bg-[#E84119] px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
            </div>
            <input
              className="h-12 w-full rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black"
              placeholder="確認のためもう一度"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
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
            {submitting ? "更新中..." : "パスワードを更新"}
          </button>
          <Link href="/auth/sign-in" className="text-sm underline">
            ログインに戻る
          </Link>
        </div>
      </form>
    </main>
  );
}
