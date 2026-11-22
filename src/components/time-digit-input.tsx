import { Fragment, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const digitLabels = ['hour tens', 'hour ones', 'minute tens', 'minute ones'];

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
};

export function TimeDigitInput({ label, value, onChange, disabled }: Props) {
  const inputs = useRef<(ComponentRef<typeof TextInput> | null)[]>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const [error, setError] = useState('');
  const digits = value.replace(':', '').padEnd(4).split('');
  const limits = [2, digits[0] === '2' ? 3 : 9, 5, 9];

  function changeDigit(index: number, text: string) {
    if (text && (!/^\d$/.test(text) || Number(text) > limits[index])) {
      setError(`Enter a digit from 0 to ${limits[index]} in this box.`);
      return;
    }

    const next = [...digits];
    next[index] = text || ' ';
    if (index === 0 && text === '2' && Number(next[1]) > 3) next[1] = ' ';

    setError('');
    onChange(`${next[0]}${next[1]}:${next[2]}${next[3]}`);
    if (text) inputs.current[index + 1]?.focus();
  }

  return (
    <View style={styles.field}>
      <View style={styles.row}>
        {digitLabels.map((digitLabel, index) => (
          <Fragment key={digitLabel}>
            {index === 2 && <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.separator}>:</Text>}
            <TextInput
              ref={(input) => { inputs.current[index] = input; }}
              accessibilityLabel={`${label}, ${digitLabel}`}
              inputMode="numeric"
              maxLength={1}
              selectTextOnFocus
              editable={!disabled}
              value={digits[index].trim()}
              placeholder={'\u2013'}
              placeholderTextColor="#8E9999"
              onChangeText={(text) => changeDigit(index, text)}
              onFocus={() => { setFocused(index); setError(''); }}
              onBlur={() => setFocused((current) => current === index ? null : current)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !digits[index].trim()) {
                  inputs.current[index - 1]?.focus();
                }
              }}
              style={[styles.digit, focused === index && styles.focused, focused === index && !!error && styles.invalid]}
            />
          </Fragment>
        ))}
      </View>
      {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 264 },
  digit: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#414A4B',
    borderRadius: 14,
    backgroundColor: '#1B2022',
    color: '#F3F5F2',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  separator: { color: '#AEB8B8', fontSize: 24, fontWeight: '700' },
  focused: { borderColor: '#DCFA84' },
  invalid: { borderColor: '#FFB9AD' },
  error: { color: '#FFB9AD', fontSize: 13 },
});
