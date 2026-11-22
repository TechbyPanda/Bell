import { isRunningInExpoGo } from 'expo';
// The package root loads push-token dependencies, including the native ExpoApplication module.
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
import { AndroidAudioContentType, AndroidAudioUsage, AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import {
  getExactAlarmPermissionsAsync,
  getPermissionsAsync,
  requestExactAlarmPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { Linking } from 'react-native';

import { localDay } from './schedule-storage';
import { planSessionAlerts, type AlertStatus, type TestAlertStatus } from './session-alert-plan';
import type { Session } from './sessions';

const inExpoGo = isRunningInExpoGo();
// Android retains the sound settings of existing channels.
const channelId = inExpoGo ? 'session-alerts' : 'session-alarm-tone';
const sound = inExpoGo ? 'default' : 'session_alarm.wav';
const identifierPrefix = 'bell-session:';
const alarmIdentifierPrefix = inExpoGo ? identifierPrefix : `${identifierPrefix}tone:`;

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let queue: Promise<unknown> = Promise.resolve();

export function syncSessionAlerts(sessions: Session[], day: string, requestAccess = false): Promise<AlertStatus> {
  const operation = queue.then(() => reconcileAlerts(sessions, day, requestAccess));
  queue = operation.catch(() => undefined);
  return operation;
}

async function reconcileAlerts(sessions: Session[], day: string, requestAccess: boolean): Promise<AlertStatus> {
  const now = new Date();
  if (localDay(now) !== day) return 'ready';

  const plan = planSessionAlerts(sessions, now);
  const wanted = new Map(plan.map((alert) => [alarmIdentifierPrefix + alert.date, alert]));
  const scheduled = await getAllScheduledNotificationsAsync();

  // Remove obsolete or changed requests before adding their replacements.
  for (const item of scheduled) {
    if (!item.identifier.startsWith(identifierPrefix)) continue;
    const alert = wanted.get(item.identifier);
    if (alert && item.content.title === alert.title && item.content.body === alert.body) {
      wanted.delete(item.identifier);
    } else {
      await cancelScheduledNotificationAsync(item.identifier);
    }
  }

  if (!plan.some((alert) => alert.date > now.getTime())) return 'ready';

  const issue = await checkNotificationChannel(requestAccess);
  if (issue) return issue;

  // Expo Go can schedule local notifications using its own app permissions.
  if (!inExpoGo) {
    let exact = await getExactAlarmPermissionsAsync();
    if (!exact.granted && requestAccess && exact.canAskAgain) {
      exact = await requestExactAlarmPermissionsAsync();
    }
    if (!exact.granted) return exact.canAskAgain ? 'exact' : 'build';
  }

  for (const [identifier, alert] of wanted) {
    if (alert.date <= Date.now()) continue;
    await scheduleNotificationAsync({
      identifier,
      content: { title: alert.title, body: alert.body, sound },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: alert.date,
        channelId,
        delivery: inExpoGo ? undefined : 'alarmClock',
      },
    });
  }

  return inExpoGo ? 'preview' : 'scheduled';
}

async function checkNotificationChannel(requestAccess: boolean) {
  const channel = await setNotificationChannelAsync(channelId, {
    name: inExpoGo ? 'Session alarms' : 'Session alarm tone',
    importance: AndroidImportance.HIGH,
    sound,
    enableVibrate: true,
    audioAttributes: inExpoGo ? undefined : {
      usage: AndroidAudioUsage.ALARM,
      contentType: AndroidAudioContentType.SONIFICATION,
    },
  });

  let permission = await getPermissionsAsync();
  if (!permission.granted && requestAccess) {
    if (!permission.canAskAgain) {
      await Linking.openSettings();
      return 'permission';
    }
    permission = await requestPermissionsAsync();
  }
  if (!permission.granted) return 'permission';

  if (channel && (channel.sound === null || channel.importance < AndroidImportance.DEFAULT)) {
    if (requestAccess) await Linking.openSettings();
    return 'muted';
  }

  return null;
}

export async function sendTestSessionAlert(): Promise<TestAlertStatus> {
  const issue = await checkNotificationChannel(true);
  if (issue) return issue;

  await scheduleNotificationAsync({
    content: { title: 'Bell sound test', body: 'Session starts and ends use this sound.', sound },
    trigger: { channelId },
  });
  return 'sent';
}