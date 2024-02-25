from pydub import AudioSegment

# Load audio clip
audio_clip = AudioSegment.from_file("resources/dramatic_piano.wav", format="wav")

# Adjust volume by -14 dB (approximately 80% reduction)
low_volume = audio_clip - 14  # Use dBFS method for volume adjustment

# Continue with clarity assessment on low_volume
