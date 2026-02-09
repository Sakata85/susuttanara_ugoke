"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, FormEvent } from "react";
import { createClient } from "@/services/supabase-service/client";

type Gender = "male" | "female" | "";
type Language = "ja" | "en";

export default function Page() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [language] = useState<Language>("ja");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<Gender>("");

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 120 }, (_, i) => currentYear - i), [currentYear]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const [year, setYear] = useState<number | "">("");
  const [month, setMonth] = useState<number | "">("");
  const [day, setDay] = useState<number | "">("");

  const days = useMemo(() => {
    if (!year || !month) return Array.from({ length: 31 }, (_, i) => i + 1);
    return Array.from({ length: new Date(Number(year), Number(month), 0).getDate() }, (_, i) => i + 1);
  }, [year, month]);

  const [postalA, setPostalA] = useState("");
  const [postalB, setPostalB] = useState("");
  const prefectures = useMemo(
    () => [
      "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
      "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
      "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
      "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
      "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
      "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
      "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
    ],
    []
  );
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
  }, [language, lastName, firstName, gender, year, month, day, postalA, postalB, prefecture, city, street, building, email, password, agree]);

  function isRequiredFilled() {
    if (!lastName.trim() || !firstName.trim()) return false;
    if (!year || !month || !day) return false;
    if (!/^[0-9]{3}$/.test(postalA) || !/^[0-9]{4}$/.test(postalB)) return false;
    if (!prefecture || !city.trim() || !street.trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (password.length < 8) return false;
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isRequiredFilled()) {
      setErrorMessage("必須項目を入力してください。");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const postalCode = `${postalA}-${postalB}`;
      const birthdate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/sign-in` : undefined;

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            language,
            last_name: lastName,
            first_name: firstName,
            gender,
            birthdate,
            postal_code: postalCode,
            address_prefecture: prefecture,
            address_city: city,
            address_street: street,
            address_building: building,
          },
        },
      });

      if (error) {
        const msg = error.message || "";
        if (/already\s*registered|already\s*exists|identit(y|ies).*exist/i.test(msg)) {
          setErrorMessage("このメールアドレスは既に登録済みです。ログインしてください。");
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      type SignUpUser = { user?: { identities?: Array<unknown> } } | null;
      const identities = (signUpData as SignUpUser)?.user?.identities;
      if (identities && identities.length === 0) {
        setErrorMessage("このメールアドレスは既に登録済みです。ログインしてください。");
        return;
      }

      router.push("/auth/confirm");
    } catch {
      setErrorMessage("予期せぬエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
      <h2 className="mb-10 text-center text-xl font-bold text-black">新規会員登録</h2>

      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <div className="flex flex-col gap-8 rounded-md border border-black bg-[#ffeb00] p-6">
          <section className="flex flex-col gap-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-bold">氏名</span>
              <span className="rounded bg-[#E84119] px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <input
                className="h-12 flex-1 rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black"
                placeholder="姓"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
              <input
                className="h-12 flex-1 rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black"
                placeholder="名"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-bold">性別</span>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="gender" value="male" checked={gender === "male"} onChange={() => setGender("male")} className="h-4 w-4" />
                男性
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="gender" value="female" checked={gender === "female"} onChange={() => setGender("female")} className="h-4 w-4" />
                女性
              </label>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-bold">生年月日</span>
              <span className="rounded bg-[#E84119] px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <select className="h-12 w-28 rounded border border-neutral-300 bg-white px-2 text-sm" value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">yyyy</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="text-sm">年</span>
              </div>
              <div className="flex items-center gap-2">
                <select className="h-12 w-24 rounded border border-neutral-300 bg-white px-2 text-sm" value={month} onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">mm</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span className="text-sm">月</span>
              </div>
              <div className="flex items-center gap-2">
                <select className="h-12 w-24 rounded border border-neutral-300 bg-white px-2 text-sm" value={day} onChange={(e) => setDay(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">dd</option>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <span className="text-sm">日</span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-bold">郵便番号</span>
              <span className="rounded bg-[#E84119] px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="h-12 w-20 rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black"
                placeholder="123"
                inputMode="numeric"
                value={postalA}
                onChange={(e) => setPostalA(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <input
                className="h-12 w-24 rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black"
                placeholder="4567"
                inputMode="numeric"
                value={postalB}
                onChange={(e) => setPostalB(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-bold">住所</span>
              <span className="rounded bg-[#E84119] px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
            </div>
            <div className="mb-2">
              <select
                className="h-12 w-full rounded border border-neutral-300 bg-white px-3 text-sm sm:w-64 md:w-72 lg:w-80"
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value)}
              >
                <option value="">都道府県</option>
                {prefectures.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <input
                className="h-12 w-full rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black"
                placeholder="市区町村"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
              />
            </div>
            <div className="mb-2">
              <input
                className="h-12 w-full rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black"
                placeholder="町名・番地"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                autoComplete="address-line1"
              />
            </div>
            <div>
              <input
                className="h-12 w-full rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black"
                placeholder="ビル・マンション名など"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                autoComplete="address-line2"
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="mb-3 flex items-center gap-2">
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
            <div className="mb-3 flex items-center gap-2">
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
        </div>

        {errorMessage && (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={!isRequiredFilled() || submitting}
            className="h-12 w-60 rounded bg-black px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "登録中..." : "アカウント登録"}
          </button>
          <div className="w-full max-w-xs">
            <p className="mb-2 text-center text-sm font-bold">アカウントをお持ちの方</p>
            <Link
              href="/auth/sign-in"
              className="flex h-12 w-full items-center justify-center rounded border border-black bg-white font-bold text-black"
            >
              ログイン
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
