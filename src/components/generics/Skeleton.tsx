import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleSheet } from 'react-native';
import { colors } from '../../themes';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: (width as any) ?? '100%',
          height: (height as any) ?? 20,
          borderRadius: borderRadius ?? 8,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#EAE8EA', // A soft neutral color suitable for skeleton loading state
  },
});
