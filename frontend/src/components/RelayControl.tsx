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
  mode: 'MANUAL' | 'AUTO';
  onToggle: (state: boolean) => void;
  onUpdateAutoShutoff: (enabled: boolean, threshold?: number) => void;
  onSwitchMode: (mode: 'MANUAL' | 'AUTO') => void;
}

export const RelayControl = ({ status, mode, onToggle, onUpdateAutoShutoff, onSwitchMode }: RelayControlProps) => {
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
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Kontrol Relay</h2>
            <p className="text-sm text-muted-foreground mt-1">Mode: <span className={mode === 'AUTO' ? 'text-success' : 'text-warning'}>{mode}</span></p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Mode Switch Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSwitchMode('MANUAL')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'MANUAL'
                ? 'bg-warning/20 border-2 border-warning text-warning'
                : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
            }`}
          >
            Manual Mode
          </button>
          <button
            onClick={() => onSwitchMode('AUTO')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'AUTO'
                ? 'bg-success/20 border-2 border-success text-success'
                : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
            }`}
          >
            Auto Mode
          </button>
        </div>

        {/* Main Power Button - Hidden in AUTO mode */}
        {mode === 'MANUAL' && (
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
        )}

        {/* AUTO Mode Info */}
        {mode === 'AUTO' ? (
        <div className="flex flex-col items-center py-6 px-4 bg-success/10 rounded-lg">
          <div className="text-center">
            <p className="text-lg font-semibold text-success mb-2">Mode Otomatis Aktif</p>
            <p className="text-sm text-muted-foreground">
              Relay akan dikontrol otomatis berdasarkan level baterai
            </p>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>📊 Baterai ≤ {status.autoShutoffThreshold}% → Relay ON (Charging)</p>
              <p>📊 Baterai ≥ 80% → Relay OFF (Full)</p>
            </div>
            <div className="mt-4 p-3 bg-success/5 rounded text-xs text-muted-foreground">
              <p className="font-mono">✓ Backend controller sedang berjalan</p>
              <p className="text-xs mt-1">Sistem akan mengecek setiap 5 detik</p>
            </div>
          </div>
        </div>
        ) : null}

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
              <span className="text-xs text-muted-foreground block">Auto Shutoff</span>
              <span className="text-sm font-medium">
                {status.autoShutoffEnabled ? `Aktif (${status.autoShutoffThreshold}%)` : 'Nonaktif'}
              </span>
            </div>
          </div>
        </div>

        {/* Settings Panel - Only show in MANUAL mode */}
        <AnimatePresence>
          {showSettings && mode === 'MANUAL' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Auto Shutoff</span>
                    <p className="text-xs text-muted-foreground">
                      Matikan arus otomatis saat baterai rendah
                    </p>
                  </div>
                  <Switch
                    checked={status.autoShutoffEnabled}
                    onCheckedChange={(checked) => onUpdateAutoShutoff(checked)}
                  />
                </div>

                {status.autoShutoffEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Threshold</span>
                      <span className="font-mono text-primary">{localThreshold}%</span>
                    </div>
                    <Slider
                      value={[localThreshold]}
                      onValueChange={([value]) => setLocalThreshold(value)}
                      onValueCommit={([value]) => onUpdateAutoShutoff(true, value)}
                      min={5}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}
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
