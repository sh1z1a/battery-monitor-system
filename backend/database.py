import sqlite3
from config import DB_NAME

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS battery_logs (
            id INTEGER PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            percentage REAL,
            voltage REAL, 
            temperature REAL
        )
    """)
    conn.commit()
    conn.close()

def log_data(data):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO battery_logs (percentage, voltage, temperature)
        VALUES (?, ?, ?)
    """, (
        data.get("percentage"),
        data.get("voltage"),
        data.get("temperature")
    ))
    conn.commit()
    conn.close()
