from pydub import AudioSegment
import matplotlib.pyplot as plt

# Load audio clip for distortion analysis
audio_clip = AudioSegment.from_file("resources/dramatic_piano.wav", format="wav")

# Extract and plot the audio waveform
samples = audio_clip.get_array_of_samples()
plt.plot(samples)
plt.title("Audio Waveform")
plt.xlabel("Sample Index")
plt.ylabel("Amplitude")
plt.show()
