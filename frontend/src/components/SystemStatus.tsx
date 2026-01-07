import { motion } from 'framer-motion';
import { Cpu, Wifi, Clock, Server } from 'lucide-react';
import { SystemStatus as SystemStatusType } from '@/types/battery';

interface SystemStatusProps {
  status: SystemStatusType;
}

export const SystemStatus = ({ status }: SystemStatusProps) => {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <motion.div
      className="glass-panel p-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {/* Arduino Status */}
          <div className="flex items-center gap-2">
            <Cpu className={`w-5 h-5 ${status.arduinoConnected ? 'text-success' : 'text-destructive'}`} />
            <div>
              <span className="text-xs text-muted-foreground block">Arduino</span>
              <span className={`text-sm font-medium ${status.arduinoConnected ? 'text-success' : 'text-destructive'}`}>
                {status.arduinoConnected ? 'Terhubung' : 'Terputus'}
              </span>
            </div>
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center gap-2">
            <Wifi className={`w-5 h-5 ${status.websocketConnected ? 'text-success' : 'text-destructive'}`} />
            <div>
              <span className="text-xs text-muted-foreground block">WebSocket</span>
              <span className={`text-sm font-medium ${status.websocketConnected ? 'text-success' : 'text-destructive'}`}>
                {status.websocketConnected ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>

          {/* Server Uptime */}
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            <div>
              <span className="text-xs text-muted-foreground block">Uptime</span>
              <span className="text-sm font-medium font-mono text-foreground">
                {formatUptime(status.uptime)}
              </span>
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            Update terakhir: <span className="font-mono">{formatLastUpdate(status.lastUpdate)}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};
