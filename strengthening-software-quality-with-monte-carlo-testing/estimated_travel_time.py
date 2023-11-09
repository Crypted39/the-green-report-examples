# Generating Random Input Data
import random


# Function to estimate travel time
def estimate_travel_time(distance, average_speed):
    # Calculate estimated time based on distance and average speed
    time = distance / average_speed
    # Simulate slight variations due to unpredictability (Monte Carlo)
    # Example: introduce a random variation of up to +/- 10% in average speed
    variation = random.uniform(0.9, 1.1)
    estimated_time_with_variation = distance / (average_speed * variation)
    return estimated_time_with_variation


# Example: Generate random distance and average speed for testing
def generate_random_input():
    random_distance = random.randint(160, 480)  # Random distance between 160 and 480 kilometers
    random_speed = random.uniform(80, 112)  # Random average speed between 80 and 112 km/h
    return random_distance, random_speed


# Executing Tests with Randomized Inputs
NUM_TESTS = 5  # Number of test iterations

for i in range(NUM_TESTS):
    distance, average_speed = generate_random_input()  # Generate random distance and speed
    estimated_time = estimate_travel_time(distance, average_speed)  # Execute test
    print(
        f"Test {i + 1}: Distance - {distance} kilometers, Speed - {average_speed} km/h, Estimated Time - {estimated_time} hours")
