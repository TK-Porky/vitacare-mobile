import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
  isValidElement,
  Children,
} from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetFooter,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../src/themes";

export type AppBottomSheetRef = {
  open: () => void;
  close: () => void;
  expand: () => void;
  collapse: () => void;
};

type Props = {
  snapPoints?: string[];
  initialIndex?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  onSnapPointChange?: (index: number) => void;
  scrollable?: boolean;
  containerStyle?: ViewStyle;
  allowPanDownToClose?: boolean;
  backdropOpacity?: number;
  backdropPressBehavior?: "close" | "collapse" | "none";
  detached?: boolean;
  detachedMargin?: number;
  enableDynamicSizing?: boolean;
};

// Type pour les props d'une FlatList
type FlatListProps = {
  data?: any[];
  renderItem?: (item: any) => React.ReactElement | null;
  keyExtractor?: (item: any, index: number) => string;
  [key: string]: any;
};

export const AppBottomSheet = forwardRef<AppBottomSheetRef, Props>(
  (
    {
      children,
      footer,
      onClose,
      onSnapPointChange,
      scrollable = true,
      containerStyle,
      snapPoints: propSnapPoints,
      initialIndex = 0,
      allowPanDownToClose = true,
      backdropOpacity = 0.4,
      backdropPressBehavior = "close",
      detached = false,
      detachedMargin = 16,
      enableDynamicSizing = false,
    },
    ref,
  ) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();

    // Snap points par défaut
    const defaultSnapPoints = useMemo(() => {
      if (propSnapPoints) return propSnapPoints;
      if (enableDynamicSizing) return undefined;
      return detached ? ["40%", "80%"] : ["55%", "90%"];
    }, [propSnapPoints, detached, enableDynamicSizing]);

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.present(),
      close: () => sheetRef.current?.dismiss(),
      expand: () => sheetRef.current?.expand(),
      collapse: () => sheetRef.current?.collapse(),
    }));

    // Rendu du backdrop
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={backdropOpacity}
          pressBehavior={backdropPressBehavior}
        />
      ),
      [backdropOpacity, backdropPressBehavior],
    );

    // Rendu du footer
    const renderFooter = useCallback(
      (props: any) => {
        if (!footer) return null;
        return (
          <BottomSheetFooter {...props} bottomInset={insets.bottom}>
            <View style={styles.footerContainer}>{footer}</View>
          </BottomSheetFooter>
        );
      },
      [footer, insets.bottom],
    );

    // Détection du type de contenu – mémorisée
    const contentMeta = useMemo(() => {
      const array = Children.toArray(children);
      const hasFlatList = array.some((child) => {
        if (!isValidElement(child)) return false;
        const t = (child.type as any);
        const n = t?.displayName || t?.name || "";
        return n === "FlatList" || n === "VirtualizedList" || n === "BottomSheetFlatList";
      });
      const flatListChild = hasFlatList
        ? (array.find((child) => {
            if (!isValidElement(child)) return false;
            const t = (child.type as any);
            const n = t?.displayName || t?.name || "";
            return n === "FlatList" || n === "VirtualizedList" || n === "BottomSheetFlatList";
          }) as React.ReactElement<FlatListProps> | undefined)
        : undefined;
      return { hasFlatList, flatListChild };
    }, [children]);

    const renderContent = useCallback(() => {
      if (!scrollable) {
        return (
          <BottomSheetView
            style={[styles.content, styles.nonScrollContent, containerStyle]}
          >
            {children}
          </BottomSheetView>
        );
      }

      const { hasFlatList, flatListChild } = contentMeta;

      if (hasFlatList && flatListChild && isValidElement(flatListChild)) {
        const props = flatListChild.props;
        const { data, renderItem, keyExtractor, ...rest } = props;

        return (
          <BottomSheetFlatList
            style={[styles.content, containerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              footer ? styles.scrollContentWithFooter : undefined,
            ]}
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            {...rest}
          />
        );
      }

      return (
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
      );
    }, [children, containerStyle, footer, scrollable, contentMeta]);

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={initialIndex}
        snapPoints={defaultSnapPoints}
        enableDynamicSizing={enableDynamicSizing}
        onDismiss={onClose}
        onChange={onSnapPointChange}
        enablePanDownToClose={allowPanDownToClose}
        backdropComponent={renderBackdrop}
        footerComponent={renderFooter}
        backgroundStyle={[
          styles.background,
          detached && {
            borderRadius: 24,
            marginHorizontal: detachedMargin,
          },
        ]}
        handleIndicatorStyle={styles.handleIndicator}
        handleStyle={styles.handle}
        keyboardBehavior={Platform.OS === "ios" ? "extend" : "interactive"}
        keyboardBlurBehavior="restore"
        bottomInset={insets.bottom}
        detached={detached}
        style={[
          detached && {
            marginHorizontal: detachedMargin,
          },
        ]}
      >
        {renderContent()}
      </BottomSheetModal>
    );
  },
);

AppBottomSheet.displayName = "AppBottomSheet";

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
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  scrollContent: {
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  scrollContentWithFooter: {
    paddingBottom: Platform.OS === "ios" ? 128 : 112,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  headerContainer: {
    flex: 1,
  },
});
