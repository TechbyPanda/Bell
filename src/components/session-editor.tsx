import { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TimeDigitInput } from '@/components/time-digit-input';
import { findOverlap, formatTime, formatTimeInput, parseTimeInput, type Session } from '@/utils/sessions';

type Props = {
  session?: Session;
  sessions: Session[];
  saving: boolean;
  saveError: string;
  onDelete?: () => void;
  onClose: () => void;
  onSave: (session: Session) => void;
};

export function SessionEditor({ session, sessions, saving, saveError, onDelete, onClose, onSave }: Props) {
  const [title, setTitle] = useState(session?.title ?? '');
  const [start, setStart] = useState(session ? formatTimeInput(session.start) : '');
  const [end, setEnd] = useState(session ? formatTimeInput(session.end) : '');
  const [mode, setMode] = useState<'time' | 'duration'>('time');
  const [duration, setDuration] = useState(session ? String(session.end - session.start) : '');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    const name = title.trim();
    const startMinutes = parseTimeInput(start);

    if (!name) return setError('Enter a session title.');
    if (startMinutes === null) return setError('Enter all four digits for the start time, such as 09:45.');

    let endMinutes = parseTimeInput(end);
    if (mode === 'duration') {
      const minutes = duration.trim();
      if (!/^\d+$/.test(minutes) || Number(minutes) < 1) {
        return setError('Enter a duration of at least one whole minute.');
      }
      endMinutes = startMinutes + Number(minutes);
    }

    if (endMinutes === null) return setError('Enter all four digits for the end time, such as 10:30.');
    if (endMinutes <= startMinutes) return setError('The end time must be after the start time.');
    if (endMinutes >= 24 * 60) return setError('Choose an end time before midnight.');

    const candidate = {
      id: session?.id ?? Math.max(0, ...sessions.map((item) => item.id)) + 1,
      title: name,
      start: startMinutes,
      end: endMinutes,
    };
    const overlap = findOverlap(candidate, sessions);
    if (overlap) {
      return setError(`Overlaps with ${overlap.title} (${formatTime(overlap.start)} to ${formatTime(overlap.end)}).`);
    }

    onSave(candidate);
  }

  function changeMode(nextMode: typeof mode) {
    const startMinutes = parseTimeInput(start);
    const endMinutes = parseTimeInput(end);

    if (nextMode !== mode && startMinutes !== null) {
      if (nextMode === 'duration' && endMinutes !== null && endMinutes > startMinutes) {
        setDuration(String(endMinutes - startMinutes));
      }
      if (nextMode === 'time' && /^\d+$/.test(duration.trim())) {
        const calculatedEnd = startMinutes + Number(duration);
        if (calculatedEnd < 24 * 60) setEnd(formatTimeInput(calculatedEnd));
      }
    }
    setMode(nextMode);
    setError('');
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent>
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            accessibilityViewIsModal
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.heading}>{session ? 'Edit session' : 'Add session'}</Text>
              <Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={styles.cancel}>
                <Text style={styles.label}>Cancel</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Session title</Text>
            <TextInput accessibilityLabel="Session title" value={title} onChangeText={setTitle}
              placeholder="e.g. Study Polity" placeholderTextColor="#8E9999" maxLength={80} style={styles.input} />

            <Text style={styles.label}>Start time</Text>
            <TimeDigitInput label="Start time" value={start} disabled={saving} onChange={(value) => { setStart(value); setError(''); }} />

            <View style={styles.modes}>
              {(['time', 'duration'] as const).map((option) => (
                <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: mode === option }}
                  onPress={() => changeMode(option)} style={[styles.mode, mode === option && styles.selectedMode]}>
                  <Text style={styles.label}>{option === 'time' ? 'End time' : 'Duration'}</Text>
                </Pressable>
              ))}
            </View>

            {mode === 'time' ? (
              <>
                <Text style={styles.label}>End time</Text>
                <TimeDigitInput label="End time" value={end} disabled={saving} onChange={(value) => { setEnd(value); setError(''); }} />
              </>
            ) : (
              <>
                <Text style={styles.label}>Duration in minutes</Text>
                <TextInput key="duration" accessibilityLabel="Duration in minutes" value={duration} onChangeText={setDuration}
                  placeholder="45" placeholderTextColor="#8E9999" keyboardType="number-pad" maxLength={4} style={styles.input} />
              </>
            )}
            <Text style={styles.hint}>Use 24-hour times, such as 09:45 or 14:30.</Text>

            {!!(saveError || error) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{saveError || error}</Text>}

            <Pressable accessibilityRole="button" disabled={saving || confirmDelete} onPress={save}
              style={({ pressed }) => [styles.save, (pressed || saving || confirmDelete) && styles.pressed]}>
              <Text style={styles.saveLabel}>{saving ? 'Saving…' : 'Save session'}</Text>
            </Pressable>
            {onDelete && (
              <View style={styles.deleteArea}>
                {confirmDelete && <Text style={styles.hint}>Remove this session and its upcoming alarms?</Text>}
                <Pressable accessibilityRole="button" disabled={saving} style={styles.deleteButton}
                  onPress={() => {
                    if (confirmDelete) {
                      setError('');
                      onDelete();
                    } else {
                      setConfirmDelete(true);
                    }
                  }}>
                  <Text style={styles.error}>{confirmDelete ? 'Confirm removal' : 'Remove session'}</Text>
                </Pressable>
                {confirmDelete && (
                  <Pressable accessibilityRole="button" disabled={saving} style={styles.deleteButton}
                    onPress={() => setConfirmDelete(false)}>
                    <Text style={styles.label}>Keep session</Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#090C0DEB' },
  container: { flex: 1 },
  form: { width: '100%', maxWidth: 540, alignSelf: 'center', padding: 24, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  heading: { flexShrink: 1, color: '#F3F5F2', fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  cancel: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 10 },
  label: { color: '#F3F5F2', fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 52, backgroundColor: '#1B2022', color: '#F3F5F2', borderColor: '#414A4B',
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, marginBottom: 8,
  },
  modes: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  mode: {
    flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 8,
    borderWidth: 1, borderColor: '#414A4B', borderRadius: 14,
  },
  selectedMode: { backgroundColor: '#2B3922', borderColor: '#9EB95C' },
  hint: { color: '#AEB8B8', fontSize: 13 },
  error: { color: '#FFB9AD', fontSize: 14, marginTop: 4 },
  save: {
    minHeight: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 16,
    padding: 12, backgroundColor: '#DCFA84', marginTop: 10,
  },
  saveLabel: { color: '#1B2712', fontSize: 16, fontWeight: '800' },
  deleteArea: { alignItems: 'center', marginTop: 10 },
  deleteButton: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  pressed: { opacity: 0.65 },
});
