from flask import Flask, jsonify, request
from threading import Thread

from globals import battery_data, data_lock
from serial_handler import init_serial, read_serial, send_command
from database import init_db
import psutil
import wmi

app = Flask(__name__)

# Global mode state
current_mode = "MANUAL"


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

def seconds_to_hours(seconds):
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours} jam {minutes} menit"

def get_health():
    try:
        c = wmi.WMI(namespace="root\\wmi")
        full = c.BatteryFullChargedCapacity()[0].FullChargedCapacity
        design = c.BatteryStaticData()[0].DesignedCapacity
        health = round((full / design) * 100, 2)
        return health
    except:
        return None

def estimate_cycles(health):
    if health is None:
        return None
    return int((100 - health) * 5)

@app.route("/api/battery")
def battery():
    b = psutil.sensors_battery()
    if not b:
        return jsonify({"error": "Battery not detected"}), 404

    health = get_health()
    cycles = estimate_cycles(health)

    time_left = None

    # secsleft values: >0 = seconds left, -2 = charging, -1 = unknown
    if b.secsleft > 0:
        time_left = seconds_to_hours(b.secsleft)
    elif b.secsleft == -2:
        time_left = "Sedang mengisi"
    elif b.secsleft == -1:
        time_left = "Tidak diketahui"


    return jsonify({
        "status": {
            "percentage": b.percent,
            "plugged": b.power_plugged,
            "time_left": time_left
        },
        "health": {
            "health_percent": health
        },
        "estimated_cycles": cycles,
        "temperature_celsius": None
    })

@app.route("/api/ssr", methods=["GET", "POST", "OPTIONS"])
def ssr():
    # Handle preflight CORS requests
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    # Accept boolean or string states from frontend
    payload = request.get_json(silent=True) or {}
    state = payload.get("state")

    print(f"[SSR] Received payload: {payload}, state type: {type(state)}, state value: {state}")

    if isinstance(state, bool):
        cmd = "SSR:ON" if state else "SSR:OFF"
    elif state is not None:
        s = str(state).lower()
        if s in ("on", "true", "1", "aktif", "activate"):
            cmd = "SSR:ON"
        elif s in ("off", "false", "0", "nonaktif", "deactivate"):
            cmd = "SSR:OFF"
        else:
            print(f"[SSR] Invalid state: {state} (as string: '{s}')")
            return jsonify({"success": False, "error": f"invalid state: {state}"}), 400
    else:
        print(f"[SSR] State is None or missing")
        return jsonify({"success": False, "error": "state is required"}), 400

    print(f"[SSR] Sending command: {cmd}")
    result = send_command(cmd)
    # Read any immediate response from serial buffer
    lines = read_serial()
    return jsonify({"result": result, "response_lines": lines})

@app.route("/api/mode", methods=["GET"])
def get_mode():
    """Get current charger mode (MANUAL or AUTO)"""
    return jsonify({"mode": current_mode})

@app.route("/api/mode", methods=["POST"])
def set_mode():
    """Switch charger mode (MANUAL or AUTO)"""
    global current_mode
    payload = request.get_json(silent=True) or {}
    new_mode = payload.get("mode", "").upper()
    
    if new_mode not in ["MANUAL", "AUTO"]:
        return jsonify({"success": False, "error": "invalid mode"}), 400
    
    print(f"[MODE] Switching from {current_mode} to {new_mode}")
    result = send_command(f"MODE:{new_mode}")
    current_mode = new_mode
    
    return jsonify({
        "success": result.get("success", False),
        "mode": current_mode,
        "result": result
    })

if __name__ == "__main__":
    init_db()
    try:
        init_serial()  # auto-detect port
    except Exception as e:
        print(f"[WARNING] Could not connect to serial: {e}")
        print("[INFO] Flask app will still run but serial commands will fail")
    
    Thread(target=read_serial, daemon=True).start()
    print("[Flask] Starting server on http://localhost:5000")
    app.run(port=5000, debug=False)
