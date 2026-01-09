import { useState, useEffect, useCallback } from 'react';
import { BatteryData, RelayStatus, ActivityLog, SystemStatus } from '@/types/battery';

// Mock data generator for demonstration
const generateMockBatteryData = (): BatteryData => ({
  percentage: Math.floor(Math.random() * 30) + 60,
  status: Math.random() > 0.5 ? 'charging' : 'discharging',
  voltage: 11.4 + Math.random() * 1.2,
  current: 1.5 + Math.random() * 2,
  power: 15 + Math.random() * 25,
  timeRemaining: Math.floor(Math.random() * 180) + 60,
  health: 85 + Math.random() * 10,
  temperature: 35 + Math.random() * 10,
  cycleCount: Math.floor(Math.random() * 200) + 100,
});

const initialRelayStatus: RelayStatus = {
  isConnected: true,
  lastToggle: new Date(),
  autoShutoffEnabled: true,
  autoShutoffThreshold: 20,
};

const initialSystemStatus: SystemStatus = {
  arduinoConnected: true,
  websocketConnected: true,
  lastUpdate: new Date(),
  uptime: 3600 * 24 * 3,
  mode: 'MANUAL',
};

const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 60000),
    action: 'Relay diaktifkan',
    user: 'Admin',
    details: 'Arus listrik dihubungkan ke baterai',
    type: 'success',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 300000),
    action: 'Peringatan baterai rendah',
    user: 'System',
    details: 'Kapasitas baterai mencapai 25%',
    type: 'warning',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 600000),
    action: 'Koneksi Arduino',
    user: 'System',
    details: 'Arduino terhubung via COM3',
    type: 'info',
  },
];

export const useBatteryData = () => {
  const [batteryData, setBatteryData] = useState<BatteryData>(generateMockBatteryData());
  const [relayStatus, setRelayStatus] = useState<RelayStatus>(initialRelayStatus);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);
  const [powerHistory, setPowerHistory] = useState<{ time: string; power: number; current: number }[]>([]);

  // Poll backend for battery data
  useEffect(() => {
    const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';

    const parseTimeLeft = (s: string | null): number => {
      if (!s) return 0;
      s = s.toLowerCase();
      if (s.includes('sedang mengisi')) return 0;
      if (s.includes('tidak diketahui')) return 0;
      // expect format like "X jam Y menit" or "Y menit"
      try {
        let hours = 0;
        let minutes = 0;
        const jamMatch = s.match(/(\d+)\s*jam/);
        const menitMatch = s.match(/(\d+)\s*menit/);
        if (jamMatch) hours = parseInt(jamMatch[1], 10);
        if (menitMatch) minutes = parseInt(menitMatch[1], 10);
        return hours * 60 + minutes;
      } catch (e) {
        return 0;
      }
    };

    let mounted = true;

    const fetchData = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/battery`);
        if (!resp.ok) throw new Error(resp.statusText || 'fetch failed');
        const json = await resp.json();

        if (!mounted) return;

        const status = json.status || {};
        const healthObj = json.health || {};

        const newData: BatteryData = {
          percentage: typeof status.percentage === 'number' ? status.percentage : batteryData.percentage,
          status: status.plugged ? 'charging' : 'discharging',
          voltage: typeof json.voltage === 'number' ? json.voltage : batteryData.voltage,
          current: typeof json.current === 'number' ? json.current : batteryData.current,
          power: typeof json.power === 'number' ? json.power : batteryData.power,
          timeRemaining: parseTimeLeft(status.time_left),
          health: typeof healthObj.health_percent === 'number' ? healthObj.health_percent : batteryData.health,
          temperature: typeof json.temperature_celsius === 'number' ? json.temperature_celsius : batteryData.temperature,
          cycleCount: typeof json.estimated_cycles === 'number' ? json.estimated_cycles : batteryData.cycleCount,
        };

        setBatteryData(newData);
        setSystemStatus(prev => ({ ...prev, lastUpdate: new Date() }));

        setPowerHistory(prev => {
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          const newHistory = [...prev, { time: timeStr, power: newData.power, current: newData.current }];
          return newHistory.slice(-20);
        });
      } catch (e) {
        const errLog: ActivityLog = {
          id: Date.now().toString(),
          timestamp: new Date(),
          action: 'Gagal mengambil data baterai',
          user: 'System',
          details: String(e),
          type: 'error',
        };
        setActivityLogs(prev => [errLog, ...prev].slice(0, 50));
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';

  const toggleRelay = useCallback((newState: boolean) => {
    // optimistic UI update
    setRelayStatus(prev => ({
      ...prev,
      isConnected: newState,
      lastToggle: new Date(),
    }));

    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      action: newState ? 'Relay diaktifkan' : 'Relay dinonaktifkan',
      user: 'Admin',
      details: newState ? 'Arus listrik dihubungkan ke baterai' : 'Arus listrik diputus dari baterai',
      type: newState ? 'success' : 'warning',
    };

    setActivityLogs(prev => [newLog, ...prev].slice(0, 50));

    // send command to backend; if it fails, revert and log error
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/ssr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: newState }),
        });

        const data = await resp.json().catch(() => null);

        if (!resp.ok || !data || !(data.result && data.result.success)) {
          // revert optimistic change
          setRelayStatus(prev => ({ ...prev, isConnected: !newState }));
          const errLog: ActivityLog = {
            id: Date.now().toString(),
            timestamp: new Date(),
            action: 'Gagal mengubah relay',
            user: 'System',
            details: `Backend error: ${data?.result?.error || data?.error || resp.statusText}`,
            type: 'error',
          };
          setActivityLogs(prev => [errLog, ...prev].slice(0, 50));
        }
      } catch (e) {
        setRelayStatus(prev => ({ ...prev, isConnected: !newState }));
        const errLog: ActivityLog = {
          id: Date.now().toString(),
          timestamp: new Date(),
          action: 'Gagal mengubah relay',
          user: 'System',
          details: `Network error: ${String(e)}`,
          type: 'error',
        };
        setActivityLogs(prev => [errLog, ...prev].slice(0, 50));
      }
    })();
  }, []);

  const updateAutoShutoff = useCallback((enabled: boolean, threshold?: number) => {
    setRelayStatus(prev => ({
      ...prev,
      autoShutoffEnabled: enabled,
      autoShutoffThreshold: threshold ?? prev.autoShutoffThreshold,
    }));
  }, []);

  const switchMode = useCallback((newMode: 'MANUAL' | 'AUTO') => {
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/mode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: newMode }),
        });

        const data = await resp.json().catch(() => null);

        if (resp.ok && data && data.success) {
          setSystemStatus(prev => ({ ...prev, mode: newMode }));
          const log: ActivityLog = {
            id: Date.now().toString(),
            timestamp: new Date(),
            action: `Mode diubah ke ${newMode}`,
            user: 'Admin',
            details: `Charger beralih ke mode ${newMode}`,
            type: 'success',
          };
          setActivityLogs(prev => [log, ...prev].slice(0, 50));
        } else {
          const errLog: ActivityLog = {
            id: Date.now().toString(),
            timestamp: new Date(),
            action: 'Gagal mengubah mode',
            user: 'System',
            details: `Backend error: ${data?.result?.error || resp.statusText}`,
            type: 'error',
          };
          setActivityLogs(prev => [errLog, ...prev].slice(0, 50));
        }
      } catch (e) {
        const errLog: ActivityLog = {
          id: Date.now().toString(),
          timestamp: new Date(),
          action: 'Gagal mengubah mode',
          user: 'System',
          details: `Network error: ${String(e)}`,
          type: 'error',
        };
        setActivityLogs(prev => [errLog, ...prev].slice(0, 50));
      }
    })();
  }, []);

  return {
    batteryData,
    relayStatus,
    activityLogs,
    systemStatus,
    powerHistory,
    toggleRelay,
    updateAutoShutoff,
    switchMode,
  };
};
