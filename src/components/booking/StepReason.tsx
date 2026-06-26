import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { colors, fontFamily, fontSize } from '../../themes';
import { StepLabel } from './StepLabel';

const MAX_CHARS = 500;

type Props = {
  value: string;
  onChange: (t: string) => void;
};

export const StepReason = ({
  value,
  onChange,
}: Props) => (
  <View>
    <StepLabel number={3} label="Entrez le motif" />
    <View style={styles.textareaWrapper}>
      <TextInput
        style={styles.textarea}
        placeholder="Entrer votre motif ici"
        placeholderTextColor={colors.inkFaint}
        multiline
        maxLength={MAX_CHARS}
        value={value}
        onChangeText={onChange}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{MAX_CHARS - value.length} Caractères Restants</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  textareaWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    minHeight: 180,
    backgroundColor: '#FFFFFF',
  },
  textarea: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.ink,
    flex: 1,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCount: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});
