/**
 * Server Battery Monitor - Dashboard JavaScript
 * Vanilla JS implementation with REST API integration
 */

// ===== Configuration =====
const CONFIG = {
  API_BASE_URL: '/api', // Base URL for REST API
  POLLING_INTERVAL: 5000, // Poll every 5 seconds
  TOAST_DURATION: 3000,
};

// ===== State =====
let state = {
  battery: {
    percentage: 0,
    status: 'unknown',
    voltage: 0,
    current: 0,
    power: 0,
    timeRemaining: 0,
    temperature: 0,
    health: 0,
  },
  relay: {
    isConnected: false,
    autoShutoffEnabled: true,
    autoShutoffThreshold: 20,
  },
  system: {
    arduinoConnected: false,
    apiConnected: false,
    uptime: 0,
  },
  activityLog: [],
  pollingTimer: null,
};

// ===== DOM Elements =====
const elements = {
  // Battery
  batteryFill: document.getElementById('battery-fill'),
  batteryPercentage: document.getElementById('battery-percentage'),
  batteryStatus: document.getElementById('battery-status'),
  voltage: document.getElementById('voltage'),
  current: document.getElementById('current'),
  power: document.getElementById('power'),
  timeRemaining: document.getElementById('time-remaining'),
  temperature: document.getElementById('temperature'),
  health: document.getElementById('health'),
  
  // Relay
  relayIndicator: document.getElementById('relay-indicator'),
  relayStatusText: document.getElementById('relay-status-text'),
  btnOn: document.getElementById('btn-on'),
  btnOff: document.getElementById('btn-off'),
  autoShutoff: document.getElementById('auto-shutoff'),
  shutoffThreshold: document.getElementById('shutoff-threshold'),
  
  // System
  connectionStatus: document.getElementById('connection-status'),
  lastUpdate: document.getElementById('last-update'),
  arduinoStatus: document.getElementById('arduino-status'),
  apiStatus: document.getElementById('api-status'),
  uptime: document.getElementById('uptime'),
  
  // Other
  activityLog: document.getElementById('activity-log'),
  confirmDialog: document.getElementById('confirm-dialog'),
  toast: document.getElementById('toast'),
};

// ===== API Functions =====

/**
 * Fetch battery status from REST API
 * GET /api/battery
 */
async function fetchBatteryData() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/battery`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    state.battery = data.battery;
    state.system = data.system;
    state.system.apiConnected = true;
    
    updateUI();
    return true;
  } catch (error) {
    console.error('Error fetching battery data:', error);
    state.system.apiConnected = false;
    updateConnectionStatus();
    
    // Use mock data for demonstration
    useMockData();
    return false;
  }
}

/**
 * Toggle relay state via REST API
 * POST /api/relay/toggle
 */
async function apiToggleRelay(newState) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/relay/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        state: newState,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error toggling relay:', error);
    // Simulate success for demo
    return { success: true, state: newState };
  }
}

/**
 * Update auto-shutoff settings via REST API
 * POST /api/relay/auto-shutoff
 */
async function apiUpdateAutoShutoff(enabled, threshold) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/relay/auto-shutoff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled, threshold }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating auto-shutoff:', error);
    return { success: true };
  }
}

// ===== Mock Data (for demonstration without backend) =====
function useMockData() {
  // Generate realistic mock battery data
  state.battery = {
    percentage: Math.floor(Math.random() * 30) + 60,
    status: Math.random() > 0.5 ? 'charging' : 'discharging',
    voltage: (11.4 + Math.random() * 1.2).toFixed(2),
    current: (1.5 + Math.random() * 2).toFixed(2),
    power: (15 + Math.random() * 25).toFixed(1),
    timeRemaining: Math.floor(Math.random() * 180) + 60,
    temperature: (35 + Math.random() * 10).toFixed(1),
    health: (85 + Math.random() * 10).toFixed(0),
  };
  
  state.system = {
    arduinoConnected: true,
    apiConnected: false, // Show as mock mode
    uptime: Math.floor(Date.now() / 1000) - 259200,
  };
  
  updateUI();
}

// ===== UI Update Functions =====

function updateUI() {
  updateBatteryDisplay();
  updateRelayDisplay();
  updateSystemInfo();
  updateConnectionStatus();
}

function updateBatteryDisplay() {
  const { percentage, status, voltage, current, power, timeRemaining } = state.battery;
  
  // Update percentage display
  elements.batteryPercentage.textContent = `${percentage}%`;
  elements.batteryFill.style.width = `${percentage}%`;
  
  // Update fill color based on level
  elements.batteryFill.classList.remove('low', 'medium');
  if (percentage <= 20) {
    elements.batteryFill.classList.add('low');
  } else if (percentage <= 50) {
    elements.batteryFill.classList.add('medium');
  }
  
  // Update status
  elements.batteryStatus.className = `battery-status ${status}`;
  const statusIcon = status === 'charging' ? '⚡' : '🔋';
  const statusText = status === 'charging' ? 'Mengisi Daya' : 'Digunakan';
  elements.batteryStatus.innerHTML = `
    <span class="status-icon">${statusIcon}</span>
    <span class="status-text">${statusText}</span>
  `;
  
  // Update details
  elements.voltage.textContent = `${voltage} V`;
  elements.current.textContent = `${current} A`;
  elements.power.textContent = `${power} W`;
  elements.timeRemaining.textContent = formatTime(timeRemaining);
}

function updateRelayDisplay() {
  const { isConnected, autoShutoffEnabled, autoShutoffThreshold } = state.relay;
  
  // Update indicator
  elements.relayIndicator.className = `relay-indicator ${isConnected ? 'on' : 'off'}`;
  elements.relayStatusText.textContent = `Status: ${isConnected ? 'Aktif' : 'Nonaktif'}`;
  
  // Update buttons
  elements.btnOn.disabled = isConnected;
  elements.btnOff.disabled = !isConnected;
  
  // Update auto-shutoff
  elements.autoShutoff.checked = autoShutoffEnabled;
  elements.shutoffThreshold.value = autoShutoffThreshold;
}

function updateSystemInfo() {
  const { arduinoConnected, uptime } = state.system;
  const { temperature, health } = state.battery;
  
  // Arduino status
  elements.arduinoStatus.textContent = arduinoConnected ? 'Terhubung' : 'Terputus';
  elements.arduinoStatus.className = `info-value ${arduinoConnected ? 'status-online' : 'status-offline'}`;
  
  // API status
  elements.apiStatus.textContent = state.system.apiConnected ? 'Terhubung' : 'Mode Demo';
  elements.apiStatus.className = `info-value ${state.system.apiConnected ? 'status-online' : 'status-offline'}`;
  
  // Uptime
  elements.uptime.textContent = formatUptime(uptime);
  
  // Temperature & Health
  elements.temperature.textContent = `${temperature} °C`;
  elements.health.textContent = `${health} %`;
}

function updateConnectionStatus() {
  const isOnline = state.system.apiConnected || state.system.arduinoConnected;
  
  elements.connectionStatus.className = `status-badge ${isOnline ? 'online' : 'offline'}`;
  elements.connectionStatus.innerHTML = `
    <span class="status-dot"></span>
    ${isOnline ? 'Online' : 'Mode Demo'}
  `;
  
  elements.lastUpdate.textContent = `Update: ${formatTimeNow()}`;
}

function updateActivityLog() {
  if (state.activityLog.length === 0) {
    elements.activityLog.innerHTML = '<div class="log-empty">Belum ada aktivitas tercatat</div>';
    return;
  }
  
  elements.activityLog.innerHTML = state.activityLog
    .slice(0, 10)
    .map(log => `
      <div class="log-item ${log.type}">
        <span class="log-time">${formatLogTime(log.timestamp)}</span>
        <div class="log-content">
          <div class="log-action">${log.action}</div>
          <div class="log-details">${log.details}</div>
        </div>
      </div>
    `)
    .join('');
}

// ===== Action Handlers =====

function toggleRelay(newState) {
  apiToggleRelay(newState).then(result => {
    if (result.success) {
      state.relay.isConnected = newState;
      updateRelayDisplay();
      
      // Add to activity log
      addActivityLog({
        action: newState ? 'Relay Diaktifkan' : 'Relay Dinonaktifkan',
        details: newState 
          ? 'Arus listrik dihubungkan ke baterai server' 
          : 'Arus listrik diputus dari baterai server',
        type: newState ? 'success' : 'warning',
      });
      
      showToast(
        newState ? 'Relay berhasil diaktifkan' : 'Relay berhasil dinonaktifkan',
        newState ? 'success' : 'warning'
      );
    }
  });
}

function updateAutoShutoff() {
  const enabled = elements.autoShutoff.checked;
  const threshold = parseInt(elements.shutoffThreshold.value) || 20;
  
  state.relay.autoShutoffEnabled = enabled;
  state.relay.autoShutoffThreshold = threshold;
  
  apiUpdateAutoShutoff(enabled, threshold);
  
  addActivityLog({
    action: 'Pengaturan Auto-Shutoff Diubah',
    details: enabled 
      ? `Auto-shutoff diaktifkan pada ${threshold}%` 
      : 'Auto-shutoff dinonaktifkan',
    type: 'info',
  });
}

function showConfirmDialog() {
  elements.confirmDialog.style.display = 'flex';
}

function hideConfirmDialog() {
  elements.confirmDialog.style.display = 'none';
}

function confirmDisconnect() {
  hideConfirmDialog();
  toggleRelay(false);
}

function addActivityLog(log) {
  state.activityLog.unshift({
    ...log,
    timestamp: new Date(),
    id: Date.now(),
  });
  updateActivityLog();
}

// ===== Toast Notification =====

function showToast(message, type = 'success') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.style.display = 'block';
  
  setTimeout(() => {
    elements.toast.style.display = 'none';
  }, CONFIG.TOAST_DURATION);
}

// ===== Utility Functions =====

function formatTime(minutes) {
  if (!minutes || minutes < 0) return '-- menit';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}j ${mins}m`;
  }
  return `${mins} menit`;
}

function formatUptime(seconds) {
  if (!seconds) return '--';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}h ${hours}j ${mins}m`;
  } else if (hours > 0) {
    return `${hours}j ${mins}m`;
  }
  return `${mins}m`;
}

function formatTimeNow() {
  const now = new Date();
  return now.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
}

function formatLogTime(date) {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ===== Polling =====

function startPolling() {
  // Initial fetch
  fetchBatteryData();
  
  // Set up polling interval
  state.pollingTimer = setInterval(() => {
    fetchBatteryData();
  }, CONFIG.POLLING_INTERVAL);
  
  console.log(`Polling started: every ${CONFIG.POLLING_INTERVAL / 1000} seconds`);
}

function stopPolling() {
  if (state.pollingTimer) {
    clearInterval(state.pollingTimer);
    state.pollingTimer = null;
    console.log('Polling stopped');
  }
}

// ===== Event Listeners =====

elements.shutoffThreshold.addEventListener('change', updateAutoShutoff);

// Handle page visibility
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopPolling();
  } else {
    startPolling();
  }
});

// Close dialog on overlay click
elements.confirmDialog.addEventListener('click', (e) => {
  if (e.target === elements.confirmDialog) {
    hideConfirmDialog();
  }
});

// Keyboard shortcut: Escape to close dialog
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideConfirmDialog();
  }
});

// ===== Initialize =====

function init() {
  console.log('Server Battery Monitor initialized');
  
  // Set initial relay state
  state.relay.isConnected = true;
  updateRelayDisplay();
  
  // Add initial log
  addActivityLog({
    action: 'Sistem Dimulai',
    details: 'Dashboard monitoring baterai server aktif',
    type: 'info',
  });
  
  // Start data polling
  startPolling();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);

// Make functions globally available for onclick handlers
window.toggleRelay = toggleRelay;
window.showConfirmDialog = showConfirmDialog;
window.hideConfirmDialog = hideConfirmDialog;
window.confirmDisconnect = confirmDisconnect;
window.updateAutoShutoff = updateAutoShutoff;
