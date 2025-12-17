// screens/dashboard/DashboardScreen.constants.js

export const GRADIENT_COLORS = ['#0F172A', '#1E293B'];

export const ICON_SIZES = {
  small: 18,
  medium: 20,
  large: 24,
  xlarge: 40,
};

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
};

export const STAT_CONFIGS = [
  {
    icon: 'notifications',
    label: 'Alerts',
    color: COLORS.primary,
    key: 'total_alerts_received',
  },
  {
    icon: 'camera',
    label: 'Incidents',
    color: COLORS.warning,
    key: 'incidents_reported',
  },
  {
    icon: 'book',
    label: 'Guides',
    color: COLORS.info,
    key: 'safety_guides_viewed',
  },
];

export const QUICK_ACTIONS = [
  {
    icon: 'camera',
    text: 'Report Incident',
    color: COLORS.primary,
    route: 'ReportIncident',
  },
  {
    icon: 'book',
    text: 'Safety Guides',
    color: COLORS.info,
    route: 'SafetyGuides',
  },
];

export const DEFAULT_USER_NAME = 'Citizen';
export const MAX_RECENT_ALERTS = 3;