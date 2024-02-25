import matplotlib.pyplot as plt
import numpy as np
from pydub import AudioSegment

# Load audio clip for frequency_response analysis
audio_clip = AudioSegment.from_file("resources/dramatic_piano.wav", format="wav")

# Convert the audio clip to a NumPy array
samples = np.array(audio_clip.get_array_of_samples())

# Compute the frequency spectrum using Fast Fourier Transform (FFT)
frequencies = np.fft.fftfreq(len(samples), 1 / audio_clip.frame_rate)
spectrum = np.fft.fft(samples)

# Find the frequency with the maximum amplitude
max_frequency = frequencies[np.argmax(np.abs(spectrum))]

print(f"Maximum Amplitude at Frequency: {max_frequency} Hz")

# Plot the frequency spectrum
plt.plot(frequencies, np.abs(spectrum))
plt.title("Frequency Response Analysis")
plt.xlabel("Frequency (Hz)")
plt.ylabel("Amplitude")
plt.show()
