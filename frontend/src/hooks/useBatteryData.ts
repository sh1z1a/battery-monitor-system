import { useState, useEffect, useCallback } from "react";
import API from "@/lib/api";
import { BatteryData, RelayStatus, ActivityLog } from "@/types/battery";

// ================= DEFAULT STATES =================
const defaultBatteryData: BatteryData = {
  percentage: 888,
  status: "full",
  // voltage: 888,
  // current: 888,
  // power: 888,
  timeRemaining: 888,
  // health: 888,
  // temperature: 888,
  // cycleCount: 888,
};

const initialRelayStatus: RelayStatus = {
  isConnected: false,
  lastToggle: new Date(),
  autoShutoffEnabled: true,
  autoShutoffThreshold: 20,
};

// const initialSystemStatus: SystemStatus = {
//   arduinoConnected: false,
//   websocketConnected: false,
//   lastUpdate: new Date(),
//   uptime: 0,
// };

// ================= HOOK =================
export const useBatteryData = () => {
  const [batteryData, setBatteryData] = useState<BatteryData>(defaultBatteryData);

  const [relayStatus, setRelayStatus] = useState<RelayStatus>(initialRelayStatus);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);

  const [powerHistory, setPowerHistory] = useState<{ time: string; power: number; current: number }[]>([]);

  // ================= FETCH BATTERY =================
  useEffect(() => {
    const fetchBatteryData = async () => {
      try {
        const res = await API.get("/battery");
        const data = res.data;

        // Mapping MANUAL (WAJIB)
        setBatteryData({
          percentage: data.percentage ?? 0,
          status: (data.plugged as BatteryData["status"]) ?? "not_charging",
          // voltage: data.voltage ?? 0,
          // current: data.current ?? 0,
          // power: data.power ?? 0,
          timeRemaining: data.seconds_left ?? 0,
          // health: Number(data.health ?? 100),
          // temperature: data.temperature ?? 0,
          // cycleCount: data.cycleCount ?? 0,
        });

        // setSystemStatus((prev) => ({
        //   ...prev,
        //   arduinoConnected: true,
        //   websocketConnected: true,
        //   lastUpdate: new Date(),
        // }));

        // Update power history
        setPowerHistory((prev) => {
          const now = new Date().toLocaleTimeString();
          const next = [
            ...prev,
            {
              time: now,
              power: data.power ?? 0,
              current: data.current ?? 0,
            },
          ];
          return next.slice(-20);
        });
      } catch (err) {
        console.error("Battery API error:", err);
        // setSystemStatus((prev) => ({
        //   ...prev,
        //   arduinoConnected: false,
        //   websocketConnected: false,
        // }));
      }
    };

    fetchBatteryData();
    const interval = setInterval(fetchBatteryData, 2000);
    return () => clearInterval(interval);
  }, []);

  // ================= FETCH LOGS =================
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get("/logs");
        setActivityLogs(res.data ?? []);
      } catch (err) {
        console.error("Logs API error:", err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================= RELAY CONTROL =================
  const toggleRelay = useCallback(async (newState: boolean) => {
    try {
      await API.post("/ssr", {
        state: newState ? "on" : "off",
      });

      setRelayStatus((prev) => ({
        ...prev,
        isConnected: newState,
        lastToggle: new Date(),
      }));

      setActivityLogs((prev: ActivityLog[]) =>
        [
          {
            id: Date.now().toString(),
            timestamp: new Date(),
            action: newState ? "Relay diaktifkan" : "Relay dinonaktifkan",
            user: "Admin",
            details: newState ? "Charger dihubungkan" : "Charger diputus",
            type: newState ? ("success" as ActivityLog["type"]) : ("warning" as ActivityLog["type"]),
          },
          ...prev,
        ].slice(0, 50)
      );
    } catch (err) {
      console.error("SSR API error:", err);
    }
  }, []);

  const updateAutoShutoff = useCallback((enabled: boolean, threshold?: number) => {
    setRelayStatus((prev) => ({
      ...prev,
      autoShutoffEnabled: enabled,
      autoShutoffThreshold: threshold ?? prev.autoShutoffThreshold,
    }));
  }, []);

  return {
    batteryData,
    relayStatus,
    activityLogs,
    // systemStatus,
    powerHistory,
    toggleRelay,
    updateAutoShutoff,
  };
};
