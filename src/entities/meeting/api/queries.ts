import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { AttendanceLogEntry, DayJournal, JournalStatus, MeetingJournal, ScheduleMeeting } from "../model/types";

/** `GET /meetings?range=today|week|next-week` — BACKEND.md §12. */
export function meetingsQueryOptions(range: string) {
  return queryOptions({
    queryKey: qk.meetings.range(range),
    queryFn: () => apiClient.get<ScheduleMeeting[]>(`/meetings?range=${range}`),
  });
}

export function useMeetingsQuery(range: string) {
  return useQuery(meetingsQueryOptions(range));
}

export interface JournalFilters {
  q?: string;
  groupId?: string;
  status?: JournalStatus;
}

/** `GET /meetings/:id/journal` — журнал посещаемости практики (ТЗ §5, §8-10). */
export function meetingJournalQueryOptions(meetingId: string, filters: JournalFilters) {
  const q = filters.q ?? "";
  const groupId = filters.groupId ?? "";
  const status = filters.status ?? "";
  return queryOptions({
    queryKey: qk.meetings.journal(meetingId, q, groupId, status),
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (groupId) params.set("groupId", groupId);
      if (status) params.set("status", status);
      const qs = params.toString();
      return apiClient.get<MeetingJournal>(`/meetings/${meetingId}/journal${qs ? `?${qs}` : ""}`);
    },
    enabled: Boolean(meetingId),
  });
}

export function useMeetingJournalQuery(meetingId: string, filters: JournalFilters) {
  return useQuery(meetingJournalQueryOptions(meetingId, filters));
}

/** `GET /meetings/:id/log` — история изменений посещаемости (ТЗ §16). */
export function meetingAuditLogQueryOptions(meetingId: string) {
  return queryOptions({
    queryKey: qk.meetings.log(meetingId),
    queryFn: () => apiClient.get<AttendanceLogEntry[]>(`/meetings/${meetingId}/log`),
    enabled: Boolean(meetingId),
  });
}

export function useMeetingAuditLogQuery(meetingId: string) {
  return useQuery(meetingAuditLogQueryOptions(meetingId));
}

export interface DayJournalFilters extends JournalFilters {
  date?: string;
}

const DAY_JOURNAL_POLL_MS = 15_000;

/**
 * `GET /meetings/journal` — единый журнал за день, все групповые практики
 * сразу (куратор явно попросил один экран вместо журнала на каждую группу —
 * при 10+ группах и ученике, который может зайти из любой, искать по одной
 * группе за раз нереально). Опрашивается с интервалом — ученик может нажать
 * «Я на практике» и уйти, куратору важно увидеть это без ручного обновления.
 */
export function dayJournalQueryOptions(filters: DayJournalFilters) {
  const date = filters.date ?? "";
  const q = filters.q ?? "";
  const groupId = filters.groupId ?? "";
  const status = filters.status ?? "";
  return queryOptions({
    queryKey: qk.meetings.dayJournal(date, q, groupId, status),
    queryFn: () => {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (q) params.set("q", q);
      if (groupId) params.set("groupId", groupId);
      if (status) params.set("status", status);
      const qs = params.toString();
      return apiClient.get<DayJournal>(`/meetings/journal${qs ? `?${qs}` : ""}`);
    },
    refetchInterval: DAY_JOURNAL_POLL_MS,
  });
}

export function useDayJournalQuery(filters: DayJournalFilters) {
  return useQuery(dayJournalQueryOptions(filters));
}
