export const colors = {
  navy: '#001F3F',
  teal: '#28A745',
  danger: '#DC3545',
  yellow: '#FFC107',
  orange: '#FD7E14',
  white: '#FFFFFF',
  surface: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    400: '#94A3B8',
    500: '#64748B',
    700: '#334155',
    900: '#0F172A'
  }
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999
} as const;

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  }
};