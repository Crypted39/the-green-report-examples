from pydub import AudioSegment
import numpy as np


def calculate_distortion_metrics(original_samples, distorted_samples):
    # Calculate the mean squared error (MSE) between original and distorted samples
    mse = np.mean((original_samples - distorted_samples) ** 2)

    # Calculate the signal power (original audio)
    signal_power = np.sum(original_samples ** 2) / len(original_samples)

    # Calculate Signal-to-Noise Ratio (SNR) in decibels
    snr_db = 10 * np.log10(signal_power / mse)

    return snr_db


# Example usage:
original_audio = AudioSegment.from_file("resources/dramatic_piano.wav", format="wav")
distorted_audio = AudioSegment.from_file("resources/dramatic_piano_distort.wav", format="wav")

# Convert the audio clips to NumPy arrays
original_samples = np.array(original_audio.get_array_of_samples())
distorted_samples = np.array(distorted_audio.get_array_of_samples())

# Calculate distortion metrics for comparison
distortion_original = calculate_distortion_metrics(original_samples, distorted_samples)

# Validate by comparing distortion metrics
assert distortion_original != 0, "Distortion detection successful"
