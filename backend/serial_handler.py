import serial, json, time
from globals import ser, battery_data, data_lock, connection_status
from config import BAUD_RATE, TIMEOUT

def init_serial(port):
    global ser, connection_status
    ser = serial.Serial(port, BAUD_RATE, timeout=TIMEOUT)
    time.sleep(2)
    connection_status = True

def read_serial():
    while True:
        if ser and ser.in_waiting:
            line = ser.readline().decode().strip()
            try:
                data = json.loads(line)
                with data_lock:
                    battery_data.update(data)
            except:
                pass
        time.sleep(0.1)

def send_command(cmd):
    if not ser:
        return {"error": "Serial not connected"}
    ser.write((json.dumps({"command": cmd}) + "\n").encode())
    return {"status": "sent"}
