// Tokens portados de ~/Projetos/tech-challenge-3/src/styles/theme.ts.
// As cores são idênticas às do admin web (tema escuro), para que os dois
// clientes pareçam o mesmo produto. O que mudou: React Native não entende
// rem/px em string, então spacing/radius/fontSizes viraram números (1rem = 16),
// os breakpoints sumiram (não há media query) e as shadows viraram o par
// shadow* do iOS + elevation do Android.
export const theme = {
  colors: {
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#273449',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    danger: '#ef4444',
    dangerHover: '#dc2626',
    success: '#22c55e',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  fontSizes: {
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    title: 40,
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;

export type Theme = typeof theme;
