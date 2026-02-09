import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** 条件付きクラスをマージする */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
