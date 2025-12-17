// screens/dashboard/DashboardScreen.types.ts

export interface DashboardStats {
  total_alerts_received: number;
  incidents_reported: number;
  safety_guides_viewed: number;
}

export interface Alert {
  id: string;
  title: string;
}

export interface DashboardScreenProps {
  navigation: any;
  route: any;
}

export interface ProfileData {
  first_name?: string;
}