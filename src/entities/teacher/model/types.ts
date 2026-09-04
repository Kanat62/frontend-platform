import type { Dto, LanguageCode, TeacherStatus } from "@/shared/api";

export type { TeacherStatus, LanguageCode };
export type TeacherOption = Dto<"TeacherOptionDto">;
export type TeacherListItem = Dto<"TeacherListItemDto">;
export type TeachersList = Dto<"TeachersListDto">;
export type TeacherGroup = Dto<"TeacherGroupDto">;
export type TeacherIndividualStudent = Dto<"TeacherIndividualStudentDto">;
export type TeacherDetail = Dto<"TeacherDetailDto">;
export type CreateTeacherRequest = Dto<"CreateTeacherRequestDto">;
export type UpdateTeacherStatusRequest = Dto<"UpdateTeacherStatusRequestDto">;
