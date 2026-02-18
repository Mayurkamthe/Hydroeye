import requests
import time
import random
import json

# ================= CONFIG =================
# Use localhost instead of ngrok for local testing to avoid tunnel issues
SERVER_URL = "http://localhost:8080/api/v1/sensor/data"
API_KEY = "ESP32_HYDROSENSE_SECRET_KEY_2024"

DEVICE_ID = "ESP32_DUMMY_PC_001"
LATITUDE = 19.0760
LONGITUDE = 72.8777

SEND_INTERVAL = 10  # Reduced to 10 seconds for faster testing

# ================= DUMMY DATA =================
def generate_dummy_data():
    return {
        "temperature": round(random.uniform(20.0, 35.0), 2),
        "ph": round(random.uniform(6.5, 8.5), 2),
        "tds": round(random.uniform(200, 500), 2), # Adjusted max to be within safe limits occasionally
        "turbidity": round(random.uniform(0, 5), 2), # Adjusted to be lower for realistic data
        "dissolvedOxygen": round(random.uniform(5.0, 10.0), 2),
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "deviceId": DEVICE_ID
    }

# ================= SEND DATA =================
def send_data(payload):
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
    }

    try:
        print("\nSending data:")
        print(json.dumps(payload, indent=2))

        response = requests.post(
            SERVER_URL,
            json=payload,
            headers=headers,
            timeout=15
        )

        print("HTTP Status:", response.status_code)
        print("Response:", response.text)

    except Exception as e:
        print("Error sending data:", e)
        print("Make sure the server is running on localhost:8080")

# ================= MAIN =================
def main():
    print("🚀 Python Dummy Water Quality Sender Started")
    print(f"Targeting: {SERVER_URL}")

    while True:
        data = generate_dummy_data()
        send_data(data)
        time.sleep(SEND_INTERVAL)

# Run
if __name__ == "__main__":
    main()
