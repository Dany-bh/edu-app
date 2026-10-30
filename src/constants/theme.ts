export const tokens = {
  colores: {
    claro: {
      fondo: '#F7FAF9',
      superficie: '#FFFFFF',
      texto: '#0F1A19',
      textoSecundario: '#4B5B59',
      primario: '#0F766E',
      primarioClaro: '#14B8A6',
      energia: '#FF6B4A',
      logro: '#F5B301',
      exito: '#16A34A',
      error: '#DC2626',
      borde: '#E3ECEA',
      transparente: 'transparent',
    },
    oscuro: {
      fondo: '#051212',
      superficie: '#0D2423',
      texto: '#EAF7F4',
      textoSecundario: '#97B8B3', // Contraste AA sobre fondo oscuro
      primario: '#14B8A6', // Turquesa EduSalud (dark mode)
      primarioClaro: '#2DD4BF',
      energia: '#FF8A70',
      logro: '#FCD34D',
      exito: '#22C55E',
      error: '#EF4444',
      borde: '#173634',
      transparente: 'transparent',
    },
    enfermedades: {
      cardiovascular: '#E11D48',
      cancer: '#7C3AED',
      respiratorias: '#0284C7',
      diabetes: '#2563EB',
      obesidad: '#EA580C',
      renal: '#0D9488',
      salud_mental: '#9333EA',
    }
  },
  espaciado: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radios: {
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
    redondo: 9999,
  },
  sombras: {
    suave: {
      shadowColor: '#0F1A19',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    media: {
      shadowColor: '#0F1A19',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    }
  },
  tipografia: {
    familias: {
      display: 'PlusJakartaSans_800ExtraBold',
      titulo: 'PlusJakartaSans_700Bold',
      subtitulo: 'PlusJakartaSans_600SemiBold',
      cuerpoMedio: 'Inter_500Medium',
      cuerpo: 'Inter_400Regular',
    },
    tamanos: {
      display: 32,
      titulo: 24,
      subtitulo: 18,
      cuerpo: 16,
      etiqueta: 13,
      mini: 11,
    }
  }
};

export type TemaColores = typeof tokens.colores.claro;
export type TipoEnfermedad = keyof typeof tokens.colores.enfermedades;

// --- COMPATIBILIDAD CON COMPONENTES ANTERIORES (TODO: Eliminar cuando se migre toda la app) ---
export const AppColors = {
  textPrimary: tokens.colores.claro.texto,
  textDark: tokens.colores.oscuro.texto,
  primaryDim: tokens.colores.claro.primarioClaro,
  primaryBorder: tokens.colores.claro.primario,
  errorDim: tokens.colores.claro.error,
  backgroundCard: tokens.colores.claro.superficie,

  primary: tokens.colores.claro.primario,
  secondary: tokens.colores.claro.primarioClaro,
  background: tokens.colores.claro.fondo,
  surface: tokens.colores.claro.superficie,
  text: tokens.colores.claro.texto,
  textSecondary: tokens.colores.claro.textoSecundario,
  error: tokens.colores.claro.error,
  success: tokens.colores.claro.exito,
  warning: tokens.colores.claro.energia,
  border: tokens.colores.claro.borde,
};

export const Colors: Record<'light' | 'dark', any> = {
  light: { ...AppColors, tint: AppColors.primary, tabIconDefault: '#ccc', tabIconSelected: AppColors.primary, backgroundElement: tokens.colores.claro.superficie },
  dark: { ...AppColors, text: tokens.colores.oscuro.texto, background: tokens.colores.oscuro.fondo, tint: tokens.colores.oscuro.primario, tabIconDefault: '#ccc', tabIconSelected: tokens.colores.oscuro.primario, backgroundElement: tokens.colores.oscuro.superficie },
};

export const Spacing = {
  half: tokens.espaciado.xs / 2,
  one: tokens.espaciado.xs,
  two: tokens.espaciado.sm,
  three: tokens.espaciado.md,
  four: tokens.espaciado.lg,
  five: tokens.espaciado.xl,
  xs: tokens.espaciado.xs,
  sm: tokens.espaciado.sm,
  md: tokens.espaciado.md,
  lg: tokens.espaciado.lg,
  xl: tokens.espaciado.xl,
  xxl: tokens.espaciado.xxl,
};

export const Fonts = {
  mono: tokens.tipografia.familias.cuerpo,

  primary: tokens.tipografia.familias.cuerpo,
  secondary: tokens.tipografia.familias.titulo,
};

export const MaxContentWidth = 1100;
export type ThemeColor = string;
