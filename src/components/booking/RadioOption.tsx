import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { colors } from '../../themes';

type Props = {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  highlighted?: boolean;
};

export const RadioOption = ({
  selected,
  onPress,
  children,
  highlighted,
}: Props) => (
  <TouchableOpacity
    style={[styles.radioOption, selected && styles.radioOptionSelected, highlighted && selected && styles.radioOptionHighlighted]}
    onPress={onPress}
  >
    <View style={styles.radioOptionContent}>{children}</View>
    <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  radioOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  radioOptionHighlighted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  radioOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: { 
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
});
