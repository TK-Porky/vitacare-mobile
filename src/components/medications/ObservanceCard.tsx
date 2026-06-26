import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { colors, fontFamily, fontSize } from '../../themes';

type Props = {
  remainingDoses: number;
  totalDoses: number;
  appointments: number;
  observancePercent: number;
};

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ObservanceCard({
  remainingDoses,
  totalDoses,
  appointments,
  observancePercent,
}: Props) {
  const strokeDashoffset = CIRCUMFERENCE * (1 - observancePercent / 100);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>AUJOURD'HUI</Text>

      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.title}>{remainingDoses} prises{'\n'}restantes</Text>
          <Text style={styles.subtitle}>
            {totalDoses} prises planifiés • {appointments} RDV planifiés
          </Text>
        </View>

        <View style={styles.circle}>
          <Svg width={90} height={90}>
            <Circle
              cx={45}
              cy={45}
              r={RADIUS}
              stroke={colors.border}
              strokeWidth={6}
              fill="none"
            />
            <Circle
              cx={45}
              cy={45}
              r={RADIUS}
              stroke={colors.primary}
              strokeWidth={6}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin="45, 45"
            />
          </Svg>
          <View style={styles.circleContent}>
            <Text style={styles.percent}>{observancePercent}%</Text>
            <Text style={styles.observanceLabel}>OBSERVANCE</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    backgroundColor: colors.white,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.primary,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.ink,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  circle: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  observanceLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 7,
    color: colors.inkLight,
    letterSpacing: 0.5,
  },
});
