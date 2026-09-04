import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode, SyntheticEvent } from "react";
import { toast } from "sonner";
import { apiClient, type Dto } from "@/shared/api";
import { clearAccessToken, setAccessToken } from "@/entities/session";
import { useTrackWatchProgress } from "./useTrackWatchProgress";

// Интеграционный тест на реальных MSW-хендлерах — проверяет, что онлайн-виджет
// не переизобретает вычисление порога, а лишь показывает `completedJustNow`
// с сервера (FRONTEND.md §7). Не через реальный <video> (ненадёжно гонять
// Playwright-сик по короткому mp4 в CI — сиков в файле почти нет после кадра 0),
// а напрямую через хук с синтетическим `SyntheticEvent<HTMLVideoElement>`.

vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function fakeTimeUpdate(currentTime: number, duration: number) {
  return { currentTarget: { currentTime, duration } } as SyntheticEvent<HTMLVideoElement>;
}

afterEach(() => {
  clearAccessToken();
  vi.clearAllMocks();
});

describe("useTrackWatchProgress", () => {
  it("posts the growing pct and updates local state (kanat, lesson 3, watched=40%)", async () => {
    const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
      login: "kanat",
      password: "test123",
    });
    setAccessToken(accessToken);

    const { result } = renderHook(() => useTrackWatchProgress(3, 40), { wrapper });
    expect(result.current.watchedPct).toBe(40);

    act(() => result.current.onTimeUpdate(fakeTimeUpdate(60, 100)));
    await waitFor(() => expect(result.current.watchedPct).toBe(60));

    const lesson = await apiClient.get<Dto<"LessonDetailDto">>("/me/lessons/3");
    expect(lesson.watchedPct).toBe(60);
    expect(lesson.state).toBe("available");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("does not send a regressed (lower) pct — server keeps the max either way", async () => {
    const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
      login: "kanat",
      password: "test123",
    });
    setAccessToken(accessToken);

    const { result } = renderHook(() => useTrackWatchProgress(3, 40), { wrapper });
    act(() => result.current.onTimeUpdate(fakeTimeUpdate(60, 100)));
    await waitFor(() => expect(result.current.watchedPct).toBe(60));

    act(() => result.current.onTimeUpdate(fakeTimeUpdate(20, 100))); // регресс — локально тоже не откатывает
    expect(result.current.watchedPct).toBe(60);
  });

  it("auto-completes past the 90% threshold and toasts once (server-computed, not recomputed on the client)", async () => {
    const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
      login: "kanat",
      password: "test123",
    });
    setAccessToken(accessToken);

    const { result } = renderHook(() => useTrackWatchProgress(3, 40), { wrapper });
    act(() => result.current.onTimeUpdate(fakeTimeUpdate(95, 100)));

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(result.current.watchedPct).toBe(95);

    const lesson = await apiClient.get<Dto<"LessonDetailDto">>("/me/lessons/3");
    expect(lesson.state).toBe("completed");
    expect(lesson.watchedPct).toBe(100);

    // Ещё один tick после завершения (видео доигрывает до конца) — тост не дублируется.
    act(() => result.current.onTimeUpdate(fakeTimeUpdate(100, 100)));
    await waitFor(() => expect(result.current.watchedPct).toBe(100));
    expect(toast.success).toHaveBeenCalledTimes(1);
  });
});
