import { motion } from "framer-motion";
import { Battery, BatteryCharging, BatteryWarning, Clock, Zap } from "lucide-react";
import { BatteryData } from "@/types/battery";
import { MetricCard } from "./MetricCard";
import { useBatteryData } from "@/hooks/useBatteryData";

interface BatteryGaugeProps {
  data: BatteryData;
}

export const BatteryGauge = ({ data }: BatteryGaugeProps) => {
  const { batteryData } = useBatteryData();

  const formatTimeRemaining = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const { percentage, status } = data;

  const getStatusColor = () => {
    if (percentage <= 20) return "text-destructive";
    if (percentage <= 40) return "text-warning";
    return "text-success";
  };

  const getGaugeColor = () => {
    if (percentage <= 20) return "from-destructive to-destructive";
    if (percentage <= 40) return "from-warning to-warning";
    return "from-success to-primary";
  };

  const StatusIcon = () => {
    if (status === "charging") return <BatteryCharging className="w-6 h-6 text-charging animate-pulse" />;
    if (percentage <= 20) return <BatteryWarning className="w-6 h-6 text-destructive" />;
    return <Battery className="w-6 h-6 text-muted-foreground" />;
  };

  return (
    <div className="glass-panel p-6 space-y-9">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Status Baterai</h2>
        <StatusIcon />
      </div>

      {/* Circular Gauge */}
      <div className="relative flex items-center justify-center">
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background circle */}
          <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="none" className="text-muted/30" />
          {/* Progress circle */}
          <motion.circle
            cx="96"
            cy="96"
            r="80"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 5.024} 502.4`}
            initial={{ strokeDasharray: "0 502.4" }}
            animate={{ strokeDasharray: `${percentage * 5.024} 502.4` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--success))" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute flex flex-col items-center">
          <motion.span className={`text-5xl font-bold font-mono ${getStatusColor()}`} key={percentage} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
            {percentage}%
          </motion.span>
          <span className="text-sm text-muted-foreground mt-1">
            {status === "charging" ? (
              <span className="flex items-center gap-1 text-charging">
                <Zap className="w-4 h-4" />
                Mengisi
              </span>
            ) : status === "discharging" ? (
              "Sedang Digunakan"
            ) : status === "full" ? (
              "Penuh"
            ) : (
              "Tidak Mengisi"
            )}
          </span>
        </div>
      </div>

      {/* Health bar */}
      {/* <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Kesehatan Baterai</span>
          <span className="font-mono text-foreground">{health.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${getGaugeColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${health}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div> */}

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 pt-4 border-t border-border/50">
        <MetricCard title="Sisa Waktu Pengecasan" value={formatTimeRemaining(batteryData.timeRemaining)} unit="" icon={Clock} color={batteryData.timeRemaining < 30 ? "destructive" : "success"} />
      </div>
    </div>
  );
};
