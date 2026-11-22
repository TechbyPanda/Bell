import type { Session } from './sessions';

export function planSessionAlerts(sessions: Session[], now: Date) {
  const boundaries = new Map<number, { start?: string; end?: string }>();

  for (const session of sessions) {
    boundaries.set(session.start, { ...boundaries.get(session.start), start: session.title });
    boundaries.set(session.end, { ...boundaries.get(session.end), end: session.title });
  }

  return [...boundaries.entries()].sort(([a], [b]) => a - b).map(([minute, boundary]) => {
    const date = new Date(now);
    date.setHours(Math.floor(minute / 60), minute % 60, 0, 0);

    const { start, end } = boundary;
    return {
      date: date.getTime(),
      title: start ? `Start ${start}` : `${end} ended`,
      body: start && end ? `${end} ended. Time for ${start}.`
        : start ? 'Your scheduled session is starting.' : 'Your scheduled session is complete.',
    };
  });
}

export type AlertStatus = 'unsupported' | 'permission' | 'exact' | 'build' | 'muted' | 'preview' | 'scheduled' | 'ready' | 'error';

export type TestAlertStatus = 'sent' | 'permission' | 'muted' | 'error' | 'unsupported';
