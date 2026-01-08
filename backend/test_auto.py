import serial
import time

ser = serial.Serial("COM5", 115200, timeout=1)
time.sleep(2)

def send(cmd):
    ser.write((cmd + "\n").encode())
    print("SEND:", cmd)

send("MODE:AUTO")
time.sleep(1)

# heartbeat ON
for _ in range(5):
    send("ON")
    time.sleep(1)

print("STOP SENDING...")
# tidak kirim apa-apa
