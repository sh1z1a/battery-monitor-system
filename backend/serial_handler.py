from config import BAUD_RATE, TIMEOUT
import serial
import time

ser = None


def init_serial(port):
    global ser
    if ser:
        try:
            ser.close()
        except Exception:
            pass

    ser = serial.Serial(port, BAUD_RATE, timeout=TIMEOUT)
    time.sleep(2)
    print(f"Serial connected: {port}")


def send_command(cmd: str):
    """Send a command to the serial device and return a result dict."""
    if not ser:
        msg = "Serial not connected"
        print(msg)
        return {"success": False, "error": msg}

    try:
        ser.write((cmd + "\n").encode())
        print(f">> SENT: {cmd}")
        return {"success": True, "cmd": cmd}
    except Exception as e:
        print("Failed to send command:", e)
        return {"success": False, "error": str(e)}


def read_serial():
    """Read and print any pending serial lines. Non-blocking; returns list of lines."""
    if not ser:
        return []

    lines = []
    try:
        while ser.in_waiting:
            line = ser.readline().decode(errors='ignore').strip()
            if line:
                print("<<", line)
                lines.append(line)
    except Exception as e:
        print("Error reading serial:", e)

    return lines