export const colors = {
    // Primary
    primary: '#00FF11',
    primaryLight: '#43F04A',
    primaryMid: '#2ADB6F',
    primaryDark: '#11C793',
  
    // Gradient
    gradientStart: '#43F04A',
    gradientMid1: '#2ADB6F',
    gradientMid2: '#1ED181',
    gradientEnd: '#11C793',
  
    // Neutral
    black: '#000000',
    
    gray50: '#F9FAFB',
    gray100: '#F5F5F6',
    gray200: '#E5E4E7',
    gray300: '#B1B0B4',
    gray400: '#8E8E93',
    gray500: '#6D6C70',
    gray600: '#555458',
    gray700: '#403F43',
    gray800: '#2E2D30',
    gray900: '#1B181B',

    ink: '#1B181B',
    inkLight: 'rgba(27, 24, 27, 0.55)',
    inkMuted: 'rgba(27, 24, 27, 0.35)',
    inkFaint: 'rgba(27, 24, 27, 0.15)',
  
    // Backgrounds
    white: '#FFFFFF',
    ltsurface: '#FAFAFA',
    surface: '#F5F4F5',
    border: '#E5E4E7',
  
    // Semantic
    error: '#FF3B30',
    errorLight: 'rgba(255, 59, 48, 0.1)',
    warning: '#FF9500',
    warningLight: 'rgba(255, 149, 0, 0.1)',
    success: '#34C759',
    successLight: 'rgba(52, 199, 89, 0.1)',
    info: '#007AFF',
    infoLight: 'rgba(0, 122, 255, 0.1)',
  } as const;
  
  export type Colors = typeof colors;
  export type ColorKey = keyof Colors;