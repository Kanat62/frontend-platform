import type { Dto, Role } from "@/shared/api";

export type { Role };

/** Вид-модель текущего пользователя — форма берётся из shared/api/schema (FRONTEND.md §5). */
export type Session = Dto<"AuthUserDto">;
