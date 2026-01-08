import { motion } from "framer-motion";
import { Battery, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActivityLog } from "./ActivityLog";
import { useBatteryData } from "@/hooks/useBatteryData";

export const Header = () => {
  const { activityLogs } = useBatteryData();
  return (
    <motion.header className="glass-panel px-6 py-4 flex items-center justify-between" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Battery className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gradient-primary">Smart Hybrid Battery</h1>
          <p className="text-xs text-muted-foreground">Dashboard Monitoring</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-50 bg-card border-border">
            <DropdownMenuItem>
              <ActivityLog logs={activityLogs} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};
