"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/services/supabase-service/client";

type RecordItem = {
  id: string;
  food_name: string;
  weight_kg: number;
  intake_kcal: number;
  exercise_id: string | null;
  duration_minutes: number | null;
  burned_kcal: number | null;
  memo: string | null;
  image_url: string | null;
  create_date?: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [records, setRecords] = useState<RecordItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.functions.invoke<RecordItem[]>(
        "records",
        { method: "GET" },
      );
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setRecords([]);
      } else {
        setRecords(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">履歴</h1>
          <button
            type="button"
            className="rounded border border-black bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-100"
            onClick={() => router.back()}
          >
            戻る
          </button>
        </div>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">履歴</h1>
          <button
            type="button"
            className="rounded border border-black bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-100"
            onClick={() => router.back()}
          >
            戻る
          </button>
        </div>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const items = records ?? [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">履歴</h1>
        <button
          type="button"
          className="rounded border border-black bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-100"
          onClick={() => router.back()}
        >
          戻る
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded border border-gray-300 bg-yellow-50 p-6 text-center">
          まだ記録がありません
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((r) => {
            const burned = r.burned_kcal ?? 0;
            const diff = Math.max(0, (r.intake_kcal || 0) - burned);
            return (
              <div key={r.id} className="rounded-xl border border-black/50 bg-[#fff3a6] p-4">
                <p className="font-bold">{r.food_name}</p>
                <p className="text-xs text-neutral-700 mt-1">
                  {r.create_date ? new Date(r.create_date).toLocaleString() : ""}
                  {" "}・ 体重 {r.weight_kg?.toFixed(2)}kg
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                    摂取 {r.intake_kcal} kcal
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                    消費 {burned} kcal
                  </span>
                  <span className="inline-flex items-center rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-800">
                    差分 {diff} kcal
                  </span>
                </div>

                {r.image_url ? (
                  <img
                    src={r.image_url.startsWith("http") ? r.image_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}${r.image_url}`}
                    alt="記録画像"
                    className="mt-3 w-full rounded-lg border border-black/30 object-cover"
                  />
                ) : null}

                {r.memo ? (
                  <p className="text-xs text-neutral-700 mt-3 whitespace-pre-wrap">{r.memo}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
