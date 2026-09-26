export const START_DELAY = 3000;
export const RETRY_INTERVAL = 3000;
export const CHECK_IN_WINDOW = 5 * 60 * 1000;
export const FAST_FORWARD_DURATION = 1500;
export const idleSimulation = { phase: 'idle', kind: null };

// One simulation per installation. Absolute deadlines survive foreground/background pauses.
export function createDemoEngine({ getMesh, publishEmergency, onChange, now = Date.now, makeId }) {
  let state = idleSimulation;
  let generation = 0;
  let disposed = false;
  const update = next => { state = next; if (!disposed) onChange(next); };
  const active = () => ['scheduled', 'retrying', 'checking', 'sending', 'error'].includes(state.phase);

  async function send() {
    if (disposed || !['retrying', 'checking', 'error'].includes(state.phase)) return;
    const token = generation;
    const snapshot = state;
    update({ ...state, phase: 'sending', remaining: 0, error: '' });
    try {
      const reason = snapshot.kind === 'range'
        ? 'Device unable to emit a signal after 5 retries. Emergency assistance requested. Last known position attached.'
        : snapshot.response === 'okay'
          ? 'Inactivity check acknowledged: the user reports being okay. Emergency notification requested for the mesh and base station.'
          : snapshot.response === 'help'
            ? 'The user requested help during an inactivity check. Emergency assistance requested.'
            : 'Inactivity detected: no response to "Are you okay?" before the check-in deadline.';
      await publishEmergency({ id: snapshot.emergencyId, nodeId: snapshot.nodeId, reason });
      if (!disposed && token === generation) update({ ...state, phase: 'sent' });
    } catch (error) {
      if (!disposed && token === generation) update({ ...state, phase: 'error', error: error.message || 'Could not publish emergency.' });
    }
  }
  function tick() {
    if (disposed || !active()) return;
    const mesh = getMesh();
    if (mesh.boundId !== state.ownerId || !mesh.nodes.some(node => node.id === state.nodeId)) {
      reset();
      return;
    }
    const time = now();
    if (state.phase === 'scheduled') {
      if (time < state.startsAt) return;
      update({ ...state, phase: state.kind === 'range' ? 'retrying' : 'checking', attempt: 1,
        deadline: state.startsAt + (state.kind === 'range' ? 5 * RETRY_INTERVAL : CHECK_IN_WINDOW) });
    }
    if (state.phase === 'retrying') {
      const attempt = Math.min(5, Math.floor((time - state.startsAt) / RETRY_INTERVAL) + 1);
      if (attempt !== state.attempt) update({ ...state, attempt });
      if (time >= state.deadline) void send();
    } else if (state.phase === 'checking') {
      if (state.fastForward && time < state.fastForward.endsAt) {
        const progress = Math.max(0, (time - state.fastForward.startedAt) / (state.fastForward.endsAt - state.fastForward.startedAt));
        const remaining = Math.max(5, Math.ceil(state.fastForward.from - (state.fastForward.from - 5) * progress));
        if (remaining !== state.remaining) update({ ...state, remaining });
        return;
      }
      const remaining = Math.max(0, Math.ceil((state.deadline - time) / 1000));
      if (remaining !== state.remaining || state.fastForward) update({ ...state, remaining, fastForward: null });
      if (!remaining) void send();
    }
  }
  function start(kind) {
    if (disposed) return 'Monitoring is unavailable.';
    if (active()) return 'Monitoring is already running. Finish or reset it first.';
    const { nodes, boundId } = getMesh();
    if (!boundId || !nodes.some(node => node.id === boundId)) return 'Connect your device first.';
    const nodeId = boundId;
    generation++;
    update({ kind, phase: 'scheduled', nodeId, ownerId: boundId, startsAt: now() + START_DELAY,
      emergencyId: makeId(), attempt: 0, remaining: 300, recipientCount: nodes.filter(node => node.id !== nodeId).length });
    return null;
  }
  function respond(response) {
    tick();
    if (state.phase !== 'checking') return;
    update({ ...state, response, fastForward: null });
    void send();
  }
  function expire() {
    tick();
    if (state.kind !== 'inactivity' || state.phase !== 'checking') return 'Start the inactivity check and wait for the prompt first.';
    if (state.fastForward || state.remaining <= 5) return null;
    const startedAt = now();
    // Do not extend an already shorter countdown, even when Shift+V is pressed repeatedly.
    const endsAt = Math.min(startedAt + FAST_FORWARD_DURATION, state.deadline - 5000);
    update({ ...state, deadline: endsAt + 5000, fastForward: { from: state.remaining, startedAt, endsAt } });
    return null;
  }
  function reset() { generation++; update(idleSimulation); }
  return { start, tick, acknowledge: () => respond('okay'), requestHelp: () => respond('help'), expire, reset, retry: () => { if (state.phase === 'error') void send(); },
    getState: () => state, dispose: () => { disposed = true; generation++; } };
}
