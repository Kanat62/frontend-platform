import type { Dto, MeetingStatus } from "@/shared/api";

export type { MeetingStatus };
/** Строка практики — общая форма для student-card/group-detail/curator-overview. */
export type MeetingSummary = Dto<"StudentMeetingDto">;
