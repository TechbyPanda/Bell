import type { AlertStatus, TestAlertStatus } from './session-alert-plan';
import type { Session } from './sessions';

export async function syncSessionAlerts(_sessions: Session[], _day: string, _requestAccess = false): Promise<AlertStatus> {
  return 'unsupported';
}

export async function sendTestSessionAlert(): Promise<TestAlertStatus> {
  return 'unsupported';
}
