import type { Dto, MeetingScope, MeetingStatus } from "@/shared/api";

export type { MeetingStatus, MeetingScope };
/** Строка практики — общая форма для student-card/group-detail/curator-overview. */
export type MeetingSummary = Dto<"StudentMeetingDto">;
/** Строка `/meetings` — куратор видит все практики за диапазон (schedule-board). */
export type ScheduleMeeting = Dto<"ScheduleMeetingDto">;
export type MeetingAttendee = Dto<"MeetingAttendeeDto">;
export type CreateMeetingRequest = Dto<"CreateMeetingRequestDto">;
export type UpdateMeetingRequest = Dto<"UpdateMeetingRequestDto">;
export type MarkAttendanceRequest = Dto<"MarkAttendanceRequestDto">;
