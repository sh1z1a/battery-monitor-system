import serial
import time

PORT = "COM5"
BAUD = 115200

def main():
    ser = serial.Serial(PORT, BAUD, timeout=1)
    time.sleep(2)

    print("Connected to Arduino")
    print("Commands: ON | OFF | STATUS | EXIT")

    # SET MODE MANUAL SEKALI SAAT START
    ser.write(("MODE:MANUAL\n").encode())
    time.sleep(0.2)

    while True:
        cmd = input(">> ").strip().upper()

        if cmd == "EXIT":
            break

        if cmd == "ON":
            ser.write(("ON\n").encode())

        elif cmd == "OFF":
            ser.write(("OFF\n").encode())

        elif cmd == "STATUS":
            ser.write(("STATUS\n").encode())

        else:
            print("Invalid command")
            continue

        # baca respon Arduino
        time.sleep(0.2)
        while ser.in_waiting:
            response = ser.readline().decode().strip()
            print("Arduino:", response)

    ser.close()
    print("Disconnected")

if __name__ == "__main__":
    main()
