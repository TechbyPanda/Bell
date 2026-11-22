export type Session = {
  id: number;
  title: string;
  start: number;
  end: number;
};

export function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function formatTimeInput(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function parseTimeInput(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
}

export function findOverlap(candidate: Session, sessions: Session[]) {
  return sessions.find((session) =>
    session.id !== candidate.id &&
    candidate.start < session.end &&
    session.start < candidate.end,
  );
}
