from pydub import AudioSegment

# Load audio clip for clarity assessment
audio_clip = AudioSegment.from_file("resources/dramatic_piano.wav", format="wav")

# Convert audio clip to a different format for playback device testing
converted_audio = audio_clip.export("resources/dramatic_piano.mp3", format="mp3")

# Continue with clarity assessment on converted_audio
