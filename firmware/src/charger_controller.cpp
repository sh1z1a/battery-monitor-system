// =================================================
// SMART HYBRID CHARGER
// Board : Wemos D1 (ESP8266)
// =================================================

#define SSR_PIN D5        // PIN ke SSR DC+
#define INDICATOR_PIN D5  // Dummy indicator (pakai pin yg sama biar simpel)

// ===== System State =====
String mode = "AUTO";
bool ssrState = false;

// ====== FAIL SAFE ======
unsigned long lastCommandTime = 0;
const unsigned long TIMEOUT = 5000; // 5 detik

void setup() {
  Serial.begin(115200);

  pinMode(SSR_PIN, OUTPUT);
  pinMode(INDICATOR_PIN, OUTPUT);

   // FAIL SAFE DEFAULT
  digitalWrite(SSR_PIN, LOW); // SSR OFF
  digitalWrite(INDICATOR_PIN, LOW);

  lastCommandTime = millis();

  Serial.println("=== SMART CHARGER READY ===");
  Serial.println("Commands:");
  Serial.println("MODE:AUTO | MODE:MANUAL");
  Serial.println("ON | OFF");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();
    lastCommandTime = millis();

    // MODE CONTROL
    if (cmd == "MODE:AUTO") {
      mode = "AUTO";
      Serial.println("MODE SET TO AUTO");
    }
    else if (cmd == "MODE:MANUAL") {
      mode = "MANUAL";
      Serial.println("MODE SET TO MANUAL");
    }

    // SSR CONTROL
    else if (cmd == "ON" && mode == "MANUAL") {
      ssrState = true;
      Serial.println("SSR ON (MANUAL)");
    }
    else if (cmd == "OFF" && mode == "MANUAL") {
      ssrState = false;
      Serial.println("SSR OFF (MANUAL)");
    }

    // AUTO COMMAND (FROM PYTHON)
    else if (cmd == "ON" && mode == "AUTO") {
      ssrState = true;
      Serial.println("SSR ON (AUTO)");
    }
    else if (cmd == "OFF" && mode == "AUTO") {
      ssrState = false;
      Serial.println("SSR OFF (AUTO)");
    }

    else {
      Serial.println("IGNORED / INVALID COMMAND");
    }
  }

  // ===== FAIL SAFE TIMEOUT =====
  if (mode == "AUTO" && millis() - lastCommandTime > TIMEOUT) {
    ssrState = false;
  }

  // ===== APPLY OUTPUT =====
  digitalWrite(SSR_PIN, ssrState ? HIGH : LOW);
  digitalWrite(INDICATOR_PIN, ssrState ? HIGH : LOW);

}

// void ssrOn() {
//   ssrState = true;
//   digitalWrite(SSR_PIN, HIGH);
//   Serial.println("STATUS:ON");
// }

// void ssrOff() {
//   ssrState = false;
//   digitalWrite(SSR_PIN, LOW);
//   Serial.println("STATUS:OFF");
// }

// void sendStatus() {
//   if (ssrState)
//     Serial.println("STATUS:ON");
//   else
//     Serial.println("STATUS:OFF");
// }
