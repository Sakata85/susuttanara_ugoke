import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS クラス名をマージするユーティリティ。
 * clsx で条件付きクラスを組み立て、tailwind-merge で競合を解消する。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
