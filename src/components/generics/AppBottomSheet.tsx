import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { colors } from '../../../src/themes';

export type AppBottomSheetRef = {
  open: () => void;
  close: () => void;
  expand: () => void;
};

type Props = {
  snapPoints?: string[]; // Ignored, as snapPoints are redefined globally as requested
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  scrollable?: boolean;
  containerStyle?: ViewStyle;
};

export const AppBottomSheet = forwardRef<AppBottomSheetRef, Props>(
  ({ children, footer, onClose, scrollable = true, containerStyle }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);

    // Redefined standard snap points capped at 90% as per user requirements
    const defaultSnapPoints = ['55%', '90%'];

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.present(),
      close: () => sheetRef.current?.dismiss(),
      expand: () => sheetRef.current?.expand(),
    }));

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.4}
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={defaultSnapPoints}
        enableDynamicSizing={false}
        onDismiss={onClose}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        handleStyle={styles.handle}
        keyboardBehavior="extend"
      >
        {scrollable ? (
          <BottomSheetScrollView
            style={[styles.content, containerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={[
              styles.scrollContent,
              footer ? styles.scrollContentWithFooter : undefined,
            ]}
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={[styles.content, styles.nonScrollContent, containerStyle]}>
            {children}
          </BottomSheetView>
        )}

        {!!footer && <View style={styles.footer}>{footer}</View>}
      </BottomSheetModal>
    );
  }
);

AppBottomSheet.displayName = 'AppBottomSheet';

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 24,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  handle: {
    paddingVertical: 14,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inkFaint,
  },
  content: {
    flex: 1,
  },
  nonScrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  scrollContentWithFooter: {
    paddingBottom: Platform.OS === 'ios' ? 128 : 112,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});