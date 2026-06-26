import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../../../themes';

type Props = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  style?: ViewStyle;
};

export const FilterRangeSlider = ({
  value,
  min = 1,
  max = 50,
  step = 1,
  onChange,
  style,
}: Props) => {
  const handleChange = useCallback(
    (v: number) => {
      onChange?.(Math.round(v));
    },
    [onChange]
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.bubbleRow}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{value}km</Text>
        </View>
      </View>

      <View style={styles.trackRow}>
        <Ionicons name="person-outline" size={16} color={colors.inkMuted} />
        <Slider
          style={styles.slider}
          value={value}
          minimumValue={min}
          maximumValue={max}
          step={step}
          onValueChange={handleChange}
          minimumTrackTintColor={colors.primaryDark}
          maximumTrackTintColor={colors.inkFaint}
          thumbTintColor={colors.primaryDark}
        />
        <Ionicons name="location-outline" size={16} color={colors.inkMuted} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  bubbleRow: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bubble: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  bubbleText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.white,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slider: {
    flex: 1,
    height: 40,
  },
});
