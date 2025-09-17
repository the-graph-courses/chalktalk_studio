import os
import presentation_utils as pu


def test_elevenlabs_tts():
    """
    Tests the ElevenLabs TTS integration by generating a few sample audio files.
    """
    print("Starting ElevenLabs TTS test...")

    # Define test script lines
    script_lines = [
        "Hello, this is a test of the ElevenLabs text-to-speech integration.",
        "This is a second line to ensure multiple files are created correctly.",
        "And a third, for good measure.",
    ]

    # Create a unique directory for the test output
    output_directory = "elevenlabs_test_output"
    os.makedirs(output_directory, exist_ok=True)

    print(f"Output directory created at: {output_directory}")

    # Fetch voiceovers using the new ElevenLabs function
    audio_files = pu.fetch_voiceover_elevenlabs(
        script_lines,
        output_dir=output_directory,
    )

    # Verify that the audio files were created
    if audio_files and all(os.path.exists(file) for file in audio_files if file):
        print("Successfully generated audio files:")
        for file in audio_files:
            if file:
                print(f"- {file}")
    else:
        print("Error: Failed to generate one or more audio files.")

    print("ElevenLabs TTS test finished.")


if __name__ == "__main__":
    test_elevenlabs_tts()
