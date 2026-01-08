import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Activity } from 'lucide-react';

interface PowerChartProps {
  data: { time: string; power: number; current: number }[];
}

export const PowerChart = ({ data }: PowerChartProps) => {
  return (
    <motion.div
      className="glass-panel p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Grafik Suhu Baterai/30 Menit</h2>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Real-time</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(175, 80%, 50%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(175, 80%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(220, 15%, 20%)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="hsl(215, 20%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(215, 20%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}W`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220, 18%, 12%)',
                border: '1px solid hsl(220, 15%, 20%)',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
              labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
              itemStyle={{ color: 'hsl(175, 80%, 50%)' }}
            />
            <Area
              type="monotone"
              dataKey="power"
              stroke="hsl(175, 80%, 50%)"
              strokeWidth={2}
              fill="url(#powerGradient)"
              name="Daya (W)"
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="hsl(142, 76%, 45%)"
              strokeWidth={2}
              fill="url(#currentGradient)"
              name="Arus (A)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Daya (W)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Arus (A)</span>
        </div>
      </div>
    </motion.div>
  );
};
