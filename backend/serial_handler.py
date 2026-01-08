import serial
import time

ser = None

BAUD_RATE = 115200
TIMEOUT = 1


def init_serial(port):
    global ser
    ser = serial.Serial(port, BAUD_RATE, timeout=TIMEOUT)
    time.sleep(2)
    print(f"Serial connected: {port}")


def send_command(cmd):
    if not ser:
        print("Serial not connected")
        return

    ser.write((cmd + "\n").encode())
    print(f">> SENT: {cmd}")


def read_serial():
    if not ser:
        return

    while ser.in_waiting:
        line = ser.readline().decode().strip()
        print("<<", line)
