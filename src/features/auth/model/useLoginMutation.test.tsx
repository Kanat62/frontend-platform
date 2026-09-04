import { describe, expect, it, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getAccessToken, clearAccessToken } from "@/entities/session";
import { useLoginMutation } from "./useLoginMutation";

// Интеграционный тест на реальных MSW-хендлерах (shared/testing/setup.ts) —
// FRONTEND.md §14 («фичи: create-student валидация и сабмит» — здесь login).

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => clearAccessToken());

describe("useLoginMutation", () => {
  it("logs a student in and stores the access token", async () => {
    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    result.current.mutate({ login: "kanat", password: "test123" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user.role).toBe("student");
    expect(result.current.data?.user.student?.firstName).toBe("Канат");
    expect(getAccessToken()).toBe("mock-access.s1");
  });

  it("logs the curator in", async () => {
    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    result.current.mutate({ login: "curator", password: "test123" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user.role).toBe("curator");
    expect(result.current.data?.user.curator?.name).toBeTruthy();
  });

  it("rejects a wrong password", async () => {
    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    result.current.mutate({ login: "kanat", password: "wrong" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(getAccessToken()).toBeNull();
  });
});
