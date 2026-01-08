import serial
import time

ser = serial.Serial("COM5", 115200, timeout=1)
time.sleep(2)

def send(cmd):
    ser.write((cmd + "\n").encode())
    print("SEND:", cmd)

send("MODE:MANUAL")
time.sleep(1)

send("ON")
time.sleep(10)

send("OFF")
