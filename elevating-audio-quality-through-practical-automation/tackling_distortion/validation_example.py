from pydub import AudioSegment
import numpy as np


def calculate_distortion_metrics(audio_clip):
    # Convert the audio clip to a NumPy array
    samples = np.array(audio_clip.get_array_of_samples())

    # Generate a distorted version of the audio clip (for demonstration purposes)
    distorted_samples = samples + np.random.normal(0, 1000, len(samples))
    distorted_audio = AudioSegment(
        distorted_samples.tobytes(),
        frame_rate=audio_clip.frame_rate,
        sample_width=audio_clip.sample_width,
        channels=audio_clip.channels
    )

    # Calculate the mean squared error (MSE) between original and distorted samples
    mse = np.mean((samples - distorted_samples) ** 2)

    # Calculate the signal power (original audio)
    signal_power = np.sum(samples ** 2) / len(samples)

    # Calculate Signal-to-Noise Ratio (SNR) in decibels
    snr_db = 10 * np.log10(signal_power / mse)

    return snr_db


# Example usage:
audio_clip = AudioSegment.from_file("resources/dramatic_piano.wav", format="wav")

# Define distortion threshold for validation
distortion_threshold = 5.0  # Adjust threshold based on testing requirements

# Validate distortion against the defined threshold using assertions
assert calculate_distortion_metrics(audio_clip) <= distortion_threshold, "Distortion falls within acceptable limits"
