import serial
import time

# GANTI PORT SESUAI DEVICE
PORT = "COM5"
BAUD = 115200

def main():
    ser = serial.Serial(PORT, BAUD, timeout=1)
    time.sleep(2)  # tunggu Arduino ready

    print("Connected to Arduino")
    print("Commands: ON | OFF | STATUS | EXIT")

    while True:
        cmd = input(">> ").strip().upper()

        if cmd == "EXIT":
            break

        if cmd not in ["ON", "OFF", "STATUS"]:
            print("Invalid command")
            continue

        ser.write((cmd + "\n").encode())

        # baca respon Arduino
        time.sleep(0.2)
        while ser.in_waiting:
            response = ser.readline().decode().strip()
            print("Arduino:", response)

    ser.close()
    print("Disconnected")

if __name__ == "__main__":
    main()
