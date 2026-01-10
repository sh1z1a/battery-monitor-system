# Troubleshooting Mode AUTO

## Masalah: Mode AUTO hanya berfungsi beberapa detik lalu mati

### Penyebab yang sudah diperbaiki:

1. **Frontend tidak sync dengan backend mode**
   - ❌ Lama: Frontend hanya send POST ke `/api/mode` tapi tidak di-fetch ulang
   - ✅ Baru: Frontend sekarang fetch `/api/mode` setiap 3 detik untuk sync dengan backend

2. **State management tidak konsisten**
   - ❌ Lama: Mode bisa berbeda antara frontend dan backend
   - ✅ Baru: Frontend selalu update mode dari backend response

3. **Controller loop di backend tidak running**
   - ✅ Backend: Controller loop berjalan di thread terpisah (daemon)
   - ✅ Setiap 5 detik check battery dan ubah relay status

---

## Cara Testing

### 1. Test via Python Script
```bash
cd backend
python test_mode.py
```

Expected output:
```
[1] Mengecek mode saat ini...
Response: 200
{"mode": "MANUAL"}

[2] Switching dari MANUAL ke AUTO...
Response: 200
{"success": true, "mode": "AUTO", "serial_result": {...}}

[3] Monitoring mode selama 20 detik...
[1] Mode: AUTO
[2] Mode: AUTO
[3] Mode: AUTO
[4] Mode: AUTO
```

### 2. Test via cURL
```bash
# Check current mode
curl http://localhost:5000/api/mode

# Switch to AUTO
curl -X POST http://localhost:5000/api/mode \
  -H "Content-Type: application/json" \
  -d '{"mode":"AUTO"}'

# Check battery
curl http://localhost:5000/api/battery

# Check thresholds
curl http://localhost:5000/api/thresholds
```

### 3. Check Backend Logs
Buka terminal backend dan lihat console output. Setiap 5 detik harus ada log:
```
[CONTROLLER] AUTO mode - Using laptop battery: 75%
[CONTROLLER] 75% - holding ON
```

---

## Flow yang Benar:

### Frontend → Backend
```
1. User click "Auto Mode" button
   ↓
2. Frontend POST /api/mode {mode: "AUTO"}
   ↓
3. Backend set current_mode = "AUTO"
   ↓
4. Backend start controller_loop yang check battery setiap 5 detik
```

### Backend Controller Loop
```
While mode == AUTO:
  - Get battery percentage
  - If battery ≤ 60%: send "ON" to Arduino
  - If battery ≥ 80%: send "OFF" to Arduino
  - Sleep 5 detik
  - Loop
```

### Frontend Fetch Mode
```
Every 3 seconds:
  - Fetch /api/mode
  - Update systemStatus.mode
  - Component re-render dengan mode terbaru
```

---

## Jika masih bermasalah:

1. **Cek terminal backend - apakah controller_loop running?**
   - Harus ada log "[CONTROLLER] AUTO mode" setiap 5 detik
   
2. **Cek battery percentage**
   - Baterai mungkin di tengah-tengah (antara 60-80%)
   - Jadi relay tidak berubah state

3. **Test manual relay command**
   ```bash
   curl -X POST http://localhost:5000/api/ssr \
     -H "Content-Type: application/json" \
     -d '{"state": true}'
   ```

4. **Check serial connection**
   ```bash
   curl http://localhost:5000/api/serial/status
   ```
   
   Harus return:
   ```json
   {"connected": true, "port": "COM3"}
   ```

---

## Debug Mode - Tambahkan logging

Di [app.py](app.py#L360), tambahkan print untuk monitoring:

```python
def controller_loop():
    global current_mode, LOW_THRESHOLD, HIGH_THRESHOLD, CHECK_INTERVAL, ACTIVE_SENSOR_SOURCE, SENSOR_SOURCES
    last_state = None
    while True:
        try:
            mode = current_mode
            print(f"[CONTROLLER-DEBUG] Current mode: {mode}, last_state: {last_state}")
            if mode == 'AUTO':
                # ... rest of code
```

---

## File yang sudah diperbaiki:

- ✅ [backend/app.py](app.py) - Tambah sensor external support + perbaiki controller_loop
- ✅ [frontend/src/hooks/useBatteryData.ts](../frontend/src/hooks/useBatteryData.ts) - Fetch mode dari backend setiap 3 detik
- ✅ [backend/test_mode.py](test_mode.py) - Testing script baru
