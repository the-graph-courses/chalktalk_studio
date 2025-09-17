#!/usr/bin/env python3
"""
ElevenLabs API Debugging Script
This script tests various aspects of the ElevenLabs API to identify issues.
"""

import os
import requests
import json
import base64
import uuid
import re
from datetime import datetime

# Configuration from your presentation_utils.py
API_KEY = "sk_d12c6a0936363e59cb6ae8cece3c5e684431a840fdbf01b3"
VOICE_ID = "9BWtsMINqrJLrRacOk9x"
MODEL = "eleven_multilingual_v2"
TEST_TEXT = "Hello, this is a test of the ElevenLabs text-to-speech API."


def test_api_key_validity():
    """Test if the API key is valid by checking user info"""
    print("=" * 50)
    print("1. Testing API Key Validity")
    print("=" * 50)

    url = "https://api.elevenlabs.io/v1/user"
    headers = {
        "xi-api-key": API_KEY,
    }

    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            user_info = response.json()
            print("✅ API Key is valid!")
            print(f"User Info: {json.dumps(user_info, indent=2)}")
            return True
        else:
            print(f"❌ API Key validation failed: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error testing API key: {e}")
        return False


def test_voice_availability():
    """Test if the specified voice ID is available"""
    print("\n" + "=" * 50)
    print("2. Testing Voice Availability")
    print("=" * 50)

    url = "https://api.elevenlabs.io/v1/voices"
    headers = {
        "xi-api-key": API_KEY,
    }

    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            voices_data = response.json()
            voices = voices_data.get("voices", [])

            print(f"✅ Found {len(voices)} available voices")

            # Check if our voice ID exists
            voice_found = False
            for voice in voices:
                if voice["voice_id"] == VOICE_ID:
                    voice_found = True
                    print(f"✅ Voice '{voice['name']}' (ID: {VOICE_ID}) found!")
                    print(f"   Category: {voice.get('category', 'Unknown')}")
                    print(
                        f"   Description: {voice.get('description', 'No description')}"
                    )
                    break

            if not voice_found:
                print(f"❌ Voice ID {VOICE_ID} not found in available voices!")
                print("Available voices:")
                for voice in voices[:5]:  # Show first 5 voices
                    print(f"   - {voice['name']} (ID: {voice['voice_id']})")

            return voice_found
        else:
            print(f"❌ Failed to get voices: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error testing voice availability: {e}")
        return False


def test_basic_tts():
    """Test basic text-to-speech without timestamps"""
    print("\n" + "=" * 50)
    print("3. Testing Basic Text-to-Speech")
    print("=" * 50)

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "Content-Type": "application/json",
        "xi-api-key": API_KEY,
    }
    payload = {
        "text": TEST_TEXT,
        "model_id": MODEL,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.5},
    }

    try:
        print(f"Making request to: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")

        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            print("✅ Basic TTS request successful!")

            # Save the audio file
            output_file = f"debug_basic_tts_{uuid.uuid4().hex[:8]}.mp3"
            with open(output_file, "wb") as f:
                f.write(response.content)
            print(f"✅ Audio saved to: {output_file}")
            return True, output_file
        else:
            print(f"❌ Basic TTS failed: {response.text}")
            return False, None

    except Exception as e:
        print(f"❌ Error in basic TTS: {e}")
        return False, None


def test_tts_with_timestamps():
    """Test text-to-speech with timestamps (your current method)"""
    print("\n" + "=" * 50)
    print("4. Testing TTS with Timestamps")
    print("=" * 50)

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps"
    headers = {
        "Content-Type": "application/json",
        "xi-api-key": API_KEY,
    }
    payload = {
        "text": TEST_TEXT,
        "model_id": MODEL,
    }

    try:
        print(f"Making request to: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")

        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            print("✅ TTS with timestamps request successful!")

            response_data = response.json()
            print(f"Response keys: {list(response_data.keys())}")

            if "audio_base64" in response_data:
                # Decode and save the audio
                audio_data = base64.b64decode(response_data["audio_base64"])
                output_file = f"debug_timestamps_tts_{uuid.uuid4().hex[:8]}.mp3"
                with open(output_file, "wb") as f:
                    f.write(audio_data)
                print(f"✅ Audio saved to: {output_file}")

                # Print timestamp info if available
                if "alignment" in response_data:
                    print(f"✅ Timestamp data available")
                    print(f"Alignment info: {response_data['alignment']}")

                return True, output_file
            else:
                print(f"❌ No audio_base64 in response: {response_data}")
                return False, None
        else:
            print(f"❌ TTS with timestamps failed: {response.text}")
            try:
                error_detail = response.json()
                print(f"Error details: {json.dumps(error_detail, indent=2)}")
            except:
                pass
            return False, None

    except Exception as e:
        print(f"❌ Error in TTS with timestamps: {e}")
        return False, None


def test_models():
    """Test available models"""
    print("\n" + "=" * 50)
    print("5. Testing Available Models")
    print("=" * 50)

    url = "https://api.elevenlabs.io/v1/models"
    headers = {
        "xi-api-key": API_KEY,
    }

    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            models_data = response.json()
            models = (
                models_data
                if isinstance(models_data, list)
                else models_data.get("models", [])
            )

            print(f"✅ Found {len(models)} available models")

            model_found = False
            for model in models:
                model_id = model.get("model_id", "Unknown")
                model_name = model.get("name", "Unknown")
                print(f"   - {model_name} (ID: {model_id})")

                if model_id == MODEL:
                    model_found = True
                    print(f"     ✅ This is your current model!")

            if not model_found:
                print(f"❌ Your model '{MODEL}' was not found in available models!")

            return model_found
        else:
            print(f"❌ Failed to get models: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error testing models: {e}")
        return False


def test_your_current_function():
    """Test your exact current function implementation"""
    print("\n" + "=" * 50)
    print("6. Testing Your Current Function Implementation")
    print("=" * 50)

    # Create output directory
    output_dir = "debug_output"
    os.makedirs(os.path.join(output_dir, "audio"), exist_ok=True)

    # Simulate your function
    script_lines = [TEST_TEXT]
    audio_dir = os.path.join(output_dir, "audio")

    try:
        line = script_lines[0]

        # Create filename (from your code)
        sanitized = re.sub(r"[^\w\s]", "", line)[:20].replace(" ", "_")
        file_name = f"{sanitized}_{uuid.uuid4()}.mp3"
        file_path = os.path.join(audio_dir, file_name)

        print(f"Output file will be: {file_path}")

        # Make the exact same request as your function
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps"
        headers = {
            "Content-Type": "application/json",
            "xi-api-key": API_KEY,
        }
        payload = {
            "text": line,
            "model_id": MODEL,
        }

        print(f"Making request exactly like your function...")
        response = requests.post(url, headers=headers, json=payload)

        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            # Decode the base64 audio content
            response_json = response.json()
            audio_data = base64.b64decode(response_json["audio_base64"])

            # Save to local file
            with open(file_path, "wb") as f:
                f.write(audio_data)

            print(f"✅ Your function would work! Audio saved to: {file_path}")
            return True, file_path
        else:
            print(f"❌ Your function failed: {response.text}")
            try:
                error_detail = response.json()
                print(f"Error details: {json.dumps(error_detail, indent=2)}")
            except:
                pass
            return False, None

    except Exception as e:
        print(f"❌ Error in your function simulation: {e}")
        import traceback

        traceback.print_exc()
        return False, None


def main():
    """Run all debug tests"""
    print("🔧 ElevenLabs API Debug Script")
    print("=" * 50)
    print(f"API Key (first 10 chars): {API_KEY[:10]}...")
    print(f"Voice ID: {VOICE_ID}")
    print(f"Model: {MODEL}")
    print(f"Test Text: {TEST_TEXT}")
    print()

    results = {}

    # Test 1: API Key
    results["api_key"] = test_api_key_validity()

    # Test 2: Voice availability
    results["voice"] = test_voice_availability()

    # Test 3: Basic TTS
    results["basic_tts"], basic_file = test_basic_tts()

    # Test 4: TTS with timestamps
    results["timestamps_tts"], timestamps_file = test_tts_with_timestamps()

    # Test 5: Models
    results["models"] = test_models()

    # Test 6: Your function
    results["your_function"], your_file = test_your_current_function()

    # Summary
    print("\n" + "=" * 50)
    print("🔍 DEBUG SUMMARY")
    print("=" * 50)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper()}: {status}")

    print("\n📁 Generated Files:")
    for file_var, label in [
        (basic_file, "Basic TTS"),
        (timestamps_file, "Timestamps TTS"),
        (your_file, "Your Function"),
    ]:
        if file_var:
            print(f"   - {label}: {file_var}")

    # Recommendations
    print("\n🔧 RECOMMENDATIONS:")
    if not results["api_key"]:
        print("   - ❌ Fix your API key first!")
    elif not results["voice"]:
        print("   - ❌ Use a different voice ID or check voice availability")
    elif not results["models"]:
        print("   - ❌ Check your model ID or use a different model")
    elif results["basic_tts"] and not results["timestamps_tts"]:
        print("   - ⚠️  Use basic TTS endpoint instead of timestamps endpoint")
    elif results["your_function"]:
        print("   - ✅ Your function should work! Check for network/environment issues")
    else:
        print(
            "   - ❌ Multiple issues detected. Check API key and network connectivity"
        )


if __name__ == "__main__":
    main()
