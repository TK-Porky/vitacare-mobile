import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { colors, fontFamily, fontSize } from '../../themes';

type Props = {
  current: number;
  total: number;
  onSkip?: () => void;
  showSkip?: boolean;
};

const TRACK_WIDTH = Dimensions.get('window').width - 32;

export function StepHeader({
  current,
  total,
  onSkip,
  showSkip = true,
}: Props) {
  const fillWidth = (current / total) * TRACK_WIDTH;
  const statusBarHeight = StatusBar.currentHeight ?? 44;

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={[styles.wrapper, { paddingTop: statusBarHeight + 12 }]}>
        <View style={styles.row}>
          <Text style={styles.step}>{current}/{total}</Text>
          {showSkip && onSkip && (
            <TouchableOpacity onPress={onSkip} activeOpacity={0.7}>
              <Text style={styles.skip}>Passer</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.track}>
          <View style={{ height: 3, width: fillWidth, backgroundColor: colors.primary, borderRadius: 999 }} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
    paddingHorizontal: 0,
    paddingBottom: 8,
    backgroundColor: colors.white,
  },
  row: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  step: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  skip: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  track: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 999,
  },
});