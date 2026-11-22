import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Session } from './sessions';

const keyPrefix = 'bell:schedule:v1:';

export function localDay(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
}

export async function loadSchedule(day: string): Promise<Session[]> {
  const stored = await AsyncStorage.getItem(keyPrefix + day);
  if (stored === null) return [];

  const sessions: Session[] = JSON.parse(stored);
  if (!Array.isArray(sessions)) throw new Error('Invalid saved schedule');
  return sessions.sort((a, b) => a.start - b.start);
}

export function storeSchedule(day: string, sessions: Session[]) {
  return AsyncStorage.setItem(keyPrefix + day, JSON.stringify(sessions));
}
