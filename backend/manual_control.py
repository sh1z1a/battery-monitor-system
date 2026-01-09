import time

from config import SERIAL_PORT
from serial_handler import init_serial, send_command, read_serial


def main():
    init_serial(SERIAL_PORT)
    time.sleep(0.2)

    print("Connected to Arduino")
    print("Commands: ON | OFF | STATUS | EXIT")

    # SET MODE MANUAL SEKALI SAAT START
    send_command("MODE:MANUAL")
    time.sleep(0.2)

    while True:
        cmd = input(">> ").strip().upper()

        if cmd == "EXIT":
            break

        if cmd in ("ON", "OFF", "STATUS"):
            send_command(cmd)
        else:
            print("Invalid command")
            continue

        # baca respon Arduino
        time.sleep(0.2)
        lines = read_serial()
        for response in lines:
            print("Arduino:", response)

    print("Disconnected")


if __name__ == "__main__":
    main()