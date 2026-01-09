import time
import psutil
from serial_handler import init_serial, send_command

# ====== CONFIG ======
PORT = "COM5"
LOW_THRESHOLD = 80     # % → charge ON
HIGH_THRESHOLD = 90    # % → charge OFF
CHECK_INTERVAL = 10    # detik

current_state = "OFF"


def get_battery():
    battery = psutil.sensors_battery()
    if battery is None:
        return None
    return battery.percent


def main():
    global current_state

    init_serial(PORT)
    print("AUTO CHARGER STARTED")

    # ===== SET MODE AUTO SEKALI =====
    send_command("MODE:AUTO")
    time.sleep(1)

    while True:
        battery = get_battery()

        if battery is None:
            print("Battery not detected")
            time.sleep(CHECK_INTERVAL)
            continue

        print(f"Battery: {battery}% | SSR: {current_state}")

        # ====== DECISION LOGIC ======
        if battery <= LOW_THRESHOLD and current_state != "ON":
            print("→ Battery low, CHARGE ON")
            send_command("ON")
            current_state = "ON"

        elif battery >= HIGH_THRESHOLD and current_state != "OFF":
            print("→ Battery high, CHARGE OFF")
            send_command("OFF")
            current_state = "OFF"

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
