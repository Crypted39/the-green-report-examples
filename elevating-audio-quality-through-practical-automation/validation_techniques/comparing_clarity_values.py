from pydub import AudioSegment
import numpy as np


def calculate_clarity_metrics(audio_clip):
    # Convert the audio clip to a NumPy array
    samples = np.array(audio_clip.get_array_of_samples())

    # Calculate the mean squared amplitude
    mean_squared_amplitude = np.mean(samples ** 2)

    # Calculate the root mean squared amplitude
    root_mean_squared_amplitude = np.sqrt(mean_squared_amplitude)

    return root_mean_squared_amplitude


# Example usage:
expected_audio = AudioSegment.from_file("resources/dramatic_piano.wav", format="wav")
actual_audio = AudioSegment.from_file("resources/dramatic_piano_distort.wav", format="wav")

# Compare clarity values
expected_clarity = calculate_clarity_metrics(expected_audio)
actual_clarity = calculate_clarity_metrics(actual_audio)

# Validate by comparing expected and actual clarity using assertions
assert expected_clarity == actual_clarity, "Clarity validation failed. Discrepancy detected."
