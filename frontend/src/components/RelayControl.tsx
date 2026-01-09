import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, ShieldAlert, Clock, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RelayStatus } from '@/types/battery';

interface RelayControlProps {
  status: RelayStatus;
  onToggle: (state: boolean) => void;
  onUpdateAutoShutoff: (enabled: boolean, threshold?: number) => void;
}

export const RelayControl = ({ status, onToggle, onUpdateAutoShutoff }: RelayControlProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingState, setPendingState] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localThreshold, setLocalThreshold] = useState(status.autoShutoffThreshold);

  const handleToggleClick = (newState: boolean) => {
    setPendingState(newState);
    setShowConfirmDialog(true);
  };

  const confirmToggle = () => {
    if (pendingState !== null) {
      onToggle(pendingState);
    }
    setShowConfirmDialog(false);
    setPendingState(null);
  };

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} detik lalu`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    return `${hours} jam lalu`;
  };

  return (
    <>
      <div className="glass-panel p-6 space-y-9">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Kontrol Relay</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Main Power Button */}
        <div className="flex flex-col items-center py-6">
          <motion.button
            onClick={() => handleToggleClick(!status.isConnected)}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              status.isConnected
                ? 'bg-success/20 border-2 border-success glow-success'
                : 'bg-destructive/20 border-2 border-destructive glow-danger'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Power
              className={`w-16 h-16 transition-colors ${
                status.isConnected ? 'text-success' : 'text-destructive'
              }`}
            />
            <motion.div
              className={`absolute inset-0 rounded-full ${
                status.isConnected ? 'bg-success' : 'bg-destructive'
              }`}
              initial={{ scale: 1, opacity: 0.2 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.button>

          <div className="mt-4 text-center">
            <span
              className={`text-xl font-semibold ${
                status.isConnected ? 'text-success' : 'text-destructive'
              }`}
            >
              {status.isConnected ? 'AKTIF' : 'NONAKTIF'}
            </span>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Terakhir diubah: {formatTimeSince(status.lastToggle)}</span>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div
              className={`status-indicator ${
                status.isConnected ? 'online' : 'offline'
              }`}
            />
            <div>
              <span className="text-xs text-muted-foreground block">Status Relay</span>
              <span className="text-sm font-medium">
                {status.isConnected ? 'Terhubung' : 'Terputus'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <ShieldAlert
              className={`w-5 h-5 ${
                status.autoShutoffEnabled ? 'text-success' : 'text-muted-foreground'
              }`}
            />
            <div>
              <span className="text-xs text-muted-foreground block">Auto Charge</span>
              <span className="text-sm font-medium">
                {status.isConnected ? `Nyala saat (${status.autoShutoffThreshold}%)` : 'Nonaktif'}
              </span>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Auto Charge</span>
                    <p className="text-xs text-muted-foreground">
                      Hidupkan arus otomatis saat baterai rendah
                    </p>
                  </div>
                </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-primary">{localThreshold}%</span>
                    </div>
                    <Slider
                      value={[localThreshold]}
                      onValueChange={([value]) => setLocalThreshold(value)}
                      onValueCommit={([value]) => onUpdateAutoShutoff(true, value)}
                      min={25}
                      max={80}
                      step={5}
                      className="w-full"
                    />
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Konfirmasi {pendingState ? 'Aktifkan' : 'Nonaktifkan'} Relay
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingState
                ? 'Arus listrik akan dihubungkan ke baterai. Pastikan tidak ada gangguan pada sistem.'
                : 'Arus listrik akan diputus dari baterai. Laptop akan beralih ke daya baterai internal.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted hover:bg-muted/80">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              className={
                pendingState
                  ? 'bg-success hover:bg-success/90 text-success-foreground'
                  : 'bg-destructive hover:bg-destructive/90'
              }
            >
              {pendingState ? 'Aktifkan' : 'Nonaktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
