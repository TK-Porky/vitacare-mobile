import React, { useRef, forwardRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { Search, X, Mic } from "lucide-react-native";
import { BaseInput, BaseInputProps } from "../generics/BaseInput";
import { colors, fontFamily, fontSize } from "../../themes";

// Types
export type SearchInputVariant = "default" | "outlined" | "filled" | "minimal";

export interface SearchInputProps extends Omit<
  BaseInputProps,
  "leftSlot" | "keyboardType"
> {
  /** Variante du champ de recherche */
  variant?: SearchInputVariant;
  /** Afficher le bouton de nettoyage */
  showClearButton?: boolean;
  /** Afficher le bouton de recherche */
  showSearchButton?: boolean;
  /** Afficher le bouton de microphone (iOS) */
  showMicButton?: boolean;
  /** Loading state pour la recherche */
  isLoading?: boolean;
  /** Appelé lors du nettoyage */
  onClear?: () => void;
  /** Appelé lors du clic sur le bouton de recherche */
  onSearch?: (query: string) => void;
  /** Appelé lors du clic sur le bouton microphone */
  onMicPress?: () => void;
  /** Délai avant de déclencher la recherche (debounce) */
  debounceDelay?: number;
  /** Style du conteneur */
  containerStyle?: ViewStyle;
  /** Style du champ de recherche */
  inputStyle?: TextStyle;
  /** Afficher le compteur de caractères */
  showCharCount?: boolean;
  /** Nombre maximum de caractères */
  maxLength?: number;
}

export interface SearchInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
}

// ================================================================================== //
// Main Component
// ================================================================================== //

export const SearchInput = forwardRef<SearchInputRef, SearchInputProps>(
  (
    {
      variant = "default",
      showClearButton = true,
      showSearchButton = true,
      showMicButton = false,
      isLoading = false,
      onClear,
      onSearch,
      onMicPress,
      debounceDelay = 300,
      containerStyle,
      inputStyle,
      showCharCount = false,
      maxLength,
      value,
      onChangeText,
      placeholder = "Rechercher...",
      returnKeyType = "search",
      ...props
    },
    ref,
  ) => {
    // ================================================================================== //
    // State & Refs
    // ================================================================================== //

    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    const [localValue, setLocalValue] = React.useState(value || "");
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => handleClear(),
      getValue: () => localValue,
    }));

    // ================================================================================== //
    // Computed
    // ================================================================================== //

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : localValue;
    const hasValue = currentValue && currentValue.length > 0;
    const charCount = currentValue?.length || 0;
    const showClear = showClearButton && hasValue && !isLoading;
    const showMic =
      showMicButton && Platform.OS === "ios" && !hasValue && !isLoading;
    const showSearch = showSearchButton && !isLoading;
    const showCharCountLabel = showCharCount && maxLength;

    // ================================================================================== //
    // Styles
    // ================================================================================== //

    const getVariantStyles = () => {
      switch (variant) {
        case "outlined":
          return {
            container: styles.containerOutlined,
            input: styles.inputOutlined,
          };
        case "filled":
          return {
            container: styles.containerFilled,
            input: styles.inputFilled,
          };
        case "minimal":
          return {
            container: styles.containerMinimal,
            input: styles.inputMinimal,
          };
        default:
          return {
            container: styles.containerDefault,
            input: styles.inputDefault,
          };
      }
    };

    const variantStyles = getVariantStyles();

    // ================================================================================== //
    // Handlers
    // ================================================================================== //

    const handleChangeText = (text: string) => {
      // Limiter la longueur si maxLength est spécifié
      if (maxLength && text.length > maxLength) {
        return;
      }

      // Mettre à jour la valeur
      if (!isControlled) {
        setLocalValue(text);
      }
      onChangeText?.(text);

      // Debounce pour la recherche
      if (onSearch && debounceDelay > 0) {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
          onSearch(text);
        }, debounceDelay);
      }
    };

    const handleClear = () => {
      if (!isControlled) {
        setLocalValue("");
      }
      onChangeText?.("");
      onClear?.();

      // Focus sur l'input après le nettoyage
      inputRef.current?.focus();

      // Déclencher une recherche avec une chaîne vide
      if (onSearch) {
        onSearch("");
      }
    };

    const handleSearchPress = () => {
      if (onSearch && currentValue) {
        // Annuler le debounce en cours
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }
        onSearch(currentValue);
      }
    };

    const handleFocus = (e: any) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleSubmitEditing = (e: any) => {
      // Annuler le debounce et soumettre immédiatement
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      if (onSearch && currentValue) {
        onSearch(currentValue);
      }
      props.onSubmitEditing?.(e);
    };

    // ================================================================================== //
    // Render Helper - Left Slot
    // ================================================================================== //

    const renderLeftSlot = () => {
      // Si isLoading, afficher un spinner à la place de la loupe
      if (isLoading) {
        return (
          <View style={[styles.slot, styles.leftSlot]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        );
      }

      // Si on est dans un état de recherche active, afficher la loupe en primary
      const iconColor =
        hasValue && isFocused ? colors.primary : colors.inkLight;
      const iconSize = 16;

      return (
        <View style={[styles.slot, styles.leftSlot]}>
          <Search size={iconSize} color={iconColor} />
        </View>
      );
    };

    // ================================================================================== //
    // Render Helper - Right Slot
    // ================================================================================== //

    const renderRightSlot = () => {
      const slots = [];

      // Bouton de nettoyage
      if (showClear) {
        slots.push(
          <TouchableOpacity
            key="clear"
            onPress={handleClear}
            style={styles.rightButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Effacer la recherche"
          >
            <X size={16} color={colors.inkLight} />
          </TouchableOpacity>,
        );
      }

      // Bouton microphone (iOS uniquement)
      if (showMic) {
        slots.push(
          <TouchableOpacity
            key="mic"
            onPress={onMicPress}
            style={styles.rightButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Recherche vocale"
          >
            <Mic size={16} color={colors.inkLight} />
          </TouchableOpacity>,
        );
      }

      // Bouton de recherche
      if (showSearch && hasValue) {
        slots.push(
          <TouchableOpacity
            key="search"
            onPress={handleSearchPress}
            style={[styles.rightButton, styles.searchButton]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Lancer la recherche"
          >
            <Search size={16} color={colors.primary} />
          </TouchableOpacity>,
        );
      }

      // Compteur de caractères
      if (showCharCountLabel) {
        const charColor =
          charCount > maxLength! * 0.9 ? colors.error : colors.inkLight;
        slots.push(
          <Text key="count" style={[styles.charCount, { color: charColor }]}>
            {charCount}/{maxLength}
          </Text>,
        );
      }

      if (slots.length === 0) return null;

      return <View style={styles.rightSlot}>{slots}</View>;
    };

    // ================================================================================== //
    // Main Render
    // ================================================================================== //

    // Props pour BaseInput
    const baseInputProps = {
      ref: inputRef,
      value: currentValue,
      onChangeText: handleChangeText,
      placeholder,
      returnKeyType,
      keyboardType: "default" as const,
      autoCapitalize: "none" as const,
      autoCorrect: false,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onSubmitEditing: handleSubmitEditing,
      maxLength,
      ...props,
      // Surcharger les props personnalisées
      leftSlot: renderLeftSlot(),
      rightSlot: renderRightSlot(),
      style: [variantStyles.input, inputStyle],
      containerStyle: [
        variantStyles.container,
        isFocused && styles.containerFocused,
        containerStyle,
      ],
    };

    return <BaseInput {...baseInputProps} />;
  },
);

SearchInput.displayName = "SearchInput";

// ================================================================================== //
// Styles
// ================================================================================== //

const styles = StyleSheet.create({
  // Containers
  containerDefault: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
  },
  containerOutlined: {
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    height: 48,
  },
  containerFilled: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 0,
    height: 48,
  },
  containerMinimal: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 0,
    height: 44,
  },

  containerFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  // Inputs
  inputDefault: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    paddingHorizontal: 12,
  },
  inputOutlined: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    paddingHorizontal: 12,
  },
  inputFilled: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    paddingHorizontal: 12,
  },
  inputMinimal: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    paddingHorizontal: 4,
  },

  // Slots
  slot: {
    alignItems: "center",
    justifyContent: "center",
  },
  leftSlot: {
    paddingLeft: 12,
    paddingRight: 8,
    minWidth: 40,
  },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    gap: 4,
  },

  // Buttons
  rightButton: {
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    minHeight: 32,
  },
  searchButton: {
    backgroundColor: colors.primaryLight || "#E3F2FD",
  },

  // Char count
  charCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkLight,
    paddingHorizontal: 4,
  },
});

// ================================================================================== //
// Default Export
// ================================================================================== //

export default SearchInput;
