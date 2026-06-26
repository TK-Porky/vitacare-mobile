export const fontFamily = {
    thin: 'DMSans_200ExtraLight',
    light: 'DMSans_300Light',
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
    extraBold: 'DMSans_800ExtraBold',
    black: 'DMSans_900Black',
  } as const;
  
  export const fontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 22,
    '3xl': 28,
    '4xl': 32,
  } as const;
  
  export const lineHeight = {
    tight: 16,
    snug: 20,
    normal: 24,
    relaxed: 28,
    loose: 36,
  } as const;
  
  export const typography = {
    // Headings
    h1: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize['4xl'],
      lineHeight: lineHeight.loose,
      color: undefined,
    },
    h2: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize['3xl'],
      lineHeight: lineHeight.relaxed,
      color: undefined,
    },
    h3: {
      fontFamily: fontFamily.semiBold,
      fontSize: fontSize['2xl'],
      lineHeight: lineHeight.relaxed,
      color: undefined,
    },
    h4: {
      fontFamily: fontFamily.semiBold,
      fontSize: fontSize.xl,
      lineHeight: lineHeight.normal,
      color: undefined,
    },
  
    // Body
    bodyLg: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      color: undefined,
    },
    bodyMd: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md,
      lineHeight: lineHeight.snug,
      color: undefined,
    },
    bodySm: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.tight,
      color: undefined,
    },
  
    // Labels
    labelLg: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      color: undefined,
    },
    labelMd: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      lineHeight: lineHeight.snug,
      color: undefined,
    },
    labelSm: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.tight,
      color: undefined,
    },
  
    // Buttons
    buttonLg: {
      fontFamily: fontFamily.semiBold,
      fontSize: fontSize.lg,
      lineHeight: lineHeight.normal,
      color: undefined,
    },
    buttonMd: {
      fontFamily: fontFamily.semiBold,
      fontSize: fontSize.base,
      lineHeight: lineHeight.normal,
      color: undefined,
    },
    buttonSm: {
      fontFamily: fontFamily.semiBold,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.tight,
      color: undefined,
    },
  
    // Caption
    caption: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.xs,
      lineHeight: lineHeight.tight,
      color: undefined,
    },
  } as const;
  
  export type Typography = typeof typography;
  export type TypographyKey = keyof Typography;