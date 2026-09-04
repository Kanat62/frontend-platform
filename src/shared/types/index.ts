/** Утилитарные TS-типы, без доменной привязки. */

export type Nullable<T> = T | null;
export type Id = string;

/** ISO-дата без времени, формат YYYY-MM-DD (BACKEND.md §9). */
export type DateStr = string;

/** Время практики, формат HH:mm. */
export type TimeStr = string;
