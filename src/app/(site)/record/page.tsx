"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/services/supabase-service/client";

type ExerciseOption = {
  id: string;
  name: string;
  met: number;
};

const EXERCISES: ExerciseOption[] = [
  { id: "none", name: "選択しない", met: 0 },
  { id: "walk", name: "ウォーキング(普通)", met: 3.5 },
  { id: "jog_8", name: "ジョギング(8km/h)", met: 8.3 },
  { id: "rope_fast", name: "縄跳び(速め)", met: 12.3 },
  { id: "swim", name: "水泳", met: 6.0 },
];

function parsePositiveNum(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseNonNegativeNum(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default function RecordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [foodName, setFoodName] = useState("ラーメン二郎（小）");
  const [weightKgStr, setWeightKgStr] = useState("");
  const [intakeKcalStr, setIntakeKcalStr] = useState("1500");
  const [exerciseId, setExerciseId] = useState<string>("none");
  const [durationMinStr, setDurationMinStr] = useState("");
  const [memo, setMemo] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const weightKgNum = useMemo(() => parsePositiveNum(weightKgStr), [weightKgStr]);
  const intakeKcalNum = useMemo(
    () => parseNonNegativeNum(intakeKcalStr),
    [intakeKcalStr]
  );
  const durationMinNum = useMemo(
    () => parseNonNegativeNum(durationMinStr),
    [durationMinStr]
  );

  const selectedExercise = useMemo(
    () => EXERCISES.find((e) => e.id === exerciseId) ?? EXERCISES[0],
    [exerciseId]
  );

  const burnedKcal = useMemo(() => {
    if (!selectedExercise || selectedExercise.met <= 0) return 0;
    if (!weightKgNum || !durationMinNum) return 0;
    const perMinute = (selectedExercise.met * 3.5 * weightKgNum) / 200;
    return Math.max(0, Math.round(perMinute * durationMinNum));
  }, [durationMinNum, selectedExercise, weightKgNum]);

  const diffKcal = useMemo(
    () => Math.max(0, intakeKcalNum - burnedKcal),
    [intakeKcalNum, burnedKcal]
  );

  const suggestions: { title: string; met: number; kind: string }[] = [
    { title: "縄跳び(速め)", met: 12.3, kind: "有酸素" },
    { title: "ジョギング(8km/h)", met: 8.3, kind: "有酸素" },
    { title: "水泳", met: 6.0, kind: "有酸素" },
  ];

  function minutesRequired(met: number) {
    if (!met || met <= 0 || !weightKgNum || !intakeKcalNum) return 0;
    const perMinute = (met * 3.5 * weightKgNum) / 200;
    if (perMinute <= 0) return 0;
    return Math.max(0, Math.round(intakeKcalNum / perMinute));
  }

  const isFormValid =
    !!foodName.trim() &&
    weightKgNum > 0 &&
    Number.isFinite(parseFloat(intakeKcalStr)) &&
    parseFloat(intakeKcalStr) >= 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">今日の記録をしましょう！</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            食品名 <span className="rounded bg-required-badge px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
          </label>
          <input
            type="text"
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="例：ラーメン二郎（小）"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            体重(kg) <span className="rounded bg-required-badge px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            className="input-no-spinner w-full rounded border border-gray-300 px-3 py-2"
            placeholder="例：65"
            value={weightKgStr}
            onChange={(e) => setWeightKgStr(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            摂取カロリー(kcal) <span className="rounded bg-required-badge px-1.5 py-0.5 text-[0.625rem] font-bold text-white">必須</span>
          </label>
          <input
            type="number"
            inputMode="numeric"
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="例：1500"
            value={intakeKcalStr}
            onChange={(e) => setIntakeKcalStr(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">画像（任意）</label>
          <input
            type="file"
            accept="image/*"
            className="w-full rounded border border-gray-300 px-3 py-2 bg-white"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setImageFile(f);
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">運動を選択</label>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 bg-white"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
          >
            {EXERCISES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">実施分数</label>
          <input
            type="number"
            inputMode="numeric"
            className="input-no-spinner w-full rounded border border-gray-300 px-3 py-2"
            placeholder="例：30"
            value={durationMinStr}
            onChange={(e) => setDurationMinStr(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
          摂取 {intakeKcalNum} kcal
        </span>
        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
          消費 {burnedKcal} kcal
        </span>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
          差分 {diffKcal} kcal
        </span>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">メモ</label>
        <textarea
          className="w-full rounded border border-gray-300 px-3 py-2 min-h-[6.25rem]"
          placeholder="運動メモ・体調など"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <p className="mt-6 text-sm font-semibold text-gray-800">
        例えば、これらの運動をこれだけやれば消費できます！
      </p>
      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.map((s) => (
          <div
            key={s.title}
            className="rounded border border-gray-300 bg-yellow-50 p-4"
          >
            <p className="text-sm text-gray-700 mb-1">{s.title}を約{minutesRequired(s.met)}分</p>
            <p className="text-xs text-gray-500">{s.kind}</p>
          </div>
        ))}
      </div>

      {!isFormValid && weightKgNum <= 0 && (
        <p className="mt-4 text-sm text-amber-700" role="alert">
          記録するには体重(kg)を入力してください。
        </p>
      )}

      <div className="mt-6">
        <button
          type="button"
          disabled={!isFormValid}
          className="w-full md:w-auto rounded bg-black px-6 py-3 text-white font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          onClick={async () => {
            if (!foodName.trim()) {
              alert("食品名を入力してください");
              return;
            }
            const w = parseFloat(weightKgStr);
            if (!Number.isFinite(w) || w <= 0) {
              alert("体重(kg)は0より大きい値を入力してください");
              return;
            }
            const kcal = parseFloat(intakeKcalStr);
            if (!Number.isFinite(kcal) || kcal < 0) {
              alert("摂取カロリーは0以上で入力してください");
              return;
            }
            const dur = durationMinStr.trim() === "" ? 0 : parseNonNegativeNum(durationMinStr);
            let imageUrl: string | null = null;
            try {
              if (imageFile) {
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData.session?.access_token ?? "";
                const form = new FormData();
                form.append("image_file", imageFile);
                form.append("bucket", "images");

                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/functions/v1/upload-image`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    },
                    body: form,
                  }
                );
                if (!res.ok) {
                  const t = await res.text().catch(() => "");
                  throw new Error(t || `画像アップロードに失敗しました (${res.status})`);
                }
                const body = (await res.json()) as { original_url?: string; thumbnail_url?: string };
                imageUrl = body.thumbnail_url || body.original_url || null;
              }
            } catch (e) {
              alert((e as Error).message || "画像アップロードに失敗しました");
              return;
            }

            await supabase.auth.refreshSession();
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;
            if (!accessToken) {
              alert("ログインし直してください。");
              router.push("/auth/sign-in");
              return;
            }

            const payload = {
              food_name: foodName,
              weight_kg: w,
              intake_kcal: kcal,
              exercise_id: exerciseId === "none" ? null : exerciseId,
              duration_minutes: dur > 0 ? dur : null,
              memo: memo || null,
              image_url: imageUrl,
            };

            const recordsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/functions/v1/records`;
            const res = await fetch(recordsUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              },
              body: JSON.stringify(payload),
            });

            const resBody = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
            if (res.status === 401) {
              alert("ログインし直してください。");
              router.push("/auth/sign-in");
              return;
            }
            if (!res.ok) {
              const msg = resBody.error ?? resBody.message ?? `HTTP ${res.status}`;
              alert(`保存に失敗しました: ${msg}`);
              return;
            }

            router.push("/record/history");
          }}
        >
          記録する
        </button>
      </div>
    </div>
  );
}
