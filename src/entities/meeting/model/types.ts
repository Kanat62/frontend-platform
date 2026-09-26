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

// --- Журнал посещаемости практики ---------------------------------------
/** Личная отметка ученика на практике. `not_marked` не хранится — вычисляется. */
export type JournalStatus = Dto<"JournalEntryDto">["status"];
export type JournalStats = Dto<"JournalStatsDto">;
export type JournalEntry = Dto<"JournalEntryDto">;
export type MeetingJournal = Dto<"MeetingJournalDto">;
export type SetAttendanceStatusRequest = Dto<"SetAttendanceStatusRequestDto">;
export type AttendanceLogEntry = Dto<"AttendanceLogEntryDto">;
/** Единый журнал за день — сразу все групповые практики (куратор ведёт одну вкладку, а не журнал на группу). */
export type DayJournalMeeting = Dto<"DayJournalMeetingDto">;
export type DayJournalEntry = Dto<"DayJournalEntryDto">;
export type DayJournal = Dto<"DayJournalDto">;
