/*
 * HydroSense IoT - ESP32 Water Quality Monitor
 * Arduino IDE Code for ESP32
 * 
 * Sensors:
 * - DS18B20: Temperature
 * - pH Sensor: Analog pH probe
 * - TDS Sensor: Total Dissolved Solids
 * - Turbidity Sensor: Water clarity
 * - DO Sensor: Dissolved Oxygen
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ============== CONFIGURATION ==============
// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* SERVER_URL = "https://a232649fe523.ngrok-free.app/api/v1/sensor/data";
const char* API_KEY = "hydrosense-esp32-secret-key";  // Must match application.properties

// Device Configuration
const char* DEVICE_ID = "ESP32_HYDRO_001";
const double LATITUDE = 19.0760;   // Your location
const double LONGITUDE = 72.8777;  // Your location

// Reading interval (milliseconds)
const unsigned long READING_INTERVAL = 60000;  // 60 seconds

// ============== SENSOR PINS ==============
#define TEMP_PIN 4       // DS18B20 OneWire data pin
#define PH_PIN 34        // pH sensor analog pin
#define TDS_PIN 35       // TDS sensor analog pin
#define TURBIDITY_PIN 32 // Turbidity sensor analog pin
#define DO_PIN 33        // Dissolved oxygen analog pin
#define LED_PIN 2        // Built-in LED

// ============== CALIBRATION VALUES ==============
// pH Calibration
#define PH_OFFSET 0.0
#define PH_NEUTRAL_VOLTAGE 1.5  // Voltage at pH 7

// TDS Calibration
#define TDS_FACTOR 0.5
#define VREF 3.3

// Turbidity Calibration
#define TURBIDITY_CLEAR_VOLTAGE 4.2
#define TURBIDITY_DIRTY_VOLTAGE 2.5

// DO Calibration
#define DO_FACTOR 0.02

// ============== SENSOR OBJECTS ==============
OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

// ============== VARIABLES ==============
unsigned long lastReadingTime = 0;
float currentTemperature = 25.0;

// ============== SETUP ==============
void setup() {
  Serial.begin(115200);
  Serial.println("\n========================================");
  Serial.println("  HydroSense IoT - Water Quality Monitor");
  Serial.println("========================================");
  
  // Initialize LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Initialize temperature sensor
  tempSensor.begin();
  
  // Connect to WiFi
  connectWiFi();
  
  // Check server health
  checkServerHealth();
  
  Serial.println("Setup complete. Starting sensor readings...\n");
}

// ============== MAIN LOOP ==============
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectWiFi();
  }
  
  // Read and send data at specified interval
  if (millis() - lastReadingTime >= READING_INTERVAL) {
    lastReadingTime = millis();
    
    // Collect sensor data
    JsonDocument sensorData;
    collectSensorData(sensorData);
    
    // Send to server
    sendData(sensorData);
  }
  
  delay(100);
}

// ============== WIFI CONNECTION ==============
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    blinkLED(3, 100);  // Success blink
  } else {
    Serial.println("\nWiFi connection failed!");
    blinkLED(5, 500);  // Error blink
  }
}

// ============== SENSOR READING FUNCTIONS ==============
float readTemperature() {
  tempSensor.requestTemperatures();
  float temp = tempSensor.getTempCByIndex(0);
  
  if (temp == DEVICE_DISCONNECTED_C) {
    Serial.println("Temperature sensor error!");
    return 25.0;  // Default fallback
  }
  
  currentTemperature = temp;
  Serial.printf("Temperature: %.2f °C\n", temp);
  return temp;
}

float readPH() {
  // Average multiple readings
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(PH_PIN);
    delay(10);
  }
  float avgReading = sum / 10.0;
  
  // Convert to voltage (ESP32 ADC is 12-bit: 0-4095)
  float voltage = (avgReading / 4095.0) * 3.3;
  
  // Convert voltage to pH
  // pH 7 is neutral, adjust based on your sensor's calibration
  float ph = 7.0 + ((PH_NEUTRAL_VOLTAGE - voltage) / 0.18) + PH_OFFSET;
  
  // Clamp to valid range
  ph = constrain(ph, 0.0, 14.0);
  
  Serial.printf("pH: %.2f (Voltage: %.3fV)\n", ph, voltage);
  return ph;
}

float readTDS() {
  // Average multiple readings
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(TDS_PIN);
    delay(10);
  }
  float avgReading = sum / 10.0;
  
  // Convert to voltage
  float voltage = (avgReading / 4095.0) * VREF;
  
  // Temperature compensation
  float compensationCoeff = 1.0 + 0.02 * (currentTemperature - 25.0);
  float compensationVoltage = voltage / compensationCoeff;
  
  // Convert to TDS (ppm)
  float tds = (133.42 * pow(compensationVoltage, 3) 
             - 255.86 * pow(compensationVoltage, 2) 
             + 857.39 * compensationVoltage) * TDS_FACTOR;
  
  tds = max(0.0f, tds);
  
  Serial.printf("TDS: %.0f ppm (Voltage: %.3fV)\n", tds, voltage);
  return tds;
}

float readTurbidity() {
  // Average multiple readings
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(TURBIDITY_PIN);
    delay(10);
  }
  float avgReading = sum / 10.0;
  
  // Convert to voltage
  float voltage = (avgReading / 4095.0) * 3.3;
  
  // Convert to NTU
  float ntu;
  if (voltage >= TURBIDITY_CLEAR_VOLTAGE) {
    ntu = 0.0;
  } else if (voltage <= TURBIDITY_DIRTY_VOLTAGE) {
    ntu = 3000.0;
  } else {
    ntu = ((TURBIDITY_CLEAR_VOLTAGE - voltage) / 
           (TURBIDITY_CLEAR_VOLTAGE - TURBIDITY_DIRTY_VOLTAGE)) * 3000.0;
  }
  
  Serial.printf("Turbidity: %.2f NTU (Voltage: %.3fV)\n", ntu, voltage);
  return ntu;
}

float readDissolvedOxygen() {
  // Average multiple readings
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(DO_PIN);
    delay(10);
  }
  float avgReading = sum / 10.0;
  
  // Convert to voltage
  float voltage = (avgReading / 4095.0) * 3.3;
  
  // Convert to mg/L (simplified calculation)
  // Saturation at 25°C is about 8.26 mg/L
  float doValue = voltage * DO_FACTOR * 100;
  doValue = constrain(doValue, 0.0f, 20.0f);
  
  Serial.printf("Dissolved Oxygen: %.2f mg/L (Voltage: %.3fV)\n", doValue, voltage);
  return doValue;
}

// ============== DATA COLLECTION ==============
void collectSensorData(JsonDocument& data) {
  Serial.println("\n--- Reading Sensors ---");
  
  data["temperature"] = readTemperature();
  data["ph"] = readPH();
  data["tds"] = readTDS();
  data["turbidity"] = readTurbidity();
  data["dissolvedOxygen"] = readDissolvedOxygen();
  data["latitude"] = LATITUDE;
  data["longitude"] = LONGITUDE;
  data["deviceId"] = DEVICE_ID;
  
  Serial.println("--- Sensor Reading Complete ---\n");
}

// ============== HTTP SEND ==============
void sendData(JsonDocument& data) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Skipping send.");
    return;
  }
  
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  http.setTimeout(30000);
  
  // Serialize JSON
  String jsonString;
  serializeJson(data, jsonString);
  
  Serial.println("Sending data to server...");
  Serial.println(jsonString);
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK) {
      String response = http.getString();
      Serial.println("Success! Response:");
      Serial.println(response);
      blinkLED(2, 100);  // Success blink
    } else {
      Serial.printf("HTTP Error: %d\n", httpCode);
      String response = http.getString();
      Serial.println(response);
      blinkLED(4, 300);  // Error blink
    }
  } else {
    Serial.printf("Connection failed: %s\n", http.errorToString(httpCode).c_str());
    blinkLED(5, 500);  // Error blink
  }
  
  http.end();
}

// ============== SERVER HEALTH CHECK ==============
void checkServerHealth() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  String healthUrl = String(SERVER_URL);
  healthUrl.replace("/data", "/health");
  
  HTTPClient http;
  http.begin(healthUrl);
  http.setTimeout(10000);
  
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    Serial.println("Server is reachable!");
    Serial.println(http.getString());
  } else {
    Serial.printf("Server health check failed: %d\n", httpCode);
  }
  
  http.end();
}

// ============== UTILITY FUNCTIONS ==============
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}
