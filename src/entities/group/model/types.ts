import type { CefrLevel, Dto, GroupStatus, LanguageCode, WeekPlanKind } from "@/shared/api";

export type { GroupStatus, LanguageCode, CefrLevel, WeekPlanKind };
export type GroupSummary = Dto<"GroupSummaryDto">;
export type GroupsList = Dto<"GroupsListDto">;
export type GroupWeekDay = Dto<"GroupWeekDayDto">;
export type GroupRosterItem = Dto<"GroupRosterItemDto">;
export type GroupDetail = Dto<"GroupDetailDto">;
export type CreateGroupRequest = Dto<"CreateGroupRequestDto">;
export type UpdateGroupRequest = Dto<"UpdateGroupRequestDto">;
export type AssignTeacherRequest = Dto<"AssignTeacherRequestDto">;
export type ScheduleGroupMeetingRequest = Dto<"ScheduleGroupMeetingRequestDto">;
