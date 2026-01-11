from flask import Flask, request, jsonifyq
from config import BAUD_RATE, TIMEOUT, SERIAL_PORT, DB_NAME
import time
import psutil
import serial

# ===== CONFIG =====

BAUD = 115200
TIMEOUT = 1
PORT = 'COM3'

LOW_THRESHOLD = 80
HIGH_THRESHOLD = 90
CHECK_INTERVAL = 10

current_mode = "MANUAL"
current_state = "OFF"

# =========================================


def get_battery():
    battery = psutil.sensors_battery()
    if battery is None:
        return None
    return battery.percent


def set_mode(ser, mode):
    global current_mode
    ser.write((f"MODE:{mode}\n").encode())
    current_mode = mode
    print(f">>> MODE SET TO {mode}")
    time.sleep(0.2)


def manual_mode(ser):
    global current_state

    print("\n=== MANUAL MODE ===")
    print("Commands: ON | OFF | STATUS | AUTO | EXIT")

    while True:
        cmd = input("MANUAL >> ").strip().upper()

        if cmd == "EXIT":
            break

        if cmd == "AUTO":
            set_mode(ser, "AUTO")
            return

        if cmd in ["ON", "OFF", "STATUS"]:
            ser.write((cmd + "\n").encode())

            time.sleep(0.2)
            while ser.in_waiting:
                response = ser.readline().decode().strip()
                print("Arduino:", response)

            if cmd in ["ON", "OFF"]:
                current_state = cmd

        else:
            print("Invalid command")


def auto_mode(ser):
    global current_state

    print("\n=== AUTO MODE ===")
    print("Commands: MANUAL (switch to manual) | EXIT (quit)")

    while True:
        battery = get_battery()

        if battery is None:
            print("Battery not detected")
            time.sleep(CHECK_INTERVAL)
            continue

        print(f"[AUTO] Battery: {battery}% | SSR: {current_state}")

        if battery <= LOW_THRESHOLD and current_state != "ON":
            print("→ Battery low → CHARGE ON")
            ser.write(b"ON\n")
            current_state = "ON"

        elif battery >= HIGH_THRESHOLD and current_state != "OFF":
            print("→ Battery high → CHARGE OFF")
            ser.write(b"OFF\n")
            current_state = "OFF"

        # cek input non-blocking (switch mode)
        start = time.time()
        while time.time() - start < CHECK_INTERVAL:
            if ser.in_waiting:
                ser.readline()  # bersihin buffer
            time.sleep(0.1)

            try:
                cmd = input("").strip().upper()
                if cmd == "MANUAL":
                    set_mode(ser, "MANUAL")
                    return
                elif cmd == "EXIT":
                    print("→ Exiting AUTO mode")
                    return
            except EOFError:
                # Handle Ctrl+D
                pass
            except Exception as e:
                pass


def main():
    ser = serial.Serial(PORT, BAUD, timeout=1)
    time.sleep(2)

    print("=== SMART CHARGER CONTROLLER ===")
    print("Select mode:")
    print("1. MANUAL")
    print("2. AUTO")

    choice = input(">> ").strip()

    if choice == "2":
        set_mode(ser, "AUTO")
        auto_mode(ser)
    else:
        set_mode(ser, "MANUAL")
        manual_mode(ser)

    ser.close()
    print("Disconnected")


if __name__ == "__main__":
    main()