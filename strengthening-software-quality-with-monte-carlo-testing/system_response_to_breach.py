import random


# Function to simulate security breach attempts
def simulate_security_breach(system_security):
    # Simulate security breach attempts
    # Example: If security threshold is 0.5, breach attempts above this threshold might cause issues
    breach_attempt = random.uniform(0, 1)

    if breach_attempt > system_security:
        return "Security Breach Detected!"
    else:
        return "No Breach Detected."


# Generating Random Security Strength
def generate_random_security_strength():
    return random.uniform(0.3, 0.8)  # Simulating security strength within a range


NUM_TESTS = 5  # Number of test iterations

for i in range(NUM_TESTS):
    system_security = generate_random_security_strength()
    breach_result = simulate_security_breach(system_security)
    print(f"Test {i + 1}: System Security - {system_security}, Result - {breach_result}")
