import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** clsx + tailwind-merge — порт english-flow/src/lib/utils.ts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
