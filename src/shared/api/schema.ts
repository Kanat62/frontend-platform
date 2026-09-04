/**
 * Ручной контракт API — по BACKEND.md §12 (Request/Response DTO), пока нет
 * реального бэкенда. Форма — как у `openapi-typescript` (`components.schemas.*`),
 * чтобы замена на сгенерированный `schema.gen.ts` (ARCHITECTURE.md §2) не требовала
 * переписывать типы в entities (model/types.ts). Дополняется по мере разработки модулей
 * (FRONTEND.md §16) — сейчас только `auth`.
 */

export type Role = "student" | "curator";
export type LanguageCode = "en" | "ru";
export type CourseType = "GROUP" | "INDIVIDUAL";

export interface components {
  schemas: {
    LoginRequestDto: {
      login: string;
      password: string;
    };

    /** Минимум, нужный кабинету ученика в шапке/сайдбаре (BACKEND.md §4, Student). */
    StudentSelfDto: {
      id: string;
      firstName: string;
      lastName: string;
      avatarTone: string;
      type: CourseType;
      language: LanguageCode;
    };

    /**
     * У кураторов в этом продукте нет отдельной сущности с профилем (TЗ §3.2 —
     * единый аккаунт `curator`) — минимальная витрина для шелла.
     */
    CuratorSelfDto: {
      id: string;
      name: string;
    };

    AuthUserDto: {
      id: string;
      role: Role;
      student?: components["schemas"]["StudentSelfDto"];
      curator?: components["schemas"]["CuratorSelfDto"];
    };

    LoginResponseDto: {
      accessToken: string;
      user: components["schemas"]["AuthUserDto"];
    };

    RefreshResponseDto: {
      accessToken: string;
    };
  };
}

export type Dto<K extends keyof components["schemas"]> = components["schemas"][K];
