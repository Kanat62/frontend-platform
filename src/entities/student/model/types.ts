import type { AccessStatus, CourseType, Dto, LanguageCode, PaymentStatus, StudentFilters } from "@/shared/api";

export type { AccessStatus, CourseType, LanguageCode, PaymentStatus, StudentFilters };
export type PaymentInfo = Dto<"PaymentInfoDto">;
export type StudentListItem = Dto<"StudentListItemDto">;
export type StudentsList = Dto<"StudentsListDto">;
export type StudentHeader = Dto<"StudentHeaderDto">;
export type StudentOverview = Dto<"StudentOverviewDto">;
export type StudentLearning = Dto<"StudentLearningDto">;
export type StudentPractice = Dto<"StudentPracticeDto">;
export type StudentProgress = Dto<"StudentProgressDto">;
export type CreateStudentRequest = Dto<"CreateStudentRequestDto">;
export type CreateStudentResponse = Dto<"CreateStudentResponseDto">;
export type BulkUpdateStudentsRequest = Dto<"BulkUpdateStudentsRequestDto">;
export type UpdateStudentRequest = Dto<"UpdateStudentRequestDto">;
export type UpdateStudentAccessRequest = Dto<"UpdateStudentAccessRequestDto">;
export type UpdateStudentGroupRequest = Dto<"UpdateStudentGroupRequestDto">;
