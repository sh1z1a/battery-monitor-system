from config import BAUD_RATE, TIMEOUT, SERIAL_PORT, DB_NAME
import time
import psutil
import serial

# ===== CONFIG =====
BAUD = 115200
TIMEOUT = 1
PORT = 'COM3'

LOW_THRESHOLD = 60
HIGH_THRESHOLD = 90
CHECK_INTERVAL = 5

current_mode = "MANUAL"
current_state = "OFF"
mode_changed = False

# =========================================

def get_battery():
    battery = psutil.sensors_battery()
    if battery is None:
        return None
    return battery.percent


def set_mode(ser, mode):
    global current_mode
    try:
        ser.write((f"MODE:{mode}\n").encode())
        current_mode = mode
        print(f">>> MODE SET TO {mode}")
        time.sleep(0.2)
    except Exception as e:
        print(f"Error setting mode: {e}")


def print_menu():
    print("\n" + "="*60)
    print(f"Current Mode: {current_mode} | SSR State: {current_state}")
    print("="*60)


def manual_mode(ser):
    global current_state, mode_changed

    print("\n=== MANUAL MODE ===")
    print("Commands: ON | OFF | STATUS | AUTO (switch mode) | EXIT")

    while True:
        if mode_changed:
            return
        
        try:
            cmd = input("MANUAL >> ").strip().upper()
        except EOFError:
            break

        if cmd == "EXIT":
            print("→ Exiting program...")
            return

        if cmd == "AUTO":
            print("→ Switching to AUTO mode...")
            mode_changed = True
            return

        if cmd in ["ON", "OFF", "STATUS"]:
            try:
                ser.write((cmd + "\n").encode())
                time.sleep(0.2)
                while ser.in_waiting:
                    response = ser.readline().decode().strip()
                    print("Arduino:", response)

                if cmd in ["ON", "OFF"]:
                    current_state = cmd
                    print(f"SSR State: {current_state}")
            except Exception as e:
                print(f"Error: {e}")

        else:
            print("Invalid command. Try: ON | OFF | STATUS | AUTO | EXIT")


def auto_mode(ser):
    global current_state, mode_changed

    print("\n=== AUTO MODE ===")
    print("Auto-controlling battery charging based on thresholds...")
    print(f"Low threshold: {LOW_THRESHOLD}% | High threshold: {HIGH_THRESHOLD}%")
    print("Commands: MANUAL (switch mode) | EXIT (quit)\n")

    while True:
        if mode_changed:
            return
        
        battery = get_battery()

        if battery is None:
            print("Battery not detected")
            time.sleep(CHECK_INTERVAL)
            continue

        print(f"[AUTO] Battery: {battery}% | SSR: {current_state}")

        if battery <= LOW_THRESHOLD and current_state != "ON":
            print(f"→ Battery low ({battery}% ≤ {LOW_THRESHOLD}%) → CHARGE ON")
            try:
                ser.write(b"ON\n")
                current_state = "ON"
            except Exception as e:
                print(f"Error: {e}")

        elif battery >= HIGH_THRESHOLD and current_state != "OFF":
            print(f"→ Battery high ({battery}% ≥ {HIGH_THRESHOLD}%) → CHARGE OFF")
            try:
                ser.write(b"OFF\n")
                current_state = "OFF"
            except Exception as e:
                print(f"Error: {e}")

        # Check for input non-blocking (switch mode)
        start = time.time()
        while time.time() - start < CHECK_INTERVAL:
            if ser.in_waiting:
                try:
                    ser.readline()  # clear buffer
                except:
                    pass
            time.sleep(0.1)

            try:
                cmd = input("").strip().upper()
                if cmd == "MANUAL":
                    print("→ Switching to MANUAL mode...")
                    mode_changed = True
                    return
                elif cmd == "EXIT":
                    print("→ Exiting program...")
                    return
                elif cmd:
                    print("Invalid command. Type: MANUAL or EXIT")
            except EOFError:
                pass
            except Exception:
                pass


def main():
    global current_mode, mode_changed
    
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        time.sleep(2)
        print(f"✓ Arduino connected on {PORT}")
    except Exception as e:
        print(f"✗ Error connecting to {PORT}: {e}")
        print("Exiting...")
        return

    print("\n" + "="*60)
    print("=== SMART CHARGER CONTROLLER ===")
    print("="*60)
    print("Select initial mode:")
    print("1. MANUAL")
    print("2. AUTO")
    print("-"*60)

    choice = input(">> ").strip()

    if choice == "2":
        set_mode(ser, "AUTO")
        current_mode = "AUTO"
    else:
        set_mode(ser, "MANUAL")
        current_mode = "MANUAL"

    # Main loop - allows switching modes
    exit_program = False
    
    while not exit_program:
        mode_changed = False
        print_menu()
        
        try:
            if current_mode == "AUTO":
                auto_mode(ser)
            else:
                manual_mode(ser)
            
            if mode_changed:
                # Switch mode
                new_mode = "MANUAL" if current_mode == "AUTO" else "AUTO"
                set_mode(ser, new_mode)
                current_mode = new_mode
            else:
                # Exit was called
                exit_program = True
        
        except KeyboardInterrupt:
            print("\n\n→ Interrupted by user")
            exit_program = True
        except Exception as e:
            print(f"Error: {e}")
            exit_program = True

    try:
        ser.close()
    except:
        pass
    
    print("\nDisconnected")


if __name__ == "__main__":
    main()
