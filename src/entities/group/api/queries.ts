import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { GroupDetail, GroupsList } from "../model/types";

/** `groups` (роль C) — BACKEND.md §12. */

export function groupsQueryOptions(status: string, language: string) {
  return queryOptions({
    queryKey: qk.groups.list(status, language),
    queryFn: () => {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (language !== "all") params.set("language", language);
      const qs = params.toString();
      return apiClient.get<GroupsList>(`/groups${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useGroupsQuery(status: string, language: string) {
  return useQuery(groupsQueryOptions(status, language));
}

export function groupQueryOptions(id: string) {
  return queryOptions({
    queryKey: qk.groups.detail(id),
    queryFn: () => apiClient.get<GroupDetail>(`/groups/${id}`),
  });
}

export function useGroupQuery(id: string) {
  return useQuery(groupQueryOptions(id));
}
