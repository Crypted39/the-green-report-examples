from pydub import AudioSegment

from validation_techniques.comparing_clarity_values import calculate_clarity_metrics

# Load audio clips for comparison
audio_clip_1 = AudioSegment.from_file("path/to/audio_clip_1.wav", format="wav")
audio_clip_2 = AudioSegment.from_file("path/to/audio_clip_2.wav", format="wav")

# Calculate clarity metrics for comparison
clarity_1 = calculate_clarity_metrics(audio_clip_1)
clarity_2 = calculate_clarity_metrics(audio_clip_2)

# Identify discrepancies using assertions
discrepancy_threshold = 0.05  # Adjust threshold based on testing requirements
assert abs(clarity_1 - clarity_2) <= discrepancy_threshold, "Clarity discrepancy detected between audio_clip_1 and audio_clip_2"
