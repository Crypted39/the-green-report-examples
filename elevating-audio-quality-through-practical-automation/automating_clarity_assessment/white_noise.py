from pydub import AudioSegment
from pydub.generators import WhiteNoise

# Load audio clip
audio_clip = AudioSegment.from_file("resources/dramatic_piano.wav", format="wav")

# Simulate background noise
background_noise = WhiteNoise().to_audio_segment(duration=len(audio_clip))
audio_with_noise = audio_clip.overlay(background_noise)

# Continue with clarity assessment on audio_with_noise
