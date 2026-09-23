import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient, qk } from "@/shared/api";
import type { AuditLogList, CuratorDetail, CuratorsList } from "../model/types";

/** `GET /curators` — только главный куратор (BACKEND.md §12, ТЗ «роли»). */
export function curatorsQueryOptions() {
  return queryOptions({
    queryKey: qk.curators.list,
    queryFn: () => apiClient.get<CuratorsList>("/curators"),
    staleTime: 30_000,
  });
}

export function useCuratorsQuery() {
  return useQuery(curatorsQueryOptions());
}

export function curatorQueryOptions(id: string) {
  return queryOptions({
    queryKey: qk.curators.detail(id),
    queryFn: () => apiClient.get<CuratorDetail>(`/curators/${id}`),
  });
}

export function useCuratorQuery(id: string) {
  return useQuery(curatorQueryOptions(id));
}

export function auditLogQueryOptions(id: string, page: number) {
  return queryOptions({
    queryKey: qk.curators.auditLog(id, page),
    queryFn: () => apiClient.get<AuditLogList>(`/curators/${id}/audit-log?page=${page}`),
  });
}

export function useAuditLogQuery(id: string, page: number) {
  return useQuery(auditLogQueryOptions(id, page));
}
