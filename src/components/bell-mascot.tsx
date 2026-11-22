import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function BellMascot() {
  const reduceMotion = useReducedMotion();
  const tilt = useSharedValue(0);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    // A short greeting, then the bell rests until it's tapped.
    tilt.set(withSequence(
      withTiming(-8, { duration: 650 }),
      withTiming(8, { duration: 950 }),
      withTiming(-5, { duration: 850 }),
      withTiming(0, { duration: 650 }),
    ));

    return () => {
      cancelAnimation(tilt);
      cancelAnimation(lift);
    };
  }, [lift, reduceMotion, tilt]);

  const motionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.get() }, { rotate: `${tilt.get()}deg` }],
  }));

  function ring() {
    if (reduceMotion) return;

    lift.set(withSequence(
      withTiming(-8, { duration: 140 }),
      withTiming(0, { duration: 300 }),
    ));
    tilt.set(withSequence(
      withTiming(-17, { duration: 105 }),
      withTiming(15, { duration: 135 }),
      withTiming(-9, { duration: 120 }),
      withTiming(0, { duration: 170 }),
    ));
  }

  return (
    <Pressable
      accessibilityLabel="Bell mascot"
      accessibilityHint={reduceMotion ? undefined : 'Plays a short bell animation'}
      accessibilityRole={reduceMotion ? 'image' : 'button'}
      onPress={reduceMotion ? undefined : ring}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View style={styles.halo} />
      <View style={styles.spark} />
      <View style={styles.smallSpark} />
      <Animated.View style={[styles.character, motionStyle]}>
        <View style={styles.loop} />
        <View style={styles.clapper} />
        <View style={styles.armLeft} />
        <View style={styles.armRight} />
        <View style={styles.body}>
          <View style={styles.highlight} />
          <View style={styles.face}>
            <View style={styles.eye} />
            <View style={styles.eye} />
            <View style={styles.smile} />
          </View>
        </View>
        <View style={styles.rim} />
      </Animated.View>
    </Pressable>
  );
}

const lime = '#DCFA84';
const ink = '#26341D';

const styles = StyleSheet.create({
  tile: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: '#222B21',
    borderColor: '#394636',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: '#33402B' },
  halo: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E3929' },
  spark: {
    position: 'absolute', top: 16, right: 16, width: 6, height: 6,
    borderRadius: 1, backgroundColor: lime, transform: [{ rotate: '45deg' }],
  },
  smallSpark: {
    position: 'absolute', left: 14, bottom: 19, width: 4, height: 4,
    borderRadius: 1, backgroundColor: '#9BAF68', transform: [{ rotate: '45deg' }],
  },
  character: { width: 52, height: 55, alignItems: 'center' },
  loop: { width: 11, height: 12, borderRadius: 6, borderColor: lime, borderWidth: 3 },
  clapper: {
    position: 'absolute', bottom: 2, width: 12, height: 12,
    borderRadius: 6, backgroundColor: '#A9C656',
  },
  armLeft: {
    position: 'absolute', left: 1, top: 27, width: 14, height: 6,
    borderRadius: 3, backgroundColor: '#A9C656', transform: [{ rotate: '27deg' }],
  },
  armRight: {
    position: 'absolute', right: 0, top: 26, width: 14, height: 6,
    borderRadius: 3, backgroundColor: '#A9C656', transform: [{ rotate: '-32deg' }],
  },
  body: {
    position: 'absolute', top: 8, height: 36, width: 36, borderTopLeftRadius: 18,
    borderTopRightRadius: 18, borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
    backgroundColor: lime, borderBottomWidth: 3, borderBottomColor: '#C5E36F',
  },
  rim: {
    position: 'absolute', bottom: 9, height: 7, width: 46,
    borderRadius: 4, backgroundColor: lime,
  },
  highlight: {
    position: 'absolute', top: 5, left: 8, height: 4, width: 10,
    borderRadius: 2, backgroundColor: '#F4FFD1', transform: [{ rotate: '-28deg' }],
  },
  face: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16 },
  eye: { width: 4, height: 6, borderRadius: 2, backgroundColor: ink },
  smile: {
    position: 'absolute', top: 21, width: 6, height: 5,
    borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    borderColor: ink, borderBottomWidth: 2,
  },
});
