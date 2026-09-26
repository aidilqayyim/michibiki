import { readPages } from "./MeshQueries";
import { supabase } from "../supabaseClient";
import { ensureIdentity, writeBinding, writeLocation } from "./api";
import { logDateKey } from "./trackingLogs";
jest.mock("../supabaseClient", () => ({ supabase: { auth: { getSession: jest.fn(), signInAnonymously: jest.fn() }, from: jest.fn() } }));

test("browser identity is persisted without sign-in", async () => {
  localStorage.setItem("michibiki.clientId", "00000000-0000-4000-8000-000000000001");
  const first = await ensureIdentity();
  const second = await ensureIdentity();
  expect(first).toEqual(second);
  expect(first.id).toBe("00000000-0000-4000-8000-000000000001");
  expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled();
});

test("history beyond one page is not truncated", async () => {
  const range = jest.fn().mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, id) => ({ id })), error: null })
    .mockResolvedValueOnce({ data: [{ id: 500 }], error: null });
  supabase.from.mockReturnValue({ select: () => ({ range }) });
  expect(await readPages(() => supabase.from("tracking_logs").select("*"))).toHaveLength(501);
  expect(range.mock.calls).toEqual([[0, 499], [500, 999]]);
});

test("binding uniqueness failures return actionable errors", async () => {
  supabase.from.mockReturnValue({ upsert: () => ({ select: () => ({ single: async () => ({ error: { code: "23505" } }) }) }) });
  await expect(writeBinding("user", "A07")).rejects.toThrow("already bound to another user");
});

test("GPS save writes coordinates and reports database failures", async () => {
  const eq = jest.fn().mockReturnValue({ select: () => ({ single: async () => ({ error: { message: "Offline" } }) }) });
  const update = jest.fn().mockReturnValue({ eq });
  supabase.from.mockReturnValue({ update });
  await expect(writeLocation("B12", { latitude: 3, longitude: 101 })).rejects.toEqual({ message: "Offline" });
  expect(update.mock.calls[0][0]).toMatchObject({ lat: 3, lng: 101 });
  expect(eq).toHaveBeenCalledWith("id", "B12");
});

test("history dates use Japan's date even when Supabase returns UTC", () => {
  expect(logDateKey("2026-09-25T16:00:00Z")).toBe("2026-09-26");
});
