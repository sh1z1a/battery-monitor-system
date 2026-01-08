from flask import Flask, jsonify, request
from threading import Thread

from globals import battery_data, data_lock
from serial_handler import init_serial, read_serial, send_command
from database import init_db
import psutil
import time

app = Flask(__name__)

@app.route("/api/battery")
def battery():
    battery = psutil.sensors_battery()

    if battery is None:
        return jsonify({
            "error": "Battery data not available"
        }), 404

    return jsonify({
        "percentage": battery.percent,
        "plugged": battery.power_plugged,
        "seconds_left": battery.secsleft
    })

@app.route("/api/ssr", methods=["POST"])
def ssr():
    state = request.json.get("state")
    return jsonify(send_command(f"ssr_{state}"))

if __name__ == "__main__":
    init_db()
    init_serial("COM3")  # ganti sesuai device
    Thread(target=read_serial, daemon=True).start()
    app.run(port=5000)
