import { motion } from 'framer-motion';
import { Battery, Bell, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  return (
    <motion.header
      className="glass-panel px-6 py-4 flex items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Battery className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gradient-primary">BatteryIoT</h1>
          <p className="text-xs text-muted-foreground">Dashboard Monitoring</p>
        </div>
      </div>

      {/* <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Pengaturan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div> */}
    </motion.header>
  );
};
