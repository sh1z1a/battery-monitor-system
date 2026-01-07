import { motion } from 'framer-motion';
import { Zap, Activity, Clock, Thermometer } from 'lucide-react';
import { Header } from '@/components/Header';
import { BatteryGauge } from '@/components/BatteryGauge';
import { MetricCard } from '@/components/MetricCard';
import { RelayControl } from '@/components/RelayControl';
import { PowerChart } from '@/components/PowerChart';
import { ActivityLog } from '@/components/ActivityLog';
import { SystemStatus } from '@/components/SystemStatus';
import { useBatteryData } from '@/hooks/useBatteryData';

const Index = () => {
  const {
    batteryData,
    relayStatus,
    activityLogs,
    systemStatus,
    powerHistory,
    toggleRelay,
    updateAutoShutoff,
  } = useBatteryData();

  const formatTimeRemaining = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <Header />

        {/* System Status Bar */}
        <SystemStatus status={systemStatus} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Battery Gauge & Relay Control */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <BatteryGauge data={batteryData} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <RelayControl
                status={relayStatus}
                onToggle={toggleRelay}
                onUpdateAutoShutoff={updateAutoShutoff}
              />
            </motion.div>
          </div>

          {/* Center Column - Metrics & Chart */}
          <div className="lg:col-span-5 space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                title="Tegangan"
                value={batteryData.voltage}
                unit="V"
                icon={Zap}
                color="primary"
              />
              <MetricCard
                title="Arus Listrik"
                value={batteryData.current}
                unit="A"
                icon={Activity}
                color={batteryData.current > 3 ? 'warning' : 'success'}
              />
              <MetricCard
                title="Daya"
                value={batteryData.power}
                unit="W"
                icon={Zap}
                color="primary"
              />
              <MetricCard
                title="Sisa Waktu"
                value={formatTimeRemaining(batteryData.timeRemaining)}
                unit=""
                icon={Clock}
                color={batteryData.timeRemaining < 30 ? 'destructive' : 'success'}
              />
            </div>

            {/* Power Chart */}
            <PowerChart data={powerHistory} />
          </div>

          {/* Right Column - Activity Log */}
          <div className="lg:col-span-3">
            <ActivityLog logs={activityLogs} />
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          className="text-center py-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>BatteryIoT Dashboard v1.0 • Arduino + Python Backend</p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
