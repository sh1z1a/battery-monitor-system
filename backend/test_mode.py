#!/usr/bin/env python3
"""
Test script untuk debugging mode AUTO di backend
Jalankan: python test_mode.py
"""
import requests
import time
import json

API_BASE = "http://localhost:5000"

def test_mode_flow():
    print("=" * 60)
    print("TEST MODE AUTO FLOW")
    print("=" * 60)
    
    # 1. Check current mode
    print("\n[1] Mengecek mode saat ini...")
    try:
        resp = requests.get(f"{API_BASE}/api/mode")
        print(f"Response: {resp.status_code}")
        print(f"Data: {json.dumps(resp.json(), indent=2)}")
        current_mode = resp.json().get("mode", "UNKNOWN")
    except Exception as e:
        print(f"Error: {e}")
        return
    
    # 2. Switch to AUTO
    print(f"\n[2] Switching dari {current_mode} ke AUTO...")
    try:
        resp = requests.post(f"{API_BASE}/api/mode", json={"mode": "AUTO"})
        print(f"Response: {resp.status_code}")
        print(f"Data: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
        return
    
    # 3. Monitor untuk 20 detik
    print("\n[3] Monitoring mode selama 20 detik...")
    for i in range(4):
        time.sleep(5)
        try:
            resp = requests.get(f"{API_BASE}/api/mode")
            data = resp.json()
            print(f"[{i+1}] Mode: {data.get('mode')} | Response time: {resp.elapsed.total_seconds():.2f}s")
        except Exception as e:
            print(f"[{i+1}] Error: {e}")
    
    # 4. Check battery
    print("\n[4] Mengecek battery status...")
    try:
        resp = requests.get(f"{API_BASE}/api/battery")
        data = resp.json()
        status = data.get("status", {})
        print(f"Battery: {status.get('percentage')}%")
        print(f"Plugged: {status.get('plugged')}")
        print(f"Time left: {status.get('time_left')}")
    except Exception as e:
        print(f"Error: {e}")
    
    # 5. Check thresholds
    print("\n[5] Mengecek thresholds...")
    try:
        resp = requests.get(f"{API_BASE}/api/thresholds")
        data = resp.json()
        print(f"Low threshold: {data.get('low_threshold')}%")
        print(f"High threshold: {data.get('high_threshold')}%")
        print(f"Check interval: {data.get('check_interval')}s")
    except Exception as e:
        print(f"Error: {e}")
    
    # 6. Switch back to MANUAL
    print(f"\n[6] Switching kembali ke MANUAL...")
    try:
        resp = requests.post(f"{API_BASE}/api/mode", json={"mode": "MANUAL"})
        print(f"Response: {resp.status_code}")
        print(f"Data: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "=" * 60)
    print("TEST SELESAI")
    print("=" * 60)

if __name__ == "__main__":
    test_mode_flow()
