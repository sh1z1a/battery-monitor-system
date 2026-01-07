import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { ActivityLog as ActivityLogType } from '@/types/battery';

interface ActivityLogProps {
  logs: ActivityLogType[];
}

export const ActivityLog = ({ logs }: ActivityLogProps) => {
  const getIcon = (type: ActivityLogType['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <motion.div
      className="glass-panel p-6 h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Log Aktivitas</h2>
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex-shrink-0 mt-0.5">{getIcon(log.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {log.action}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {log.details}
                </p>
                <span className="text-xs text-muted-foreground/60">oleh {log.user}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
};
