from config import BAUD_RATE, TIMEOUT
import serial
import serial.tools.list_ports
import time

ser = None
_port = None


def find_available_port():
    """Auto-detect Arduino/serial device port"""
    ports = serial.tools.list_ports.comports()
    if not ports:
        return None
    
    # Prefer Arduino ports, fallback to first available
    for port_info in ports:
        if 'arduino' in port_info.description.lower() or 'ch340' in port_info.description.lower():
            return port_info.device
    
    return ports[0].device if ports else None


def init_serial(port=None):
    global ser
    if ser:
        try:
            ser.close()
        except Exception:
            pass

    if not port:
        port = find_available_port()
        if not port:
            raise Exception("No serial ports found")
        print(f"[Serial] Auto-detected port: {port}")

    ser = serial.Serial(port, BAUD_RATE, timeout=TIMEOUT)
    _port = port
    time.sleep(2)
    print(f"[Serial] Connected: {port}")


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


def list_ports():
    ports = serial.tools.list_ports.comports()
    return [p.device for p in ports]


def is_connected():
    return ser is not None and getattr(ser, 'is_open', False)


def get_port():
    return _port


def connect_port(port: str):
    """Attempt to connect to specified port."""
    try:
        init_serial(port)
        return {"success": True, "port": port}
    except Exception as e:
        return {"success": False, "error": str(e)}