/*
 * Smart Charger Battery Monitor - ESP8266
 * Final Version - Simple & Stable
 */
#include <Arduino.h>
#include <ArduinoJson.h>

// Pin Configuration
const int VOLTAGE_PIN = A0;
const int SSR_CONTROL_PIN = D1;
const int TEMP_PIN = D2;
const int CHARGING_PIN = D5;

// Battery Settings
const float BATTERY_MAX_VOLTAGE = 4.2;
const float BATTERY_MIN_VOLTAGE = 3.0;
const float VOLTAGE_DIVIDER_RATIO = 3.037;

// Auto Charge Settings
const int CHARGE_START = 20;  // Start at 20%
const int CHARGE_STOP = 95;   // Stop at 95%
const int TEMP_MAX = 45;      // Max temp 45°C

// Variables
float voltage = 0;
float temperature = 0;
int percentage = 0;
bool ssrEnabled = false;
bool autoCharge = true;
bool isCharging = false;

String commandBuffer = "";

void setup() {
  Serial.begin(115200);
  
  pinMode(SSR_CONTROL_PIN, OUTPUT);
  pinMode(CHARGING_PIN, INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);
  
  digitalWrite(SSR_CONTROL_PIN, LOW);
  
  // Startup indicator
  for(int i = 0; i < 3; i++) {
    digitalWrite(LED_BUILTIN, LOW);
    delay(200);
    digitalWrite(LED_BUILTIN, HIGH);
    delay(200);
  }
  
  Serial.println("{\"status\":\"ready\"}");
}

void loop() {
  handleSerialCommands();
  readSensors();
  
  if (autoCharge) {
    autoControlCharger();
  }
  
  static unsigned long lastSend = 0;
  if (millis() - lastSend >= 2000) {
    sendData();
    lastSend = millis();
    
    digitalWrite(LED_BUILTIN, LOW);
    delay(50);
    digitalWrite(LED_BUILTIN, HIGH);
  }
  
  delay(100);
}

void handleSerialCommands() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    
    if (c == '\n' || c == '\r') {
      if (commandBuffer.length() > 0) {
        processCommand(commandBuffer);
        commandBuffer = "";
      }
    } else {
      commandBuffer += c;
    }
  }
}

void processCommand(String command) {
  StaticJsonDocument<200> doc;
  
  if (deserializeJson(doc, command)) {
    return;
  }
  
  String cmd = doc["command"].as<String>();
  
  if (cmd == "ssr_on") {
    digitalWrite(SSR_CONTROL_PIN, HIGH);
    ssrEnabled = true;
    Serial.println("{\"status\":\"success\",\"ssr\":\"on\"}");
    
  } else if (cmd == "ssr_off") {
    digitalWrite(SSR_CONTROL_PIN, LOW);
    ssrEnabled = false;
    Serial.println("{\"status\":\"success\",\"ssr\":\"off\"}");
    
  } else if (cmd == "toggle_auto") {
    autoCharge = !autoCharge;
    Serial.print("{\"status\":\"success\",\"autoCharge\":");
    Serial.print(autoCharge ? "true" : "false");
    Serial.println("}");
  }
}

void readSensors() {
  // Read voltage
  int rawValue = analogRead(VOLTAGE_PIN);
  float measuredV = (rawValue / 1023.0) * 3.3;
  voltage = measuredV * VOLTAGE_DIVIDER_RATIO;
  
  // Smooth voltage
  static float lastV = voltage;
  voltage = (voltage * 0.2) + (lastV * 0.8);
  lastV = voltage;
  
  // Read temperature
  rawValue = analogRead(TEMP_PIN);
  float sensorV = (rawValue / 1023.0) * 3.3;
  temperature = sensorV * 100;
  
  // Smooth temperature
  static float lastT = temperature;
  temperature = (temperature * 0.3) + (lastT * 0.7);
  lastT = temperature;
  
  // Calculate percentage
  percentage = map(voltage * 100, BATTERY_MIN_VOLTAGE * 100, 
                   BATTERY_MAX_VOLTAGE * 100, 0, 100);
  percentage = constrain(percentage, 0, 100);
  
  // Check charging status
  isCharging = ssrEnabled && !digitalRead(CHARGING_PIN);
}

void autoControlCharger() {
  // Start charging if low
  if (percentage <= CHARGE_START && !ssrEnabled) {
    digitalWrite(SSR_CONTROL_PIN, HIGH);
    ssrEnabled = true;
  }
  
  // Stop charging if full
  if (percentage >= CHARGE_STOP && ssrEnabled) {
    digitalWrite(SSR_CONTROL_PIN, LOW);
    ssrEnabled = false;
  }
  
  // Stop if temperature too high
  if (temperature > TEMP_MAX && ssrEnabled) {
    digitalWrite(SSR_CONTROL_PIN, LOW);
    ssrEnabled = false;
  }
}

void sendData() {
  StaticJsonDocument<256> doc;
  
  doc["percentage"] = percentage;
  doc["voltage"] = round(voltage * 100) / 100.0;
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["isCharging"] = isCharging;
  doc["ssrStatus"] = ssrEnabled;
  doc["autoCharge"] = autoCharge;
  
  serializeJson(doc, Serial);
  Serial.println();
}

/*
 * WIRING:
 * A0  - Voltage Divider (Battery+ → 47kΩ → A0 → 22kΩ → GND)
 * D1  - SSR Control (Terminal 3+)
 * D2  - LM35 Temperature (OUT pin)
 * D5  - Charging Detection
 * VIN - 5V Power
 * GND - Ground
 */