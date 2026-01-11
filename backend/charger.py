import time
import psutil
import serial

# ===== CONFIG =====
PORT = "COM3"
BAUD = 115200

LOW_THRESHOLD = 95
HIGH_THRESHOLD = 96
CHECK_INTERVAL = 1  # detik

current_state = "OFF"

def get_battery():
    battery = psutil.sensors_battery()
    if battery is None:
        return None
    return battery.percent

def main():
    global current_state

    ser = serial.Serial(PORT, BAUD, timeout=1)
    time.sleep(2)

    print("✓ Connected to Arduino")

    # ===== SET AUTO MODE =====
    ser.write(b"MODE:AUTO\n")
    time.sleep(0.2)

    print("=== AUTO CHARGER STARTED ===")

    while True:
        battery = get_battery()

        if battery is None:
            print("Battery not detected")
            time.sleep(CHECK_INTERVAL)
            continue

        print(f"[AUTO] Battery: {battery}% | SSR: {current_state}")

        # ===== DECISION =====
        if battery <= LOW_THRESHOLD and current_state != "ON":
            ser.write(b"ON\n")
            current_state = "ON"
            print("→ CHARGE ON")

        elif battery >= HIGH_THRESHOLD and current_state != "OFF":
            ser.write(b"OFF\n")
            current_state = "OFF"
            print("→ CHARGE OFF")

        # ===== HEARTBEAT =====
        ser.write(b"PING\n")

        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()