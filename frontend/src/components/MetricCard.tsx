import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

export const MetricCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend, 
  color = 'primary' 
}: MetricCardProps) => {
  const colorClasses = {
    primary: 'text-primary border-primary/30',
    success: 'text-success border-success/30',
    warning: 'text-warning border-warning/30',
    destructive: 'text-destructive border-destructive/30',
  };

  const glowClasses = {
    primary: 'glow-primary',
    success: 'glow-success',
    warning: 'glow-warning',
    destructive: 'glow-danger',
  };

  return (
    <motion.div
      className={`metric-card group ${colorClasses[color]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg bg-${color}/10 ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <motion.span
          className={`text-3xl font-bold font-mono ${colorClasses[color].split(' ')[0]}`}
          key={value}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          {typeof value === 'number' ? value.toFixed(2) : value}
        </motion.span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1">
          {trend === 'up' && <span className="text-xs text-success">↑ Naik</span>}
          {trend === 'down' && <span className="text-xs text-destructive">↓ Turun</span>}
          {trend === 'stable' && <span className="text-xs text-muted-foreground">→ Stabil</span>}
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-${color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
    </motion.div>
  );
};
