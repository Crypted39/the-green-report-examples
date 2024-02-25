from pydub import AudioSegment

# Load audio clip for distortion analysis
audio_clip = AudioSegment.from_file("resources/dramatic_piano.wav", format="wav")

# Apply gain adjustment to emphasize distortion (adjust gain_db based on your needs)
gain_db = 12

# Ensure the gain_db doesn't exceed the maximum amplitude
max_amplitude = audio_clip.max_dBFS
gain_db = min(gain_db, max_amplitude)  # Limit gain to prevent clipping

distorted_audio = audio_clip + gain_db  # Apply gain adjustment

# Continue with distortion analysis on distorted_audio
