import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/client";
import { setAccessToken } from "@/shared/api/token";
import type { Dto } from "@/shared/api/schema";

// `GET /curator/dashboard` — BACKEND.md §12, порт CuratorDashboard (curator.index.tsx).

beforeAll(async () => {
  const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
    login: "curator",
    password: "test123",
  });
  setAccessToken(accessToken);
});

describe("GET /curator/dashboard", () => {
  it("reports top-level stats and only non-zero attention rows", async () => {
    const dashboard = await apiClient.get<Dto<"CuratorDashboardDto">>("/curator/dashboard");
    expect(dashboard.curatorName).toBeTruthy();
    expect(dashboard.stats.students).toBeGreaterThan(0);
    expect(dashboard.stats.groups).toBeGreaterThan(0);
    expect(dashboard.attentionRows.every((r) => r.count > 0)).toBe(true);
    expect(dashboard.attentionCount).toBe(dashboard.attentionRows.reduce((sum, r) => sum + r.count, 0));
  });

  it("403s a student token", async () => {
    const { accessToken } = await apiClient.post<Dto<"LoginResponseDto">>("/auth/login", {
      login: "kanat",
      password: "test123",
    });
    setAccessToken(accessToken);
    await expect(apiClient.get("/curator/dashboard")).rejects.toMatchObject({ status: 403 });
  });
});
