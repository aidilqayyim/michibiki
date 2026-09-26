import { createDemoEngine, CHECK_IN_WINDOW, FAST_FORWARD_DURATION } from './demoEngine';

let time, mesh, publish, engine;
beforeEach(() => {
  time = 0;
  mesh = { boundId: 'A07', nodes: [{ id: 'A07', lat: 1, lng: 2 }, { id: 'B12', lat: 2, lng: 3 }] };
  publish = jest.fn().mockResolvedValue({ id: 'alert-id' });
  engine = createDemoEngine({ getMesh: () => mesh, publishEmergency: publish, onChange: jest.fn(),
    now: () => time, makeId: () => 'alert-id' });
});
const advance = async value => { time += value; engine.tick(); await Promise.resolve(); };

test('after three seconds the bound device retries five times and broadcasts once', async () => {
  const original = JSON.stringify(mesh);
  engine.start('range');
  expect(engine.getState()).toMatchObject({ phase: 'scheduled', nodeId: 'A07', recipientCount: 1 });
  await advance(2999);
  expect(engine.getState().phase).toBe('scheduled');
  await advance(1);
  for (let attempt = 1; attempt <= 5; attempt++) {
    expect(engine.getState()).toMatchObject({ phase: 'retrying', attempt, nodeId: 'A07' });
    expect(publish).not.toHaveBeenCalled();
    await advance(3000);
  }
  expect(publish).toHaveBeenCalledTimes(1);
  expect(publish).toHaveBeenCalledWith({ id: 'alert-id', nodeId: 'A07', reason: expect.stringContaining('unable to emit a signal after 5 retries') });
  expect(engine.getState().phase).toBe('sent');
  await advance(10000);
  expect(publish).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(mesh)).toBe(original);
});

test('repeated triggers do not restart or overlap scenarios', async () => {
  engine.start('range');
  expect(engine.start('range')).toMatch(/already running/);
  expect(engine.start('inactivity')).toMatch(/already running/);
  await advance(3000);
  expect(engine.getState()).toMatchObject({ phase: 'retrying', attempt: 1 });
});

test('inactivity asks after three seconds and expires naturally after five minutes', async () => {
  engine.start('inactivity');
  await advance(3000);
  expect(engine.getState()).toMatchObject({ phase: 'checking', remaining: 300 });
  await advance(CHECK_IN_WINDOW - 1);
  expect(publish).not.toHaveBeenCalled();
  await advance(1);
  expect(publish).toHaveBeenCalledWith({ id: 'alert-id', nodeId: 'A07', reason: expect.stringContaining('no response') });
  expect(engine.getState().phase).toBe('sent');
});

test("I'm okay broadcasts a truthful acknowledgement exactly once", async () => {
  engine.start('inactivity');
  await advance(3000);
  engine.acknowledge();
  engine.requestHelp();
  engine.acknowledge();
  await Promise.resolve();
  expect(engine.getState()).toMatchObject({ phase: 'sent', response: 'okay' });
  expect(publish).toHaveBeenCalledWith({ id: 'alert-id', nodeId: 'A07', reason: expect.stringContaining('user reports being okay') });
  await advance(CHECK_IN_WINDOW);
  expect(publish).toHaveBeenCalledTimes(1);
});

test('I need help sends immediately rather than fast-forwarding', async () => {
  engine.start('inactivity');
  await advance(3000);
  engine.requestHelp();
  await Promise.resolve();
  expect(engine.getState()).toMatchObject({ phase: 'sent', response: 'help' });
  expect(publish).toHaveBeenCalledWith({ id: 'alert-id', nodeId: 'A07', reason: expect.stringContaining('user requested help') });
});

test('Shift+V rapidly changes numbers down to five, then counts five normal seconds', async () => {
  expect(engine.expire()).toMatch(/wait for the prompt/);
  engine.start('inactivity');
  expect(engine.expire()).toMatch(/wait for the prompt/);
  await advance(3000);
  expect(engine.expire()).toBeNull();
  const deadline = engine.getState().deadline;
  expect(engine.getState().remaining).toBe(300);
  await advance(FAST_FORWARD_DURATION / 2);
  expect(engine.getState().remaining).toBeGreaterThan(5);
  expect(engine.getState().remaining).toBeLessThan(300);
  engine.expire();
  expect(engine.getState().deadline).toBe(deadline);
  await advance(FAST_FORWARD_DURATION / 2);
  expect(engine.getState()).toMatchObject({ phase: 'checking', remaining: 5 });
  for (let remaining = 4; remaining >= 1; remaining--) {
    await advance(1000);
    expect(engine.getState().remaining).toBe(remaining);
    expect(publish).not.toHaveBeenCalled();
    engine.expire();
    expect(engine.getState().deadline).toBe(deadline);
  }
  await advance(1000);
  expect(engine.getState().phase).toBe('sent');
  expect(publish).toHaveBeenCalledTimes(1);
});

test('a user can respond during fast-forwarding without a second timeout alert', async () => {
  engine.start('inactivity');
  await advance(3000);
  engine.expire();
  await advance(500);
  engine.requestHelp();
  await Promise.resolve();
  await advance(10000);
  expect(publish).toHaveBeenCalledTimes(1);
  expect(engine.getState().response).toBe('help');
});

test('fast-forward never lengthens a countdown that has less than five seconds left', async () => {
  engine.start('inactivity');
  await advance(3000 + CHECK_IN_WINDOW - 2000);
  const deadline = engine.getState().deadline;
  engine.expire();
  expect(engine.getState().deadline).toBe(deadline);
  expect(engine.getState().remaining).toBe(2);
});

test('late acknowledgement cannot duplicate an expired check-in', async () => {
  engine.start('inactivity');
  await advance(3000);
  time += CHECK_IN_WINDOW;
  engine.acknowledge();
  await Promise.resolve();
  expect(publish).toHaveBeenCalledTimes(1);
  expect(engine.getState().phase).toBe('sent');
});

test('failed publication is explicit and retry reuses the same ID and response', async () => {
  publish.mockRejectedValueOnce(new Error('Offline'));
  engine.start('inactivity');
  await advance(3000);
  engine.acknowledge();
  await Promise.resolve();
  expect(engine.getState()).toMatchObject({ phase: 'error', error: 'Offline' });
  await advance(6000);
  expect(publish).toHaveBeenCalledTimes(1);
  engine.retry();
  await Promise.resolve();
  expect(publish.mock.calls[1][0]).toEqual(publish.mock.calls[0][0]);
  expect(engine.getState().phase).toBe('sent');
});

test('device switching, node removal, reset and unmount cancel pending work', async () => {
  engine.start('range');
  mesh.boundId = 'B12';
  await advance(3000);
  expect(engine.getState().phase).toBe('idle');
  engine.start('range');
  mesh.nodes = mesh.nodes.filter(node => node.id !== 'B12');
  await advance(3000);
  expect(engine.getState().phase).toBe('idle');
  mesh.boundId = 'A07';
  engine.start('inactivity');
  engine.reset();
  await advance(CHECK_IN_WINDOW + 3000);
  expect(publish).not.toHaveBeenCalled();
  engine.start('inactivity');
  engine.dispose();
  await advance(CHECK_IN_WINDOW + 3000);
  expect(publish).not.toHaveBeenCalled();
});

test('background time counts toward both the check-in and fast-forward deadline', async () => {
  engine.start('inactivity');
  await advance(3000);
  engine.expire();
  await advance(FAST_FORWARD_DURATION + 6000);
  expect(publish).toHaveBeenCalledTimes(1);
});

test('a connected device is required, but a second node is not needed for transmission failure', () => {
  mesh.boundId = null;
  expect(engine.start('range')).toMatch(/Connect/);
  mesh.boundId = 'A07';
  mesh.nodes = mesh.nodes.slice(0, 1);
  expect(engine.start('range')).toBeNull();
  expect(engine.getState().nodeId).toBe('A07');
});
