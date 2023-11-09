import random


# Function to simulate webpage load time
def simulate_page_load(network_speed):
    # Typical load time in milliseconds (ms) for the webpage
    typical_load_time = 200  # Assuming a typical load time of 200ms under ideal conditions

    # Simulate variations due to network conditions (Monte Carlo)
    variation = random.uniform(0.7, 1.3)  # Simulate a range of 70% to 130% variation in load time
    simulated_load_time = typical_load_time * variation / network_speed

    return simulated_load_time


# Generating Random Input Data
def generate_random_network_speed():
    random_speed = random.uniform(1, 10)  # Simulating network speed in Mbps (random values)
    return random_speed


NUM_TESTS = 5  # Number of test iterations

for i in range(NUM_TESTS):
    network_speed = generate_random_network_speed()
    page_load_time = simulate_page_load(network_speed)
    print(f"Test {i + 1}: Network Speed - {network_speed} Mbps, Simulated Load Time - {page_load_time} ms")