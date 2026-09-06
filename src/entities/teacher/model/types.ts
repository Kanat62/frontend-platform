import type { Dto, LanguageCode, TeacherStatus } from "@/shared/api";

export type { TeacherStatus, LanguageCode };
export type TeacherListItem = Dto<"TeacherListItemDto">;
/** Минимальный вид преподавателя для дропдауна назначения (подмножество строки списка). */
export type TeacherOption = Pick<TeacherListItem, "id" | "name" | "languages" | "status" | "phone" | "tone">;
export type TeachersList = Dto<"TeachersListDto">;
export type TeacherGroup = Dto<"TeacherGroupDto">;
export type TeacherIndividualStudent = Dto<"TeacherIndividualStudentDto">;
export type TeacherDetail = Dto<"TeacherDetailDto">;
export type CreateTeacherRequest = Dto<"CreateTeacherRequestDto">;
/** `PATCH /teachers/:id` — карточка меняет только статус (BACKEND.md §12). */
export type UpdateTeacherStatusRequest = Pick<Dto<"UpdateTeacherRequestDto">, "status">;
