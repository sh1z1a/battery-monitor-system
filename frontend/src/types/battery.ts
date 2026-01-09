export interface BatteryData {
  percentage: number;
  status: 'charging' | 'discharging' | 'full' | 'not_charging';
  // voltage: number;
  // current: number;
  // power: number;
  timeRemaining: number; // in minutes
  // health: number;
  // temperature: number;
  // cycleCount: number;
}

export interface RelayStatus {
  isConnected: boolean;
  lastToggle: Date;
  autoShutoffEnabled: boolean;
  autoShutoffThreshold: number;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  details: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface SystemStatus {
  arduinoConnected: boolean;
  websocketConnected: boolean;
  lastUpdate: Date;
  uptime: number;
}
