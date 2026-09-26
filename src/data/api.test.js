import AsyncStorage from "@react-native-async-storage/async-storage";
import { readPages } from "./MeshQueries";
import { supabase } from "../supabaseClient";
import { ensureIdentity, writeBinding, insertDemoEmergency } from "./api";
import { logDateKey } from "./trackingLogs";
jest.mock("../supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInAnonymously: jest.fn()
    },
    from: jest.fn()
  }
}));
test("installation identity is persisted without sign-in", async () => {
  await AsyncStorage.setItem("michibiki.clientId", "00000000-0000-4000-8000-000000000001");
  const first = await ensureIdentity();
  const second = await ensureIdentity();
  expect(first).toEqual(second);
  expect(first.id).toBe("00000000-0000-4000-8000-000000000001");
  expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled();
});
test("history beyond one page is not truncated", async () => {
  const range = jest.fn().mockResolvedValueOnce({
    data: Array.from({
      length: 500
    }, (_, id) => ({
      id
    })),
    error: null
  }).mockResolvedValueOnce({
    data: [{
      id: 500
    }],
    error: null
  });
  supabase.from.mockReturnValue({
    select: () => ({
      range
    })
  });
  expect(await readPages(() => supabase.from("tracking_logs").select("*"))).toHaveLength(501);
  expect(range.mock.calls).toEqual([[0, 499], [500, 999]]);
});
test("binding uniqueness failures return actionable errors", async () => {
  supabase.from.mockReturnValue({
    upsert: () => ({
      select: () => ({
        single: async () => ({
          error: {
            code: "23505"
          }
        })
      })
    })
  });
  await expect(writeBinding("user", "A07")).rejects.toThrow("already bound to another user");
});
test("history dates use Japan's date even when Supabase returns UTC", () => {
  expect(logDateKey("2026-09-25T16:00:00Z")).toBe("2026-09-26");
});

test('retrying a saved demo emergency returns the same record rather than creating a duplicate', async () => {
  const row = { id: 'same-id', node_id: 'B12', is_demo: true };
  const eq = jest.fn().mockReturnValue({ single: async () => ({ data: row, error: null }) });
  supabase.from.mockReturnValueOnce({ insert: () => ({ select: () => ({ single: async () => ({ error: { code: '23505' } }) }) }) })
    .mockReturnValueOnce({ select: () => ({ eq }) });
  await expect(insertDemoEmergency(row)).resolves.toEqual(row);
  expect(eq).toHaveBeenCalledWith('id', 'same-id');
});

test('demo publication failures propagate instead of claiming an emergency was sent', async () => {
  supabase.from.mockReturnValueOnce({ insert: () => ({ select: () => ({ single: async () => ({ error: { message: 'Offline' } }) }) }) });
  await expect(insertDemoEmergency({ id: 'demo' })).rejects.toEqual({ message: 'Offline' });
});
