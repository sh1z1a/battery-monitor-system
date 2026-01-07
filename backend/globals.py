import threading

# Global variables for battery monitoring system

# Serial connection object
ser = None

# Battery data dictionary
battery_data = {
    "percentage": 0.0,
    "voltage": 0.0,
    "temperature": 0.0
}

# Thread lock for data synchronization
data_lock = threading.Lock()

# Connection status
connection_status = False