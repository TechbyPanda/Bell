import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BellMascot } from '@/components/bell-mascot';
import { SessionEditor } from '@/components/session-editor';
import { useScheduleClock } from '@/hooks/use-schedule-clock';
import { loadSchedule, localDay, storeSchedule } from '@/utils/schedule-storage';
import type { AlertStatus, TestAlertStatus } from '@/utils/session-alert-plan';
import { sendTestSessionAlert, syncSessionAlerts } from '@/utils/session-alerts';
import { formatTime, type Session } from '@/utils/sessions';

const alertActions: Partial<Record<AlertStatus, string>> = {
  permission: 'Allow notifications',
  exact: 'Allow exact alarms',
  muted: 'Check alarm sound settings',
  error: 'Retry alarm setup',
};

const testMessages: Record<TestAlertStatus, string> = {
  sent: 'Test sent. If it is silent, check the notification shade and sound volume.',
  permission: 'Allow Bell notifications, then try the sound test again.',
  muted: 'Enable sound for the Bell notification category, then try again.',
  error: 'Android could not send the test notification.',
  unsupported: 'The sound test is available on Android.',
};

export default function TodayScreen() {
  const clock = useScheduleClock();
  if (!clock) return <SafeAreaView style={styles.screen} />;

  const day = localDay(clock.now);
  return <TodaySchedule key={day} day={day} {...clock} />;
}

function TodaySchedule({ day, now, activation }: { day: string; now: Date; activation: number }) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [editor, setEditor] = useState<Session | 'new' | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const writeInProgress = useRef(false);
  const [alertStatus, setAlertStatus] = useState<AlertStatus | null>(null);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [testStatus, setTestStatus] = useState<TestAlertStatus | 'testing' | null>(null);
  const minute = now.getHours() * 60 + now.getMinutes();
  const activeSession = sessions?.find((session) => session.start <= minute && minute < session.end);
  const nextSession = sessions?.find((session) => session.start > minute);
  const focusMinutes = sessions?.reduce((total, session) => total + session.end - session.start, 0) ?? 0;
  const alertAction = alertStatus && alertActions[alertStatus];

  useEffect(() => {
    let mounted = true;
    loadSchedule(day).then((stored) => {
      if (mounted) setSessions(stored);
    }).catch(() => {
      if (mounted) setLoadError(true);
    });
    return () => { mounted = false; };
  }, [day, loadAttempt]);

  useEffect(() => {
    if (!sessions) return;

    let current = true;
    syncSessionAlerts(sessions, day).then((status) => {
      if (current) setAlertStatus(status);
    }).catch(() => {
      if (current) setAlertStatus('error');
    });
    return () => { current = false; };
  }, [activation, day, sessions]);

  async function requestAlarmAccess() {
    if (!sessions || requestingAccess) return;

    setRequestingAccess(true);
    try {
      setAlertStatus(await syncSessionAlerts(sessions, day, true));
    } catch {
      setAlertStatus('error');
    } finally {
      setRequestingAccess(false);
    }
  }

  async function testAlarmSound() {
    setTestStatus('testing');
    try {
      setTestStatus(await sendTestSessionAlert());
    } catch {
      setTestStatus('error');
    }
  }

  function openEditor(session: Session | 'new') {
    setSaveError('');
    setEditor(session);
  }

  async function saveSchedule(updated: Session[]) {
    if (writeInProgress.current) return;

    writeInProgress.current = true;
    setSaving(true);
    setSaveError('');
    try {
      await storeSchedule(day, updated);
      setSessions(updated);
      setEditor(null);
    } catch {
      setSaveError('Could not save the schedule. Try again.');
    } finally {
      writeInProgress.current = false;
      setSaving(false);
    }
  }

  function saveSession(session: Session) {
    if (!sessions) return;
    void saveSchedule([...sessions.filter((item) => item.id !== session.id), session]
      .sort((a, b) => a.start - b.start));
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.masthead}>
          <View style={styles.heading}>
            <Text style={styles.brandName}>bell</Text>
            <Text accessibilityRole="header" style={styles.title}>Today</Text>
            <Text style={styles.muted}>Local time · {formatTime(minute)}</Text>
          </View>
          <BellMascot />
        </View>

        {!sessions ? (
          <Text accessibilityLiveRegion="polite" style={styles.muted}>
            {loadError ? 'Could not load today’s schedule.' : 'Loading your schedule…'}
          </Text>
        ) : activeSession ? (
          <ActiveSessionCard session={activeSession} minute={minute} />
        ) : (
          <View style={styles.focus}>
            <Text style={styles.focusLabel}>
              {nextSession ? 'UP NEXT' : sessions.length ? 'SCHEDULE COMPLETE' : 'TODAY’S PLAN'}
            </Text>
            <Text accessibilityRole="header" style={styles.focusTitle}>
              {nextSession?.title ?? (sessions.length ? 'All done' : 'No sessions yet')}
            </Text>
            {nextSession && <Text style={styles.focusDetail}>Starts at {formatTime(nextSession.start)}</Text>}
          </View>
        )}

        {sessions && <View style={styles.scheduleHeading}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Schedule</Text>
          <Text style={styles.muted}>{focusMinutes} min planned</Text>
        </View>}

        {sessions?.map((session, index) => {
          const isActive = session === activeSession;
          return (
            <View key={session.id} style={styles.sessionRow}>
              <Text style={[styles.startTime, isActive && styles.accent]}>
                {formatTime(session.start)}
              </Text>
              <View style={styles.timeline}>
                {index < sessions.length - 1 && <View style={styles.connector} />}
                <View style={[styles.dot, isActive && styles.activeDot]} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Opens the session editor"
                onPress={() => openEditor(session)}
                style={({ pressed }) => [styles.sessionCard, isActive && styles.activeCard, pressed && styles.pressed]}>
                <View style={styles.sessionHeading}>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  {session === nextSession && <Text style={styles.nextLabel}>UP NEXT</Text>}
                </View>
                <Text style={styles.muted}>
                  Ends {formatTime(session.end)} · {session.end - session.start} min
                </Text>
              </Pressable>
            </View>
          );
        })}
        {Platform.OS === 'android' && (
          <View style={styles.alarmTools}>
            {alertStatus === 'scheduled' && (
              <Text accessibilityLiveRegion="polite" style={styles.muted}>Upcoming alarms scheduled.</Text>
            )}
            {testStatus && testStatus !== 'testing' && (
              <Text accessibilityLiveRegion="polite" style={styles.muted}>{testMessages[testStatus]}</Text>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={requestingAccess || testStatus === 'testing'}
              onPress={testAlarmSound}
              style={styles.alarmAction}>
              <Text style={styles.accent}>{testStatus === 'testing' ? 'Sending test…' : 'Test alarm sound'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        {alertStatus === 'preview' && (
          <Text accessibilityLiveRegion="polite" style={styles.muted}>
            Session alerts scheduled. Android may delay them in Expo Go.
          </Text>
        )}
        {alertStatus === 'build' && (
          <Text style={styles.muted}>Exact alarms require a Bell Android development build.</Text>
        )}
        {Platform.OS === 'android' && alertAction && (
          <Pressable accessibilityRole="button" disabled={requestingAccess || testStatus === 'testing'} onPress={requestAlarmAccess}
            style={styles.alarmAction}>
            <Text style={styles.accent}>{requestingAccess ? 'Checking alarms…' : alertAction}</Text>
          </Pressable>
        )}
        {loadError ? (
          <Pressable accessibilityRole="button" onPress={() => {
            setLoadError(false);
            setLoadAttempt((attempt) => attempt + 1);
          }} style={styles.addButton}>
            <Text style={styles.addLabel}>Retry loading</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" disabled={!sessions}
            onPress={() => openEditor('new')}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed, !sessions && styles.disabled]}>
            <Text style={styles.addLabel}>+  Add session</Text>
          </Pressable>
        )}
      </View>
      {editor && sessions && (
        <SessionEditor
          session={editor === 'new' ? undefined : editor}
          sessions={sessions}
          saving={saving}
          saveError={saveError}
          onClose={() => { if (!writeInProgress.current) setEditor(null); }}
          onSave={saveSession}
          onDelete={editor === 'new' ? undefined : () => {
            void saveSchedule(sessions.filter((session) => session.id !== editor.id));
          }}
        />
      )}
    </SafeAreaView>
  );
}

function ActiveSessionCard({ session, minute }: { session: Session; minute: number }) {
  const progress = Math.floor((minute - session.start) / (session.end - session.start) * 100);

  return (
    <View style={styles.focus}>
      <View style={styles.focusTop}>
        <Text style={styles.focusLabel}>IN PROGRESS</Text>
        <Text style={styles.focusTime}>{session.end - minute} min left</Text>
      </View>
      <Text accessibilityRole="header" style={styles.focusTitle}>{session.title}</Text>
      <Text style={styles.focusDetail}>Ends at {formatTime(session.end)}</Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`${session.title} session progress`}
        accessibilityValue={{ min: 0, max: 100, now: progress }}
        style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const palette = {
  background: '#111416',
  surface: '#1B2022',
  border: '#303739',
  text: '#F3F5F2',
  muted: '#AEB8B8',
  accent: '#DCFA84',
  ink: '#1B2712',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { width: '100%', maxWidth: 540, alignSelf: 'center', padding: 24, paddingBottom: 12 },
  masthead: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 22 },
  heading: { flex: 1, gap: 4 },
  brandName: { color: palette.accent, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  title: { color: palette.text, fontSize: 46, fontWeight: '800', letterSpacing: -2 },
  muted: { color: palette.muted, fontSize: 13 },
  focus: { backgroundColor: palette.accent, borderRadius: 24, padding: 20 },
  focusTop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  focusLabel: { color: palette.ink, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  focusTime: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  focusTitle: { color: palette.ink, fontSize: 34, fontWeight: '800', letterSpacing: -1.2, marginTop: 12 },
  focusDetail: { color: '#364727', fontSize: 14, marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#B9D66F', marginTop: 18 },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: palette.ink },
  scheduleHeading: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between',
    alignItems: 'baseline', marginTop: 26, marginBottom: 14,
  },
  sectionTitle: { color: palette.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.6 },
  sessionRow: { flexDirection: 'row', alignItems: 'stretch' },
  startTime: {
    color: palette.muted, width: 68, fontSize: 12, fontWeight: '700',
    fontVariant: ['tabular-nums'], paddingTop: 16,
  },
  accent: { color: palette.accent },
  timeline: { width: 18, alignItems: 'center', marginRight: 8 },
  connector: { position: 'absolute', top: 21, bottom: -21, width: 1, backgroundColor: palette.border },
  dot: { marginTop: 17, width: 9, height: 9, borderRadius: 5, backgroundColor: '#778284' },
  activeDot: { backgroundColor: palette.accent },
  sessionCard: {
    flex: 1, minWidth: 0, backgroundColor: palette.surface, borderColor: palette.border,
    borderWidth: 1, borderRadius: 16, padding: 13, gap: 4, marginBottom: 10,
  },
  activeCard: { borderColor: '#627741' },
  sessionHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  sessionTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  nextLabel: { color: palette.accent, fontWeight: '800', fontSize: 10, letterSpacing: 0.7 },
  footer: {
    width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 24,
    paddingTop: 10, paddingBottom: 14, gap: 10,
  },
  alarmTools: { marginTop: 16, gap: 6, alignItems: 'center' },
  alarmAction: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.5 },
  addButton: {
    minHeight: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: palette.accent,
  },
  addLabel: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.8 },
});
