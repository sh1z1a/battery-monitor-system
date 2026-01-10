from flask import Flask, jsonify, request
from threading import Thread
from datetime import datetime

from globals import battery_data, data_lock
from serial_handler import init_serial, read_serial, send_command
from serial_handler import list_ports, is_connected, get_port, connect_port
from database import init_db
import psutil
import wmi
import time

app = Flask(__name__)

# Global mode state
current_mode = "MANUAL"

# AUTO controller thresholds (used when backend manages AUTO mode)
# Can be updated via /api/thresholds endpoint
LOW_THRESHOLD = 20
HIGH_THRESHOLD = 80
CHECK_INTERVAL = 5

# External sensor configuration
SENSOR_SOURCES = {}  # {source_name: {"percentage": value, "timestamp": datetime, "device_type": "power_bank|phone|tablet"}}
ACTIVE_SENSOR_SOURCE = None  # Which sensor source to use for AUTO mode (None = use laptop battery)


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

    # Arduino expects simple ON/OFF commands for relay control
    if isinstance(state, bool):
        cmd = "ON" if state else "OFF"
    elif state is not None:
        s = str(state).lower()
        if s in ("on", "true", "1", "aktif", "activate"):
            cmd = "ON"
        elif s in ("off", "false", "0", "nonaktif", "deactivate"):
            cmd = "OFF"
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
    
    # Try to send mode command to Arduino
    result = send_command(f"MODE:{new_mode}")
    current_mode = new_mode
    print(f"[MODE] current_mode now = {current_mode}")
    
    # If switching to AUTO, immediately turn ON relay
    if new_mode == "AUTO":
        print(f"[MODE] AUTO mode activated - turning relay ON")
        send_command("ON")
    
    # Return success regardless of serial connection - mode is switched
    return jsonify({
        "success": True,  # Always true - mode is switched
        "mode": current_mode,
        "serial_result": result  # Info about serial send attempt
    })


@app.route('/api/serial/ports', methods=['GET'])
def api_list_ports():
    return jsonify({"ports": list_ports()})


@app.route('/api/serial/status', methods=['GET'])
def api_serial_status():
    return jsonify({
        "connected": is_connected(),
        "port": get_port()
    })


@app.route('/api/serial/connect', methods=['POST'])
def api_serial_connect():
    payload = request.get_json(silent=True) or {}
    port = payload.get('port')
    if not port:
        return jsonify({"success": False, "error": "port required"}), 400
    result = connect_port(port)
    status = 200 if result.get('success') else 400
    return jsonify(result), status


@app.route('/api/thresholds', methods=['GET'])
def get_thresholds():
    """Get current AUTO mode thresholds"""
    return jsonify({
        "low_threshold": LOW_THRESHOLD,
        "high_threshold": HIGH_THRESHOLD,
        "check_interval": CHECK_INTERVAL
    })


@app.route('/api/sensor/update', methods=['POST'])
def update_sensor_data():
    """
    Receive battery data from external sensors
    
    Request body:
    {
        "source": "sensor_name",  # unique identifier
        "percentage": 75,
        "device_type": "power_bank|phone|tablet|other"  # optional
    }
    """
    global SENSOR_SOURCES
    payload = request.get_json(silent=True) or {}
    
    source = payload.get('source', '').strip()
    percentage = payload.get('percentage')
    device_type = payload.get('device_type', 'other')
    
    if not source:
        return jsonify({"success": False, "error": "source is required"}), 400
    
    if percentage is None or not isinstance(percentage, (int, float)) or percentage < 0 or percentage > 100:
        return jsonify({"success": False, "error": "percentage must be 0-100"}), 400
    
    try:
        SENSOR_SOURCES[source] = {
            "percentage": float(percentage),
            "timestamp": datetime.now().isoformat(),
            "device_type": device_type
        }
        print(f"[SENSOR] Updated {source}: {percentage}% ({device_type})")
        return jsonify({
            "success": True,
            "source": source,
            "percentage": percentage,
            "timestamp": SENSOR_SOURCES[source]["timestamp"]
        })
    except Exception as e:
        print(f"[SENSOR] Error updating {source}: {e}")
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/sensor/list', methods=['GET'])
def list_sensors():
    """Get list of all registered sensors and their current values"""
    sensors_list = []
    for source, data in SENSOR_SOURCES.items():
        sensors_list.append({
            "source": source,
            "percentage": data["percentage"],
            "device_type": data["device_type"],
            "timestamp": data["timestamp"]
        })
    
    return jsonify({
        "sensors": sensors_list,
        "active_source": ACTIVE_SENSOR_SOURCE,
        "total_sensors": len(SENSOR_SOURCES)
    })


@app.route('/api/sensor/active', methods=['GET'])
def get_active_sensor():
    """Get which sensor is being used for AUTO mode"""
    return jsonify({
        "active_source": ACTIVE_SENSOR_SOURCE,
        "mode": "laptop_battery" if ACTIVE_SENSOR_SOURCE is None else "external_sensor"
    })


@app.route('/api/sensor/active', methods=['POST'])
def set_active_sensor():
    """Set which sensor to use for AUTO mode (or use laptop battery)"""
    global ACTIVE_SENSOR_SOURCE
    payload = request.get_json(silent=True) or {}
    source = payload.get('source')  # None = use laptop battery
    
    # If source is provided, verify it exists
    if source is not None and source not in SENSOR_SOURCES:
        return jsonify({"success": False, "error": f"sensor '{source}' not found"}), 404
    
    ACTIVE_SENSOR_SOURCE = source
    print(f"[SENSOR] Active sensor source set to: {source if source else 'laptop_battery'}")
    
    return jsonify({
        "success": True,
        "active_source": ACTIVE_SENSOR_SOURCE,
        "mode": "laptop_battery" if ACTIVE_SENSOR_SOURCE is None else "external_sensor"
    })


@app.route('/api/sensor/remove', methods=['POST'])
def remove_sensor():
    """Remove a sensor from the system"""
    global ACTIVE_SENSOR_SOURCE, SENSOR_SOURCES
    payload = request.get_json(silent=True) or {}
    source = payload.get('source', '').strip()
    
    if not source:
        return jsonify({"success": False, "error": "source is required"}), 400
    
    if source not in SENSOR_SOURCES:
        return jsonify({"success": False, "error": f"sensor '{source}' not found"}), 404
    
    # If this sensor is active, switch back to laptop battery
    if ACTIVE_SENSOR_SOURCE == source:
        ACTIVE_SENSOR_SOURCE = None
        print(f"[SENSOR] Removed active sensor {source}, switched to laptop_battery")
    
    del SENSOR_SOURCES[source]
    print(f"[SENSOR] Removed sensor {source}")
    
    return jsonify({
        "success": True,
        "message": f"Sensor '{source}' removed",
        "new_active_source": ACTIVE_SENSOR_SOURCE
    })


@app.route('/api/thresholds', methods=['POST'])
def set_thresholds():
    """Update AUTO mode thresholds"""
    global LOW_THRESHOLD, HIGH_THRESHOLD, CHECK_INTERVAL
    payload = request.get_json(silent=True) or {}
    
    low = payload.get('low_threshold')
    high = payload.get('high_threshold')
    interval = payload.get('check_interval')
    
    try:
        if low is not None and (not isinstance(low, (int, float)) or low < 0 or low > 100):
            return jsonify({"success": False, "error": "low_threshold must be 0-100"}), 400
        if high is not None and (not isinstance(high, (int, float)) or high < 0 or high > 100):
            return jsonify({"success": False, "error": "high_threshold must be 0-100"}), 400
        if interval is not None and (not isinstance(interval, (int, float)) or interval < 1):
            return jsonify({"success": False, "error": "check_interval must be >= 1"}), 400
        
        if low is not None:
            LOW_THRESHOLD = low
            print(f"[THRESHOLDS] Updated LOW_THRESHOLD to {LOW_THRESHOLD}")
        if high is not None:
            HIGH_THRESHOLD = high
            print(f"[THRESHOLDS] Updated HIGH_THRESHOLD to {HIGH_THRESHOLD}")
        if interval is not None:
            CHECK_INTERVAL = interval
            print(f"[THRESHOLDS] Updated CHECK_INTERVAL to {CHECK_INTERVAL}")
        
        print(f"[THRESHOLDS] Current: LOW={LOW_THRESHOLD}, HIGH={HIGH_THRESHOLD}, INTERVAL={CHECK_INTERVAL}")
        
        return jsonify({
            "success": True,
            "low_threshold": LOW_THRESHOLD,
            "high_threshold": HIGH_THRESHOLD,
            "check_interval": CHECK_INTERVAL
        })
    except Exception as e:
        print(f"[THRESHOLDS] Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == "__main__":
    init_db()
    try:
        init_serial()  # auto-detect port
    except Exception as e:
        print(f"[WARNING] Could not connect to serial: {e}")
        print("[INFO] Flask app will still run but serial commands will fail")
    
    Thread(target=read_serial, daemon=True).start()

    # background controller loop to support AUTO mode when backend manages the relay
    def controller_loop():
        global current_mode, LOW_THRESHOLD, HIGH_THRESHOLD, CHECK_INTERVAL, ACTIVE_SENSOR_SOURCE, SENSOR_SOURCES
        last_state = None
        while True:
            try:
                # Read current mode (updated by /api/mode endpoint)
                mode = current_mode
                if mode == 'AUTO':
                    # Determine which battery percentage to use
                    pct = None
                    source_name = "unknown"
                    
                    if ACTIVE_SENSOR_SOURCE and ACTIVE_SENSOR_SOURCE in SENSOR_SOURCES:
                        # Use external sensor
                        pct = SENSOR_SOURCES[ACTIVE_SENSOR_SOURCE]["percentage"]
                        source_name = ACTIVE_SENSOR_SOURCE
                        print(f"[CONTROLLER] AUTO mode - Using external sensor '{source_name}': {pct}%")
                    else:
                        # Use laptop battery
                        b = psutil.sensors_battery()
                        if b is None:
                            print('[CONTROLLER] Battery not detected')
                            time.sleep(CHECK_INTERVAL)
                            continue
                        pct = b.percent
                        source_name = "laptop_battery"
                        print(f"[CONTROLLER] AUTO mode - Using laptop battery: {pct}%")
                    
                    print(f"[CONTROLLER] {source_name}: {pct}%, Last state: {last_state}, Thresholds: {LOW_THRESHOLD}%-{HIGH_THRESHOLD}%")
                    
                    # Battery low - turn ON
                    if pct <= LOW_THRESHOLD and last_state != 'ON':
                        print(f"[CONTROLLER] {source_name} {pct}% <= {LOW_THRESHOLD}% -> Sending ON command")
                        result = send_command('ON')
                        print(f"[CONTROLLER] ON result: {result}")
                        last_state = 'ON'
                    
                    # Battery high - turn OFF
                    elif pct >= HIGH_THRESHOLD and last_state != 'OFF':
                        print(f"[CONTROLLER] {source_name} {pct}% >= {HIGH_THRESHOLD}% -> Sending OFF command")
                        result = send_command('OFF')
                        print(f"[CONTROLLER] OFF result: {result}")
                        last_state = 'OFF'
                    
                    # In between thresholds - stay same state
                    else:
                        if last_state:
                            print(f"[CONTROLLER] {source_name} {pct}% - holding {last_state}")
                else:
                    # Manual mode - reset state
                    if last_state is not None:
                        print(f"[CONTROLLER] Switched to MANUAL, resetting state")
                        last_state = None
                
                time.sleep(CHECK_INTERVAL)
            except Exception as e:
                print('[CONTROLLER] Error:', e)
                import traceback
                traceback.print_exc()
                time.sleep(CHECK_INTERVAL)

    Thread(target=controller_loop, daemon=True).start()

    print("[Flask] Starting server on http://localhost:5000")
    app.run(port=5000, debug=False)
