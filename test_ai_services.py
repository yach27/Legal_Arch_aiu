#!/usr/bin/env python3
"""
Test script for all AI services integration
"""
import requests
import json
import time

def test_all_services():
    """Test all AI services are working"""
    print("🔧 Testing All AI Services Integration...")
    print("=" * 60)
    
    services = [
        {"name": "Text Extraction Service", "url": "http://127.0.0.1:5002/health"},
        {"name": "Embedding Service", "url": "http://127.0.0.1:5001/health"},
        {"name": "AI Bridge Service", "url": "http://127.0.0.1:5003/health"}
    ]
    
    all_healthy = True
    
    for service in services:
        print(f"\n🔍 Testing {service['name']}...")
        try:
            response = requests.get(service['url'], timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {service['name']}: {data.get('status', 'OK')}")
                if 'model_loaded' in data:
                    print(f"   Model Loaded: {data['model_loaded']}")
            else:
                print(f"❌ {service['name']}: HTTP {response.status_code}")
                all_healthy = False
        except requests.exceptions.ConnectionError:
            print(f"❌ {service['name']}: Connection refused (service not running)")
            all_healthy = False
        except Exception as e:
            print(f"❌ {service['name']}: Error - {str(e)}")
            all_healthy = False
    
    print("\n" + "=" * 60)
    if all_healthy:
        print("✅ All AI services are running and healthy!")
        print("\n🚀 Ready for automatic AI processing!")
        print("\nTo test:")
        print("1. Make sure Laravel is running (php artisan serve)")
        print("2. Upload a document through the web interface")
        print("3. Check if AI processing happens automatically")
    else:
        print("❌ Some services are not working properly")
        print("\nTo fix:")
        print("1. Run: python aiservice/run_all_services.py")
        print("2. Wait for all services to start")
        print("3. Try the test again")
    
    return all_healthy

if __name__ == "__main__":
    test_all_services()