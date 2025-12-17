// screens/home/HomeScreen.constants.ts

export const GRADIENT_COLORS = ['#0F172A', '#1E293B'] as const;

export const COLORS = {
  primary: '#DC2626',
  warning: '#F59E0B',
  info: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
  white: '#FFF',
  gray: {
    light: '#94A3B8',
    medium: '#64748B',
  },
} as const;

export const EMERGENCY_NUMBERS = {
  main: '112',
  minema: '+250-788-000-000',
} as const;

export const MAX_ALERTS_DISPLAY = 5;

export const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#F59E0B',
  low: '#10B981',
};