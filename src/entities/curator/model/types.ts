import type { Dto, LanguageCode } from "@/shared/api";

export type { LanguageCode };
export type CuratorListItem = Dto<"CuratorListItemDto">;
export type CuratorsList = Dto<"CuratorsListDto">;
export type CuratorGroup = Dto<"CuratorGroupDto">;
export type CuratorStudent = Dto<"CuratorStudentDto">;
export type CuratorDetail = Dto<"CuratorDetailDto">;
export type CreateCuratorRequest = Dto<"CreateCuratorRequestDto">;
export type CreateCuratorResponse = Dto<"CreateCuratorResponseDto">;
export type UpdateCuratorRequest = Dto<"UpdateCuratorRequestDto">;
export type ResetCuratorPasswordResponse = Dto<"ResetCuratorPasswordResponseDto">;
export type StartSubstitutionRequest = Dto<"StartSubstitutionRequestDto">;
export type AuditLogEntry = Dto<"AuditLogEntryDto">;
export type AuditLogList = Dto<"AuditLogListDto">;
